const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/', authenticateToken, categoryController.createCategory);
router.get('/', categoryController.getAllCategories);
router.delete('/:id', authenticateToken, categoryController.deleteCategory);

module.exports = router;