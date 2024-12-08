const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const {
    register,
    login,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} = require('../controllers/userController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/', authenticateToken, getAllUsers);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, deleteUser);

module.exports = router;