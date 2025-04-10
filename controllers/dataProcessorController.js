// Data processing endpoint
const processComments = async (req, res) => {
  const dataProcessor = req.app.locals.dataProcessor; // Access shared instance
  try {
    const options = req.body;
    const result = await dataProcessor.processAllComments(options);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Statistics endpoint
const getStats = async (req, res) => {
  const dataProcessor = req.app.locals.dataProcessor; // Access shared instance
  try {
    const stats = await dataProcessor.getProcessingStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  processComments,
  getStats
};
