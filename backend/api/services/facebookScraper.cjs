const FB = require('fb');
require('mongodb');

// Import utility classes
const KeywordManager = require('./utils/KeywordManager');
const PageManager = require('./utils/PageManager.cjs');
const CommentManager = require('./utils/CommentManager');

class FacebookScraper {
  constructor(db) {
    // Initialize Facebook Graph API
    FB.options({
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
      version: 'v16.0'
    });
    
    FB.setAccessToken(process.env.FACEBOOK_ACCESS_TOKEN);
    
    // Initialize the DB
    this.db = db;
    
    // Initialize utility managers
    this.keywordManager = new KeywordManager(db);
    this.pageManager = new PageManager(db, this.fbPromise.bind(this));
    this.commentManager = new CommentManager(db, this.keywordManager);
  }
  
  // Initialize all required dependencies
  async initialize() {
    await this.keywordManager.initializeKeywords();
    return true;
  }
  
  // Custom promise wrapper for FB API calls
  fbPromise(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      FB.api(endpoint, options, (response) => {
        if(!response || response.error) {
          reject(response ? response.error : 'Unknown error');
        } else {
          resolve(response);
        }
      });
    });
  }
  
  // Fetch comments from a post
  async fetchCommentsFromPost(postId, options = {}) {
    try {
      const { limit = 100, since = null, until = null } = options;
      
      const apiOptions = {
        limit,
        fields: 'id,message,created_time,comment_count,like_count'
      };
      
      if (since) apiOptions.since = since;
      if (until) apiOptions.until = until;
      
      const response = await this.fbPromise(`${postId}/comments`, apiOptions);
      
      if (!response || !response.data) {
        return { success: false, message: 'No comments returned from Facebook' };
      }
      
      // Filter and save comments to DB
      const comments = response.data
        .filter(comment => comment.message && comment.message.trim() !== '')
        .map(comment => ({
          ...comment,
          post_id: postId,
          created_time: new Date(comment.created_time),
          scraped_time: new Date()
        }));
      
      if (comments.length > 0) {
        await this.commentManager.saveComments(comments);
      }
      
      return {
        success: true,
        count: comments.length,
        has_next: !!response.paging?.next
      };
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }
  
  // Fetch posts from a page
  async fetchPostsFromPage(pageId, options = {}) {
    try {
      const { limit = 50, since = null, until = null, maxComments = 1000 } = options;
      
      const apiOptions = {
        limit,
        fields: 'id,message,created_time,comments.limit(0).summary(true),reactions.limit(0).summary(true)'
      };
      
      if (since) apiOptions.since = since;
      if (until) apiOptions.until = until;
      
      const response = await this.fbPromise(`${pageId}/posts`, apiOptions);
      
      if (!response || !response.data) {
        return { success: false, message: 'No posts returned from Facebook' };
      }
      
      let totalComments = 0;
      const postsWithComments = response.data
        .filter(post => {
          const hasComments = post.comments?.summary?.total_count > 0;
          const hasMessage = post.message && post.message.trim() !== '';
          return hasComments && hasMessage;
        });
      
      console.log(`Found ${postsWithComments.length} posts with comments (out of ${response.data.length} total posts)`);
      
      // Fetch comments for each post
      let commentsFetched = 0;
      for (const post of postsWithComments) {
        if (commentsFetched >= maxComments) break;
        
        const commentResult = await this.fetchCommentsFromPost(post.id, {
          limit: Math.min(100, maxComments - commentsFetched)
        });
        
        if (commentResult.success) {
          commentsFetched += commentResult.count;
          totalComments += commentResult.count;
        }
      }
      
      return {
        success: true,
        totalPosts: postsWithComments.length,
        totalComments,
        has_next: !!response.paging?.next
      };
    } catch (error) {
      console.error(`Error fetching posts for page ${pageId}:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }
  
  // Run the scraper for all pages
  async runScraper(options = {}) {
    try {
      const { limit = 100, maxComments = 1000 } = options;
      
      // Get all pages
      const pages = await this.pageManager.getAllPages();
      
      if (!pages || pages.length === 0) {
        return { success: true, message: 'No pages found to scrape', pageCount: 0, commentCount: 0 };
      }
      
      console.log(`Starting scraper for ${pages.length} pages`);
      
      let totalComments = 0;
      let pagesWithComments = 0;
      
      for (const page of pages) {
        const pageResult = await this.fetchPostsFromPage(page.page_id, { 
          limit,
          maxComments: maxComments - totalComments 
        });
        
        if (pageResult.success && pageResult.totalComments > 0) {
          totalComments += pageResult.totalComments;
          pagesWithComments++;
        }
        
        if (totalComments >= maxComments) break;
      }
      
      // Run keyword matching
      await this.commentManager.matchCommentsToKeywords();
      
      return {
        success: true,
        pageCount: pages.length,
        pagesWithComments,
        commentCount: totalComments
      };
    } catch (error) {
      console.error('Error running scraper:', error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }
  
  // Get stats about the scraper and data collected
  async getStats() {
    try {
      const pageCount = await this.pageManager.getPageCount();
      const commentStats = await this.commentManager.getCommentStats();
      
      return {
        success: true,
        pages: pageCount,
        ...commentStats
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }
}

module.exports = FacebookScraper;
