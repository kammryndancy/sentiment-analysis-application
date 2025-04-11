const FacebookScraper = require('../../services/facebookScraper');
const { MongoClient } = require('mongodb');
const FB = require('fb');

// Mock MongoDB
jest.mock('mongodb');

// Mock FB module
jest.mock('fb', () => {
  return {
    options: jest.fn(),
    setAccessToken: jest.fn(),
    api: jest.fn()
  };
});

describe('FacebookScraper', () => {
  let scraper;
  let mockCollection;
  let mockDb;

  beforeEach(() => {
    // Mock MongoDB collection
    mockCollection = {
      insertMany: jest.fn(),
      find: jest.fn().mockReturnThis(),
      toArray: jest.fn()
    };

    // Mock MongoDB database
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    // Mock FB module
    FB.options.mockReturnValue(undefined);
    FB.setAccessToken.mockReturnValue(undefined);
    FB.api.mockImplementation((endpoint, options, callback) => {
      callback(null, {
        data: [
          { id: 'post1', message: 'Avon product review', created_time: '2025-04-11' },
          { id: 'post2', message: 'Just bought some Avon makeup', created_time: '2025-04-11' }
        ]
      });
    });

    // Set up environment variables
    process.env.FACEBOOK_APP_ID = 'mock_app_id';
    process.env.FACEBOOK_APP_SECRET = 'mock_app_secret';
    process.env.FACEBOOK_ACCESS_TOKEN = 'mock_access_token';

    // Initialize scraper
    scraper = new FacebookScraper(mockDb);

    // Mock PageManager methods
    scraper.pageManager = {
      getPageIds: jest.fn().mockResolvedValue([
        { page_id: '12345', name: 'Test Page 1' },
        { page_id: '67890', name: 'Test Page 2' }
      ]),
      getPagePosts: jest.fn().mockResolvedValue([
        { id: 'post1', message: 'Avon product review', created_time: '2025-04-11' },
        { id: 'post2', message: 'Just bought some Avon makeup', created_time: '2025-04-11' }
      ]),
      savePost: jest.fn().mockResolvedValue(undefined)
    };

    // Mock CommentManager methods
    scraper.commentManager = {
      getAllComments: jest.fn().mockResolvedValue([
        { id: 'comment1', message: 'Love this Avon product!', created_time: '2025-04-11' },
        { id: 'comment2', message: 'Great review!', created_time: '2025-04-11' }
      ]),
      saveAllComments: jest.fn().mockResolvedValue(2)
    };
  });

  describe('scrapePages', () => {
    beforeEach(() => {
      // Mock PageManager's getAllPages
      scraper.pageManager.getPageIds.mockResolvedValue([
        { page_id: '12345', name: 'Test Page 1' },
        { page_id: '67890', name: 'Test Page 2' }
      ]);
    });

    it('should scrape and store data successfully', async () => {
      // Mock FB.api for comments
      scraper.fbPromise = jest.fn().mockImplementation((method, endpoint, params) => {
        if (endpoint.includes('/comments')) {
          return Promise.resolve({
            data: [
              { id: 'comment1', message: 'Love this Avon product!', created_time: '2025-04-11' },
              { id: 'comment2', message: 'Great review!', created_time: '2025-04-11' }
            ]
          });
        } else {
          return Promise.resolve({
            data: [
              { id: 'post1', message: 'Avon product review', created_time: '2025-04-11' },
              { id: 'post2', message: 'Just bought some Avon makeup', created_time: '2025-04-11' }
            ]
          });
        }
      });

      // Mock PageManager methods
      scraper.pageManager = {
        getPageIds: jest.fn().mockResolvedValue([
          { page_id: '12345', name: 'Test Page 1' },
          { page_id: '67890', name: 'Test Page 2' }
        ]),
        getPagePosts: jest.fn().mockImplementation(async (pageId, limit, daysBack) => {
          // Use fbPromise to mock the actual API call
          const posts = await scraper.fbPromise('GET', `${pageId}/posts`, {
            limit: limit,
            since: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
          });
          return posts.data;
        }),
        savePost: jest.fn().mockResolvedValue(undefined),
        updatePageLastScraped: jest.fn().mockResolvedValue(undefined)
      };

      // Mock CommentManager methods
      scraper.commentManager = {
        getAllComments: jest.fn().mockImplementation(async (post, fbPromise) => {
          const comments = await fbPromise('GET', `${post.id}/comments`, { limit: 100 });
          return comments.data;
        }),
        saveAllComments: jest.fn().mockResolvedValue(2)
      };

      // Mock isAvonRelated
      scraper.isAvonRelated = jest.fn().mockReturnValue(true);

      const result = await scraper.scrapePages(null, 10);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Scraping completed successfully.');
      expect(result.stats).toEqual({
        totalPosts: 4,
        keywordMatchedPosts: 4,
        totalComments: 8,
        totalSavedComments: 8
      });
      expect(scraper.fbPromise).toHaveBeenCalled();
      expect(scraper.pageManager.getPagePosts).toHaveBeenCalled();
      expect(scraper.pageManager.getPageIds).toHaveBeenCalled();
      expect(scraper.pageManager.updatePageLastScraped).toHaveBeenCalled();
      expect(scraper.pageManager.savePost).toHaveBeenCalledTimes(4);
      expect(scraper.commentManager.getAllComments).toHaveBeenCalled();
      expect(scraper.commentManager.saveAllComments).toHaveBeenCalled();
      expect(scraper.isAvonRelated).toHaveBeenCalledTimes(4);
    });

    it('should scrape and store data successfully for specific pages', async () => {
      // Mock FB.api for comments
      scraper.fbPromise = jest.fn().mockImplementation((method, endpoint, params) => {
        if (endpoint.includes('/comments')) {
          return Promise.resolve({
            data: [
              { id: 'comment1', message: 'Love this Avon product!', created_time: '2025-04-11' },
              { id: 'comment2', message: 'Great review!', created_time: '2025-04-11' }
            ]
          });
        } else {
          return Promise.resolve({
            data: [
              { id: 'post1', message: 'Avon product review', created_time: '2025-04-11' },
              { id: 'post2', message: 'Just bought some Avon makeup', created_time: '2025-04-11' }
            ]
          });
        }
      });

      // Mock PageManager methods
      scraper.pageManager = {
        getPagePosts: jest.fn().mockImplementation(async (pageId, limit, daysBack) => {
          const posts = await scraper.fbPromise('GET', `${pageId}/posts`, {
            limit: limit,
            since: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
          });
          return posts.data;
        }),
        savePost: jest.fn().mockResolvedValue(undefined),
        updatePageLastScraped: jest.fn().mockResolvedValue(undefined)
      };

      // Mock CommentManager methods
      scraper.commentManager = {
        getAllComments: jest.fn().mockImplementation(async (post, fbPromise) => {
          const comments = await fbPromise('GET', `${post.id}/comments`, { limit: 100 });
          return comments.data;
        }),
        saveAllComments: jest.fn().mockResolvedValue(2)
      };

      // Mock isAvonRelated
      scraper.isAvonRelated = jest.fn().mockReturnValue(true);

      const result = await scraper.scrapePages(['12345', '67890'], 10);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Scraping completed successfully.');
      expect(result.stats).toEqual({
        totalPosts: 4,
        keywordMatchedPosts: 4,
        totalComments: 8,
        totalSavedComments: 8
      });
      expect(scraper.fbPromise).toHaveBeenCalled();
      expect(scraper.pageManager.getPagePosts).toHaveBeenCalled();
      expect(scraper.pageManager.updatePageLastScraped).toHaveBeenCalled();
      expect(scraper.pageManager.savePost).toHaveBeenCalledTimes(4);
      expect(scraper.commentManager.getAllComments).toHaveBeenCalled();
      expect(scraper.commentManager.saveAllComments).toHaveBeenCalled();
      expect(scraper.isAvonRelated).toHaveBeenCalledTimes(4);
    });

    it('should scrape all pages when no pageIds are provided', async () => {
      // Mock FB.api for comments
      scraper.fbPromise = jest.fn().mockImplementation((method, endpoint, params) => {
        if (endpoint.includes('/comments')) {
          return Promise.resolve({
            data: [
              { id: 'comment1', message: 'Love this Avon product!', created_time: '2025-04-11' },
              { id: 'comment2', message: 'Great review!', created_time: '2025-04-11' }
            ]
          });
        } else {
          return Promise.resolve({
            data: [
              { id: 'post1', message: 'Avon product review', created_time: '2025-04-11' },
              { id: 'post2', message: 'Just bought some Avon makeup', created_time: '2025-04-11' }
            ]
          });
        }
      });

      // Mock PageManager methods
      scraper.pageManager = {
        getPageIds: jest.fn().mockResolvedValue([
          { page_id: '12345', name: 'Test Page 1' },
          { page_id: '67890', name: 'Test Page 2' }
        ]),
        getPagePosts: jest.fn().mockImplementation(async (pageId, limit, daysBack) => {
          const posts = await scraper.fbPromise('GET', `${pageId}/posts`, {
            limit: limit,
            since: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
          });
          return posts.data;
        }),
        savePost: jest.fn().mockResolvedValue(undefined),
        updatePageLastScraped: jest.fn().mockResolvedValue(undefined)
      };

      // Mock CommentManager methods
      scraper.commentManager = {
        getAllComments: jest.fn().mockImplementation(async (post, fbPromise) => {
          const comments = await fbPromise('GET', `${post.id}/comments`, { limit: 100 });
          return comments.data;
        }),
        saveAllComments: jest.fn().mockResolvedValue(2)
      };

      // Mock isAvonRelated
      scraper.isAvonRelated = jest.fn().mockReturnValue(true);

      const result = await scraper.scrapePages(null, 10);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Scraping completed successfully.');
      expect(result.stats).toEqual({
        totalPosts: 4,
        keywordMatchedPosts: 4,
        totalComments: 8,
        totalSavedComments: 8
      });
      expect(scraper.fbPromise).toHaveBeenCalled();
      expect(scraper.pageManager.getPagePosts).toHaveBeenCalled();
      expect(scraper.pageManager.getPageIds).toHaveBeenCalled();
      expect(scraper.pageManager.updatePageLastScraped).toHaveBeenCalled();
      expect(scraper.pageManager.savePost).toHaveBeenCalledTimes(4);
      expect(scraper.commentManager.getAllComments).toHaveBeenCalled();
      expect(scraper.commentManager.saveAllComments).toHaveBeenCalled();
      expect(scraper.isAvonRelated).toHaveBeenCalledTimes(4);
    });

    it('should handle API errors gracefully', async () => {
      // Mock FB.api with error
      scraper.fbPromise = jest.fn().mockImplementation((method, endpoint, params) => {
        return Promise.reject(new Error('Facebook API error'));
      });

      // Mock PageManager methods
      scraper.pageManager = {
        getPageIds: jest.fn().mockResolvedValue([
          { page_id: '12345', name: 'Test Page 1' }
        ]),
        getPagePosts: jest.fn().mockImplementation(async (pageId, limit, daysBack) => {
          try {
            const posts = await scraper.fbPromise('GET', `${pageId}/posts`, {
              limit: limit,
              since: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
            });
            return posts.data;
          } catch (error) {
            throw error;
          }
        }),
        savePost: jest.fn().mockResolvedValue(undefined),
        updatePageLastScraped: jest.fn().mockResolvedValue(undefined)
      };

      // Mock CommentManager methods
      scraper.commentManager = {
        getAllComments: jest.fn().mockImplementation(async (post, fbPromise) => {
          try {
            const comments = await fbPromise('GET', `${post.id}/comments`, { limit: 100 });
            return comments.data;
          } catch (error) {
            throw error;
          }
        }),
        saveAllComments: jest.fn().mockResolvedValue(2)
      };

      // Mock isAvonRelated
      scraper.isAvonRelated = jest.fn().mockReturnValue(true);

      const result = await scraper.scrapePages(['12345'], 10);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Facebook API error');
      expect(result.stats).toEqual({
        totalPosts: 0,
        keywordMatchedPosts: 0,
        totalComments: 0,
        totalSavedComments: 0
      });
      expect(scraper.fbPromise).toHaveBeenCalled();
      expect(scraper.pageManager.getPagePosts).toHaveBeenCalled();
      expect(scraper.pageManager.savePost).not.toHaveBeenCalled();
      expect(scraper.commentManager.getAllComments).not.toHaveBeenCalled();
      expect(scraper.commentManager.saveAllComments).not.toHaveBeenCalled();
    });

    it('should handle empty results gracefully', async () => {
      // Mock FB.api with empty results
      scraper.fbPromise = jest.fn().mockImplementation((method, endpoint, params) => {
        return Promise.resolve({ data: [] });
      });

      // Mock PageManager methods
      scraper.pageManager = {
        getPageIds: jest.fn().mockResolvedValue([
          { page_id: '12345', name: 'Test Page 1' }
        ]),
        getPagePosts: jest.fn().mockImplementation(async (pageId, limit, daysBack) => {
          const posts = await scraper.fbPromise('GET', `${pageId}/posts`, {
            limit: limit,
            since: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
          });
          return posts.data;
        }),
        savePost: jest.fn().mockResolvedValue(undefined),
        updatePageLastScraped: jest.fn().mockResolvedValue(undefined)
      };

      // Mock CommentManager methods
      scraper.commentManager = {
        getAllComments: jest.fn().mockImplementation(async (post, fbPromise) => {
          const comments = await fbPromise('GET', `${post.id}/comments`, { limit: 100 });
          return comments.data;
        }),
        saveAllComments: jest.fn().mockResolvedValue(2)
      };

      // Mock isAvonRelated
      scraper.isAvonRelated = jest.fn().mockReturnValue(true);

      const result = await scraper.scrapePages(['12345'], 10);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Scraping completed successfully.');
      expect(result.stats).toEqual({
        totalPosts: 0,
        keywordMatchedPosts: 0,
        totalComments: 0,
        totalSavedComments: 0
      });
      expect(scraper.fbPromise).toHaveBeenCalled();
      expect(scraper.pageManager.getPagePosts).toHaveBeenCalled();
      expect(scraper.pageManager.savePost).not.toHaveBeenCalled();
      expect(scraper.commentManager.getAllComments).not.toHaveBeenCalled();
      expect(scraper.commentManager.saveAllComments).not.toHaveBeenCalled();
    });
  });
});
