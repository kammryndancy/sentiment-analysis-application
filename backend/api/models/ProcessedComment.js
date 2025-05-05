const mongoose = require('mongoose');

const ProcessedCommentSchema = new mongoose.Schema({
  comment_id: String,
  post_id: String,
  page_id: String,
  created_time: Date,
  message: String,
  matched_keywords: [String],
  weighted_sentiment: Number,
});

module.exports = mongoose.model('ProcessedComment', ProcessedCommentSchema, 'processed_comments');
