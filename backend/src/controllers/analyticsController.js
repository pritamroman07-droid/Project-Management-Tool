const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { generateInsights } = require('../config/gemini');
const { createError } = require('../middleware/errorHandler');

// @desc    Dashboard stats
// @route   GET /api/analytics/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Projects accessible by user
    const projectFilter = { $or: [{ owner: userId }, { 'members.user': userId }], isArchived: false };
    const projects = await Project.find(projectFilter).select('_id status dueDate');
    const projectIds = projects.map((p) => p._id);

    const [taskStats, recentActivity, upcomingDeadlines] = await Promise.all([
      Task.aggregate([
        { $match: { project: { $in: projectIds }, isArchived: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      ActivityLog.find({ project: { $in: projectIds } })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(10),
      Task.find({
        project: { $in: projectIds },
        dueDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
        status: { $ne: 'done' },
      }).populate('project', 'name color').populate('assignees', 'name avatar').sort({ dueDate: 1 }).limit(5),
    ]);

    const stats = { todo: 0, inprogress: 0, review: 0, done: 0 };
    taskStats.forEach((s) => { stats[s._id] = s.count; });
    const totalTasks = Object.values(stats).reduce((a, b) => a + b, 0);

    const overdueCount = await Task.countDocuments({
      project: { $in: projectIds },
      dueDate: { $lt: now },
      status: { $ne: 'done' },
    });

    res.json({
      success: true,
      data: {
        projects: { total: projects.length, active: projects.filter((p) => p.status === 'active').length, completed: projects.filter((p) => p.status === 'completed').length },
        tasks: { ...stats, total: totalTasks, overdue: overdueCount },
        recentActivity,
        upcomingDeadlines,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Task completion over time (last 30 days)
// @route   GET /api/analytics/task-trends
const getTaskTrends = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const matchStage = { completedAt: { $gte: thirtyDaysAgo }, status: 'done' };
    if (projectId) matchStage.project = new mongoose.Types.ObjectId(projectId);

    const trends = await Task.aggregate([
      { $match: matchStage },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: trends });
  } catch (error) {
    next(error);
  }
};

// @desc    Team performance (tasks completed per member)
// @route   GET /api/analytics/team-performance
const getTeamPerformance = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const matchStage = { status: 'done' };
    if (projectId) matchStage.project = new mongoose.Types.ObjectId(projectId);

    const performance = await Task.aggregate([
      { $match: matchStage },
      { $unwind: '$assignees' },
      { $group: { _id: '$assignees', completed: { $sum: 1 } } },
      { $sort: { completed: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { completed: 1, 'user.name': 1, 'user.avatar': 1, 'user.email': 1 } },
    ]);

    res.json({ success: true, data: performance });
  } catch (error) {
    next(error);
  }
};

// @desc    Priority distribution
// @route   GET /api/analytics/priority-distribution
const getPriorityDistribution = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const matchStage = { isArchived: false };
    if (projectId) matchStage.project = new mongoose.Types.ObjectId(projectId);

    const distribution = await Task.aggregate([
      { $match: matchStage },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    res.json({ success: true, data: distribution });
  } catch (error) {
    next(error);
  }
};

// @desc    AI-generated productivity insights (Gemini)
// @route   GET /api/analytics/ai-insights
const getAiInsights = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const projectFilter = { $or: [{ owner: userId }, { 'members.user': userId }], isArchived: false };
    const projectIds = (await Project.find(projectFilter).select('_id')).map((p) => p._id);

    const now = new Date();
    const [taskStats, overdueTasks, highPriorityPending, completedThisWeek] = await Promise.all([
      Task.aggregate([{ $match: { project: { $in: projectIds } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.countDocuments({ project: { $in: projectIds }, dueDate: { $lt: now }, status: { $ne: 'done' } }),
      Task.countDocuments({ project: { $in: projectIds }, priority: { $in: ['high', 'critical'] }, status: { $ne: 'done' } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'done', completedAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } }),
    ]);

    const stats = {};
    taskStats.forEach((s) => { stats[s._id] = s.count; });
    const totalTasks = Object.values(stats).reduce((a, b) => a + b, 0);

    const topMember = await Task.aggregate([
      { $match: { project: { $in: projectIds }, status: 'done', completedAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } } },
      { $unwind: '$assignees' },
      { $group: { _id: '$assignees', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    ]);

    const insights = await generateInsights({
      totalTasks,
      completedTasks: stats.done || 0,
      overdueTasks,
      highPriorityPending,
      avgCompletionDays: 3,
      mostActiveMember: topMember[0]?.user?.name || 'N/A',
      projectsAtRisk: Math.min(overdueTasks, projectIds.length),
    });

    res.json({ success: true, data: { insights, generatedAt: new Date() } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getTaskTrends, getTeamPerformance, getPriorityDistribution, getAiInsights };
