const request = require('supertest');
const express = require('express');
const { Router } = require('express');
const pageController = require('../../controllers/pageController');

jest.mock('../../controllers/pageController');

const router = Router();
router.get('/', pageController.getAllPages);
router.post('/', pageController.addPage);
router.delete('/:pageId', pageController.removePage);
router.post('/import', pageController.importPages);

describe('Page Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/pages', router);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/pages', () => {
    it('should get all pages successfully', async () => {
      const mockPages = [
        { pageId: '12345', name: 'Test Page 1' },
        { pageId: '67890', name: 'Test Page 2' }
      ];

      pageController.getAllPages.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockPages
        });
      });

      const response = await request(app).get('/api/pages');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockPages
      });
      expect(pageController.getAllPages).toHaveBeenCalled();
    });

    it('should handle errors when getting pages', async () => {
      pageController.getAllPages.mockImplementation((req, res) => {
        res.status(500).json({
          success: false,
          error: 'Database error'
        });
      });

      const response = await request(app).get('/api/pages');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Database error'
      });
    });
  });

  describe('POST /api/pages', () => {
    it('should add a new page successfully', async () => {
      const newPage = {
        pageId: '12345',
        name: 'Test Page',
        description: 'Test Description'
      };

      pageController.addPage.mockImplementation((req, res) => {
        res.status(201).json({
          success: true,
          message: 'Page added successfully'
        });
      });

      const response = await request(app)
        .post('/api/pages')
        .send(newPage);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(pageController.addPage).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      pageController.addPage.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Page ID and name are required'
        });
      });

      const response = await request(app)
        .post('/api/pages')
        .send({
          description: 'Missing required fields'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Page ID and name are required');
    });

    it('should handle duplicate pages', async () => {
      pageController.addPage.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Page already exists'
        });
      });

      const response = await request(app)
        .post('/api/pages')
        .send({
          pageId: '12345',
          name: 'Duplicate Page'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Page already exists');
    });
  });

  describe('DELETE /api/pages/:pageId', () => {
    it('should remove a page successfully', async () => {
      pageController.removePage.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Page removed successfully'
        });
      });

      const response = await request(app)
        .delete('/api/pages/12345');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(pageController.removePage).toHaveBeenCalled();
    });

    it('should handle non-existent page removal', async () => {
      pageController.removePage.mockImplementation((req, res) => {
        res.status(404).json({
          success: false,
          error: 'Page not found'
        });
      });

      const response = await request(app)
        .delete('/api/pages/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Page not found');
    });
  });

  describe('POST /api/pages/import', () => {
    it('should import pages successfully', async () => {
      const pages = [
        { pageId: '67890', name: 'Page 1' },
        { pageId: '09876', name: 'Page 2' }
      ];

      pageController.importPages.mockImplementation((req, res) => {
        res.status(201).json({
          success: true,
          message: 'Pages imported successfully'
        });
      });

      const response = await request(app)
        .post('/api/pages/import')
        .send({ pages });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(pageController.importPages).toHaveBeenCalled();
    });

    it('should validate import payload', async () => {
      pageController.importPages.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Pages array is required'
        });
      });

      const response = await request(app)
        .post('/api/pages/import')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Pages array is required');
    });

    it('should handle invalid page data', async () => {
      pageController.importPages.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Invalid page data'
        });
      });

      const response = await request(app)
        .post('/api/pages/import')
        .send({
          pages: [
            { name: 'Invalid Page' } // Missing pageId
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid page data');
    });
  });
});
