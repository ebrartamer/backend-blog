const express = require('express');
const router = express.Router();
const path = require('path');
router.use('/users', require('./userRoutes'));
router.use('/blogs', require('./blogRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/tags', require('./tagRoutes'));
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));


module.exports = router;

