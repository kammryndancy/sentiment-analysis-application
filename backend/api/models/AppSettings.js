const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
  google_cloud_nlp_api_key: { type: String, required: false }, // Encrypted
  huggingface_api_key: { type: String, required: false }, // Encrypted
  huggingface_model_id: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AppSettings', appSettingsSchema);
