const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/adminAuth');

router.post('/', [authenticateToken, isAdmin], categoryController.createCategory);
router.get('/', categoryController.getAllCategories);
router.delete('/:id', [authenticateToken, isAdmin], categoryController.deleteCategory);

module.exports = router;