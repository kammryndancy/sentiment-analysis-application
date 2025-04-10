const FacebookScraper = require('../services/facebookScraper');

exports.runScraper = async (req, res) => {
  try {
    const scraper = req.app.locals.scraper;
    const { pageIds, daysBack = 30 } = req.body;

    if (!pageIds) {
      return res.status(400).json({
        success: false,
        error: 'Page IDs array is required'
      });
    }

    if (!Array.isArray(pageIds)) {
      return res.status(400).json({
        success: false,
        error: 'Page IDs must be an array'
      });
    }

    if (pageIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Page IDs array cannot be empty'
      });
    }

    await scraper.runScraper(pageIds, daysBack);

    res.status(202).json({
      success: true,
      message: 'Scraper started successfully',
      pageIds: pageIds,
      daysBack
    });
  } catch (error) {
    console.error('Error starting scraper:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getScraperStatus = async (req, res) => {
  try {
    const scraper = req.app.locals.scraper;
    const status = await scraper.getScraperStatus();

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting scraper status:', error);
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

    const queryParams = {};

    // Parse and validate dates if provided
    if (startDate) {
      const parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format'
        });
      }
      queryParams.startDate = parsedStartDate;
    }

    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format'
        });
      }
      queryParams.endDate = parsedEndDate;
    }

    if (pageId) {
      queryParams.pageId = pageId;
    }

    queryParams.limit = parseInt(limit);
    queryParams.skip = parseInt(skip);

    const comments = await scraper.getComments(queryParams);

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
    const stats = await scraper.getStats();

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
