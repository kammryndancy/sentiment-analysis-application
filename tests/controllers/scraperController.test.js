const { 
  runScraper, 
  getComments, 
  getStats 
} = require('../../controllers/scraperController');

describe('Scraper Controller', () => {
  let req;
  let res;
  let mockScraper;
  let mockPageManager;

  beforeEach(() => {
    mockScraper = {
      scrapePages: jest.fn(),
      getComments: jest.fn(),
      getStats: jest.fn()
    };

    mockPageManager = {
      getPageIds: jest.fn()
    };

    req = {
      app: {
        locals: {
          scraper: mockScraper,
          pageManager: mockPageManager
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
      mockScraper.scrapePages.mockResolvedValue({ success: true, stats: { processed: 2 } });

      await runScraper(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Scraper started successfully',
        stats: { processed: 2 }
      });
      expect(mockScraper.scrapePages).toHaveBeenCalledWith(pageIds, 30);
    });

    it('should handle errors when starting scraper', async () => {
      const error = new Error('Database error');
      mockScraper.scrapePages.mockRejectedValue(error);
      mockPageManager.getPageIds.mockResolvedValue(['12345', '67890']);

      await runScraper(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
      expect(mockPageManager.getPageIds).toHaveBeenCalled();
      expect(mockScraper.scrapePages).toHaveBeenCalledWith(['12345', '67890'], 30);
    });

    it('should validate pageIds is an array', async () => {
      req.body = { pageIds: 'not an array' };

      await runScraper(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Page IDs must be an array'
      });
      expect(mockScraper.scrapePages).not.toHaveBeenCalled();
    });

    it('should validate pageIds array is not empty', async () => {
      req.body = { pageIds: [] };

      await runScraper(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Page IDs array cannot be empty'
      });
      expect(mockScraper.scrapePages).not.toHaveBeenCalled();
    });

    it('should start scraper with all pages when no pageIds provided', async () => {
      const mockPageIds = ['12345', '67890'];
      
      mockPageManager.getPageIds.mockResolvedValue(mockPageIds);
      mockScraper.scrapePages.mockResolvedValue({ success: true, stats: { processed: 2 } });

      await runScraper(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Scraper started successfully',
        stats: { processed: 2 }
      });
      expect(mockPageManager.getPageIds).toHaveBeenCalled();
      expect(mockScraper.scrapePages).toHaveBeenCalledWith(mockPageIds, 30);
    });

    it('should return error when no pages found in database', async () => {
      mockPageManager.getPageIds.mockResolvedValue([]);

      await runScraper(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No pages found in the database'
      });
    });
  });

  describe('getComments', () => {
    it('should return comments successfully', async () => {
      const mockComments = [
        { id: '1', message: 'Test comment 1', from: { name: 'User 1' } },
        { id: '2', message: 'Test comment 2', from: { name: 'User 2' } }
      ];

      // Setup mock scraper with commentManager
      mockScraper.commentManager = {
        getComments: jest.fn().mockResolvedValue(mockComments)
      };

      await getComments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockComments
      });
      expect(mockScraper.commentManager.getComments).toHaveBeenCalledWith({
        startDate: undefined,
        endDate: undefined,
        pageId: undefined,
        limit: 100,
        skip: 0
      });
    });

    it('should handle errors when getting comments', async () => {
      const error = new Error('Database error');
      mockScraper.commentManager = {
        getComments: jest.fn().mockRejectedValue(error)
      };

      await getComments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
    });

    it('should handle query parameters', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';
      const pageId = '12345';
      req.query = { startDate, endDate, pageId };
      
      // Setup mock for commentManager
      mockScraper.commentManager = {
        getComments: jest.fn().mockResolvedValue([])
      };

      await getComments(req, res);

      const calledWith = mockScraper.commentManager.getComments.mock.calls[0][0];
      expect(calledWith).toEqual({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        pageId: '12345',
        limit: 100,
        skip: 0
      });
    });

    it('should handle invalid date parameters', async () => {
      const error = new Error('Invalid date format');
      req.query = {
        startDate: 'invalid-date'
      };

      // Setup mock for commentManager
      mockScraper.commentManager = {
        getComments: jest.fn().mockRejectedValue(error)
      };

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
        totalPages: 10,
        averageCommentsPerPage: 10
      };

      // Setup mock for commentManager
      mockScraper.commentManager = {
        getStats: jest.fn().mockResolvedValue(mockStats)
      };

      await getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
      expect(mockScraper.commentManager.getStats).toHaveBeenCalled();
    });

    it('should handle errors when getting stats', async () => {
      const error = new Error('Database error');
      // Setup mock for commentManager
      mockScraper.commentManager = {
        getStats: jest.fn().mockRejectedValue(error)
      };

      await getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
      expect(mockScraper.commentManager.getStats).toHaveBeenCalled();
    });
  });
});
