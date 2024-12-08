const express = require('express');
const router = express.Router();
const { 
    getDashboardStats, 
    getBasicStats,
    getRecentPosts 
} = require('../controllers/statsController');
const { authenticateToken } = require('../middlewares/auth');

router.get('/dashboard', authenticateToken, getDashboardStats);
router.get('/basic', authenticateToken, getBasicStats);
router.get('/recent-posts', getRecentPosts);

module.exports = router; 