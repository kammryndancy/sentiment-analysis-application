/**
 * Main Data Processor
 * 
 * Processes data from MongoDB, applies text preprocessing and anonymization,
 * and stores the processed data back to MongoDB.
 */

import { MongoClient } from 'mongodb';
import { preprocessText } from './dataProcessing/text-preprocessor.js';
import { anonymizeData } from './anonymization/anonymizer.js';
import Sentiment from 'sentiment';
import { analyzeSentimentHuggingFace } from '../nlp/huggingfaceSentiment.js';
import { analyzeSentimentGoogle } from '../nlp/googleCloudNLP.js';
const sentiment = new Sentiment();

class DataProcessor {
  constructor(db) {
    this.mongoUri = process.env.MONGO_URI;
    this.dbName = process.env.MONGO_DB;
    this.sourceCollection = process.env.MONGO_COLLECTION;
    this.processedCollection = 'processed_comments';
    this.client = null;
    this.db = db;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      this.client = new MongoClient(this.mongoUri);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      console.log(`Connected to MongoDB: ${this.mongoUri}/${this.dbName}`);
      return true;
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      return false;
    }
  }

  /**
   * Close MongoDB connection
   */
  async close() {
    if (this.client) {
      await this.client.close();
      console.log('Disconnected from MongoDB');
    }
  }

  /**
   * Analyze sentiment of a text
   * @param {string} text - Input text to analyze
   * @returns {Object} - Sentiment analysis results
   */
  analyzeSentiment(text) {
    const result = sentiment.analyze(text);
    return result;
  }

  /**
   * Analyze sentiment of a text using both Hugging Face and Google Cloud NLP
   * @param {string} text - Input text to analyze
   * @returns {Object} - Combined sentiment analysis results
   */
  async analyzeHybridSentiment(text) {
    const results = {};
    try {
      results.huggingface = await analyzeSentimentHuggingFace(text);
    } catch (err) {
      results.huggingface = { error: err.message };
    }
    try {
      results.google = await analyzeSentimentGoogle(text);
    } catch (err) {
      results.google = { error: err.message };
    }
    return results;
  }

  /**
   * Process all comments in the source collection
   * @param {Object} options - Processing options
   */
  async processAllComments(options = {}) {
    const {
      batchSize = 100,
      startDate = null,
      endDate = null,
      removeStopwords = true,
      performLemmatization = true,
      anonymizePII = true,
      anonymizeUsernames = true,
      analyzeSentiment: shouldAnalyzeSentiment = true
    } = options;

    try {
      if (!this.db) {
        await this.connect();
      }

      const sourceCollection = this.db.collection(this.sourceCollection);
      const processedCollection = this.db.collection(this.processedCollection);

      // Build query for date range
      const query = {};
      if (startDate || endDate) {
        query.created_time = {};
        if (startDate) {
          query.created_time.$gte = new Date(startDate);
        }
        if (endDate) {
          query.created_time.$lte = new Date(endDate);
        }
      }

      // Get already processed comment IDs to avoid duplicates
      const processedIds = await processedCollection
        .find({}, { projection: { comment_id: 1 } })
        .map(doc => doc.comment_id)
        .toArray();
      
      const processedIdSet = new Set(processedIds);

      // Get total count for progress reporting
      const totalCount = await sourceCollection.countDocuments(query);
      console.log(`Found ${totalCount} comments to process`);

      let processedCount = 0;
      let cursor = sourceCollection.find(query);

      // Process comments in batches
      while (await cursor.hasNext()) {
        const batch = [];
        const processingBatch = [];
        
        // Fetch a batch of comments
        while (batch.length < batchSize && await cursor.hasNext()) {
          const comment = await cursor.next();
          
          // Skip already processed comments
          if (processedIdSet.has(comment.comment_id)) {
            continue;
          }
          
          batch.push(comment);
        }

        if (batch.length === 0) {
          break;
        }

        // Process each comment in the batch
        for (const comment of batch) {
          const processedComment = await this.processComment(comment, {
            removeStopwords,
            performLemmatization,
            anonymizePII,
            anonymizeUsernames,
            analyzeSentiment: shouldAnalyzeSentiment
          });

          processingBatch.push(processedComment);
        }

        // Insert processed comments into the processed collection
        if (processingBatch.length > 0) {
          await processedCollection.insertMany(processingBatch);
          processedCount += processingBatch.length;
          console.log(`Processed ${processedCount}/${totalCount} comments`);
        }
      }

      return {
        success: true,
        processedCount,
        totalCount
      };
    } catch (error) {
      console.error('Error processing comments:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processComment(comment, options = {}) {
    // Preprocess the text
    const processedText = preprocessText(comment.message, options);

    // Anonymize the data
    const anonymizedComment = anonymizeData(comment, options);

    // Analyze sentiment using both Hugging Face and Google Cloud NLP
    const hybridSentiment = await this.analyzeHybridSentiment(processedText.text);

    // Compute weighted sentiment based on likes/reactions
    const likeWeight = 1;
    const reactionWeights = {
      LIKE: 1,
      LOVE: 2,
      HAHA: 1,
      WOW: 1,
      SAD: -1,
      ANGRY: -2
    };
    let reactionWeightSum = 0;
    if (comment.reactions && Array.isArray(comment.reactions)) {
      for (const reaction of comment.reactions) {
        const type = (reaction.type || '').toUpperCase();
        reactionWeightSum += reactionWeights[type] || 0;
      }
    }
    const engagement = 1 + (comment.like_count || 0) * likeWeight + reactionWeightSum;
    const weightedSentiment = hybridSentiment * engagement;

    return {
      ...anonymizedComment,
      original_message: comment.message,
      processed_message: processedText.text,
      tokens: processedText.tokens,
      sentiment: hybridSentiment,
      weighted_sentiment: weightedSentiment,
      engagement,
      processed_at: new Date()
    };
  }

  async processPost(post, options = {}) {
    // Preprocess the post message
    const processedText = preprocessText(post.message, options);

    // Anonymize the post data
    const anonymizedPost = anonymizeData(post, options);

    // Analyze sentiment using both Hugging Face and Google Cloud NLP
    const hybridSentiment = await this.analyzeHybridSentiment(processedText.text);

    // Compute weighted sentiment based on likes/reactions
    const likeWeight = 1;
    const reactionWeights = {
      LIKE: 1,
      LOVE: 2,
      HAHA: 1,
      WOW: 1,
      SAD: -1,
      ANGRY: -2
    };
    let reactionWeightSum = 0;
    if (post.reactions && Array.isArray(post.reactions)) {
      for (const reaction of post.reactions) {
        const type = (reaction.type || '').toUpperCase();
        reactionWeightSum += reactionWeights[type] || 0;
      }
    }
    const engagement = 1 + (post.likes || 0) * likeWeight + reactionWeightSum;
    const weightedSentiment = hybridSentiment * engagement;

    return {
      ...anonymizedPost,
      original_message: post.message,
      processed_message: processedText.text,
      tokens: processedText.tokens,
      sentiment: hybridSentiment,
      weighted_sentiment: weightedSentiment,
      engagement,
      processed_at: new Date()
    };
  }

  /**
   * Get statistics about processed comments
   */
  async getProcessingStats() {
    try {
      if (!this.db) {
        await this.connect();
      }

      const sourceCollection = this.db.collection(this.sourceCollection);
      const processedCollection = this.db.collection(this.processedCollection);

      const totalComments = await sourceCollection.countDocuments();
      const processedComments = await processedCollection.countDocuments();
      const processingRatio = totalComments > 0 ? (processedComments / totalComments) * 100 : 0;

      // Get avg token count
      const tokenStats = await processedCollection.aggregate([
        {
          $match: { tokens: { $exists: true } }
        },
        {
          $project: {
            tokenCount: { $size: '$tokens' }
          }
        },
        {
          $group: {
            _id: null,
            avgTokenCount: { $avg: '$tokenCount' },
            minTokenCount: { $min: '$tokenCount' },
            maxTokenCount: { $max: '$tokenCount' }
          }
        }
      ]).toArray();

      const stats = {
        totalComments,
        processedComments,
        processingRatio: processingRatio.toFixed(2) + '%',
        tokenStats: tokenStats.length > 0 ? tokenStats[0] : null
      };

      return stats;
    } catch (error) {
      console.error('Error getting processing stats:', error);
      return null;
    }
  }
}

export default DataProcessor;
