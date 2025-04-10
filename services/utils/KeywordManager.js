const { NlpManager } = require('node-nlp');

class KeywordManager {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('keywords');
    this.nlpManager = new NlpManager({ languages: ['en'] });
    this.avonPattern = null;
    
    // Initialize keywords asynchronously
    this.compileKeywordPattern();
  }
  
  // Initialize keywords from database or use defaults if none exist
  async initializeKeywords() {
    try {
      // Check if we have keywords in the database
      const keywords = await this.collection.find({}).toArray();
      const keywordsCount = keywords.length;
      
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
      const keywords = await this.getAllKeywords();
      
      if (!keywords || keywords.length === 0) {
        // Fallback to a basic pattern if no keywords are found
        this.avonPattern = new RegExp('\\bavon\\b', 'i');
      } else {
        // Compile regex pattern for faster matching
        this.avonPattern = new RegExp('\\b(' + keywords.map(k => k.keyword).join('|') + ')\\b', 'i');
      }
    } catch (error) {
      console.error('Error compiling keyword pattern:', error);
      // Fallback to a basic pattern
      this.avonPattern = new RegExp('\\bavon\\b', 'i');
    }
  }
  
  // Check if the text contains Avon-related keywords
  async isAvonRelated(text) {
    if (!text) {
      return false;
    }
    
    if (!this.avonPattern) {
      await this.compileKeywordPattern();
    }
    
    return this.avonPattern.test(text);
  }
  
  // Add a keyword to the database
  async addKeyword(keywordData) {
    try {
      // Validation
      if (!keywordData || (!keywordData.keyword && typeof keywordData !== 'string')) {
        return { 
          success: false, 
          error: 'Keyword is required' 
        };
      }
      
      const keyword = typeof keywordData === 'string' ? 
        keywordData : keywordData.keyword;
      
      const category = typeof keywordData === 'object' ? 
        keywordData.category || null : null;
      
      const description = typeof keywordData === 'object' ? 
        keywordData.description || null : null;
      
      // Check if keyword already exists
      const existing = await this.collection.findOne({ 
        keyword: keyword.toLowerCase().trim() 
      });
      
      if (existing) {
        return { 
          success: false, 
          error: 'Keyword already exists' 
        };
      }
      
      // Prepare document for MongoDB
      const keywordDoc = {
        keyword: keyword.toLowerCase().trim(),
        category,
        description,
        added_at: new Date(),
        last_updated: new Date()
      };
      
      // Insert keyword in MongoDB
      await this.collection.insertOne(keywordDoc);
      
      // Recompile the pattern with the new keyword
      await this.compileKeywordPattern();
      
      return {
        success: true,
        message: `Added new keyword: ${keywordDoc.keyword}`
      };
    } catch (error) {
      throw new Error(`Error adding keyword: ${error.message}`);
    }
  }
  
  // Remove a keyword from the database
  async removeKeyword(keyword) {
    try {
      // Validation
      if (!keyword) {
        return { 
          success: false, 
          error: 'Keyword is required' 
        };
      }
      
      const result = await this.collection.deleteOne({ 
        keyword: keyword.toLowerCase().trim() 
      });
      
      if (result.deletedCount === 0) {
        return { 
          success: false, 
          error: 'Keyword not found' 
        };
      }
      
      // Recompile the pattern without the removed keyword
      await this.compileKeywordPattern();
      
      return { 
        success: true, 
        message: `Removed keyword: ${keyword}` 
      };
    } catch (error) {
      throw new Error(`Error removing keyword: ${error.message}`);
    }
  }
  
  // Get all keywords from the database
  async getAllKeywords() {
    try {
      return await this.collection.find({}).toArray();
    } catch (error) {
      throw new Error(`Error getting keywords: ${error.message}`);
    }
  }
  
  // Import a list of keywords to the database
  async importKeywords(keywordsList) {
    try {
      // Validation
      if (!keywordsList || !Array.isArray(keywordsList) || keywordsList.length === 0) {
        return { 
          success: false, 
          error: 'No keywords provided' 
        };
      }
      
      // Check that all items have keyword field
      for (const item of keywordsList) {
        if (typeof item === 'object' && !item.keyword) {
          return { 
            success: false, 
            error: 'All keywords must have a keyword field' 
          };
        }
      }
      
      await this.collection.insertMany(keywordsList);
      
      // Recompile the pattern
      await this.compileKeywordPattern();
      
      return {
        success: true,
        message: `Imported ${keywordsList.length} keywords successfully.`
      };
    } catch (error) {
      throw new Error(`Error importing keywords: ${error.message}`);
    }
  }
}

module.exports = KeywordManager;
