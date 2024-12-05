const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { authenticateToken } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/adminAuth');

router.post('/', [authenticateToken, isAdmin], tagController.createTag);
router.get('/', tagController.getAllTags);
router.delete('/:id', [authenticateToken, isAdmin], tagController.deleteTag);

module.exports = router;