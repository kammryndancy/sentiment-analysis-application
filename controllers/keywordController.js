const FacebookScraper = require('../services/facebookScraper');

exports.listKeywords = async (req, res) => {
  try {
    const scraper = new FacebookScraper(req.app.locals.db);
    const keywords = await scraper.listKeywords();
    res.json({ success: true, data: keywords });
  } catch (error) {
    console.error('Error getting keywords:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addKeyword = async (req, res) => {
  try {
    const scraper = new FacebookScraper(req.app.locals.db);
    const { keyword, category, description } = req.body;

    if (!keyword) {
      return res.status(400).json({ success: false, message: 'Keyword is required' });
    }

    const result = await scraper.addKeyword(keyword, category, description);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error adding keyword:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeKeyword = async (req, res) => {
  try {
    const scraper = new FacebookScraper(req.app.locals.db);
    const { keyword } = req.params;
    const result = await scraper.removeKeyword(keyword);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error removing keyword:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.importKeywords = async (req, res) => {
  try {
    const scraper = new FacebookScraper(req.app.locals.db);
    const { keywords } = req.body;

    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({
        success: false,
        message: 'Request body must contain a keywords array'
      });
    }

    const result = await scraper.importKeywords(keywords);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error importing keywords:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
