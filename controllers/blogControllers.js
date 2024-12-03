const mongoose = require('mongoose');
const Blog = require('../models/blogModel');
const Response = require('../utils/response');
const Category = require('../models/categoryModel');
const Tag = require('../models/tagModel');

// Create a new blog post
exports.createBlogPost = async (req, res) => {
    try {
        // Aynı başlıkla blog var mı kontrol et
        const existingBlog = await Blog.findOne({ 
            title: req.body.title,
            deletedAt: null
        });

        if (existingBlog) {
            return new Response(null, "Bu başlıkta bir blog zaten mevcut").error400(res);
        }

        // Tag ID'lerini kontrol et
        let validatedTags = [];
        if (req.body.tags && Array.isArray(req.body.tags)) {
            try {
                // Her bir tag ID'sinin geçerli olup olmadığını kontrol et
                validatedTags = req.body.tags.map(tagId => {
                    if (!mongoose.Types.ObjectId.isValid(tagId)) {
                        throw new Error(`Geçersiz tag ID formatı: ${tagId}`);
                    }
                    return tagId;
                });

                // Tag'lerin veritabanında var olduğunu kontrol et
                const existingTags = await Tag.find({ _id: { $in: validatedTags } });
                if (existingTags.length !== validatedTags.length) {
                    return new Response(null, "Bir veya birden fazla tag bulunamadı").error400(res);
                }
            } catch (error) {
                return new Response(null, error.message).error400(res);
            }
        }

        // Kategori ID'sini kontrol et
        let validatedCategory = null;
        if (req.body.category) {
            if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
                return new Response(null, "Geçersiz kategori ID formatı").error400(res);
            }
            validatedCategory = req.body.category;
            const categoryExists = await Category.findById(validatedCategory);
            if (!categoryExists) {
                return new Response(null, "Belirtilen kategori bulunamadı").error400(res);
            }
        }

        const newPost = new Blog({
            title: req.body.title,
            content: req.body.content,
            author: req.user.id,
            category: validatedCategory,
            tags: validatedTags
        });
        
        await newPost.save();

        // Populate ile ilişkili alanları doldur
        const populatedPost = await Blog.findById(newPost._id)
            .populate('author', 'username email')
            .populate('category', 'name')
            .populate('tags', 'name');

        return new Response(populatedPost, "Blog başarıyla oluşturuldu").created(res);
    } catch (error) {
        if (error.name === 'CastError') {
            return new Response(null, "Geçersiz ID formatı").error400(res);
        }
        return new Response(null, error.message).error500(res);
    }
};

// Get all blog posts
exports.getAllBlogPosts = async (req, res) => {
    try {
        const posts = await Blog.find({ deletedAt: null })
            .populate('author', 'username email')
            .populate('category', 'name')
            .populate('tags', 'name')
            .populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    select: 'username'
                }
            })
            .sort({ createdAt: -1 });
        return new Response(posts, "Bloglar başarıyla getirildi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};

// Get a single blog post by ID
exports.getBlogPostById = async (req, res) => {
    try {
        const post = await Blog.findOne({ 
            _id: req.params.id,
            deletedAt: null 
        })
        .populate('author', 'username email')
        .populate('category', 'name')
        .populate('tags', 'name')
        .populate({
            path: 'comments',
            populate: {
                path: 'author',
                select: 'username'
            }
        });

        if (!post) {
            return new Response(null, "Blog bulunamadı").error404(res);
        }
        return new Response(post, "Blog başarıyla getirildi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};

// Update a blog post by ID
exports.updateBlogPost = async (req, res) => {
    try {
        const blog = await Blog.findOne({ 
            _id: req.params.id,
            deletedAt: null 
        });

        if (!blog) {
            return new Response(null, "Blog bulunamadı").error404(res);
        }

        // Sadece blog sahibi güncelleyebilir
        if (blog.author.toString() !== req.user.id) {
            return new Response(null, "Bu blogu güncelleme yetkiniz yok").error403(res);
        }

        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true }
        )
        .populate('author', 'username email')
        .populate('category', 'name')
        .populate('tags', 'name')
        .populate({
            path: 'comments',
            populate: {
                path: 'author',
                select: 'username'
            }
        });

        return new Response(updatedBlog, "Blog başarıyla güncellendi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};

// Delete a blog post by ID (soft delete)
exports.deleteBlogPost = async (req, res) => {
    try {
        const blog = await Blog.findOne({ 
            _id: req.params.id,
            deletedAt: null 
        });

        if (!blog) {
            return new Response(null, "Blog bulunamadı").error404(res);
        }

        // Sadece blog sahibi silebilir
        if (blog.author.toString() !== req.user.id) {
            return new Response(null, "Bu blogu silme yetkiniz yok").error403(res);
        }

        blog.deletedAt = new Date();
        await blog.save();

        return new Response(null, "Blog başarıyla silindi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};

// Yorum ekleme fonksiyonunu düzeltelim
exports.addComment = async (req, res) => {
    try {
        const blog = await Blog.findOne({ 
            _id: req.params.id,
            deletedAt: null 
        });

        if (!blog) {
            return new Response(null, "Blog bulunamadı").error404(res);
        }

        blog.comments.push({
            author: req.user.id,
            content: req.body.content
        });

        await blog.save();

        // Populate edilmiş blog'u döndür
        const populatedBlog = await Blog.findById(blog._id)
            .populate('author', 'username email')
            .populate('category', 'name')
            .populate('tags', 'name')
            .populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    select: 'username'
                }
            });

        return new Response(populatedBlog, "Yorum başarıyla eklendi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};