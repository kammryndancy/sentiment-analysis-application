// Use .mjs extension for explicit ES Module
import { jest } from '@jest/globals';
import { MongoClient } from 'mongodb';
import DataProcessor from '../../../services/utils/dataProcessorManager.js';
import { preprocessText } from '../../../services/utils/dataProcessing/text-preprocessor.js';
import { anonymizeData } from '../../../services/utils/anonymization/anonymizer.js';
import Sentiment from 'sentiment';

// Mock the dependencies
jest.mock('mongodb');
jest.mock('../../../services/utils/dataProcessing/text-preprocessor.js');
jest.mock('../../../services/utils/anonymization/anonymizer.js');
jest.mock('sentiment', () => {
  return jest.fn().mockImplementation(() => {
    return {
      analyze: jest.fn().mockReturnValue({
        score: 1,
        comparative: 0.5,
        tokens: ['test', 'comment'],
        words: ['test'],
        positive: ['test'],
        negative: []
      })
    };
  });
});

describe('DataProcessor', () => {
  let dataProcessor;
  let mockDb;
  let mockCollection;
  let mockCursor;

  beforeEach(() => {
    // Set up mock cursor
    mockCursor = {
      hasNext: jest.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false),
      next: jest.fn().mockResolvedValue({
        comment_id: '123',
        message: 'Test comment'
      })
    };
    
    // Set up mock collection
    mockCollection = {
      find: jest.fn().mockReturnValue(mockCursor),
      countDocuments: jest.fn().mockResolvedValue(1),
      insertMany: jest.fn().mockResolvedValue({ insertedCount: 1 }),
      aggregate: jest.fn().mockResolvedValue([{
        _id: null,
        avgTokenCount: 10,
        minTokenCount: 5,
        maxTokenCount: 15
      }]),
      projection: jest.fn().mockReturnThis(),
      map: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([])
    };

    // Set up mock db
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    // Set environment variables
    process.env.MONGO_URI = 'mongodb://localhost:27017';
    process.env.MONGO_DB = 'test_db';
    process.env.MONGO_COLLECTION = 'comments';

    // Initialize with mockDb
    dataProcessor = new DataProcessor(mockDb);
    
    // Mock the MongoDB client
    MongoClient.mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(true),
      db: jest.fn().mockReturnValue(mockDb),
      close: jest.fn().mockResolvedValue(true)
    }));
    
    // Mock preprocessText and anonymizeData
    preprocessText.mockReturnValue({ 
      text: 'processed text', 
      tokens: ['processed', 'text'] 
    });
    
    anonymizeData.mockReturnValue({ 
      anonymized: true, 
      comment_id: '123' 
    });
  });

  describe('connect', () => {
    it('should connect to MongoDB successfully', async () => {
      const result = await dataProcessor.connect();
      expect(result).toBe(true);
    });

    it('should handle connection errors', async () => {
      // Override the mock implementation for this specific test
      MongoClient.mockImplementationOnce(() => ({
        connect: jest.fn().mockRejectedValue(new Error('Connection failed'))
      }));
      
      dataProcessor = new DataProcessor(); // Create a new instance without db
      const result = await dataProcessor.connect();
      expect(result).toBe(false);
    });
  });

  describe('processAllComments', () => {
    it('should process comments successfully', async () => {
      const result = await dataProcessor.processAllComments({
        batchSize: 1,
        removeStopwords: true
      });

      expect(result.success).toBe(true);
      expect(result.processedCount).toBeDefined();
      expect(mockDb.collection).toHaveBeenCalledWith(process.env.MONGO_COLLECTION);
      expect(mockDb.collection).toHaveBeenCalledWith('processed_comments');
      expect(mockCollection.insertMany).toHaveBeenCalled();
    });

    it('should handle processing errors', async () => {
      mockCollection.insertMany.mockRejectedValue(new Error('Processing failed'));

      const result = await dataProcessor.processAllComments();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('processComment', () => {
    it('should process a single comment successfully', async () => {
      const mockComment = { 
        comment_id: '123',
        message: 'Test comment' 
      };

      const result = await dataProcessor.processComment(mockComment);

      expect(result).toHaveProperty('processed_message', 'processed text');
      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('anonymized');
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('processed_at');
      expect(preprocessText).toHaveBeenCalledWith('Test comment', expect.any(Object));
      expect(anonymizeData).toHaveBeenCalledWith(mockComment, expect.any(Object));
    });
  });

  describe('getProcessingStats', () => {
    it('should return processing stats successfully', async () => {
      mockCollection.countDocuments
        .mockResolvedValueOnce(100)  // source collection
        .mockResolvedValueOnce(50);  // processed collection

      const stats = await dataProcessor.getProcessingStats();

      expect(stats).toHaveProperty('totalComments', 100);
      expect(stats).toHaveProperty('processedComments', 50);
      expect(stats).toHaveProperty('processingRatio', '50.00%');
      expect(stats).toHaveProperty('tokenStats');
    });

    it('should handle stats retrieval errors', async () => {
      mockCollection.countDocuments.mockRejectedValue(new Error('Stats failed'));
      const stats = await dataProcessor.getProcessingStats();
      expect(stats).toBeNull();
    });
  });
});
