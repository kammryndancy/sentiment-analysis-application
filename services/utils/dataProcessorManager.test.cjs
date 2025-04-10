/**
 * Simplified DataProcessor for testing
 * This version avoids natural library dependencies that are causing issues
 */

const { MongoClient } = require('mongodb');

class DataProcessor {
  constructor(db) {
    this.mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
    this.dbName = process.env.MONGO_DB || 'test_db';
    this.sourceCollection = process.env.MONGO_COLLECTION || 'comments';
    this.processedCollection = 'processed_comments';
    this.client = null;
    this.db = db;
  }

  async connect() {
    // If we already have a db instance, just return it
    if (this.db) {
      return this.db;
    }
    
    // Otherwise, connect
    return this.db;
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
    return true;
  }

  async processComment(comment) {
    // For testing purposes, just return a simplified processed comment
    return {
      _id: comment._id || 'test_id',
      original_message: comment.content || comment.message || '',
      processed_message: `preprocessed_${comment.content || comment.message || ''}`,
      tokens: ['test', 'tokens'],
      anonymized: true,
      sentiment: {
        score: 1,
        comparative: 0.5
      },
      processed_at: new Date()
    };
  }

  async processAllComments(options = {}) {
    try {
      const db = await this.connect();
      const comments = await db.collection(this.sourceCollection)
        .find({})
        .toArray();

      const processedComments = [];
      for (const comment of comments) {
        const processed = await this.processComment(comment);
        processedComments.push(processed);
      }

      if (processedComments.length > 0) {
        await db.collection(this.processedCollection).insertMany(processedComments);
      }

      return {
        success: true,
        count: processedComments.length,
        comments: processedComments
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getStats() {
    try {
      const db = await this.connect();
      const totalComments = await db.collection(this.sourceCollection).countDocuments();
      const processedComments = await db.collection(this.processedCollection).countDocuments();
      
      return {
        success: true,
        totalComments,
        processedComments,
        processingRate: totalComments > 0 ? (processedComments / totalComments) * 100 : 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DataProcessor;
