const FB = require('fb');
const { NlpManager } = require('node-nlp');
const { ObjectId } = require('mongodb');

class FacebookScraper {
  constructor(db) {
    // Initialize Facebook Graph API
    FB.options({
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
      version: 'v16.0'
    });
    
    FB.setAccessToken(process.env.FACEBOOK_ACCESS_TOKEN);
    
    // Initialize MongoDB collections
    this.db = db;
    this.collection = db.collection(process.env.MONGO_COLLECTION);
    this.scraped_posts = db.collection('scraped_posts');
    this.page_ids_collection = db.collection('page_ids');
    this.keywords_collection = db.collection('keywords');
    
    // Initialize NLP manager for keyword matching
    this.nlpManager = new NlpManager({ languages: ['en'] });
    
    // Initialize keywords from database
    this.initializeKeywords();
  }
  
  // Initialize keywords from database or use defaults if none exist
  async initializeKeywords() {
    try {
      // Check if we have keywords in the database
      const keywordsCount = await this.keywords_collection.countDocuments({});
      
      if (keywordsCount === 0) {
        // No keywords in database, add default keywords
        const defaultKeywords = [
          'avon', 'avon products', 'avon representative', 'avon catalog', 
          'avon skincare', 'avon makeup', 'avon perfume', 'avon fragrance',
          'anew', 'skin so soft', 'far away', 'today', 'little black dress',
          'advance techniques', 'mark', 'avon care'
        ];
        
        for (const keyword of defaultKeywords) {
          await this.addKeyword(keyword, null, null, true);
        }
        
        console.log(`Initialized database with ${defaultKeywords.length} default keywords`);
      }
      
      // Compile regex pattern
      await this.compileKeywordPattern();
    } catch (error) {
      console.error('Error initializing keywords:', error);
    }
  }
  
  // Compile regex pattern from current keywords
  async compileKeywordPattern() {
    try {
      // Get all keywords from database
      const keywords = await this.getKeywords();
      
      if (!keywords || keywords.length === 0) {
        // Fallback to a basic pattern if no keywords are found
        this.avonPattern = new RegExp('\\bavon\\b', 'i');
      } else {
        // Compile regex pattern for faster matching
        this.avonPattern = new RegExp('\\b(' + keywords.join('|') + ')\\b', 'i');
      }
    } catch (error) {
      console.error('Error compiling keyword pattern:', error);
      // Fallback to a basic pattern
      this.avonPattern = new RegExp('\\bavon\\b', 'i');
    }
  }
  
  // Check if the text contains Avon-related keywords
  isAvonRelated(text) {
    if (!text) {
      return false;
    }
    return this.avonPattern.test(text);
  }
  
  // Add a keyword to the database
  async addKeyword(keyword, category = null, description = null, isDefault = false) {
    try {
      // Prepare document for MongoDB
      const keywordDoc = {
        keyword: keyword.toLowerCase().trim(),
        category,
        description,
        is_default: isDefault,
        added_at: new Date(),
        last_updated: new Date()
      };
      
      // Insert or update keyword in MongoDB
      const result = await this.keywords_collection.updateOne(
        { keyword: keywordDoc.keyword },
        { $set: keywordDoc },
        { upsert: true }
      );
      
      // Recompile the pattern with the new keyword
      await this.compileKeywordPattern();
      
      return {
        success: true,
        message: result.upsertedCount > 0 
          ? `Added new keyword: ${keywordDoc.keyword}` 
          : `Updated existing keyword: ${keywordDoc.keyword}`
      };
    } catch (error) {
      console.error('Error adding keyword:', error);
      return { success: false, message: error.message };
    }
  }
  
  // Remove a keyword from the database
  async removeKeyword(keyword) {
    try {
      const result = await this.keywords_collection.deleteOne({ 
        keyword: keyword.toLowerCase().trim() 
      });
      
      if (result.deletedCount === 0) {
        return { success: false, message: `Keyword not found: ${keyword}` };
      }
      
      // Recompile the pattern without the removed keyword
      await this.compileKeywordPattern();
      
      return { success: true, message: `Removed keyword: ${keyword}` };
    } catch (error) {
      console.error('Error removing keyword:', error);
      return { success: false, message: error.message };
    }
  }
  
  // Get all keywords from the database
  async getKeywords() {
    try {
      const keywords = await this.keywords_collection.find({}).toArray();
      return keywords.map(k => k.keyword);
    } catch (error) {
      console.error('Error getting keywords:', error);
      return [];
    }
  }
  
  // List all keywords in the database with details
  async listKeywords() {
    try {
      return await this.keywords_collection.find({}).toArray();
    } catch (error) {
      console.error('Error listing keywords:', error);
      return [];
    }
  }
  
  // Import a list of keywords to the database
  async importKeywords(keywordsList) {
    try {
      let addedCount = 0;
      let updatedCount = 0;
      
      for (const item of keywordsList) {
        if (typeof item === 'string') {
          // Simple string keyword
          const result = await this.addKeyword(item);
          if (result.success) {
            if (result.message.includes('Added')) {
              addedCount++;
            } else {
              updatedCount++;
            }
          }
        } else if (typeof item === 'object') {
          // Object with keyword, category, and description
          const result = await this.addKeyword(
            item.keyword, 
            item.category || null, 
            item.description || null
          );
          if (result.success) {
            if (result.message.includes('Added')) {
              addedCount++;
            } else {
              updatedCount++;
            }
          }
        }
      }
      
      return {
        success: true,
        message: `Imported ${addedCount} new keywords and updated ${updatedCount} existing keywords.`
      };
    } catch (error) {
      console.error('Error importing keywords:', error);
      return { success: false, message: error.message };
    }
  }
  
  // Add a page ID to the database
  async addPageId(pageId, name = null, description = null) {
    try {
      // Check if the page exists on Facebook
      try {
        const pageInfo = await this.fbPromise('get', `/${pageId}`);
        
        // If no name was provided, use the one from Facebook
        if (!name && pageInfo.name) {
          name = pageInfo.name;
        }
      } catch (fbError) {
        console.warn(`Could not fetch page info from Facebook: ${fbError.message}`);
        // Continue anyway, as the page ID might be valid but not accessible
      }
      
      // Prepare document for MongoDB
      const pageDoc = {
        page_id: pageId,
        name: name || pageId,
        description: description || '',
        last_scraped: null,
        added_at: new Date(),
        last_updated: new Date()
      };
      
      // Insert or update page in MongoDB
      const result = await this.page_ids_collection.updateOne(
        { page_id: pageId },
        { $set: pageDoc },
        { upsert: true }
      );
      
      return {
        success: true,
        message: result.upsertedCount > 0 
          ? `Added new page ID: ${pageId}` 
          : `Updated existing page ID: ${pageId}`
      };
    } catch (error) {
      console.error('Error adding page ID:', error);
      return { success: false, message: error.message };
    }
  }
  
  // Remove a page ID from the database
  async removePageId(pageId) {
    try {
      const result = await this.page_ids_collection.deleteOne({ page_id: pageId });
      
      if (result.deletedCount === 0) {
        return { success: false, message: `Page ID not found: ${pageId}` };
      }
      
      return { success: true, message: `Removed page ID: ${pageId}` };
    } catch (error) {
      console.error('Error removing page ID:', error);
      return { success: false, message: error.message };
    }
  }
  
  // Get all page IDs from the database
  async getPageIds() {
    try {
      const pages = await this.page_ids_collection.find({}).toArray();
      return pages.map(p => p.page_id);
    } catch (error) {
      console.error('Error getting page IDs:', error);
      return [];
    }
  }
  
  // List all pages in the database with details
  async listPages() {
    try {
      return await this.page_ids_collection.find({}).toArray();
    } catch (error) {
      console.error('Error listing pages:', error);
      return [];
    }
  }
  
  // Update the last_scraped timestamp for a page
  async updatePageLastScraped(pageId) {
    try {
      await this.page_ids_collection.updateOne(
        { page_id: pageId },
        { $set: { last_scraped: new Date(), last_updated: new Date() } }
      );
    } catch (error) {
      console.error(`Error updating last_scraped for page ${pageId}:`, error);
    }
  }
  
  // Fetch posts from a Facebook page, filtering out already scraped posts
  async getPagePosts(pageId, limit = 100, daysBack = 30) {
    try {
      // Calculate the date threshold
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysBack);
      
      // Get the page's last scraped timestamp
      const page = await this.page_ids_collection.findOne({ page_id: pageId });
      const lastScraped = page && page.last_scraped ? new Date(page.last_scraped) : null;
      
      // Get already scraped post IDs for this page
      const existingPostIds = await this.scraped_posts
        .find({ page_id: pageId })
        .project({ post_id: 1 })
        .toArray();
      
      const existingPostIdSet = new Set(existingPostIds.map(p => p.post_id));
      
      // Fetch posts from Facebook
      const response = await this.fbPromise('get', `/${pageId}/posts`, {
        limit,
        fields: 'id,message,created_time,comments.limit(25){id,message,from,created_time}'
      });
      
      if (!response || !response.data) {
        console.warn(`No posts found for page ${pageId}`);
        return [];
      }
      
      // Filter out posts that are too old or already scraped
      const newPosts = response.data.filter(post => {
        const postCreatedTime = new Date(post.created_time);
        return (
          postCreatedTime >= dateThreshold && 
          !existingPostIdSet.has(post.id)
        );
      });
      
      // Save the new posts to the scraped_posts collection
      if (newPosts.length > 0) {
        const scrapedPostDocs = newPosts.map(post => ({
          post_id: post.id,
          page_id: pageId,
          created_time: new Date(post.created_time),
          scraped_at: new Date()
        }));
        
        await this.scraped_posts.insertMany(scrapedPostDocs);
      }
      
      console.log(`Found ${newPosts.length} new posts for page ${pageId}`);
      return newPosts;
    } catch (error) {
      console.error(`Error getting posts for page ${pageId}:`, error);
      return [];
    }
  }
  
  // Process comments and save Avon-related comments to MongoDB
  async processComments(commentsData, postId, pageId) {
    try {
      if (!commentsData || commentsData.length === 0) {
        return 0;
      }
      
      // Get existing comment IDs to avoid duplicates
      const existingCommentIds = await this.collection
        .find({ post_id: postId })
        .project({ comment_id: 1 })
        .toArray();
      
      const existingCommentIdSet = new Set(existingCommentIds.map(c => c.comment_id));
      
      let savedCount = 0;
      let newCommentsCount = 0;
      
      for (const comment of commentsData) {
        const commentId = comment.id;
        
        // Skip already processed comments
        if (existingCommentIdSet.has(commentId)) {
          continue;
        }
        
        newCommentsCount++;
        const commentMessage = comment.message || '';
        
        // Check if comment is related to Avon
        if (this.isAvonRelated(commentMessage)) {
          // Prepare document for MongoDB
          const commentDoc = {
            comment_id: commentId,
            post_id: postId,
            page_id: pageId,
            message: commentMessage,
            created_time: new Date(comment.created_time),
            from_id: comment.from ? comment.from.id : null,
            from_name: comment.from ? comment.from.name : null,
            scraped_at: new Date()
          };
          
          // Insert comment in MongoDB
          await this.collection.insertOne(commentDoc);
          savedCount++;
        }
      }
      
      console.log(`Processed ${newCommentsCount} new comments for post ${postId}, saved ${savedCount} Avon-related comments`);
      return savedCount;
    } catch (error) {
      console.error(`Error processing comments for post ${postId}:`, error);
      return 0;
    }
  }
  
  // Get all comments for a post, handling pagination
  async getAllComments(post) {
    try {
      if (!post.comments) {
        return [];
      }
      
      let comments = post.comments.data;
      let nextPage = post.comments.paging ? post.comments.paging.next : null;
      
      // Handle pagination to get all comments
      while (nextPage) {
        try {
          // Extract the relative path from the full URL
          const url = new URL(nextPage);
          const path = url.pathname + url.search;
          
          const nextComments = await this.fbPromise('get', path);
          comments = comments.concat(nextComments.data);
          nextPage = nextComments.paging ? nextComments.paging.next : null;
        } catch (error) {
          console.error('Error fetching next page of comments:', error);
          break;
        }
      }
      
      return comments;
    } catch (error) {
      console.error('Error getting all comments:', error);
      return [];
    }
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
            stats: { totalPosts: 0, totalComments: 0, totalSavedComments: 0 }
          };
        }
      }
      
      let totalPosts = 0;
      let totalComments = 0;
      let totalSavedComments = 0;
      
      console.log(`Starting to scrape ${pageIds.length} Facebook pages...`);
      
      for (const pageId of pageIds) {
        console.log(`Scraping page: ${pageId}`);
        const posts = await this.getPagePosts(pageId, 100, daysBack);
        totalPosts += posts.length;
        
        for (const post of posts) {
          const postId = post.id;
          const comments = await this.getAllComments(post);
          totalComments += comments.length;
          
          const savedComments = await this.processComments(comments, postId, pageId);
          totalSavedComments += savedComments;
          
          // Respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Update last_scraped timestamp for this page
        await this.updatePageLastScraped(pageId);
      }
      
      console.log(`Scraping completed. Processed ${totalPosts} new posts and ${totalComments} comments.`);
      console.log(`Saved ${totalSavedComments} new Avon-related comments to MongoDB.`);
      
      return {
        success: true,
        message: `Scraping completed successfully.`,
        stats: {
          totalPosts,
          totalComments,
          totalSavedComments
        }
      };
    } catch (error) {
      console.error('Error scraping pages:', error);
      return {
        success: false,
        message: error.message,
        stats: { totalPosts: 0, totalComments: 0, totalSavedComments: 0 }
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
