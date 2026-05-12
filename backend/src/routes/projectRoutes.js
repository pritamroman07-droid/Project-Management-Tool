const express = require('express');
const router = express.Router();
const { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember, getTemplates } = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { projectValidator, paginationValidator } = require('../middleware/validators');
const { logActivity } = require('../middleware/activityLogger');

router.get('/templates', protect, getTemplates);
router.get('/', protect, paginationValidator, getProjects);
router.post('/', protect, projectValidator, logActivity('created_project', 'project'), createProject);
router.get('/:id', protect, getProject);
router.put('/:id', protect, logActivity('updated_project', 'project'), updateProject);
router.delete('/:id', protect, deleteProject);
router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;
