const { 
  runScraper, 
  getScraperStatus, 
  getComments, 
  getStats 
} = require('../../controllers/scraperController');

describe('Scraper Controller', () => {
  let req;
  let res;
  let mockScraper;

  beforeEach(() => {
    mockScraper = {
      runScraper: jest.fn(),
      getScraperStatus: jest.fn(),
      getComments: jest.fn(),
      getStats: jest.fn()
    };

    req = {
      app: {
        locals: {
          scraper: mockScraper
        }
      },
      params: {},
      body: {},
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('runScraper', () => {
    const pageIds = ['12345', '67890'];

    it('should start scraper successfully', async () => {
      req.body = { pageIds };
      mockScraper.runScraper.mockResolvedValue({ success: true });

      await runScraper(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Scraper started successfully',
        pageIds,
        daysBack: 30
      });
      expect(mockScraper.runScraper).toHaveBeenCalledWith(pageIds, 30);
    });

    it('should validate required fields', async () => {
      req.body = {}; // Missing pageIds

      await runScraper(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Page IDs array is required'
      });
      expect(mockScraper.runScraper).not.toHaveBeenCalled();
    });

    it('should validate pageIds is an array', async () => {
      req.body = { pageIds: '12345' }; // Not an array

      await runScraper(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Page IDs must be an array'
      });
      expect(mockScraper.runScraper).not.toHaveBeenCalled();
    });

    it('should handle scraper errors', async () => {
      req.body = { pageIds };
      const error = new Error('Scraper error');
      mockScraper.runScraper.mockRejectedValue(error);

      await runScraper(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
    });
  });

  describe('getScraperStatus', () => {
    it('should return scraper status successfully', async () => {
      const mockStatus = {
        isRunning: true,
        progress: 50,
        lastRun: new Date()
      };
      mockScraper.getScraperStatus.mockResolvedValue(mockStatus);

      await getScraperStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatus
      });
    });

    it('should handle status retrieval errors', async () => {
      const error = new Error('Status error');
      mockScraper.getScraperStatus.mockRejectedValue(error);

      await getScraperStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
    });
  });

  describe('getComments', () => {
    it('should return comments successfully', async () => {
      const mockComments = [
        { id: 'comment1', message: 'Test comment 1' },
        { id: 'comment2', message: 'Test comment 2' }
      ];
      mockScraper.getComments.mockResolvedValue(mockComments);

      await getComments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockComments
      });
    });

    it('should handle query parameters', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';
      const pageId = '12345';
      req.query = { startDate, endDate, pageId };
      
      await getComments(req, res);

      // Check that we're passing a proper object to getComments
      expect(mockScraper.getComments).toHaveBeenCalled();
      const calledWith = mockScraper.getComments.mock.calls[0][0];
      expect(calledWith).toHaveProperty('startDate');
      expect(calledWith).toHaveProperty('endDate');
      expect(calledWith).toHaveProperty('pageId', pageId);
    });

    it('should handle invalid date parameters', async () => {
      req.query = {
        startDate: 'invalid-date'
      };

      await getComments(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid date format'
      });
    });

    it('should handle comment retrieval errors', async () => {
      const error = new Error('Comments error');
      mockScraper.getComments.mockRejectedValue(error);

      await getComments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
    });
  });

  describe('getStats', () => {
    it('should return stats successfully', async () => {
      const mockStats = {
        totalComments: 100,
        totalPages: 5,
        lastScrapeDate: new Date()
      };
      mockScraper.getStats.mockResolvedValue(mockStats);

      await getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should handle stats retrieval errors', async () => {
      const error = new Error('Stats error');
      mockScraper.getStats.mockRejectedValue(error);

      await getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
    });
  });
});
