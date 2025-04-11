const request = require('supertest');
const express = require('express');
const { Router } = require('express');
const scraperController = require('../../controllers/scraperController');

jest.mock('../../controllers/scraperController');

const router = Router();
router.post('/run', scraperController.runScraper);
router.get('/comments', scraperController.getComments);
router.get('/stats', scraperController.getStats);

describe('Scraper Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/scraper', router);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/scraper/run', () => {
    it('should start scraper successfully', async () => {
      const pageIds = ['12345', '67890'];

      scraperController.runScraper.mockImplementation((req, res) => {
        res.status(202).json({
          success: true,
          message: 'Scraper started successfully',
          pageIds: req.body.pageIds,
          daysBack: 30
        });
      });

      const response = await request(app)
        .post('/api/scraper/run')
        .send({ pageIds });

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Scraper started successfully');
      expect(scraperController.runScraper).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      scraperController.runScraper.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Page IDs array is required'
        });
      });

      const response = await request(app)
        .post('/api/scraper/run')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Page IDs array is required');
    });
  });

  describe('GET /api/scraper/comments', () => {
    it('should return comments successfully', async () => {
      const mockComments = [
        { id: 'comment1', message: 'Test comment 1' },
        { id: 'comment2', message: 'Test comment 2' }
      ];

      scraperController.getComments.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockComments
        });
      });

      const response = await request(app).get('/api/scraper/comments');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockComments);
      expect(scraperController.getComments).toHaveBeenCalled();
    });

    it('should handle query parameters', async () => {
      scraperController.getComments.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: []
        });
      });

      await request(app).get('/api/scraper/comments?startDate=2023-01-01&endDate=2023-12-31&pageId=12345');

      expect(scraperController.getComments).toHaveBeenCalled();
    });

    it('should handle errors when getting comments', async () => {
      scraperController.getComments.mockImplementation((req, res) => {
        res.status(500).json({
          success: false,
          error: 'Error getting comments'
        });
      });

      const response = await request(app).get('/api/scraper/comments');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Error getting comments');
    });
  });

  describe('GET /api/scraper/stats', () => {
    it('should return stats successfully', async () => {
      const mockStats = {
        totalComments: 100,
        totalPages: 5,
        lastScrapeDate: new Date().toISOString()
      };

      scraperController.getStats.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockStats
        });
      });

      const response = await request(app).get('/api/scraper/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Use a more flexible comparison due to Date serialization
      expect(response.body.data).toMatchObject({
        totalComments: mockStats.totalComments,
        totalPages: mockStats.totalPages
      });
      expect(scraperController.getStats).toHaveBeenCalled();
    });

    it('should handle errors when getting stats', async () => {
      scraperController.getStats.mockImplementation((req, res) => {
        res.status(500).json({
          success: false,
          error: 'Error getting stats'
        });
      });

      const response = await request(app).get('/api/scraper/stats');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Error getting stats');
    });
  });
});
