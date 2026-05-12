const Notification = require('../models/Notification');
const { createError } = require('../middleware/errorHandler');

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = { recipient: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.json({ success: true, data: notifications, unreadCount, pagination: { total, page: Number(page) } });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { ids } = req.body; // array of notification IDs
    if (ids?.length) {
      await Notification.updateMany({ _id: { $in: ids }, recipient: req.user._id }, { isRead: true, readAt: new Date() });
    }
    res.json({ success: true, message: 'Notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return next(createError('Notification not found.', 404));
    if (!notif.recipient.equals(req.user._id)) return next(createError('Not authorized.', 403));
    await notif.deleteOne();
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, markAllRead, deleteNotification };
