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
  getTotalLikesCount,
  addComment,
  replyToComment,
  getCommentReplies
} = require('../controllers/blogControllers');

// Public routes
router.get('/', getBlogs);
router.get('/:id', getBlogById);
router.post('/:id/comments', authenticateToken, addComment);

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

// Yorum yanıtlama route'ları
router.post('/:blogId/comments/:commentId/reply', authenticateToken, replyToComment);
router.get('/:blogId/comments/:commentId/replies', getCommentReplies);

module.exports = router;