const express = require('express');
const router = express.Router();
const { getTeams, createTeam, updateTeam, addTeamMember, removeTeamMember } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getTeams);
router.post('/', protect, createTeam);
router.put('/:id', protect, updateTeam);
router.post('/:id/members', protect, addTeamMember);
router.delete('/:id/members/:userId', protect, removeTeamMember);

module.exports = router;
