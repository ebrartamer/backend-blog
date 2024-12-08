const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { getAllVisitors, getVisitorStats, getDeviceStats } = require('../controllers/visitorController');

// Admin route'ları
router.get('/', authenticateToken, getAllVisitors);
router.get('/stats', authenticateToken, getVisitorStats);
router.get('/device-stats', authenticateToken, getDeviceStats);

module.exports = router;
