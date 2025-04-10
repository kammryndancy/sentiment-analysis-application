export const listKeywords = async (req, res) => {
  try {
    const keywordManager = req.app.locals.keywordManager;
    const keywords = await keywordManager.listKeywords();
    res.status(200).json({
      success: true,
      data: keywords
    });
  } catch (error) {
    console.error('Error getting keywords:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const addKeyword = async (req, res) => {
  try {
    const keywordManager = req.app.locals.keywordManager;
    const { keyword, category, description } = req.body;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Keyword is required'
      });
    }

    const result = await keywordManager.addKeyword({ keyword, category, description });

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Keyword added successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Keyword already exists'
      });
    }
  } catch (error) {
    console.error('Error adding keyword:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const removeKeyword = async (req, res) => {
  try {
    const keywordManager = req.app.locals.keywordManager;
    const { keyword } = req.params;
    const result = await keywordManager.removeKeyword(keyword);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Keyword removed successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Keyword not found'
      });
    }
  } catch (error) {
    console.error('Error removing keyword:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const importKeywords = async (req, res) => {
  try {
    const keywordManager = req.app.locals.keywordManager;
    const { keywords } = req.body;

    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({
        success: false,
        error: 'Keywords array is required'
      });
    }

    const result = await keywordManager.importKeywords(keywords);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Keywords imported successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to import keywords'
      });
    }
  } catch (error) {
    console.error('Error importing keywords:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
