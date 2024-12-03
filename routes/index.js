const express = require('express');
const router = express.Router();

router.use('/users', require('./userRoutes'));
router.use('/blogs', require('./blogRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/tags', require('./tagRoutes'));

module.exports = router;

