const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { createError } = require('../middleware/errorHandler');

const checkProjectAccess = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found.', status: 404 };
  const isMember = project.members.some((m) => m.user.equals(userId));
  const isOwner = project.owner.equals(userId);
  if (!isMember && !isOwner && userRole !== 'admin') {
    return { error: 'Access denied.', status: 403 };
  }
  return { project };
};

const getTasks = async (req, res, next) => {
  try {
    const { projectId, status, priority, assignee, search, page = 1, limit = 50 } = req.query;
    const filter = { isArchived: false };
    if (projectId) filter.project = projectId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignees = assignee;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignees', 'name avatar email')
        .populate('createdBy', 'name avatar')
        .sort({ status: 1, position: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({ success: true, data: tasks, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name avatar email')
      .populate('createdBy', 'name avatar')
      .populate('project', 'name color')
      .populate('dependencies', 'title status');
    if (!task) return next(createError('Task not found.', 404));
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, project, status = 'todo', priority, assignees, labels, dueDate, startDate, estimatedHours, isMilestone } = req.body;

    const access = await checkProjectAccess(project, req.user._id, req.user.role);
    if (access.error) return next(createError(access.error, access.status));

    const maxPositionTask = await Task.findOne({ project, status }).sort({ position: -1 }).select('position');
    const position = (maxPositionTask?.position ?? -1) + 1;

    const task = await Task.create({
      title, description, project, status, priority, assignees,
      labels, dueDate, startDate, estimatedHours, isMilestone,
      createdBy: req.user._id, position,
    });

    await task.populate('assignees', 'name avatar email');
    await task.populate('createdBy', 'name avatar');

    if (assignees?.length) {
      const notifs = assignees
        .filter((id) => id.toString() !== req.user._id.toString())
        .map((userId) => ({
          recipient: userId,
          sender: req.user._id,
          type: 'task_assigned',
          title: 'New task assigned',
          message: `You were assigned "${title}" by ${req.user.name}`,
          link: `/tasks/${task._id}`,
          relatedTask: task._id,
          relatedProject: project,
        }));
      if (notifs.length) {
        const created = await Notification.insertMany(notifs);
        created.forEach((n) => req.io?.to(`user:${n.recipient}`).emit('notification:new', n));
      }
    }

    req.io?.to(`project:${project}`).emit('task:create', task);
    res.status(201).json({ success: true, message: 'Task created.', data: task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return next(createError('Task not found.', 404));

    const allowed = ['title', 'description', 'status', 'priority', 'assignees', 'labels', 'dueDate', 'startDate', 'estimatedHours', 'isMilestone', 'position'];
    const prevStatus = task.status;
    allowed.forEach((field) => { if (req.body[field] !== undefined) task[field] = req.body[field]; });

    if (task.status === 'done' && prevStatus !== 'done') task.completedAt = new Date();
    else if (task.status !== 'done') task.completedAt = undefined;

    await task.save();
    await task.populate('assignees', 'name avatar email');
    req.io?.to(`project:${task.project}`).emit('task:update', task);
    res.json({ success: true, message: 'Task updated.', data: task });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return next(createError('Task not found.', 404));
    req.io?.to(`project:${task.project}`).emit('task:delete', { taskId: task._id, projectId: task.project });
    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    next(error);
  }
};

const reorderTasks = async (req, res, next) => {
  try {
    const { items, projectId } = req.body;
    const bulkOps = items.map((item) => ({
      updateOne: { filter: { _id: item.id }, update: { status: item.status, position: item.position } },
    }));
    await Task.bulkWrite(bulkOps);
    req.io?.to(`project:${projectId}`).emit('kanban:reorder', { items, projectId });
    res.json({ success: true, message: 'Tasks reordered.' });
  } catch (error) {
    next(error);
  }
};

const addSubtask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return next(createError('Task not found.', 404));
    task.subtasks.push({ title: req.body.title, assignee: req.body.assignee });
    await task.save();
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const toggleSubtask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return next(createError('Task not found.', 404));
    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return next(createError('Subtask not found.', 404));
    subtask.completed = !subtask.completed;
    subtask.completedAt = subtask.completed ? new Date() : undefined;
    await task.save();
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const startTimer = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return next(createError('Task not found.', 404));
    task.timeEntries.push({ user: req.user._id, startTime: new Date(), note: req.body.note });
    await task.save();
    res.json({ success: true, message: 'Timer started.', data: task });
  } catch (error) {
    next(error);
  }
};

const stopTimer = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return next(createError('Task not found.', 404));
    const entry = task.timeEntries.id(req.params.entryId);
    if (!entry) return next(createError('Time entry not found.', 404));
    entry.endTime = new Date();
    entry.duration = Math.round((entry.endTime - entry.startTime) / 60000);
    await task.save();
    res.json({ success: true, message: 'Timer stopped.', data: task });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, reorderTasks, addSubtask, toggleSubtask, startTimer, stopTimer };
