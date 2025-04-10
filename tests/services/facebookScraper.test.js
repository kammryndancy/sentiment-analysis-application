const { MongoClient } = require('mongodb');
const FacebookScraper = require('../../services/facebookScraperShim');
const FB = require('fb');

jest.mock('mongodb');
jest.mock('fb');

describe('FacebookScraper', () => {
  let scraper;
  let mockDb;
  let mockCollection;
  let mockFbApi;

  beforeEach(() => {
    mockCollection = {
      find: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      insertOne: jest.fn(),
      insertMany: jest.fn(),
      updateOne: jest.fn(),
      findOne: jest.fn(),
      aggregate: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockResolvedValue(10)
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    // Set up FB API mock
    mockFbApi = jest.fn().mockImplementation((endpoint, options, callback) => {
      const response = {
        data: []
      };
      
      if (endpoint.includes('posts')) {
        response.data = [
          { 
            id: 'post1', 
            message: 'Test post 1',
            comments: { summary: { total_count: 5 } },
            reactions: { summary: { total_count: 10 } }
          },
          { 
            id: 'post2', 
            message: 'Test post 2',
            comments: { summary: { total_count: 3 } },
            reactions: { summary: { total_count: 7 } }
          }
        ];
      } else if (endpoint.includes('comments')) {
        response.data = [
          { id: 'comment1', message: 'Test comment 1', created_time: '2023-04-01T12:00:00Z' },
          { id: 'comment2', message: 'Test comment 2', created_time: '2023-04-02T12:00:00Z' }
        ];
      }
      
      // Call the callback with the response
      callback(response);
    });
    
    FB.api = mockFbApi;
    FB.setAccessToken = jest.fn();
    FB.options = jest.fn();
    
    // Create scraper with mock DB
    scraper = new FacebookScraper(mockDb);
    
    // Mock environment variables
    process.env.FACEBOOK_APP_ID = 'mock_app_id';
    process.env.FACEBOOK_APP_SECRET = 'mock_app_secret';
    process.env.FACEBOOK_ACCESS_TOKEN = 'mock_access_token';
  });

  describe('runScraper', () => {
    beforeEach(() => {
      // Mock PageManager's getAllPages
      mockCollection.toArray.mockResolvedValue([
        { page_id: '12345', name: 'Test Page 1' },
        { page_id: '67890', name: 'Test Page 2' }
      ]);
    });

    it('should scrape and store data successfully', async () => {
      const result = await scraper.runScraper({ limit: 10 });

      expect(result.success).toBe(true);
      expect(mockCollection.insertMany).toHaveBeenCalled();
      expect(FB.api).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      // Override the mockFbApi to simulate an error
      FB.api.mockImplementationOnce((endpoint, options, callback) => {
        callback({ error: { message: 'API error' } });
      });

      const result = await scraper.runScraper({ limit: 10 });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle database errors', async () => {
      mockCollection.insertMany.mockRejectedValue(new Error('Database error'));

      const result = await scraper.runScraper({ limit: 10 });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return scraper statistics', async () => {
      mockCollection.countDocuments
        .mockResolvedValueOnce(5)  // pages
        .mockResolvedValueOnce(100); // comments
      
      mockCollection.aggregate.mockResolvedValue([
        { total: 100, matched: 50 }
      ]);

      const stats = await scraper.getStats();

      expect(stats.success).toBe(true);
      expect(stats.pages).toBeDefined();
      expect(mockCollection.countDocuments).toHaveBeenCalled();
    });

    it('should handle stats retrieval errors', async () => {
      mockCollection.countDocuments.mockRejectedValue(new Error('Stats error'));

      const stats = await scraper.getStats();

      expect(stats.success).toBe(false);
      expect(stats.error).toBeDefined();
    });
  });
});
