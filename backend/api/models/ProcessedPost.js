const mongoose = require('mongoose');

const ProcessedPostSchema = new mongoose.Schema({
  post_id: String,
  page_id: String,
  created_time: Date,
  message: String,
  matched_keywords: [String],
  weighted_sentiment: Number,
});

module.exports = mongoose.model('ProcessedPost', ProcessedPostSchema, 'processed_posts');
