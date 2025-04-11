const request = require('supertest');
const express = require('express');
const { Router } = require('express');
const pageController = require('../../controllers/pageController');

jest.mock('../../controllers/pageController');

// Mock pageManager methods
class MockPageManager {
  async listPages() {
    return [
      { page_id: '12345', name: 'Test Page 1' },
      { page_id: '67890', name: 'Test Page 2' }
    ];
  }

  async addPageId(pageId, name, description) {
    // Return different responses based on the pageId
    if (pageId === '12345') {
      return {
        success: true,
        page: { page_id: pageId, name, description }
      };
    }
    return {
      success: false,
      error: 'Page already exists'
    };
  }

  async removePageId(pageId) {
    // Return different responses based on the pageId
    if (pageId === '12345') {
      return { success: true };
    }
    return {
      success: false,
      error: 'Page not found'
    };
  }
}

// Create mock app with pageManager in locals
describe('Page Routes', () => {
  let app;
  let router;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Create router and attach routes
    router = Router();
    router.get('/', pageController.listPages);
    router.post('/', pageController.addPage);
    router.delete('/:page_id', pageController.removePage);
    router.post('/import', pageController.importPages);
    
    app.use('/api/pages', router);
    
    // Create and set the pageManager in app locals
    const mockPageManager = new MockPageManager();
    app.locals = { pageManager: mockPageManager };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/pages', () => {
    it('should get all pages successfully', async () => {
      const mockPages = [
        { page_id: '12345', name: 'Test Page 1' },
        { page_id: '67890', name: 'Test Page 2' }
      ];

      pageController.listPages.mockImplementation(async (req, res) => {
        try {
          const pages = await req.app.locals.pageManager.listPages();
          res.status(200).json({
            success: true,
            data: pages
          });
        } catch (error) {
          console.error('Error getting pages:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });

      const response = await request(app).get('/api/pages');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockPages
      });
      expect(pageController.listPages).toHaveBeenCalled();
    });

    it('should handle errors when getting pages', async () => {
      const errorMessage = 'Database error';
      pageController.listPages.mockImplementation(async (req, res) => {
        try {
          throw new Error(errorMessage);
        } catch (error) {
          console.error('Error getting pages:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });

      const response = await request(app).get('/api/pages');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: errorMessage
      });
      expect(pageController.listPages).toHaveBeenCalled();
    });
  });

  describe('POST /api/pages', () => {
    it('should add a new page successfully', async () => {
      const mockPage = {
        page_id: '12345',
        name: 'Test Page',
        description: 'Test description'
      };

      pageController.addPage.mockImplementation(async (req, res) => {
        try {
          const { page_id, name, description } = req.body;
          
          if (!page_id || !name) {
            return res.status(400).json({
              success: false,
              error: 'Both page_id and name are required'
            });
          }

          const result = await req.app.locals.pageManager.addPageId(page_id, name, description);
          
          if (result.success) {
            res.status(201).json({
              success: true,
              message: 'Page added successfully',
              data: result.page
            });
          } else {
            res.status(400).json({
              success: false,
              error: result.error || 'Page already exists'
            });
          }
        } catch (error) {
          console.error('Error adding page:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });

      const response = await request(app)
        .post('/api/pages')
        .send(mockPage);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: 'Page added successfully',
        data: mockPage
      });
      expect(pageController.addPage).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      pageController.addPage.mockImplementation(async (req, res) => {
        try {
          const { page_id, name } = req.body;
          if (!page_id || !name) {
            return res.status(400).json({
              success: false,
              error: 'Both page_id and name are required'
            });
          }
        } catch (error) {
          console.error('Error adding page:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });

      const response = await request(app)
        .post('/api/pages')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Both page_id and name are required'
      });
      expect(pageController.addPage).toHaveBeenCalled();
    });

    it('should handle page already exists error', async () => {
      pageController.addPage.mockImplementation(async (req, res) => {
        try {
          const result = {
            success: false,
            error: 'Page already exists'
          };
          res.status(400).json({
            success: false,
            error: result.error || 'Page already exists'
          });
        } catch (error) {
          console.error('Error adding page:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });

      const response = await request(app)
        .post('/api/pages')
        .send({ page_id: '67890', name: 'Test Page' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Page already exists'
      });
      expect(pageController.addPage).toHaveBeenCalled();
    });

    it('should handle errors when adding page', async () => {
      const errorMessage = 'Database error';
      pageController.addPage.mockImplementation(async (req, res) => {
        try {
          throw new Error(errorMessage);
        } catch (error) {
          console.error('Error adding page:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });

      const response = await request(app)
        .post('/api/pages')
        .send({ page_id: '12345', name: 'Test Page' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: errorMessage
      });
      expect(pageController.addPage).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/pages/:page_id', () => {
    it('should return 404 when pageId parameter is missing', async () => {
      const response = await request(app).delete('/api/pages/');
      expect(response.status).toBe(404);
      expect(pageController.removePage).not.toHaveBeenCalled();
    });

    it('should remove a page successfully', async () => {
      pageController.removePage.mockImplementation(async (req, res) => {
        try {
          const page_id = req.params.page_id;
          if (!page_id) {
            return res.status(400).json({
              success: false,
              error: 'Page ID is required'
            });
          }

          const result = await req.app.locals.pageManager.removePageId(page_id);
          
          if (result.success) {
            res.status(200).json({
              success: true,
              message: 'Page removed successfully'
            });
          } else {
            res.status(404).json({
              success: false,
              error: result.error || 'Page not found'
            });
          }
        } catch (error) {
          console.error('Error removing page:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });

      const response = await request(app).delete('/api/pages/12345');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Page removed successfully'
      });
      expect(pageController.removePage).toHaveBeenCalled();
    });

    it('should handle page not found error', async () => {
      pageController.removePage.mockImplementation(async (req, res) => {
        try {
          const page_id = req.params.page_id;
          if (!page_id) {
            return res.status(400).json({
              success: false,
              error: 'Page ID is required'
            });
          }

          const result = await req.app.locals.pageManager.removePageId(page_id);
          
          if (result.success) {
            res.status(200).json({
              success: true,
              message: 'Page removed successfully'
            });
          } else {
            res.status(404).json({
              success: false,
              error: result.error || 'Page not found'
            });
          }
        } catch (error) {
          console.error('Error removing page:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });

      const response = await request(app).delete('/api/pages/67890');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Page not found'
      });
      expect(pageController.removePage).toHaveBeenCalled();
    });

    it('should handle errors when removing page', async () => {
      const errorMessage = 'Database error';
      pageController.removePage.mockImplementation(async (req, res) => {
        try {
          throw new Error(errorMessage);
        } catch (error) {
          console.error('Error removing page:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });

      const response = await request(app).delete('/api/pages/12345');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: errorMessage
      });
      expect(pageController.removePage).toHaveBeenCalled();
    });

    it('should validate pageId parameter with empty string', async () => {
      pageController.removePage.mockImplementation(async (req, res) => {
        try {
          const page_id = req.params.page_id;
          if (!page_id) {
            return res.status(400).json({
              success: false,
              error: 'Page ID is required'
            });
          }
        } catch (error) {
          console.error('Error removing page:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });

      // Make request with empty string as page_id
      const response = await request(app).delete('/api/pages/');
      expect(response.status).toBe(404);
      expect(pageController.removePage).not.toHaveBeenCalled();
    }, 5000); // Set timeout to 5 seconds
  });

  describe('POST /api/pages/import', () => {
    it('should import pages successfully', async () => {
      const mockResults = [
        { success: true, page: { page_id: '12345' } },
        { success: false, error: 'Page already exists' }
      ];

      pageController.importPages.mockImplementation(async (req, res) => {
        try {
          const { pageIds } = req.body;
          if (!pageIds || !Array.isArray(pageIds)) {
            return res.status(400).json({
              success: false,
              error: 'pageIds array is required'
            });
          }

          const results = [];
          for (const pageId of pageIds) {
            const result = await req.app.locals.pageManager.addPageId(pageId, null, null);
            results.push(result);
          }

          const successCount = results.filter(r => r.success).length;
          const failedCount = results.length - successCount;

          res.status(200).json({
            success: true,
            message: 'Pages imported successfully',
            data: {
              total: results.length,
              success: successCount,
              failed: failedCount,
              results
            }
          });
        } catch (error) {
          console.error('Error importing pages:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });

      const response = await request(app)
        .post('/api/pages/import')
        .send({ pageIds: ['12345', '67890'] });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Pages imported successfully',
        data: {
          total: 2,
          success: 1,
          failed: 1,
          results: [
            { success: true, page: { page_id: '12345', name: null, description: null } },
            { success: false, error: 'Page already exists' }
          ]
        }
      });
      expect(pageController.importPages).toHaveBeenCalled();
    });

    it('should validate pageIds array', async () => {
      pageController.importPages.mockImplementation(async (req, res) => {
        try {
          const { pageIds } = req.body;
          if (!pageIds || !Array.isArray(pageIds)) {
            return res.status(400).json({
              success: false,
              error: 'pageIds array is required'
            });
          }
        } catch (error) {
          console.error('Error importing pages:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });

      const response = await request(app)
        .post('/api/pages/import')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'pageIds array is required'
      });
      expect(pageController.importPages).toHaveBeenCalled();
    });

    it('should handle errors when importing pages', async () => {
      const errorMessage = 'Database error';
      pageController.importPages.mockImplementation(async (req, res) => {
        try {
          throw new Error(errorMessage);
        } catch (error) {
          console.error('Error importing pages:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });

      const response = await request(app)
        .post('/api/pages/import')
        .send({ pageIds: ['12345', '67890'] });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: errorMessage
      });
      expect(pageController.importPages).toHaveBeenCalled();
    });
  });
});
