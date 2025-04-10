import { getAllKeywords, addKeyword, removeKeyword, importKeywords } from '../../controllers/keywordController.js';

describe('Keyword Controller', () => {
  let req;
  let res;
  let mockKeywordManager;

  beforeEach(() => {
    mockKeywordManager = {
      getAllKeywords: jest.fn(),
      addKeyword: jest.fn(),
      removeKeyword: jest.fn(),
      importKeywords: jest.fn()
    };

    req = {
      app: {
        locals: {
          keywordManager: mockKeywordManager
        }
      },
      params: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getAllKeywords', () => {
    it('should return all keywords successfully', async () => {
      const mockKeywords = [
        { keyword: 'lipstick', category: 'cosmetics' },
        { keyword: 'foundation', category: 'cosmetics' }
      ];
      mockKeywordManager.getAllKeywords.mockResolvedValue(mockKeywords);

      await getAllKeywords(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockKeywords
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockKeywordManager.getAllKeywords.mockRejectedValue(error);

      await getAllKeywords(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
    });
  });

  describe('addKeyword', () => {
    const newKeyword = {
      keyword: 'lipstick',
      category: 'cosmetics',
      description: 'Test Keyword'
    };

    it('should add a keyword successfully', async () => {
      req.body = newKeyword;
      mockKeywordManager.addKeyword.mockResolvedValue({ success: true });

      await addKeyword(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Keyword added successfully'
      });
      expect(mockKeywordManager.addKeyword).toHaveBeenCalledWith(newKeyword);
    });

    it('should validate required fields', async () => {
      req.body = { category: 'cosmetics' }; // Missing keyword

      await addKeyword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Keyword is required'
      });
      expect(mockKeywordManager.addKeyword).not.toHaveBeenCalled();
    });

    it('should handle duplicate keywords', async () => {
      req.body = newKeyword;
      mockKeywordManager.addKeyword.mockResolvedValue({
        success: false,
        error: 'Keyword already exists'
      });

      await addKeyword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Keyword already exists'
      });
    });

    it('should handle errors', async () => {
      req.body = newKeyword;
      const error = new Error('Database error');
      mockKeywordManager.addKeyword.mockRejectedValue(error);

      await addKeyword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
    });
  });

  describe('removeKeyword', () => {
    it('should remove a keyword successfully', async () => {
      req.params.keyword = 'lipstick';
      mockKeywordManager.removeKeyword.mockResolvedValue({ success: true });

      await removeKeyword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Keyword removed successfully'
      });
      expect(mockKeywordManager.removeKeyword).toHaveBeenCalledWith('lipstick');
    });

    it('should handle non-existent keywords', async () => {
      req.params.keyword = 'nonexistent';
      mockKeywordManager.removeKeyword.mockResolvedValue({
        success: false,
        error: 'Keyword not found'
      });

      await removeKeyword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Keyword not found'
      });
    });

    it('should handle errors', async () => {
      req.params.keyword = 'lipstick';
      const error = new Error('Database error');
      mockKeywordManager.removeKeyword.mockRejectedValue(error);

      await removeKeyword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
    });
  });

  describe('importKeywords', () => {
    const keywords = [
      { keyword: 'mascara', category: 'cosmetics' },
      { keyword: 'eyeliner', category: 'cosmetics' }
    ];

    it('should import keywords successfully', async () => {
      req.body = { keywords };
      mockKeywordManager.importKeywords.mockResolvedValue({ success: true });

      await importKeywords(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Keywords imported successfully'
      });
      expect(mockKeywordManager.importKeywords).toHaveBeenCalledWith(keywords);
    });

    it('should validate import payload', async () => {
      req.body = {}; // Missing keywords array

      await importKeywords(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Keywords array is required'
      });
      expect(mockKeywordManager.importKeywords).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.body = { keywords };
      const error = new Error('Database error');
      mockKeywordManager.importKeywords.mockRejectedValue(error);

      await importKeywords(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
    });
  });
});
