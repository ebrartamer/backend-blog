const Blog = require('../models/blogModel');
const upload = require('../middlewares/upload');
const asyncHandler = require('express-async-handler');

// @desc    Tüm blogları getir
// @route   GET /api/blogs
// @access  Public
const getBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ deletedAt: null })
    .populate('author', 'username email')
    .populate('categoryId', 'name')
    .populate('tagsId', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: blogs,
    message: 'Bloglar başarıyla getirildi'
  });
});

// @desc    Blog detayını getir
// @route   GET /api/blogs/:id
// @access  Public
const getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ _id: req.params.id, deletedAt: null })
    .populate('author', 'username email')
    .populate('categoryId', 'name')
    .populate('tagsId', 'name')
    .populate('comments.author', 'username');

  if (!blog) {
    res.status(404);
    throw new Error('Blog bulunamadı');
  }

  res.status(200).json({
    success: true,
    data: blog,
    message: 'Blog başarıyla getirildi'
  });
});

// @desc    Blog oluştur
// @route   POST /api/blogs
// @access  Private
const createBlog = asyncHandler(async (req, res) => {
  const { title, content, categoryId, tagsId, author } = req.body;

  // Görsel kontrolü
  if (!req.file) {
    res.status(400);
    throw new Error('Lütfen bir görsel yükleyin');
  }

  // Blog başlığı kontrolü
  const existingBlog = await Blog.findOne({ title });
  if (existingBlog) {
    res.status(400);
    throw new Error('Bu başlıkta bir blog zaten mevcut');
  }

  const blog = await Blog.create({
    title,
    content,
    author,
    image: req.file.path,
    categoryId,
    tagsId: tagsId ? JSON.parse(tagsId) : [],
  });

  const populatedBlog = await Blog.findById(blog._id)
    .populate('author', 'username email')
    .populate('categoryId', 'name')
    .populate('tagsId', 'name');

  res.status(201).json({
    success: true,
    data: populatedBlog,
    message: 'Blog başarıyla oluşturuldu'
  });
});

// @desc    Blog güncelle
// @route   PUT /api/blogs/:id
// @access  Private
const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    res.status(404);
    throw new Error('Blog bulunamadı');
  }

  // Blog sahibi kontrolü
  if (blog.author.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Bu blogu güncelleme yetkiniz yok');
  }

  const { title, content, categoryId, tagsId } = req.body;

  // Başlık değişmişse unique kontrolü
  if (title && title !== blog.title) {
    const existingBlog = await Blog.findOne({ title });
    if (existingBlog) {
      res.status(400);
      throw new Error('Bu başlıkta bir blog zaten mevcut');
    }
  }

  // Update verileri
  const updateData = {
    title: title || blog.title,
    content: content || blog.content,
    categoryId: categoryId || blog.categoryId,
    tagsId: tagsId ? JSON.parse(tagsId) : blog.tagsId,
  };

  // Görsel varsa güncelle
  if (req.file) {
    updateData.image = req.file.path;
  }

  const updatedBlog = await Blog.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  )
    .populate('author', 'username email')
    .populate('categoryId', 'name')
    .populate('tagsId', 'name');

  res.status(200).json({
    success: true,
    data: updatedBlog,
    message: 'Blog başarıyla güncellendi'
  });
});

// @desc    Blog sil (soft delete)
// @route   DELETE /api/blogs/:id
// @access  Private
const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    res.status(404);
    throw new Error('Blog bulunamadı');
  }

  // Blog sahibi kontrolü
  if (blog.author.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Bu blogu silme yetkiniz yok');
  }

  // Soft delete
  blog.deletedAt = new Date();
  await blog.save();

  res.status(200).json({
    success: true,
    message: 'Blog başarıyla silindi'
  });
});

// @desc    Blog'a yorum ekle
// @route   POST /api/blogs/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    res.status(404);
    throw new Error('Blog bulunamadı');
  }

  const { content } = req.body;

  if (!content) {
    res.status(400);
    throw new Error('Yorum içeriği gereklidir');
  }

  const comment = {
    content,
    author: req.user._id,
  };

  blog.comments.push(comment);
  await blog.save();

  const updatedBlog = await Blog.findById(req.params.id)
    .populate('author', 'username email')
    .populate('categoryId', 'name')
    .populate('tagsId', 'name')
    .populate('comments.author', 'username');

  res.status(201).json({
    success: true,
    data: updatedBlog,
    message: 'Yorum başarıyla eklendi'
  });
});

// @desc    Blog yorumunu sil
// @route   DELETE /api/blogs/:id/comments/:commentId
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    res.status(404);
    throw new Error('Blog bulunamadı');
  }

  const comment = blog.comments.id(req.params.commentId);

  if (!comment) {
    res.status(404);
    throw new Error('Yorum bulunamadı');
  }

  // Yorum sahibi kontrolü
  if (comment.author.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Bu yorumu silme yetkiniz yok');
  }

  comment.remove();
  await blog.save();

  const updatedBlog = await Blog.findById(req.params.id)
    .populate('author', 'username email')
    .populate('categoryId', 'name')
    .populate('tagsId', 'name')
    .populate('comments.author', 'username');

  res.status(200).json({
    success: true,
    data: updatedBlog,
    message: 'Yorum başarıyla silindi'
  });
});

module.exports = {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  addComment,
  deleteComment
};