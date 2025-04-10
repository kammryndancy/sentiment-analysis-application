import { MongoClient } from 'mongodb';
import CommentManager from '../../../services/utils/CommentManager.js';

jest.mock('mongodb');

describe('CommentManager', () => {
  let commentManager;
  let mockDb;
  let mockCollection;
  let mockKeywordManager;

  beforeEach(() => {
    mockCollection = {
      find: jest.fn().mockReturnThis(),
      project: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      insertOne: jest.fn()
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    mockKeywordManager = {
      isAvonRelated: jest.fn()
    };

    process.env.MONGO_COLLECTION = 'comments';
    commentManager = new CommentManager(mockDb, mockKeywordManager);
  });

  describe('getAllComments', () => {
    it('should handle posts with no comments', async () => {
      const post = { id: '123' }; // No comments field
      const fbPromise = jest.fn();

      const result = await commentManager.getAllComments(post, fbPromise);

      expect(result).toEqual([]);
      expect(fbPromise).not.toHaveBeenCalled();
    });

    it('should fetch all comments including paginated ones', async () => {
      const initialComments = {
        data: [{ id: '1', message: 'Comment 1' }],
        paging: {
          next: 'https://graph.facebook.com/v12.0/next-page'
        }
      };

      const nextPageComments = {
        data: [{ id: '2', message: 'Comment 2' }],
        paging: null
      };

      const post = {
        id: '123',
        comments: initialComments
      };

      const fbPromise = jest.fn()
        .mockResolvedValueOnce(nextPageComments);

      const result = await commentManager.getAllComments(post, fbPromise);

      expect(result).toEqual([
        ...initialComments.data,
        ...nextPageComments.data
      ]);
      expect(fbPromise).toHaveBeenCalledTimes(1);
    });

    it('should handle pagination errors gracefully', async () => {
      const initialComments = {
        data: [{ id: '1', message: 'Comment 1' }],
        paging: {
          next: 'https://graph.facebook.com/v12.0/next-page'
        }
      };

      const post = {
        id: '123',
        comments: initialComments
      };

      const fbPromise = jest.fn()
        .mockRejectedValueOnce(new Error('API error'));

      const result = await commentManager.getAllComments(post, fbPromise);

      expect(result).toEqual(initialComments.data);
      expect(fbPromise).toHaveBeenCalledTimes(1);
    });
  });

  describe('processComments', () => {
    const commentsData = [
      {
        id: '1',
        message: 'Avon related comment',
        created_time: '2025-01-01T00:00:00Z',
        from: { id: 'user1', name: 'User 1' }
      },
      {
        id: '2',
        message: 'Non-Avon comment',
        created_time: '2025-01-01T00:00:00Z',
        from: { id: 'user2', name: 'User 2' }
      }
    ];

    it('should process and save Avon-related comments', async () => {
      mockCollection.toArray.mockResolvedValue([]);
      mockKeywordManager.isAvonRelated
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const result = await commentManager.processComments(commentsData, 'post1', 'page1');

      expect(result).toBe(1);
      expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
      expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
        comment_id: '1',
        post_id: 'post1',
        page_id: 'page1'
      }));
    });

    it('should skip existing comments', async () => {
      mockCollection.toArray.mockResolvedValue([
        { comment_id: '1' }
      ]);
      mockKeywordManager.isAvonRelated.mockReturnValue(true);

      const result = await commentManager.processComments(commentsData, 'post1', 'page1');

      expect(result).toBe(1);
      expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
      expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
        comment_id: '2'
      }));
    });

    it('should handle empty comments data', async () => {
      const result = await commentManager.processComments([], 'post1', 'page1');

      expect(result).toBe(0);
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockCollection.toArray.mockRejectedValue(new Error('Database error'));

      const result = await commentManager.processComments(commentsData, 'post1', 'page1');

      expect(result).toBe(0);
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });
  });

  describe('saveAllComments', () => {
    const commentsData = [
      {
        id: '1',
        message: 'Comment 1',
        created_time: '2025-01-01T00:00:00Z',
        from: { id: 'user1', name: 'User 1' }
      },
      {
        id: '2',
        message: 'Comment 2',
        created_time: '2025-01-01T00:00:00Z',
        from: { id: 'user2', name: 'User 2' }
      }
    ];

    it('should save all comments regardless of content', async () => {
      mockCollection.toArray.mockResolvedValue([]);
      mockKeywordManager.isAvonRelated
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const result = await commentManager.saveAllComments(commentsData, 'post1', 'page1');

      expect(result).toBe(2);
      expect(mockCollection.insertOne).toHaveBeenCalledTimes(2);
      expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
        comment_id: '1',
        contains_keywords: true
      }));
      expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
        comment_id: '2',
        contains_keywords: false
      }));
    });

    it('should skip existing comments', async () => {
      mockCollection.toArray.mockResolvedValue([
        { comment_id: '1' }
      ]);

      const result = await commentManager.saveAllComments(commentsData, 'post1', 'page1');

      expect(result).toBe(1);
      expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
      expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
        comment_id: '2'
      }));
    });

    it('should handle empty comments data', async () => {
      const result = await commentManager.saveAllComments([], 'post1', 'page1');

      expect(result).toBe(0);
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockCollection.toArray.mockRejectedValue(new Error('Database error'));

      const result = await commentManager.saveAllComments(commentsData, 'post1', 'page1');

      expect(result).toBe(0);
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should handle comments without message field', async () => {
      const commentsWithoutMessage = [
        {
          id: '1',
          created_time: '2025-01-01T00:00:00Z',
          from: { id: 'user1', name: 'User 1' }
        }
      ];

      mockCollection.toArray.mockResolvedValue([]);
      mockKeywordManager.isAvonRelated.mockReturnValue(false);

      const result = await commentManager.saveAllComments(commentsWithoutMessage, 'post1', 'page1');

      expect(result).toBe(1);
      expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
        comment_id: '1',
        message: undefined,
        contains_keywords: false
      }));
    });
  });
});
