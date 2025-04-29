exports.listPages = async (req, res) => {
  try {
    const pageManager = req.app.locals.pageManager;
    const pages = await pageManager.listPages();
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

    // Pass the page_id as a string directly
    const result = await pageManager.addPageId(page_id, name, description);

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

    const result = await pageManager.removePageId(page_id);

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

    // Process each page ID
    const results = [];
    for (const pageId of pageIds) {
      const result = await pageManager.addPageId(pageId, null, null);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;

    res.status(200).json({
      success: true,
      message: 'Pages imported successfully',
      data: {
        total: results.length,
        success: successCount,
        failed: failedCount,
        results
      }
    });
  } catch (error) {
    console.error('Error importing pages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Enable or disable a page by page_id
exports.setPageEnabled = async (req, res) => {
  try {
    const pageManager = req.app.locals.pageManager;
    const { page_id } = req.params;
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, error: 'enabled must be a boolean' });
    }
    const result = await pageManager.page_ids_collection.updateOne(
      { page_id },
      { $set: { enabled, last_updated: new Date() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }
    res.status(200).json({ success: true, message: `Page ${enabled ? 'enabled' : 'disabled'} successfully` });
  } catch (error) {
    console.error('Error updating page enabled status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
