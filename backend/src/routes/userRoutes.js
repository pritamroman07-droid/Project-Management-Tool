const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword, searchUsers, getAllUsers } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/search', protect, searchUsers);
router.get('/', protect, authorize('admin', 'manager'), getAllUsers);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.patch('/change-password', protect, changePassword);

module.exports = router;
