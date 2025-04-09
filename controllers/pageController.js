const FacebookScraper = require('../services/facebookScraper');

exports.listPages = async (req, res) => {
  try {
    const scraper = new FacebookScraper(req.app.locals.db);
    const pages = await scraper.listPages();
    res.json({ success: true, data: pages });
  } catch (error) {
    console.error('Error getting pages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addPage = async (req, res) => {
  try {
    const scraper = new FacebookScraper(req.app.locals.db);
    const { pageId, name, description } = req.body;

    if (!pageId) {
      return res.status(400).json({ success: false, message: 'Page ID is required' });
    }

    const result = await scraper.addPageId(pageId, name, description);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error adding page:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removePage = async (req, res) => {
  try {
    const scraper = new FacebookScraper(req.app.locals.db);
    const { pageId } = req.params;
    const result = await scraper.removePageId(pageId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error removing page:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.importPages = async (req, res) => {
  try {
    const scraper = new FacebookScraper(req.app.locals.db);
    const { pageIds } = req.body;

    if (!pageIds || !Array.isArray(pageIds)) {
      return res.status(400).json({
        success: false,
        message: 'Request body must contain a pageIds array'
      });
    }

    const results = {
      success: true,
      added: 0,
      updated: 0,
      failed: 0,
      messages: []
    };

    for (const pageId of pageIds) {
      const result = await scraper.addPageId(pageId);

      if (result.success) {
        if (result.message.includes('Added')) {
          results.added++;
        } else {
          results.updated++;
        }
      } else {
        results.failed++;
        results.messages.push(`Failed to add ${pageId}: ${result.message}`);
      }
    }

    results.message = `Imported ${results.added} new pages and updated ${results.updated} existing pages. ${results.failed} failed.`;

    res.status(201).json(results);
  } catch (error) {
    console.error('Error importing pages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
