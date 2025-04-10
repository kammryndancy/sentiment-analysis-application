const PageManager = require('../services/utils/PageManagerShim');

exports.getAllPages = async (req, res) => {
  try {
    const pageManager = req.app.locals.pageManager;
    const pages = await pageManager.getAllPages();
    res.status(200).json({
      success: true,
      data: pages
    });
  } catch (error) {
    console.error('Error getting pages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.addPage = async (req, res) => {
  try {
    const pageManager = req.app.locals.pageManager;
    const { page_id, name, description } = req.body;

    if (!page_id || !name) {
      return res.status(400).json({
        success: false,
        error: 'Both page_id and name are required'
      });
    }

    const result = await pageManager.addPage({ page_id, name, description });

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Page added successfully',
        data: result.page
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Page already exists'
      });
    }
  } catch (error) {
    console.error('Error adding page:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.removePage = async (req, res) => {
  try {
    const pageManager = req.app.locals.pageManager;
    const page_id = req.params.page_id;

    if (!page_id) {
      return res.status(400).json({
        success: false,
        error: 'Page ID is required'
      });
    }

    const result = await pageManager.removePage(page_id);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Page removed successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error || 'Page not found'
      });
    }
  } catch (error) {
    console.error('Error removing page:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.importPages = async (req, res) => {
  try {
    const pageManager = req.app.locals.pageManager;
    const { pageIds } = req.body;

    if (!pageIds || !Array.isArray(pageIds)) {
      return res.status(400).json({
        success: false,
        error: 'pageIds array is required'
      });
    }

    const result = await pageManager.importPages(pageIds);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Pages imported successfully',
        data: { imported: result.imported }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to import pages'
      });
    }
  } catch (error) {
    console.error('Error importing pages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
