const express = require('express');
const router = express.Router();
const FacebookScraper = require('../services/facebookScraper');

// Middleware to initialize FacebookScraper
router.use((req, res, next) => {
  req.scraper = new FacebookScraper(req.app.locals.db);
  next();
});

/**
 * @route   POST /api/scraper/run
 * @desc    Run the scraper on specified pages or all pages in the database
 */
router.post('/run', async (req, res) => {
  try {
    const { pageIds, daysBack = 30 } = req.body;
    
    // Start scraping in the background
    res.status(202).json({ 
      success: true, 
      message: 'Scraping started in the background',
      pageIds: pageIds || 'all pages in database',
      daysBack
    });
    
    // Run the scraper after sending the response
    const result = await req.scraper.scrapePages(pageIds, daysBack);
    
    console.log('Scraping completed with result:', result);
  } catch (error) {
    console.error('Error running scraper:', error);
    // Error is logged but not returned to client since response is already sent
  }
});

/**
 * @route   GET /api/scraper/status
 * @desc    Get the status of the scraper (last run times for each page)
 */
router.get('/status', async (req, res) => {
  try {
    const pages = await req.scraper.listPages();
    
    // Format the status information
    const status = pages.map(page => ({
      pageId: page.page_id,
      name: page.name,
      lastScraped: page.last_scraped,
      addedAt: page.added_at
    }));
    
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Error getting scraper status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/scraper/comments
 * @desc    Get Avon-related comments with optional filtering
 */
router.get('/comments', async (req, res) => {
  try {
    const { 
      pageId, 
      startDate, 
      endDate, 
      limit = 100, 
      skip = 0 
    } = req.query;
    
    // Build the query
    const query = {};
    
    if (pageId) {
      query.page_id = pageId;
    }
    
    if (startDate || endDate) {
      query.created_time = {};
      
      if (startDate) {
        query.created_time.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.created_time.$lte = new Date(endDate);
      }
    }
    
    // Get the comments from MongoDB
    const db = req.app.locals.db;
    const collection = db.collection(process.env.MONGO_SCRAPED_COMMENTS_COLLECTION || 'scraped_comments');
    
    const comments = await collection
      .find(query)
      .sort({ created_time: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();
    
    const total = await collection.countDocuments(query);
    
    res.json({ 
      success: true, 
      data: comments,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + comments.length
      }
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/scraper/stats
 * @desc    Get statistics about the scraped data
 */
router.get('/stats', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const collection = db.collection(process.env.MONGO_SCRAPED_COMMENTS_COLLECTION || 'scraped_comments');
    const scraped_posts = db.collection(process.env.MONGO_SCRAPED_POSTS_COLLECTION || 'scraped_posts');
    
    // Get total counts
    const totalComments = await collection.countDocuments();
    const totalPosts = await scraped_posts.countDocuments();
    const totalPages = await db.collection(process.env.MONGO_PAGE_IDS_COLLECTION || 'page_ids').countDocuments();
    
    // Get comments per page
    const commentsPerPage = await collection.aggregate([
      { $group: { _id: '$page_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    // Get comments over time (by month)
    const commentsOverTime = await collection.aggregate([
      {
        $addFields: {
          created_time_date: {
            $cond: [
              { $eq: [{ $type: "$created_time" }, "date"] },
              "$created_time",
              {
                $cond: [
                  { $eq: [{ $type: "$created_time" }, "string"] },
                  { $toDate: "$created_time" },
                  {
                    $cond: [
                      { $eq: [{ $type: "$created_time" }, "int"] },
                      { $toDate: "$created_time" },
                      null
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $match: { created_time_date: { $type: "date" } }
      },
      {
        $group: {
          _id: {
            year: { $year: "$created_time_date" },
            month: { $month: "$created_time_date" },
            day: { $dayOfMonth: "$created_time_date" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]).toArray();
    
    res.json({ 
      success: true, 
      data: {
        totalComments,
        totalPosts,
        totalPages,
        commentsPerPage,
        commentsOverTime
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
