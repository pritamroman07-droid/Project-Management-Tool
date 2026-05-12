const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { createError } = require('../middleware/errorHandler');

const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const comments = await Comment.find({ task: taskId, parentComment: null })
      .populate('author', 'name avatar email')
      .populate('mentions', 'name avatar')
      .populate({ path: 'parentComment', populate: { path: 'author', select: 'name avatar' } })
      .sort({ createdAt: 1 });
    res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};

const createComment = async (req, res, next) => {
  try {
    const { content, mentions = [], parentComment, attachments } = req.body;
    const { taskId } = req.params;

    const task = await Task.findById(taskId).populate('project', 'name');
    if (!task) return next(createError('Task not found.', 404));

    const comment = await Comment.create({
      content, task: taskId, author: req.user._id,
      mentions, parentComment, attachments,
    });

    await comment.populate('author', 'name avatar email');
    await comment.populate('mentions', 'name avatar');

    // Notify mentioned users
    if (mentions.length) {
      const notifs = mentions
        .filter((id) => id.toString() !== req.user._id.toString())
        .map((userId) => ({
          recipient: userId,
          sender: req.user._id,
          type: 'task_mentioned',
          title: 'You were mentioned',
          message: `${req.user.name} mentioned you in a comment on "${task.title}"`,
          link: `/tasks/${taskId}`,
          relatedTask: taskId,
          relatedProject: task.project,
        }));
      if (notifs.length) {
        const created = await Notification.insertMany(notifs);
        created.forEach((n) => req.io?.to(`user:${n.recipient}`).emit('notification:new', n));
      }
    }

    req.io?.to(`project:${task.project}`).emit('comment:new', { taskId, comment });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(createError('Comment not found.', 404));
    if (!comment.author.equals(req.user._id)) return next(createError('Not authorized.', 403));

    comment.content = req.body.content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();
    await comment.populate('author', 'name avatar email');

    res.json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(createError('Comment not found.', 404));
    const canDelete = comment.author.equals(req.user._id) || req.user.role === 'admin';
    if (!canDelete) return next(createError('Not authorized.', 403));
    await comment.deleteOne();
    res.json({ success: true, message: 'Comment deleted.' });
  } catch (error) {
    next(error);
  }
};

const addReaction = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(createError('Comment not found.', 404));

    let reaction = comment.reactions.find((r) => r.emoji === emoji);
    if (reaction) {
      const idx = reaction.users.indexOf(req.user._id);
      if (idx > -1) reaction.users.splice(idx, 1);
      else reaction.users.push(req.user._id);
      if (!reaction.users.length) comment.reactions = comment.reactions.filter((r) => r.emoji !== emoji);
    } else {
      comment.reactions.push({ emoji, users: [req.user._id] });
    }

    await comment.save();
    res.json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

module.exports = { getComments, createComment, updateComment, deleteComment, addReaction };
