const Response = require('../utils/response');


const isAdmin = (req, res, next) => {
    // Kullanıcı bilgisi auth middleware'inden geliyor
    if (!req.user || req.user.role !== 'admin') {
        return new Response(null, "Bu işlem için admin yetkisi gereklidir").error403(res);
    }
    next();
};

module.exports = { isAdmin }; 