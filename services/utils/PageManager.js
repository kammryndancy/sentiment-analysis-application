const FB = require('fb');

class PageManager {
  constructor(db, fbPromise) {
    this.db = db;
    this.page_ids_collection = db.collection('page_ids');
    this.scraped_posts = db.collection('scraped_posts');
    this.saved_posts = db.collection('saved_posts');
    this.fbPromise = fbPromise;
  }

  // Initialize page IDs from JSON file or use defaults if none exist
  async initializePageIds() {
    try {
      // Check if we have page IDs in the database
      const pages = await this.page_ids_collection.find({}).toArray();
      
      if (pages.length === 0) {
        // No page IDs in database, load from JSON file
        const fs = require('fs');
        const path = require('path');
        const defaultPagesPath = path.resolve(process.cwd(), 'page_ids.json');
        
        if (fs.existsSync(defaultPagesPath)) {
          // Load page IDs from JSON file
          const pageIdsData = fs.readFileSync(defaultPagesPath, 'utf8');
          const pageIds = JSON.parse(pageIdsData);
          
          console.log(`Found ${pageIds.length} page IDs in JSON file. Adding to database...`);
          
          const added = [];
          for (const pageId of pageIds) {
            const result = await this.addPageId(pageId);
            if (result.success) {
              added.push(pageId);
            }
          }
          
          console.log(`Added ${added.length} page IDs to database from JSON file.`);
          return {
            success: true,
            message: `Initialized database with ${added.length} page IDs.`,
            added
          };
        } else {
          console.warn('No page_ids.json file found in the root directory.');
          return {
            success: false,
            message: 'No page_ids.json file found in the root directory.'
          };
        }
      } else {
        // We already have page IDs in the database, let's check for new ones in the JSON
        const fs = require('fs');
        const path = require('path');
        const defaultPagesPath = path.resolve(process.cwd(), 'page_ids.json');
        
        if (fs.existsSync(defaultPagesPath)) {
          // Load page IDs from JSON file
          const pageIdsData = fs.readFileSync(defaultPagesPath, 'utf8');
          const pageIds = JSON.parse(pageIdsData);
          
          // Get existing page IDs
          const existingPageIds = pages.map(p => p.page_id);
          
          // Find new page IDs
          const newPageIds = pageIds.filter(id => !existingPageIds.includes(id));
          
          if (newPageIds.length > 0) {
            console.log(`Found ${newPageIds.length} new page IDs in JSON file. Adding to database...`);
            
            const added = [];
            for (const pageId of newPageIds) {
              const result = await this.addPageId(pageId);
              if (result.success) {
                added.push(pageId);
              }
            }
            
            console.log(`Added ${added.length} new page IDs to database from JSON file.`);
            return {
              success: true,
              message: `Added ${added.length} new page IDs to database.`,
              added
            };
          } else {
            console.log('No new page IDs found in JSON file.');
            return {
              success: true,
              message: `Database already has all ${pageIds.length} page IDs from JSON file.`
            };
          }
        } else {
          console.log(`Database already has ${pages.length} page IDs. No page_ids.json file found.`);
          return {
            success: true,
            message: `Database already has ${pages.length} page IDs.`
          };
        }
      }
    } catch (error) {
      console.error('Error initializing page IDs:', error);
      return {
        success: false,
        message: error.message
      };
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
        name,
        description,
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
      
      // Get already scraped post IDs for this page
      const existingPostIds = await this.scraped_posts
        .find({ page_id: pageId })
        .project({ post_id: 1 })
        .toArray();
      
      const existingPostIdSet = new Set(existingPostIds.map(p => p.post_id));
      
      // Fetch posts from Facebook
      const path = `/${pageId}/posts`;
      const params = {
        limit: limit,
        fields: 'id,message,created_time,comments.limit(25){id,message,from,created_time}'
      };
      
      const response = await this.fbPromise('get', path, params);
      
      if (!response || !response.data) {
        return [];
      }
      
      // Filter out already scraped posts and posts older than the threshold
      const newPosts = response.data.filter(post => {
        // Skip if already scraped
        if (existingPostIdSet.has(post.id)) {
          return false;
        }
        
        // Skip if older than threshold
        const postDate = new Date(post.created_time);
        if (postDate < dateThreshold) {
          return false;
        }
        
        return true;
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

  // Save a post to the saved_posts collection
  async savePost(post, pageId) {
    try {
      // Prepare document for MongoDB
      const postDoc = {
        post_id: post.id,
        page_id: pageId,
        message: post.message,
        created_time: new Date(post.created_time),
        scraped_at: new Date()
      };
      
      // Insert post in MongoDB
      await this.saved_posts.insertOne(postDoc);
    } catch (error) {
      console.error(`Error saving post ${post.id}:`, error);
    }
  }
}

module.exports = PageManager;
