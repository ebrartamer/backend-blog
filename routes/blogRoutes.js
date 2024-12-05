const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  addComment,
  deleteComment
} = require('../controllers/blogControllers');

// Public routes
router.get('/', getBlogs);
router.get('/:id', getBlogById);

// Protected routes
router.post('/', authenticateToken, upload.single('image'), createBlog);
router.put('/:id', authenticateToken, upload.single('image'), updateBlog);
router.delete('/:id', authenticateToken, deleteBlog);

// Comment routes
router.post('/:id/comments', authenticateToken, addComment);
router.delete('/:id/comments/:commentId', authenticateToken, deleteComment);

module.exports = router;