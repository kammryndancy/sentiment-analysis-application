const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  roles: { type: [String], enum: ['admin', 'user'], default: ['user'] },
  pendingRoles: { type: [String], enum: ['admin', 'user'], default: [] },
  createdAt: { type: Date, default: Date.now },
  enabled: { type: Boolean, default: false }, // New: must be enabled by admin
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
