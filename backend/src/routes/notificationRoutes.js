const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllRead, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.patch('/mark-read', protect, markAsRead);
router.patch('/mark-all-read', protect, markAllRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
