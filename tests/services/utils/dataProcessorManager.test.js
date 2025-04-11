// Mock modules before requiring any other modules
jest.mock('natural', () => ({
  PorterStemmer: {
    stem: jest.fn(word => `${word}_stemmed`)
  },
  WordTokenizer: jest.fn().mockImplementation(() => ({
    tokenize: jest.fn(text => text.split(' '))
  })),
  SentimentAnalyzer: jest.fn().mockImplementation(() => ({
    getSentiment: jest.fn(() => 0.5)
  }))
}));

jest.mock('../../../services/utils/dataProcessing/text-preprocessor-shim', () => ({
  preprocessText: jest.fn(text => `preprocessed_${text}`)
}));

jest.mock('../../../services/utils/anonymization/anonymizer-shim', () => ({
  anonymizeData: jest.fn(text => `anonymized_${text}`)
}));

jest.mock('sentiment', () => {
  return jest.fn().mockImplementation(() => ({
    analyze: jest.fn(() => ({
      score: 1,
      comparative: 0.5,
      tokens: ['test', 'comment'],
      words: ['test'],
      positive: ['test'],
      negative: []
    }))
  }));
});

const { jest } = require('@jest/globals');
const DataProcessor = require('../../../services/utils/dataProcessorManagerShim');
const { preprocessText } = require('../../../services/utils/dataProcessing/text-preprocessor-shim');
const { anonymizeData } = require('../../../services/utils/anonymization/anonymizer-shim');

describe('DataProcessor', () => {
  let dataProcessor;
  let mockDb;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up mock db
    mockDb = {
      collection: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([
          { _id: '1', content: 'Test comment 1', postId: 'post1' },
          { _id: '2', content: 'Test comment 2', postId: 'post2' }
        ]),
        insertMany: jest.fn().mockResolvedValue({ insertedCount: 2 }),
        aggregate: jest.fn().mockReturnThis(),
        project: jest.fn().mockReturnThis(),
        group: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        countDocuments: jest.fn().mockResolvedValue(10)
      })
    };

    // Set environment variables
    process.env.MONGO_URI = 'mongodb://localhost:27017';
    process.env.MONGO_DB = 'test_db';
    process.env.MONGO_COLLECTION = 'comments';

    // Create instance
    dataProcessor = new DataProcessor(mockDb);
  });

  describe('processComment', () => {
    it('should process a comment correctly', async () => {
      const mockComment = {
        _id: 'comment123',
        content: 'Test comment',
        postId: 'post123'
      };

      const expectedProcessed = {
        _id: 'comment123',
        original_message: 'Test comment',
        processed_message: 'preprocessed_Test comment',
        tokens: ['test', 'tokens'],
        anonymized: true,
        sentiment: {
          score: 1,
          comparative: 0.5
        },
        processed_at: expect.any(Date)
      };

      const result = await dataProcessor.processComment(mockComment);

      expect(result).toEqual(expectedProcessed);
      expect(result.processed_at).toBeInstanceOf(Date);
    });
  });

  describe('processAllComments', () => {
    it('should process all comments', async () => {
      const mockComments = [
        { _id: '1', content: 'Test comment 1', postId: 'post1' },
        { _id: '2', content: 'Test comment 2', postId: 'post2' }
      ];

      // Mock the database operations
      mockDb.collection().find().toArray.mockResolvedValue(mockComments);
      mockDb.collection().insertMany.mockResolvedValue({ insertedCount: mockComments.length });

      const result = await dataProcessor.processAllComments();

      expect(result).toEqual({
        success: true,
        count: 2,
        comments: expect.arrayContaining([
          {
            _id: '1',
            original_message: 'Test comment 1',
            processed_message: 'preprocessed_Test comment 1',
            tokens: ['test', 'tokens'],
            anonymized: true,
            sentiment: {
              score: 1,
              comparative: 0.5
            },
            processed_at: expect.any(Date)
          },
          {
            _id: '2',
            original_message: 'Test comment 2',
            processed_message: 'preprocessed_Test comment 2',
            tokens: ['test', 'tokens'],
            anonymized: true,
            sentiment: {
              score: 1,
              comparative: 0.5
            },
            processed_at: expect.any(Date)
          }
        ])
      });

      expect(mockDb.collection).toHaveBeenCalledWith('comments');
      expect(mockDb.collection).toHaveBeenCalledWith('processed_comments');
      expect(mockDb.collection().find().toArray).toHaveBeenCalled();
      expect(mockDb.collection().insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ _id: '1' }),
          expect.objectContaining({ _id: '2' })
        ])
      );
    });

    it('should handle errors', async () => {
      mockDb.collection().find().toArray.mockRejectedValue(new Error('Test error'));

      const result = await dataProcessor.processAllComments();

      expect(result).toEqual({
        success: false,
        error: 'Test error'
      });
    });
  });

  describe('getStats', () => {
    it('should return processing stats', async () => {
      mockDb.collection().countDocuments.mockResolvedValue(10);

      const result = await dataProcessor.getStats();

      expect(result).toEqual({
        success: true,
        totalComments: 10,
        processedComments: 10,
        processingRate: 100
      });

      expect(mockDb.collection().countDocuments).toHaveBeenCalledWith();
    });

    it('should handle errors', async () => {
      mockDb.collection().countDocuments.mockRejectedValue(new Error('Stats error'));

      const result = await dataProcessor.getStats();

      expect(result).toEqual({
        success: false,
        error: 'Stats error'
      });
    });
  });
});
