const Blog = require('../models/blogModel');
const User = require('../models/userModels');
const Response = require('../utils/response');

exports.getDashboardStats = async (req, res) => {
    try {
        // Tüm istatistikleri paralel olarak çekelim
        const [totalBlogs, totalUsers, totalLikes, totalViews] = await Promise.all([
            Blog.countDocuments({ deletedAt: null }),
            User.countDocuments({ deletedAt: null }),
            Blog.aggregate([
                { $match: { deletedAt: null } },
                { $group: { _id: null, total: { $sum: "$likes" } } }
            ]),
            Blog.aggregate([
                { $match: { deletedAt: null } },
                { $group: { _id: null, total: { $sum: "$views" } } }
            ])
        ]);

        // Son 12 ayın ziyaretçi istatistikleri
        const monthlyStats = await Blog.aggregate([
            { $match: { deletedAt: null } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    views: { $sum: "$views" }
                }
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
            { $limit: 12 }
        ]);

        const stats = {
            followers: totalUsers,
            posts: totalBlogs,
            likes: totalLikes[0]?.total || 0,
            views: totalViews[0]?.total || 0,
            monthlyStats: monthlyStats.map(stat => ({
                month: stat._id.month,
                year: stat._id.year,
                views: stat.views
            }))
        };

        return new Response(stats, "İstatistikler başarıyla getirildi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};

// Temel istatistikleri getir
exports.getBasicStats = async (req, res) => {
    try {
        const [totalUsers, totalPosts] = await Promise.all([
            User.countDocuments({ deletedAt: null }),
            Blog.countDocuments({ deletedAt: null })
        ]);

        const stats = {
            totalUsers,
            totalPosts
        };

        return new Response(stats, "Temel istatistikler başarıyla getirildi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};

// Son blogları getir
exports.getRecentPosts = async (req, res) => {
    try {
        const recentPosts = await Blog.find({ deletedAt: null })
            .populate('category', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title createdAt category comments image');

        return new Response(recentPosts, "Son gönderiler başarıyla getirildi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
}; 