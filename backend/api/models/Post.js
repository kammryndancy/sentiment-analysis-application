const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  post_id: String,
  page_id: String,
  created_time: Date,
  message: String,
  sentiment: Number, // average sentiment value for the post
  matched_keywords: [String],
  // ... add other fields as needed, e.g., likes, reactions, etc.
});

module.exports = mongoose.model('Post', PostSchema);
