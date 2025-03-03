const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  provider: String, // 'google' or 'github'
  providerId: String,
  displayName: String,
  email: String,
  avatar: String,
  rating: { type: Number, default: 1200 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
