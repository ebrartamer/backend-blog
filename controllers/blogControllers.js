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
    // Blog'u bul ve yazar bilgisiyle birlikte getir
    const blog = await Blog.findById(req.params.id).populate('author');

    if (!blog) {
      res.status(404);
      throw new Error('Blog bulunamadı');
    }

    // Kullanıcı kontrolü
    if (!req.user) {
      res.status(401);
      throw new Error('Yetkilendirme başarısız');
    }

    // Admin veya blog sahibi kontrolü
    const isAdmin = req.user.role === 'admin';
    const isBlogOwner = blog.author._id.toString() === req.user._id.toString();

    if (!isAdmin && !isBlogOwner) {
      res.status(401);
      throw new Error('Bu işlem için yetkiniz yok');
    }

    // Soft delete - sadece deletedAt alanını güncelle
    blog.deletedAt = new Date();
    await blog.save();

    res.status(200).json({
      success: true,
      message: 'Blog başarıyla silindi'
    });
    
  } catch (error) {
    console.error('Blog silme hatası:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Blog silinirken bir hata oluştu'
    });
  }
});

// @desc    Blog'a yorum ekle
// @route   POST /api/blogs/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  try {
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
const deleteComment = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.blogId);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog bulunamadı'
            });
        }

        const comment = blog.comments.id(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Yorum bulunamadı'
            });
        }

        // Admin veya yorum sahibi kontrolü
        const isAdmin = req.user.role === 'admin';
        const isCommentOwner = comment.author.toString() === req.user._id.toString();

        if (!isAdmin && !isCommentOwner) {
            return res.status(403).json({
                success: false,
                message: 'Bu yorumu silme yetkiniz yok'
            });
        }

        // Eğer yorumun yanıtları varsa onları da sil
        if (comment.replies && comment.replies.length > 0) {
            blog.comments = blog.comments.filter(c => 
                !comment.replies.includes(c._id) && c._id.toString() !== comment._id.toString()
            );
        } else {
            // Sadece yorumu sil
            comment.remove();
        }

        await blog.save();

        // Güncellenmiş blogu getir ve populate et
        const updatedBlog = await Blog.findById(req.params.blogId)
            .populate({
                path: 'comments.author',
                select: 'username'
            })
            .populate({
                path: 'comments',
                populate: {
                    path: 'replies',
                    populate: {
                        path: 'author',
                        select: 'username'
                    }
                }
            });

        return res.status(200).json({
            success: true,
            data: updatedBlog,
            message: 'Yorum başarıyla silindi'
        });

    } catch (error) {
        console.error('Yorum silme hatası:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Yorum silinirken bir hata oluştu'
        });
    }
};

// Blog beğenme/beğenmekten vazgeçme
const toggleLike = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        
        if (!blog) {
            res.status(404);
            throw new Error('Blog bulunamadı');
        }

        // Kullanıcının blog'u daha önce beğenip beğenmediğini kontrol et
        const isLiked = blog.likes.includes(req.user._id);

        if (isLiked) {
            // Blog zaten beğenilmişse, beğeniyi kaldır
            blog.likes = blog.likes.filter(id => id.toString() !== req.user._id.toString());
            blog.likesCount = blog.likesCount - 1;
        } else {
            // Blog beğenilmemişse, beğeni ekle
            blog.likes.push(req.user._id);
            blog.likesCount = blog.likesCount + 1;
        }

        await blog.save();

        res.status(200).json({
            success: true,
            data: {
                liked: !isLiked,
                likesCount: blog.likesCount
            },
            message: `Blog ${isLiked ? 'beğenmekten vazgeçildi' : 'beğenildi'}`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Blog beğeni durumunu kontrol et
const checkLikeStatus = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        
        if (!blog) {
            res.status(404);
            throw new Error('Blog bulunamadı');
        }

        const isLiked = blog.likes.includes(req.user._id);

        res.status(200).json({
            success: true,
            data: {
                liked: isLiked,
                likesCount: blog.likesCount
            },
            message: "Beğeni durumu başarıyla getirildi"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Blog'un toplam beğeni sayısını getir
const getLikesCount = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        
        if (!blog) {
            res.status(404);
            throw new Error('Blog bulunamadı');
        }

        res.status(200).json({
            success: true,
            data: {
                likesCount: blog.likesCount
            },
            message: "Beğeni sayısı başarıyla getirildi"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Tüm blogların toplam beğeni sayısını getir
const getTotalLikes = async (req, res) => {
    try {
        const result = await Blog.aggregate([
            { $match: { deletedAt: null } }, // Silinmemiş blogları filtrele
            {
                $group: {
                    _id: null,
                    totalLikes: { $sum: "$likesCount" }
                }
            }
        ]);

        const totalLikes = result[0]?.totalLikes || 0;

        res.status(200).json({
            success: true,
            data: {
                totalLikes
            },
            message: "Toplam beğeni sayısı başarıyla getirildi"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Tüm blogların toplam beğeni sayısını getir
const getTotalLikesCount = async (req, res) => {
    try {
        // Silinmemiş tüm blogların beğeni sayılarını topla
        const result = await Blog.aggregate([
            // Silinmemiş blogları filtrele
            { 
                $match: { 
                    deletedAt: null 
                } 
            },
            // Tüm beğeni sayılarını topla
            {
                $group: {
                    _id: null,
                    totalLikes: { $sum: "$likesCount" }
                }
            }
        ]);

        // Eğer hiç blog yoksa veya hiç beğeni yoksa 0 döndür
        const totalLikes = result[0]?.totalLikes || 0;

        res.status(200).json({
            success: true,
            data: {
                totalLikes
            },
            message: "Tüm blogların toplam beğeni sayısı başarıyla getirildi"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Toplam beğeni sayısı alınırken bir hata oluştu'
        });
    }
};

// Yoruma yanıt ver
const replyToComment = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.blogId);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog bulunamadı'
            });
        }

        const parentComment = blog.comments.id(req.params.commentId);
        
        if (!parentComment) {
            return res.status(404).json({
                success: false,
                message: 'Yanıt verilecek yorum bulunamadı'
            });
        }

        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Yanıt içeriği gereklidir'
            });
        }

        // Yeni yanıt oluştur
        const newComment = {
            content: content.trim(),
            author: req.user.id,
            parentId: parentComment._id,
            createdAt: new Date(),
            replies: []
        };

        // Yanıtı yorumlar dizisine ekle
        blog.comments.push(newComment);
        
        // Parent yorumun replies dizisine yeni yorumun ID'sini ekle
        const addedComment = blog.comments[blog.comments.length - 1];
        parentComment.replies.push(addedComment._id);

        await blog.save();

        // Güncellenmiş blogu getir ve populate et
        const updatedBlog = await Blog.findById(req.params.blogId)
            .populate({
                path: 'comments.author',
                select: 'username'
            })
            .populate({
                path: 'comments',
                populate: {
                    path: 'replies',
                    populate: {
                        path: 'author',
                        select: 'username'
                    }
                }
            });

        return res.status(201).json({
            success: true,
            data: updatedBlog,
            message: 'Yanıt başarıyla eklendi'
        });

    } catch (error) {
        console.error('Yanıt ekleme hatası:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Yanıt eklenirken bir hata oluştu'
        });
    }
};

// Yorumun yanıtlarını getir
const getCommentReplies = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.blogId);
        
        if (!blog) {
            res.status(404);
            throw new Error('Blog bulunamadı');
        }

        const comment = blog.comments.id(req.params.commentId);
        
        if (!comment) {
            res.status(404);
            throw new Error('Yorum bulunamadı');
        }

        // Yanıtları populate et
        const populatedComment = await Blog.findOne(
            { _id: req.params.blogId, 'comments._id': req.params.commentId },
            { 'comments.$': 1 }
        ).populate('comments.replies');

        res.status(200).json({
            success: true,
            data: populatedComment.comments[0].replies,
            message: 'Yanıtlar başarıyla getirildi'
        });

    } catch (error) {
        console.error('Yanıt getirme hatası:', error);
        res.status(error.status || 500);
        throw new Error('Yanıtlar getirilirken bir hata oluştu: ' + error.message);
    }
};

module.exports = {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  addComment,
  deleteComment,
  uploadImage,
  toggleLike,
  checkLikeStatus,
  getLikesCount,
  getTotalLikes,
  getTotalLikesCount,
  replyToComment,
  getCommentReplies
};