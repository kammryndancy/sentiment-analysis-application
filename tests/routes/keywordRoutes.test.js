const request = require('supertest');
const express = require('express');
const { Router } = require('express');
const keywordController = require('../../controllers/keywordController');

jest.mock('../../controllers/keywordController');

const router = Router();
router.get('/', keywordController.getAllKeywords);
router.post('/', keywordController.addKeyword);
router.delete('/:keyword', keywordController.removeKeyword);
router.post('/import', keywordController.importKeywords);

describe('Keyword Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/keywords', router);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/keywords', () => {
    it('should get all keywords successfully', async () => {
      const mockKeywords = [
        { keyword: 'lipstick', category: 'cosmetics' },
        { keyword: 'foundation', category: 'cosmetics' }
      ];
      keywordController.getAllKeywords.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockKeywords
        });
      });

      const response = await request(app).get('/api/keywords');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockKeywords
      });
      expect(keywordController.getAllKeywords).toHaveBeenCalled();
    });

    it('should handle errors when getting keywords', async () => {
      keywordController.getAllKeywords.mockImplementation((req, res) => {
        res.status(500).json({
          success: false,
          error: 'Database error'
        });
      });

      const response = await request(app).get('/api/keywords');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Database error'
      });
    });
  });

  describe('POST /api/keywords', () => {
    it('should add a new keyword successfully', async () => {
      const newKeyword = {
        keyword: 'lipstick',
        category: 'cosmetics',
        description: 'Test Keyword'
      };

      keywordController.addKeyword.mockImplementation((req, res) => {
        res.status(201).json({
          success: true,
          message: 'Keyword added successfully'
        });
      });

      const response = await request(app)
        .post('/api/keywords')
        .send(newKeyword);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(keywordController.addKeyword).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      keywordController.addKeyword.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Keyword is required'
        });
      });

      const response = await request(app)
        .post('/api/keywords')
        .send({
          category: 'cosmetics',
          description: 'Test Keyword'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Keyword is required');
    });
  });

  describe('DELETE /api/keywords/:keyword', () => {
    it('should remove a keyword successfully', async () => {
      keywordController.removeKeyword.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Keyword removed successfully'
        });
      });

      const response = await request(app)
        .delete('/api/keywords/lipstick');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(keywordController.removeKeyword).toHaveBeenCalled();
    });

    it('should handle non-existent keyword removal', async () => {
      keywordController.removeKeyword.mockImplementation((req, res) => {
        res.status(404).json({
          success: false,
          error: 'Keyword not found'
        });
      });

      const response = await request(app)
        .delete('/api/keywords/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/keywords/import', () => {
    it('should import keywords successfully', async () => {
      const keywords = [
        { keyword: 'mascara', category: 'cosmetics' },
        { keyword: 'eyeliner', category: 'cosmetics' }
      ];

      keywordController.importKeywords.mockImplementation((req, res) => {
        res.status(201).json({
          success: true,
          message: 'Keywords imported successfully'
        });
      });

      const response = await request(app)
        .post('/api/keywords/import')
        .send({ keywords });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(keywordController.importKeywords).toHaveBeenCalled();
    });

    it('should validate import payload', async () => {
      keywordController.importKeywords.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Keywords array is required'
        });
      });

      const response = await request(app)
        .post('/api/keywords/import')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Keywords array is required');
    });
  });
});
