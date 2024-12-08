const Visitor = require('../models/visitorModel');
const Response = require('../utils/response');

// Tüm ziyaretçileri getir
const getAllVisitors = async (req, res) => {
    try {
        const visitors = await Visitor.find()
            .sort({ date: -1 }); // En son ziyaretçiler başta

        // Toplam benzersiz ziyaretçi sayısı
        const uniqueVisitors = await Visitor.distinct('ip');

        res.status(200).json({
            success: true,
            data: {
                totalVisits: visitors.length,
                uniqueVisitors: uniqueVisitors.length,
                visitors: visitors
            },
            message: "Ziyaretçi bilgileri başarıyla getirildi"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Ziyaretçi bilgileri alınırken bir hata oluştu'
        });
    }
};

// Ziyaretçi istatistiklerini getir
const getVisitorStats = async (req, res) => {
    try {
        // Son 24 saatteki ziyaretçiler
        const last24Hours = await Visitor.countDocuments({
            date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        // Son 7 gündeki ziyaretçiler
        const last7Days = await Visitor.countDocuments({
            date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        // Toplam benzersiz ziyaretçi sayısı
        const uniqueVisitors = await Visitor.distinct('ip');

        // En çok ziyaret edilen sayfalar
        const popularPages = await Visitor.aggregate([
            { $group: { _id: '$path', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                last24Hours,
                last7Days,
                totalUniqueVisitors: uniqueVisitors.length,
                popularPages
            },
            message: "Ziyaretçi istatistikleri başarıyla getirildi"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Ziyaretçi istatistikleri alınırken bir hata oluştu'
        });
    }
};

module.exports = {
    getAllVisitors,
    getVisitorStats
}; 