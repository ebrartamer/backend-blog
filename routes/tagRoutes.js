const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/', authenticateToken, tagController.createTag);
router.get('/', tagController.getAllTags);
router.delete('/:id', authenticateToken, tagController.deleteTag);

module.exports = router;