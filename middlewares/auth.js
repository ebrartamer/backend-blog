const jwt = require('jsonwebtoken');
const Response = require('../utils/response');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1];
    
    if (!bearerToken) {
        return new Response(null, "Erişim reddedildi. Geçerli bir Bearer token gerekli").error401(res);
    }

    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return new Response(null, "Geçersiz veya süresi dolmuş token").error401(res);
        }
        req.user = user;
        next();
    });
};

const generateToken = (userId, role) => {
    return `Bearer ${jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET, { expiresIn: '1h' })}`;
};

module.exports = { generateToken, authenticateToken };
