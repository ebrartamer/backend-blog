const express = require('express');
const router = express.Router();
const blogControllers = require('../controllers/blogControllers');
const { authenticateToken } = require('../middlewares/auth');

router.post('/', authenticateToken, blogControllers.createBlogPost);
router.get('/', blogControllers.getAllBlogPosts);
router.get('/:id', blogControllers.getBlogPostById);
router.put('/:id', authenticateToken, blogControllers.updateBlogPost);
router.delete('/:id', authenticateToken, blogControllers.deleteBlogPost);
router.post('/:id/comments', authenticateToken, blogControllers.addComment);

module.exports = router;