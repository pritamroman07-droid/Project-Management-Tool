const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { createError } = require('../middleware/errorHandler');

// @desc    Get all projects (user is member or owner)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    const { status, priority, search, page = 1, limit = 12, archived } = req.query;
    const userId = req.user._id;

    const filter = {
      $or: [{ owner: userId }, { 'members.user': userId }],
      isArchived: archived === 'true' ? true : false,
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('owner', 'name avatar email')
        .populate('members.user', 'name avatar email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: projects,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name avatar email role')
      .populate('members.user', 'name avatar email role');

    if (!project) return next(createError('Project not found.', 404));

    // Check access
    const isMember = project.members.some((m) => m.user._id.equals(req.user._id));
    const isOwner = project.owner._id.equals(req.user._id);
    if (!isMember && !isOwner && req.user.role !== 'admin') {
      return next(createError('Access denied.', 403));
    }

    // Fetch task stats
    const taskStats = await Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const stats = { todo: 0, inprogress: 0, review: 0, done: 0 };
    taskStats.forEach((s) => { stats[s._id] = s.count; });
    const totalTasks = Object.values(stats).reduce((a, b) => a + b, 0);
    const progress = totalTasks > 0 ? Math.round((stats.done / totalTasks) * 100) : 0;

    res.json({
      success: true,
      data: { ...project.toObject(), taskStats: stats, progress },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private (admin, manager)
const createProject = async (req, res, next) => {
  try {
    const { name, description, status, priority, dueDate, startDate, tags, color, members } = req.body;

    const project = await Project.create({
      name,
      description,
      status,
      priority,
      dueDate,
      startDate,
      tags,
      color,
      owner: req.user._id,
      members: members?.map((m) => ({ user: m.user || m, role: m.role || 'member' })) || [],
    });

    await project.populate('owner', 'name avatar email');

    res.status(201).json({ success: true, message: 'Project created.', data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (owner, admin, manager)
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError('Project not found.', 404));

    const canEdit =
      project.owner.equals(req.user._id) ||
      req.user.role === 'admin' ||
      project.members.some((m) => m.user.equals(req.user._id) && ['admin', 'manager'].includes(m.role));

    if (!canEdit) return next(createError('Not authorized to edit this project.', 403));

    const allowed = ['name', 'description', 'status', 'priority', 'dueDate', 'startDate', 'tags', 'color', 'columns'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) project[field] = req.body[field];
    });

    if (req.body.status === 'completed' && !project.completedAt) {
      project.completedAt = new Date();
    }

    await project.save();
    await project.populate('owner', 'name avatar email');
    await project.populate('members.user', 'name avatar email');

    // Emit real-time update
    req.io?.to(`project:${project._id}`).emit('project:update', project);

    res.json({ success: true, message: 'Project updated.', data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (owner, admin)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError('Project not found.', 404));

    const canDelete = project.owner.equals(req.user._id) || req.user.role === 'admin';
    if (!canDelete) return next(createError('Not authorized to delete this project.', 403));

    // Delete all tasks in project
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (owner, admin, manager)
const addMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError('Project not found.', 404));

    const { userId, role = 'member' } = req.body;

    const alreadyMember = project.members.some((m) => m.user.equals(userId));
    if (alreadyMember) return next(createError('User is already a member.', 409));

    project.members.push({ user: userId, role });
    await project.save();
    await project.populate('members.user', 'name avatar email');

    res.json({ success: true, message: 'Member added.', data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (owner, admin)
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError('Project not found.', 404));

    project.members = project.members.filter((m) => !m.user.equals(req.params.userId));
    await project.save();

    res.json({ success: true, message: 'Member removed.', data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project templates (isTemplate=true)
// @route   GET /api/projects/templates
// @access  Private
const getTemplates = async (req, res, next) => {
  try {
    const templates = await Project.find({ isTemplate: true }).select('name description color tags priority');
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects, getProject, createProject, updateProject,
  deleteProject, addMember, removeMember, getTemplates,
};
