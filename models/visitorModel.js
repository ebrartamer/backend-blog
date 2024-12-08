const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  date: { type: Date, default: Date.now },
  userAgent: { type: String }, // Tarayıcı bilgileri
  path: { type: String }, // Ziyaret edilen sayfa
});

module.exports = mongoose.model('Visitor', visitorSchema);
