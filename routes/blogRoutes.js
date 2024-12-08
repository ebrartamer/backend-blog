const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleLike,
  checkLikeStatus,
  getLikesCount,
  getTotalLikesCount
} = require('../controllers/blogControllers');

// Public routes
router.get('/', getBlogs);
router.get('/:id', getBlogById);

// Protected routes
router.post('/', authenticateToken, createBlog);
router.put('/:id', authenticateToken, updateBlog);
router.delete('/:id', authenticateToken, deleteBlog);

// Like routes
router.post('/:id/like', authenticateToken, toggleLike);
router.get('/:id/like', authenticateToken, checkLikeStatus);
router.get('/:id/likes', getLikesCount);

// Tüm blogların toplam beğeni sayısını getir
router.get('/stats/total-likes', getTotalLikesCount);

module.exports = router;