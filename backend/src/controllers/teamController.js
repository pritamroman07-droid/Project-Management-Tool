const Team = require('../models/Team');
const { createError } = require('../middleware/errorHandler');

const getTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ 'members.user': req.user._id })
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email role')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};

const createTeam = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const team = await Team.create({
      name, description, color,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });
    await team.populate('owner', 'name avatar email');
    res.status(201).json({ success: true, message: 'Team created.', data: team });
  } catch (error) {
    next(error);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return next(createError('Team not found.', 404));
    if (!team.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return next(createError('Not authorized.', 403));
    }
    const allowed = ['name', 'description', 'color', 'settings'];
    allowed.forEach((field) => { if (req.body[field] !== undefined) team[field] = req.body[field]; });
    await team.save();
    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

const addTeamMember = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return next(createError('Team not found.', 404));
    const { userId, role = 'member' } = req.body;
    const exists = team.members.some((m) => m.user.equals(userId));
    if (exists) return next(createError('User already in team.', 409));
    team.members.push({ user: userId, role });
    await team.save();
    await team.populate('members.user', 'name avatar email');
    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

const removeTeamMember = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return next(createError('Team not found.', 404));
    team.members = team.members.filter((m) => !m.user.equals(req.params.userId));
    await team.save();
    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTeams, createTeam, updateTeam, addTeamMember, removeTeamMember };
