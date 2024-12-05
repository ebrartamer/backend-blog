const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/adminAuth');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/', [authenticateToken, isAdmin], userController.getAllUsers);

module.exports = router;