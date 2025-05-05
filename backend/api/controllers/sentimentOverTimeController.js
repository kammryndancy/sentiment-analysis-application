const mongoose = require('mongoose');
const ProcessedPost = require('../models/ProcessedPost'); 
const ProcessedComment = require('../models/ProcessedComment'); 

/**
 * GET /api/sentiment-over-time
 * Query: keyword, customWord, pageId, startDate, endDate
 * Returns: [{ date, sentiment }]
 */
exports.getSentimentOverTime = async (req, res) => {
  try {
    const { keyword, customWord, pageId, startDate, endDate } = req.query;
    const match = {};
    if (keyword) match['matched_keywords'] = keyword;
    if (pageId) match['page_id'] = pageId;
    if (customWord) {
      match['tokens'] = { $in: [customWord.toLowerCase()] };
    }
    if (startDate || endDate) {
      match['created_time'] = {};
      if (startDate) match['created_time'].$gte = new Date(startDate);
      if (endDate) match['created_time'].$lte = new Date(endDate);
    }
    const dateCheck = { $and: [
      { created_time: { $exists: true } },
      { $or: [
        { created_time: { $type: 'date' } },
        { created_time: { $type: 'string' } }
      ] }
    ] };
    const pipeline = [
      { $match: { ...match, ...dateCheck } },
      {
        $addFields: {
          created_time_date: {
            $cond: [
              { $eq: [ { $type: "$created_time" }, "date" ] },
              "$created_time",
              { $toDate: "$created_time" }
            ]
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_time_date' } },
          avgSentiment: { $avg: '$weighted_sentiment' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    // Aggregate from processed_posts and processed_comments
    const [postResults, commentResults] = await Promise.all([
      ProcessedPost.aggregate(pipeline),
      ProcessedComment.aggregate(pipeline)
    ]);
    // Merge results by date
    const merged = {};
    for (const r of [...postResults, ...commentResults]) {
      if (!merged[r._id]) {
        merged[r._id] = { date: r._id, sentimentSum: 0, count: 0 };
      }
      merged[r._id].sentimentSum += (r.avgSentiment ?? 0) * (r.count ?? 0);
      merged[r._id].count += r.count ?? 0;
    }
    const mergedResults = Object.values(merged)
      .map(r => ({
        date: r.date,
        sentiment: r.count ? r.sentimentSum / r.count : null,
        count: r.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    res.json({ data: mergedResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
