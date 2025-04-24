const { jest } = require('@jest/globals');
const { MongoClient } = require('mongodb');
const KeywordManager = require('../../../services/utils/KeywordManager');

jest.mock('mongodb');
jest.mock('node-nlp', () => ({
  NlpManager: jest.fn().mockImplementation(() => ({
    addDocument: jest.fn(),
    train: jest.fn().mockResolvedValue({}),
    process: jest.fn().mockResolvedValue({ intent: 'avon', score: 0.75 })
  }))
}));

describe('KeywordManager', () => {
  let keywordManager;
  let mockDb;
  let mockCollection;

  beforeEach(() => {
    mockCollection = {
      find: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockResolvedValue({ insertedId: '123' }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      insertMany: jest.fn().mockResolvedValue({ insertedCount: 2 }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    keywordManager = new KeywordManager(mockDb);

    // Mock the pattern compilation
    keywordManager.avonPattern = new RegExp('\\b(lipstick|avon)\\b', 'i');
    keywordManager.compileKeywordPattern = jest.fn().mockResolvedValue(keywordManager.avonPattern);
  });

  describe('getAllKeywords', () => {
    it('should return all keywords successfully', async () => {
      const mockKeywords = [
        { keyword: 'lipstick', category: 'cosmetics' },
        { keyword: 'foundation', category: 'cosmetics' }
      ];
      mockCollection.toArray.mockResolvedValue(mockKeywords);

      const result = await keywordManager.getAllKeywords();

      expect(result).toEqual(mockKeywords);
      expect(mockDb.collection).toHaveBeenCalledWith('keywords');
    });

    it('should return empty array when no keywords exist', async () => {
      mockCollection.toArray.mockResolvedValue([]);

      const result = await keywordManager.getAllKeywords();

      expect(result).toEqual([]);
      expect(mockDb.collection).toHaveBeenCalledWith('keywords');
    });

    it('should handle database errors', async () => {
      mockCollection.toArray.mockRejectedValue(new Error('Database error'));

      await expect(keywordManager.getAllKeywords()).rejects.toThrow('Database error');
    });
  });

  describe('addKeyword', () => {
    it('should add a new keyword successfully', async () => {
      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.insertOne.mockResolvedValue({ insertedId: '123' });

      const result = await keywordManager.addKeyword('lipstick');

      expect(result.success).toBe(true);
      expect(result.updated).toBe(false);
      expect(result.message).toBe('Added new keyword: lipstick');
      expect(mockCollection.findOne).toHaveBeenCalled();
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it('should update an existing keyword', async () => {
      mockCollection.findOne.mockResolvedValue({ 
        keyword: 'lipstick', 
        category: 'old', 
        description: 'old description' 
      });
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await keywordManager.addKeyword({
        keyword: 'lipstick',
        category: 'new',
        description: 'new description'
      });

      expect(result.success).toBe(true);
      expect(result.updated).toBe(true);
      expect(result.message).toBe('Updated keyword: lipstick');
      expect(mockCollection.findOne).toHaveBeenCalled();
      expect(mockCollection.updateOne).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const result = await keywordManager.addKeyword(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Keyword is required');
      expect(mockCollection.findOne).not.toHaveBeenCalled();
    });
  });

  describe('removeKeyword', () => {
    it('should remove a keyword successfully', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await keywordManager.removeKeyword('lipstick');

      expect(result.success).toBe(true);
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ keyword: 'lipstick' });
    });

    it('should handle non-existent keyword removal', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await keywordManager.removeKeyword('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Keyword not found');
    });

    it('should validate keyword parameter', async () => {
      const result = await keywordManager.removeKeyword('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Keyword is required');
      expect(mockCollection.deleteOne).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockCollection.deleteOne.mockRejectedValue(new Error('Database error'));

      await expect(keywordManager.removeKeyword('lipstick')).rejects.toThrow('Database error');
    });
  });

  describe('importKeywords', () => {
    const keywords = [
      { keyword: 'mascara', category: 'cosmetics' },
      { keyword: 'eyeliner', category: 'cosmetics' }
    ];

    it('should import keywords successfully', async () => {
      const now = new Date();
      mockCollection.insertMany.mockResolvedValue({ insertedCount: keywords.length });

      const result = await keywordManager.importKeywords(keywords);

      expect(result.success).toBe(true);
      expect(mockCollection.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            keyword: 'mascara',
            category: 'cosmetics',
            description: null,
            added_at: expect.any(Date),
            last_updated: expect.any(Date)
          }),
          expect.objectContaining({
            keyword: 'eyeliner',
            category: 'cosmetics',
            description: null,
            added_at: expect.any(Date),
            last_updated: expect.any(Date)
          })
        ])
      );
    });

    it('should handle empty keywords array', async () => {
      const result = await keywordManager.importKeywords([]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No keywords provided');
      expect(mockCollection.insertMany).not.toHaveBeenCalled();
    });

    it('should validate keyword objects in array', async () => {
      const invalidKeywords = [
        { category: 'cosmetics' }, // Missing keyword field
        { keyword: 'eyeliner', category: 'cosmetics' }
      ];

      await expect(keywordManager.importKeywords(invalidKeywords))
        .rejects
        .toThrow('Error importing keywords: Invalid keyword object: keyword field is required and must be a string');

      expect(mockCollection.insertMany).not.toHaveBeenCalled();
    });
  });

  describe('isAvonRelated', () => {
    beforeEach(() => {
      mockCollection.toArray.mockResolvedValue([
        { keyword: 'lipstick', category: 'cosmetics' },
        { keyword: 'avon', category: 'brand' }
      ]);
    });

    it('should return true for text containing keywords', async () => {
      const text = 'Looking for Avon lipstick';
      const result = await keywordManager.isAvonRelated(text);
      expect(result).toBe(true);
    });

    it('should return false for text without keywords', async () => {
      const text = 'Looking for makeup';
      const result = await keywordManager.isAvonRelated(text);
      expect(result).toBe(false);
    });

    it('should handle case-insensitive matching', async () => {
      const text = 'Looking for AVON LIPSTICK';
      const result = await keywordManager.isAvonRelated(text);
      expect(result).toBe(true);
    });

    it('should handle empty text', async () => {
      const result = await keywordManager.isAvonRelated('');
      expect(result).toBe(false);
    });

    it('should handle null or undefined text', async () => {
      expect(await keywordManager.isAvonRelated(null)).toBe(false);
      expect(await keywordManager.isAvonRelated(undefined)).toBe(false);
    });
  });
});
