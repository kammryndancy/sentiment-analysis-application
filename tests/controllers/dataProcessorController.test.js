const { processComments, getStats } = require('../../controllers/dataProcessorController');

describe('Data Processor Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      app: {
        locals: {
          dataProcessor: {
            processAllComments: jest.fn(),
            getProcessingStats: jest.fn()
          }
        }
      },
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('processComments', () => {
    it('should process comments successfully', async () => {
      const mockResult = { success: true, processedCount: 10, totalCount: 10 };
      req.app.locals.dataProcessor.processAllComments.mockResolvedValue(mockResult);

      await processComments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle processing errors', async () => {
      const error = new Error('Processing failed');
      req.app.locals.dataProcessor.processAllComments.mockRejectedValue(error);

      await processComments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: error.message });
    });
  });

  describe('getStats', () => {
    it('should return stats successfully', async () => {
      const mockStats = {
        totalComments: 100,
        processedComments: 50,
        processingRatio: '50.00%'
      };
      req.app.locals.dataProcessor.getProcessingStats.mockResolvedValue(mockStats);

      await getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStats);
    });

    it('should handle stats retrieval errors', async () => {
      const error = new Error('Stats retrieval failed');
      req.app.locals.dataProcessor.getProcessingStats.mockRejectedValue(error);

      await getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: error.message });
    });
  });
});
