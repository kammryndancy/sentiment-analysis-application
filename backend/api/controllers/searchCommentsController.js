const ProcessedPost = require('../models/ProcessedPost');
const ProcessedComment = require('../models/ProcessedComment');

// GET /api/search-comments
// Query: keyword, searchWord, page, pageSize, sortField, sortOrder
// Returns: { comments: [], total: n }
exports.searchComments = async (req, res) => {
  try {
    const { keyword, searchWord, page = 1, pageSize = 10, sortField = 'created_time', sortOrder = 'desc' } = req.query;
    const match = {};
    if (keyword) match['matched_keywords'] = keyword;
    if (searchWord) match['tokens'] = { $in: [searchWord.toLowerCase()] };
    // Only include documents with a valid message
    match['message'] = { $exists: true, $ne: '' };
    match['weighted_sentiment'] = { $exists: true };
    // Allow created_time to be either date or string
    const dateCheck = { $and: [
      { created_time: { $exists: true } },
      { $or: [
        { created_time: { $type: 'date' } },
        { created_time: { $type: 'string' } }
      ] }
    ] };
    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    // Helper to normalize results
    const normalize = (doc, source) => ({
      _id: doc._id,
      message: doc.message,
      matched_keywords: doc.matched_keywords || [],
      tokens: doc.tokens || [],
      page_id: doc.page_id,
      created_time: doc.created_time,
      weighted_sentiment: doc.weighted_sentiment,
      source,
    });
    // Query both collections
    const [postResults, postTotal] = await Promise.all([
      ProcessedPost.find({ ...match, ...dateCheck }).sort(sort).skip(skip).limit(limit),
      ProcessedPost.countDocuments({ ...match, ...dateCheck })
    ]);
    const [commentResults, commentTotal] = await Promise.all([
      ProcessedComment.find({ ...match, ...dateCheck }).sort(sort).skip(skip).limit(limit),
      ProcessedComment.countDocuments({ ...match, ...dateCheck })
    ]);
    // Merge and sort
    const allResults = [
      ...postResults.map(doc => normalize(doc, 'post')),
      ...commentResults.map(doc => normalize(doc, 'comment'))
    ];
    allResults.sort((a, b) => {
      if (sortOrder === 'asc') return new Date(a[sortField]) - new Date(b[sortField]);
      else return new Date(b[sortField]) - new Date(a[sortField]);
    });
    const paginatedResults = allResults.slice(0, limit);
    res.json({ comments: paginatedResults, total: postTotal + commentTotal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
