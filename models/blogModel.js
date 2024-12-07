const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        min: 1
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog'
    }]
});

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        min: 3,
        max: 100,
        unique: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        min: 10,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    image: {
        type: String,
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    tagsId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
    }],
    comments: [commentSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    deletedAt: {
        type: Date,
        default: null
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likesCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

commentSchema.set('discriminatorKey', 'kind');

commentSchema.virtual('replyDetails', {
    ref: 'Blog',
    localField: 'replies',
    foreignField: '_id'
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog; 