const mongoose = require('mongoose');

const huggingFaceModelSchema = new mongoose.Schema({
  model_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HuggingFaceModel', huggingFaceModelSchema);
