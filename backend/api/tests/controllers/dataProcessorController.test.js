const { processComments, getStats } = require('../../controllers/dataProcessorController');

describe('Data Processor Controller', () => {
  let req;
  let res;
  let mockDataProcessor;

  beforeEach(() => {
    mockDataProcessor = {
      processAllComments: jest.fn(),
      getProcessingStats: jest.fn()
    };

    req = {
      app: {
        locals: {
          dataProcessor: mockDataProcessor
        }
      },
      body: {} // Initialize empty body
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Reset mocks
    mockDataProcessor.processAllComments.mockClear();
    mockDataProcessor.getProcessingStats.mockClear();
  });

  describe('processComments', () => {
    it('should process comments successfully', async () => {
      const mockResult = { 
        success: true, 
        processedCount: 10, 
        totalCount: 10,
        processingTime: 5000
      };
      
      // Set up the mock before making the request
      mockDataProcessor.processAllComments.mockResolvedValue(mockResult);

      req.body = {
        batchSize: 100,
        maxComments: 1000,
        skipAnonymization: false
      };

      await processComments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comments processed successfully',
        data: mockResult
      });
      expect(mockDataProcessor.processAllComments).toHaveBeenCalledWith(req.body);
    });

    it('should handle missing options', async () => {
      req.body = {};

      // Mock the processAllComments method to return an error
      mockDataProcessor.processAllComments.mockResolvedValue({
        success: false,
        error: 'Processing options are required'
      });

      await processComments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Processing options are required'
      });
      expect(mockDataProcessor.processAllComments).toHaveBeenCalled();
    });

    it('should handle processing errors', async () => {
      const error = new Error('Failed to process comments');
      mockDataProcessor.processAllComments.mockResolvedValue({
        success: false,
        error: error.message
      });

      req.body = {
        batchSize: 100
      };

      await processComments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
      expect(mockDataProcessor.processAllComments).toHaveBeenCalled();
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Unexpected error occurred');
      mockDataProcessor.processAllComments.mockRejectedValue(error);

      req.body = {
        batchSize: 100
      };

      await processComments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
      expect(mockDataProcessor.processAllComments).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return stats successfully', async () => {
      const mockStats = {
        totalCommentsProcessed: 1000,
        averageProcessingTime: 5000,
        lastRun: new Date(),
        successRate: 99.5
      };
      mockDataProcessor.getProcessingStats.mockResolvedValue(mockStats);

      await getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
      expect(mockDataProcessor.getProcessingStats).toHaveBeenCalled();
    });

    it('should handle stats retrieval errors', async () => {
      const error = new Error('Failed to get processing stats');
      mockDataProcessor.getProcessingStats.mockResolvedValue(null);

      await getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get processing stats'
      });
      expect(mockDataProcessor.getProcessingStats).toHaveBeenCalled();
    });
  });
});
