const express = require('express');
const router = express.Router({ mergeParams: true });
const { getComments, createComment, updateComment, deleteComment, addReaction } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { commentValidator } = require('../middleware/validators');

// Routes: /api/tasks/:taskId/comments
router.get('/', protect, getComments);
router.post('/', protect, commentValidator, createComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/reactions', protect, addReaction);

module.exports = router;
