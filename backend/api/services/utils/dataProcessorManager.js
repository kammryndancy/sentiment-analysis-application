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
    this.mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
    this.dbName = process.env.MONGO_DB || 'tonique';
    this.sourceCollection = process.env.MONGO_SCRAPED_COMMENTS_COLLECTION || 'scraped_comments';
    this.processedCollection = process.env.MONGO_PROCESSED_COMMENTS_COLLECTION || 'processed_comments';
    this.processedPostCollection = process.env.MONGO_PROCESSED_POSTS_COLLECTION || 'processed_posts';
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
    const processedText = await preprocessText(comment.message, options);

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

    // Use Google sentiment score for weighting
    let googleScore = 0;
    if (hybridSentiment && hybridSentiment.google && hybridSentiment.google.documentSentiment && typeof hybridSentiment.google.documentSentiment.score === 'number') {
      googleScore = hybridSentiment.google.documentSentiment.score;
    }
    const weightedSentiment = googleScore * engagement;

    return {
      ...anonymizedComment,
      created_time: comment.created_time ? new Date(comment.created_time) : new Date(),
      matched_keywords: comment.matched_keywords,
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
    // Await the async preprocessing of text
    const processedText = await preprocessText(post.message, options);

    // Await the async anonymization of post data
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

    // Use Google sentiment score for weighting
    let googleScore = 0;
    if (hybridSentiment && hybridSentiment.google && hybridSentiment.google.documentSentiment && typeof hybridSentiment.google.documentSentiment.score === 'number') {
      googleScore = hybridSentiment.google.documentSentiment.score;
    }
    const weightedSentiment = googleScore * engagement;

    return {
      ...anonymizedPost,
      created_time: post.created_time ? new Date(post.created_time) : new Date(),
      matched_keywords: post.matched_keywords,
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
   * Process all posts in the source collection
   * @param {Object} options - Processing options
   */
  async processAllPosts(options = {}) {
    const {
      batchSize = 100,
      startDate = null,
      endDate = null,
      removeStopwords = true,
      performLemmatization = true,
      anonymizePII = true,
      anonymizeUsernames = true,
      analyzeSentiment = true
    } = options;
    try {
      if (!this.db) {
        await this.connect();
      }
      const sourceCollection = this.db.collection(process.env.MONGO_SCRAPED_POSTS_COLLECTION || 'scraped_posts');
      const processedCollection = this.db.collection('processed_posts');
      // Build query for date range
      const query = {};
      if (startDate) query.created_time = { ...query.created_time, $gte: new Date(startDate) };
      if (endDate) query.created_time = { ...query.created_time, $lte: new Date(endDate) };
      const totalCount = await sourceCollection.countDocuments(query);
      let processedCount = 0;
      let cursor = sourceCollection.find(query).batchSize(batchSize);
      let processingBatch = [];
      for await (const post of cursor) {
        // Use the same processPost logic as before
        const processedPost = await this.processPost(post, {
          removeStopwords,
          performLemmatization,
          anonymizePII,
          anonymizeUsernames,
          analyzeSentiment
        });
        processingBatch.push(processedPost);
        if (processingBatch.length >= batchSize) {
          await processedCollection.insertMany(processingBatch);
          processedCount += processingBatch.length;
          processingBatch = [];
        }
      }
      if (processingBatch.length > 0) {
        await processedCollection.insertMany(processingBatch);
        processedCount += processingBatch.length;
      }
      return {
        success: true,
        processedCount,
        totalCount
      };
    } catch (error) {
      console.error('Error processing posts:', error);
      return {
        success: false,
        error: error.message
      };
    }
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

      // Post stats
      const postSourceCollection = this.db.collection(process.env.MONGO_SCRAPED_POSTS_COLLECTION || 'scraped_posts');
      const postProcessedCollection = this.db.collection(process.env.MONGO_PROCESSED_POSTS_COLLECTION || 'processed_posts');
      const totalPosts = await postSourceCollection.countDocuments();
      const processedPosts = await postProcessedCollection.countDocuments();
      const postProcessingRatio = totalPosts > 0 ? (processedPosts / totalPosts) * 100 : 0;

      // Get avg, min, max weighted sentiment
      const sentimentStats = await processedCollection.aggregate([
        {
          $match: { weighted_sentiment: { $exists: true, $ne: null, $type: 'number' } }
        },
        {
          $group: {
            _id: null,
            avgWeightedSentiment: { $avg: '$weighted_sentiment' },
            minWeightedSentiment: { $min: '$weighted_sentiment' },
            maxWeightedSentiment: { $max: '$weighted_sentiment' }
          }
        }
      ]).toArray();

      const postSentimentStats = await postProcessedCollection.aggregate([
        {
          $match: { weighted_sentiment: { $exists: true, $ne: null, $type: 'number' } }
        },
        {
          $group: {
            _id: null,
            avgWeightedSentiment: { $avg: '$weighted_sentiment' },
            minWeightedSentiment: { $min: '$weighted_sentiment' },
            maxWeightedSentiment: { $max: '$weighted_sentiment' }
          }
        }
      ]).toArray();

      const stats = {
        totalComments,
        processedComments,
        processingRatio: processingRatio.toFixed(2) + '%',
        sentimentStats: sentimentStats.length > 0 ? sentimentStats[0] : null,
        totalPosts,
        processedPosts,
        postProcessingRatio: postProcessingRatio.toFixed(2) + '%',
        postSentimentStats: postSentimentStats.length > 0 ? postSentimentStats[0] : null
      };

      return stats;
    } catch (error) {
      console.error('Error getting processing stats:', error);
      return null;
    }
  }

  /**
   * Get processed comment extremes: highest, lowest, and neutralist weighted sentiment
   */
  async getProcessedCommentExtremes() {
    if (!this.db) {
      await this.connect();
    }
    const processedCollection = this.db.collection(this.processedPostCollection);
    // Highest
    const highest = await processedCollection.find({ weighted_sentiment: { $exists: true, $ne: null, $type: 'number' } })
      .sort({ weighted_sentiment: -1 })
      .limit(1)
      .toArray();
    // Lowest
    const lowest = await processedCollection.find({ weighted_sentiment: { $exists: true, $ne: null, $type: 'number' } })
      .sort({ weighted_sentiment: 1 })
      .limit(1)
      .toArray();
    // Neutralist (closest to zero)
    const neutralist = await processedCollection.aggregate([
      {
        $match: { weighted_sentiment: { $exists: true, $ne: null, $type: 'number' } }
      },
      {
        $addFields: { absWeightedSentiment: { $abs: "$weighted_sentiment" } }
      },
      { $sort: { absWeightedSentiment: 1 } },
      { $limit: 1 }
    ]).toArray();
    return {
      highest: highest[0] || null,
      lowest: lowest[0] || null,
      neutralist: neutralist[0] || null
    };
  }

  /**
   * Get word cloud data for processed posts, weighted by weighted_sentiment, using tokens array
   * Returns array of { word, count, weightedSentiment }
   */
  async getProcessedPostsWordCloud({ topN = 50 } = {}) {
    if (!this.db) {
      await this.connect();
    }
    const processedPosts = this.db.collection(this.processedPostCollection);
    // Aggregate words from processed_posts.tokens (array of important words)
    // 1. Unwind tokens
    // 2. Group by token, count and sum/avg weighted_sentiment
    // 3. Sort by count desc, limit topN
    const pipeline = [
      { $match: { tokens: { $exists: true, $ne: null, $type: 'array', $not: { $size: 0 } }, weighted_sentiment: { $exists: true, $type: 'number' } } },
      { $unwind: "$tokens" },
      { $match: { tokens: { $regex: /^[a-zA-Z]{3,}$/ } } }, // Only alpha words, min length 3
      { $group: {
          _id: "$tokens",
          count: { $sum: 1 },
          avgWeightedSentiment: { $avg: "$weighted_sentiment" },
          sumWeightedSentiment: { $sum: "$weighted_sentiment" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: topN },
      { $project: { word: "$_id", count: 1, avgWeightedSentiment: 1, sumWeightedSentiment: 1, _id: 0 } }
    ];
    return await processedPosts.aggregate(pipeline).toArray();
  }
}

export default DataProcessor;
