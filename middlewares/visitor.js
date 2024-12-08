const Visitor = require('../models/visitorModel');

const logVisitor = async (req, res, next) => {
  try {
    if (req.originalUrl.startsWith('/uploads/')) {
      return next();
    }

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const path = req.originalUrl;

    const isMobile = /mobile/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';

    await Visitor.create({ ip, userAgent, path, deviceType });
    next();
  } catch (error) {
    console.error('Ziyaretçi kaydı sırasında hata:', error);
    next();
  }
};

module.exports = logVisitor;
