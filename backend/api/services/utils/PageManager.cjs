/**
 * PageManager (CommonJS Version for Tests)
 */

class PageManager {
  constructor(db, fbPromise) {
    this.db = db;
    this.page_ids_collection = db.collection('page_ids');
    this.scraped_posts = db.collection('scraped_posts');
    this.saved_posts = db.collection('saved_posts');
    this.fbPromise = fbPromise || this.defaultFbPromise.bind(this);
  }

  defaultFbPromise(method, path, params) {
    return Promise.resolve({
      name: 'Test Page',
      id: path.replace('/', ''),
      about: 'Test Description'
    });
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

  // Add a page ID to the database
  async addPageId(pageId, name = null, description = null) {
    try {
      // Basic validation
      if (!pageId || pageId.trim() === '') {
        return { success: false, message: 'Invalid page ID provided' };
      }

      // Check if page ID already exists
      const existingPage = await this.page_ids_collection.findOne({ page_id: pageId });
      if (existingPage) {
        return { success: false, message: `Page ID ${pageId} already exists` };
      }

      // If no name provided, fetch from Facebook
      if (!name) {
        try {
          const response = await this.fbPromise('get', `/${pageId}`, {
            fields: 'name,username,about'
          });
          
          name = response.name;
          description = description || response.about || '';
        } catch (fbError) {
          console.warn(`Warning: Could not fetch details for page ID ${pageId} from Facebook:`, fbError);
        }
      }

      // Create page document
      const pageDoc = {
        page_id: pageId,
        name: name || 'Unknown Page',
        description: description || '',
        created_at: new Date(),
        last_updated: new Date(),
        last_scraped: null
      };

      // Insert into database
      await this.page_ids_collection.insertOne(pageDoc);
      
      return { 
        success: true, 
        message: `Added page ID: ${pageId}`, 
        page: pageDoc 
      };
    } catch (error) {
      console.error('Error adding page ID:', error);
      return { success: false, message: error.message };
    }
  }

  // Remove a page ID from the database
  async removePageId(pageId) {
    try {
      if (!pageId || pageId.trim() === '') {
        return { success: false, message: 'Invalid page ID provided' };
      }
      
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

  // Update the last_scraped timestamp for a page
  async updatePageLastScraped(pageId) {
    try {
      await this.page_ids_collection.updateOne(
        { page_id: pageId },
        { $set: { last_scraped: new Date(), last_updated: new Date() } }
      );
      return { success: true };
    } catch (error) {
      console.error(`Error updating last_scraped for page ${pageId}:`, error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = PageManager;
