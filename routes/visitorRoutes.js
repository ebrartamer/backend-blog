const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { getAllVisitors, getVisitorStats } = require('../controllers/visitorController');

// Admin route'ları
router.get('/', authenticateToken, getAllVisitors);
router.get('/stats', authenticateToken, getVisitorStats);

module.exports = router;
