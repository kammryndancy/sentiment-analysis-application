const request = require('supertest');
const express = require('express');
const dataProcessorRoutes = require('../../routes/dataProcessorRoutes');

describe('Data Processor Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/data', dataProcessorRoutes);
    app.locals.dataProcessor = {
      processAllComments: jest.fn(),
      getProcessingStats: jest.fn()
    };
  });

  describe('POST /api/data/process', () => {
    it('should process comments successfully', async () => {
      const mockResult = { success: true, processedCount: 10, totalCount: 10 };
      app.locals.dataProcessor.processAllComments.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/data/process')
        .send({ removeStopwords: true });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Comments processed successfully',
        data: mockResult
      });
      expect(app.locals.dataProcessor.processAllComments).toHaveBeenCalledWith({ removeStopwords: true });
    });

    it('should handle processing errors', async () => {
      const error = new Error('Processing failed');
      app.locals.dataProcessor.processAllComments.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/data/process')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ success: false, error: error.message });
    });
  });

  describe('GET /api/data/stats', () => {
    it('should return processing stats successfully', async () => {
      const mockStats = {
        totalComments: 100,
        processedComments: 50,
        processingRatio: "50.00%"
      };
      app.locals.dataProcessor.getProcessingStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/data/stats');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockStats
      });
      expect(app.locals.dataProcessor.getProcessingStats).toHaveBeenCalled();
    });

    it('should handle stats retrieval errors', async () => {
      const error = new Error('Failed to retrieve stats');
      app.locals.dataProcessor.getProcessingStats.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/data/stats');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: error.message
      });
    });
  });
});
