const Visitor = require('../models/visitorModel');

const logVisitor = async (req, res, next) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const path = req.originalUrl;

    await Visitor.create({ ip, userAgent, path });
    next();
  } catch (error) {
    console.error('Ziyaretçi kaydı sırasında hata:', error);
    next();
  }
};

module.exports = logVisitor;
