const request = require('supertest');
const express = require('express');
const { Router } = require('express');
const keywordController = require('../../controllers/keywordController');

jest.mock('../../controllers/keywordController');

const router = Router();
router.get('/', keywordController.listKeywords);
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
        { keyword: 'lipstick', category: 'cosmetics', description: 'Lip products' },
        { keyword: 'foundation', category: 'cosmetics', description: 'Face products' }
      ];
      
      keywordController.listKeywords.mockImplementation((req, res) => {
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
      expect(keywordController.listKeywords).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      keywordController.listKeywords.mockImplementation((req, res) => {
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
      expect(keywordController.listKeywords).toHaveBeenCalled();
    });
  });

  describe('POST /api/keywords', () => {
    it('should add a keyword successfully', async () => {
      const mockKeyword = {
        keyword: 'mascara',
        category: 'cosmetics',
        description: 'Eye products'
      };
      
      keywordController.addKeyword.mockImplementation((req, res) => {
        res.status(201).json({
          success: true,
          message: 'Keyword added successfully',
          data: { success: true, keyword: mockKeyword }
        });
      });

      const response = await request(app)
        .post('/api/keywords')
        .send(mockKeyword);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: 'Keyword added successfully',
        data: { success: true, keyword: mockKeyword }
      });
      expect(keywordController.addKeyword).toHaveBeenCalled();
    });

    it('should handle missing keyword', async () => {
      keywordController.addKeyword.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Keyword is required'
        });
      });

      const response = await request(app)
        .post('/api/keywords')
        .send({ category: 'cosmetics' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Keyword is required'
      });
      expect(keywordController.addKeyword).toHaveBeenCalled();
    });

    it('should handle keyword already exists', async () => {
      const mockKeyword = {
        keyword: 'lipstick',
        category: 'cosmetics'
      };

      keywordController.addKeyword.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Keyword already exists'
        });
      });

      const response = await request(app)
        .post('/api/keywords')
        .send(mockKeyword);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Keyword already exists'
      });
      expect(keywordController.addKeyword).toHaveBeenCalled();
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
      expect(response.body).toEqual({
        success: true,
        message: 'Keyword removed successfully'
      });
      expect(keywordController.removeKeyword).toHaveBeenCalled();
    });

    it('should handle keyword not found', async () => {
      keywordController.removeKeyword.mockImplementation((req, res) => {
        res.status(404).json({
          success: false,
          error: 'Keyword not found'
        });
      });

      const response = await request(app)
        .delete('/api/keywords/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Keyword not found'
      });
      expect(keywordController.removeKeyword).toHaveBeenCalled();
    });
  });

  describe('POST /api/keywords/import', () => {
    it('should import keywords successfully', async () => {
      const mockKeywords = [
        { keyword: 'eyeliner', category: 'cosmetics' },
        { keyword: 'eyeshadow', category: 'cosmetics' }
      ];

      keywordController.importKeywords.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Keywords imported successfully',
          data: {
            success: true,
            imported: 2,
            duplicates: 0,
            errors: []
          }
        });
      });

      const response = await request(app)
        .post('/api/keywords/import')
        .send({ keywords: mockKeywords });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Keywords imported successfully',
        data: {
          success: true,
          imported: 2,
          duplicates: 0,
          errors: []
        }
      });
      expect(keywordController.importKeywords).toHaveBeenCalled();
    });

    it('should handle invalid keywords format', async () => {
      keywordController.importKeywords.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Keywords array is required'
        });
      });

      const response = await request(app)
        .post('/api/keywords/import')
        .send({ keywords: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Keywords array is required'
      });
      expect(keywordController.importKeywords).toHaveBeenCalled();
    });

    it('should handle import errors', async () => {
      const mockKeywords = [
        { keyword: 'eyeliner', category: 'cosmetics' },
        { keyword: 'lipstick', category: 'cosmetics' }
      ];

      keywordController.importKeywords.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Some keywords failed to import'
        });
      });

      const response = await request(app)
        .post('/api/keywords/import')
        .send({ keywords: mockKeywords });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Some keywords failed to import'
      });
      expect(keywordController.importKeywords).toHaveBeenCalled();
    });
  });
});
