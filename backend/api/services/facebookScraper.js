const FB = require('fb');
require('mongodb');
const FacebookCredential = require('../models/FacebookCredential');
const crypto = require('crypto');

// Copied from settingsController.js for decrypting credentials
const ENCRYPTION_KEY = (process.env.CRED_ENCRYPTION_KEY || 'default_fb_cred_key_32b!').padEnd(32, '!').slice(0, 32); // 32 bytes for AES-256
const IV_LENGTH = 16; // AES block size is 16 bytes for aes-256-cbc

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Import utility classes
const KeywordManager = require('./utils/KeywordManager');
const PageManager = require('./utils/PageManager');
const CommentManager = require('./utils/CommentManager');

class FacebookScraper {
  constructor(db) {
    this.db = db;
    this.keywordManager = new KeywordManager(db);
    this.pageManager = new PageManager(db, this.fbPromise?.bind(this));
    this.commentManager = new CommentManager(db, this.keywordManager);
    this.fbInitialized = false;
  }

  async initializeFB() {
    // Try to get credentials from DB
    const cred = await FacebookCredential.findOne();
    let appId, appSecret, accessToken;
    if (cred) {
      appId = decrypt(cred.facebook_app_id);
      appSecret = decrypt(cred.facebook_app_secret);
      accessToken = decrypt(cred.facebook_access_token);
    } else {
      appId = process.env.FACEBOOK_APP_ID;
      appSecret = process.env.FACEBOOK_APP_SECRET;
      accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    }
    FB.options({
      appId,
      appSecret,
      version: 'v16.0'
    });
    FB.setAccessToken(accessToken);
    this.fbInitialized = true;
  }

  async ensureFBInitialized() {
    if (!this.fbInitialized) {
      await this.initializeFB();
    }
  }

  // Initialize all required dependencies
  async initialize() {
    await this.ensureFBInitialized();
    await this.keywordManager.initializeKeywords();
    await this.pageManager.initializePageIds();
    return true;
  }

  // Check if the text contains Avon-related keywords
  isAvonRelated(text) {
    return this.keywordManager.isAvonRelated(text);
  }

  // Add a keyword to the database
  async addKeyword(keyword, category = null, description = null, isDefault = false) {
    return this.keywordManager.addKeyword(keyword, category, description, isDefault);
  }

  // Remove a keyword from the database
  async removeKeyword(keyword) {
    return this.keywordManager.removeKeyword(keyword);
  }

  // Get all keywords from the database
  async getKeywords() {
    return this.keywordManager.getKeywords();
  }

  // List all keywords in the database with details
  async listKeywords() {
    return this.keywordManager.listKeywords();
  }

  // Import a list of keywords to the database
  async importKeywords(keywordsList) {
    return this.keywordManager.importKeywords(keywordsList);
  }

  // Add a page ID to the database
  async addPageId(pageId, name = null, description = null) {
    return this.pageManager.addPageId(pageId, name, description);
  }

  // Remove a page ID from the database
  async removePageId(pageId) {
    return this.pageManager.removePageId(pageId);
  }

  // Get all page IDs from the database
  async getPageIds() {
    return this.pageManager.getPageIds();
  }

  // List all pages in the database with details
  async listPages() {
    return this.pageManager.listPages();
  }

  // Update the last_scraped timestamp for a page
  async updatePageLastScraped(pageId) {
    return this.pageManager.updatePageLastScraped(pageId);
  }

  // Fetch posts from a Facebook page, filtering out already scraped posts
  async getPagePosts(pageId, limit = 100, daysBack = 30) {
    return this.pageManager.getPagePosts(pageId, limit, daysBack);
  }

  // Process comments and save Avon-related comments to MongoDB
  async processComments(commentsData, postId, pageId) {
    return this.commentManager.processComments(commentsData, postId, pageId);
  }

  // Get all comments for a post, handling pagination
  async getAllComments(post) {
    return this.commentManager.getAllComments(post, this.fbPromise.bind(this));
  }

  // Save all comments for a post regardless of their content
  async saveAllComments(commentsData, postId, pageId, matchedKeywords) {
    return this.commentManager.saveAllComments(commentsData, postId, pageId, matchedKeywords);
  }

  // Save a post to the saved_posts collection
  async savePost(post, pageId) {
    return this.pageManager.savePost(post, pageId);
  }

  // Scrape posts and comments from a list of Facebook page IDs
  async scrapePages(pageIds = null, daysBack = 30) {
    try {
      if (!pageIds) {
        pageIds = await this.getPageIds();
        if (!pageIds || pageIds.length === 0) {
          return {
            success: false,
            message: "No page IDs found in the database. Please add some page IDs first.",
            stats: { totalPosts: 0, keywordMatchedPosts: 0, totalComments: 0, totalSavedComments: 0 }
          };
        }
      }
      console.log(`Found ${JSON.stringify(pageIds)} page IDs to scrape.`);
      let totalPosts = 0;
      let totalComments = 0;
      let totalSavedComments = 0;
      let keywordMatchedPosts = 0;

      console.log(`Starting to scrape ${pageIds.length} Facebook pages...`);

      for (const pageId of pageIds) {
        console.log(`Scraping page: ${pageId}`);
        const posts = await this.getPagePosts(pageId, 100, daysBack);
        totalPosts += posts.length;

        for (const post of posts) {
          const postId = post.id;
          const postMessage = post.message || '';
          const postHasKeywords = this.isAvonRelated(postMessage);
          let matchedKeywords = [];
          if (postHasKeywords) {
            // Extract specific matched keywords
            matchedKeywords = await this.keywordManager.extractMatchedKeywords(postMessage);
            keywordMatchedPosts++;
            console.log(`Found Avon-related keywords in post ${postId}: "${postMessage.substring(0, 50)}..."`);

            // Save the post to the saved_posts collection, including matched keywords
            await this.savePost({ ...post, matched_keywords: matchedKeywords }, pageId);

            const comments = await this.getAllComments(post);
            totalComments += comments.length;

            // Save all comments from this post since the post contains keywords
            const savedComments = await this.saveAllComments(comments, postId, pageId, matchedKeywords);
            totalSavedComments += savedComments;
          }

          // Respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Update last_scraped timestamp for this page
        await this.updatePageLastScraped(pageId);
      }

      console.log(`Scraping completed. Processed ${totalPosts} new posts, found ${keywordMatchedPosts} posts with Avon keywords.`);
      console.log(`Processed ${totalComments} comments and saved ${totalSavedComments} comments to MongoDB.`);

      return {
        success: true,
        message: `Scraping completed successfully.`,
        stats: {
          totalPosts,
          keywordMatchedPosts,
          totalComments,
          totalSavedComments
        }
      };
    } catch (error) {
      console.error('Error scraping pages:', error);
      return {
        success: false,
        message: error.message,
        stats: { totalPosts: 0, keywordMatchedPosts: 0, totalComments: 0, totalSavedComments: 0 }
      };
    }
  }

  // Helper function to promisify FB API calls
  fbPromise(method, path, params = {}) {
    return new Promise((resolve, reject) => {
      FB.api(path, method, params, (response) => {
        if (!response || response.error) {
          reject(response ? response.error : new Error('Unknown Facebook API error'));
        } else {
          resolve(response);
        }
      });
    });
  }
}

module.exports = FacebookScraper;
