const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask, reorderTasks, addSubtask, toggleSubtask, startTimer, stopTimer } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { taskValidator } = require('../middleware/validators');
const { logActivity } = require('../middleware/activityLogger');

router.get('/', protect, getTasks);
router.post('/', protect, taskValidator, logActivity('created_task', 'task'), createTask);
router.post('/reorder', protect, reorderTasks);
router.get('/:id', protect, getTask);
router.put('/:id', protect, logActivity('updated_task', 'task'), updateTask);
router.delete('/:id', protect, deleteTask);
router.post('/:id/subtasks', protect, addSubtask);
router.patch('/:id/subtasks/:subtaskId', protect, toggleSubtask);
router.post('/:id/time/start', protect, startTimer);
router.patch('/:id/time/:entryId/stop', protect, stopTimer);

module.exports = router;
