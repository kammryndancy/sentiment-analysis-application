const mongoose = require('mongoose');

const FacebookCredentialSchema = new mongoose.Schema({
  facebook_app_id: { type: String, required: true },
  facebook_app_secret: { type: String, required: true },
  facebook_access_token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FacebookCredential', FacebookCredentialSchema);
