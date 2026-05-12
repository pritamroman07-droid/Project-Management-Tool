const express = require('express');
const router = express.Router();
const { getDashboardStats, getTaskTrends, getTeamPerformance, getPriorityDistribution, getAiInsights } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboardStats);
router.get('/task-trends', protect, getTaskTrends);
router.get('/team-performance', protect, getTeamPerformance);
router.get('/priority-distribution', protect, getPriorityDistribution);
router.get('/ai-insights', protect, getAiInsights);

module.exports = router;
