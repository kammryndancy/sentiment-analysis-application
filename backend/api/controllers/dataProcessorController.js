// Data processing endpoint
const processComments = async (req, res) => {
  try {
    const dataProcessor = req.app.locals.dataProcessor;
    const options = req.body;

    if (!options) {
      return res.status(400).json({
        success: false,
        error: 'Processing options are required'
      });
    }

    const result = await dataProcessor.processAllComments(options);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Comments processed successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to process comments'
      });
    }
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const processPosts = async (req, res) => {
  try {
    const dataProcessor = req.app.locals.dataProcessor;
    const options = req.body;
    if (!options) {
      return res.status(400).json({ success: false, error: 'Processing options are required' });
    }
    const result = await dataProcessor.processAllPosts(options);
    if (result.success) {
      res.status(200).json({ success: true, message: 'Posts processed successfully', data: result });
    } else {
      res.status(500).json({ success: false, error: result.error || 'Failed to process posts' });
    }
  } catch (error) {
    console.error('Error processing posts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Statistics endpoint
const getStats = async (req, res) => {
  try {
    const dataProcessor = req.app.locals.dataProcessor;
    const stats = await dataProcessor.getProcessingStats();
    
    if (stats) {
      res.status(200).json({
        success: true,
        data: stats
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to get processing stats'
      });
    }
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  processComments,
  processPosts,
  getStats
};
