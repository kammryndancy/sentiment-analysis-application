exports.runScraper = async (req, res) => {
  try {
    const scraper = req.app.locals.scraper;
    const { pageIds, daysBack = 30 } = req.body;

    let finalPageIds = pageIds;
    if (!pageIds) {
      // If no pageIds provided, get all pageIds from the database
      const pageManager = req.app.locals.pageManager;
      finalPageIds = await pageManager.getPageIds();
      
      if (!finalPageIds || finalPageIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No pages found in the database'
        });
      }
    }

    if (!Array.isArray(finalPageIds)) {
      return res.status(400).json({
        success: false,
        error: 'Page IDs must be an array'
      });
    }

    if (finalPageIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Page IDs array cannot be empty'
      });
    }

    const result = await scraper.scrapePages(finalPageIds, daysBack);

    if (result.success) {
      res.status(202).json({
        success: true,
        message: 'Scraper started successfully',
        stats: result.stats
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error starting scraper:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getComments = async (req, res) => {
  try {
    const scraper = req.app.locals.scraper;
    const { startDate, endDate, pageId, limit = 100, skip = 0 } = req.query;

    // Use CommentManager's new getCommentsFromDb method
    const comments = await scraper.commentManager.getCommentsFromDb({ startDate, endDate, pageId, limit, skip });

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const scraper = req.app.locals.scraper;
    const stats = await scraper.commentManager.getStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
