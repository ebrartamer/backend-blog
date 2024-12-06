const Blog = require('../models/blogModel');
const upload = require('../middlewares/upload');
const asyncHandler = require('express-async-handler');
const { diskStorage } = require('multer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Storage Ayarı
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const uploadDir = path.join(__dirname, '../../uploads/blog');
      
      // Klasör var mı kontrol et, yoksa oluştur
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      cb(null, uploadDir); // Hedef klasörü ayarla
    } catch (error) {
      cb(new Error('Upload directory could not be created: ' + error.message)); // Hata durumunu yönet
    }
  },
  filename: (req, file, cb) => {
    try {
      // Dosya adı oluşturma
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const sanitizedFileName = file.fieldname + '-' + uniqueSuffix + fileExtension;

      cb(null, sanitizedFileName); // Dosya adını ayarla
    } catch (error) {
      cb(new Error('File name could not be generated: ' + error.message)); // Hata durumunu yönet
    }
  }
});


const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|mp4|mov|avi/; // Video türlerini de ekleyin
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error("Sadece jpeg, jpg, png ve belirli video dosya türlerine izin verilir"));
};



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

// @desc    Görsel yükle
// @route   POST /api/blogs/upload
// @access  Private
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Lütfen bir görsel yükleyin');
  }

  res.status(200).json({
    success: true,
    imageUrl: req.file.path,
    message: 'Görsel başarıyla yüklendi'
  });
});

// @desc    Blog oluştur
// @route   POST /api/blogs
// @access  Private
const createBlog = asyncHandler(async (req, res) => {
  console.log("req.body", req.body)
  console.log("req.file", req.file)
  const { title, content, categoryId, tagsId, author } = req.body;

  const image = req.file ? req.file.path : null;
  // Görsel kontrolü
  if (!image) {
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
    image,
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

  const { title, content, categoryId, tagsId, image } = req.body;

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
    image: image || blog.image
  };

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

// @desc    Blog sil
// @route   DELETE /api/blogs/:id
// @access  Private
const deleteBlog = asyncHandler(async (req, res) => {
  try {
    // Blog'u author bilgisiyle birlikte çek
    const blog = await Blog.findById(req.params.id).populate('author');

    if (!blog) {
      res.status(404);
      throw new Error('Blog bulunamadı');
    }

    // Kullanıcı kontrolü
    if (!req.user || !req.user._id) {
      res.status(401);
      throw new Error('Oturum açmanız gerekiyor');
    }

    // Blog author kontrolü
    if (!blog.author || !blog.author._id) {
      res.status(400);
      throw new Error('Blog yazarı bilgisi eksik');
    }

    // Yetki kontrolü
    const authorId = blog.author._id.toString();
    const userId = req.user._id.toString();

    if (authorId !== userId) {
      res.status(401);
      throw new Error('Bu blogu silme yetkiniz yok');
    }

    // Blog'u sil
    await Blog.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Blog başarıyla silindi'
    });
    
  } catch (error) {
    console.error('Blog silme hatası:', error);
    res.status(500);
    throw new Error('Blog silinirken bir hata oluştu: ' + error.message);
  }
});

// @desc    Blog'a yorum ekle
// @route   POST /api/blogs/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  try {
    console.log("req.user", req.user)
    // Kullanıcı kontrolü
    if (!req.user || !req.user.id) {
      res.status(401);
      throw new Error('Oturum açmanız gerekiyor');
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      res.status(404);
      throw new Error('Blog bulunamadı');
    }

    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400);
      throw new Error('Yorum içeriği gereklidir');
    }

    // Yorum nesnesini oluştur
    const comment = {
      content: content.trim(),
      author: req.user.id, // Kullanıcı ID'sini doğrudan ata
      createdAt: new Date()
    };

    // Yorumu ekle ve kaydet
    blog.comments.push(comment);
    await blog.save();

    // Güncellenmiş blogu getir
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

  } catch (error) {
    console.error('Yorum ekleme hatası:', error);
    res.status(error.status || 500);
    throw new Error('Yorum eklenirken bir hata oluştu: ' + error.message);
  }
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
  deleteComment,
  uploadImage
};