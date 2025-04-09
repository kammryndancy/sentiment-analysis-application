const { NlpManager } = require('node-nlp');

class KeywordManager {
  constructor(db) {
    this.db = db;
    this.keywords_collection = db.collection('keywords');
    this.nlpManager = new NlpManager({ languages: ['en'] });
    this.avonPattern = null;
    
    // Initialize keywords
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
}

module.exports = KeywordManager;
