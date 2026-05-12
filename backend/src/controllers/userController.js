const User = require('../models/User');
const { createError } = require('../middleware/errorHandler');

const getProfile = async (req, res) => {
  res.json({ success: true, data: req.user });
};

const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'bio', 'avatar', 'preferences'];
    const updates = {};
    allowed.forEach((field) => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated.', data: user });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return next(createError('Current password is incorrect.', 401));
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: [] });

    const users = await User.find({
      $or: [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }],
      isActive: true,
    }).select('name email avatar role').limit(Number(limit));

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find({ isActive: true }).select('name email avatar role lastSeen createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments({ isActive: true }),
    ]);
    res.json({ success: true, data: users, pagination: { total, page: Number(page) } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, changePassword, searchUsers, getAllUsers };
