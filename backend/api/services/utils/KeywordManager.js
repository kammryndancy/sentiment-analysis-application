const { NlpManager } = require('node-nlp');
const fs = require('fs');
const path = require('path');

class KeywordManager {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('keywords');
    this.nlpManager = new NlpManager({ languages: ['en'] });
    this.avonPattern = null;
  }
  
  // Initialize keywords from database or use defaults if none exist
  async initializeKeywords() {
    try {
      // Check if we have keywords in the database
      const keywords = await this.collection.find({}).toArray();
      const keywordsCount = keywords.length;
      
      if (keywordsCount === 0) {
        // Load keywords from JSON file
        const keywordsPath = path.join(__dirname, '..', '..', 'keywords.json');
        const keywordsData = JSON.parse(fs.readFileSync(keywordsPath, 'utf8'));
        
        // Process keywords to ensure proper structure
        const processedKeywords = keywordsData.map(keywordData => {
          const keyword = typeof keywordData === 'object' ? 
            keywordData.keyword : 
            keywordData;
          
          const category = typeof keywordData === 'object' ? 
            keywordData.category || null : 
            null;
          
          const description = typeof keywordData === 'object' ? 
            keywordData.description || null : 
            null;
          
          return {
            keyword: keyword.toLowerCase().trim(),
            category,
            description,
            added_at: new Date(),
            last_updated: new Date(),
            enabled: typeof keywordData.enabled === 'boolean' ? keywordData.enabled : true
          };
        });

        // Insert keywords into database
        await this.collection.insertMany(processedKeywords);
        
        console.log(`Initialized database with ${processedKeywords.length} keywords from keywords.json`);
      }
      
      // Compile regex pattern
      await this.compileKeywordPattern();
      return true;
    } catch (error) {
      console.error('Error initializing keywords:', error);
      return false;
    }
  }
  
  // Compile regex pattern from current keywords
  async compileKeywordPattern() {
    try {
      // Get all enabled keywords from database
      const keywords = await this.getEnabledKeywords();
      
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
      
      const enabled = typeof keywordData === 'object' ? 
        keywordData.enabled || true : true;
      
      // Check if keyword already exists
      const existing = await this.collection.findOne({ 
        keyword: keyword.toLowerCase().trim() 
      });
      
      if (existing) {
        // Update existing keyword with new category and description
        const updateResult = await this.collection.updateOne(
          { keyword: keyword.toLowerCase().trim() },
          {
            $set: {
              category: category,
              description: description,
              enabled: enabled,
              last_updated: new Date()
            }
          }
        );
        
        if (updateResult.modifiedCount === 0) {
          return { 
            success: false, 
            error: 'Failed to update keyword' 
          };
        }
        
        // Recompile the pattern
        await this.compileKeywordPattern();
        
        return {
          success: true,
          message: `Updated keyword: ${keyword}`,
          updated: true,
          keyword: {
            keyword,
            category,
            description,
            enabled,
            last_updated: new Date()
          }
        };
      }
      
      // Prepare document for MongoDB
      const keywordDoc = {
        keyword: keyword.toLowerCase().trim(),
        category,
        description,
        enabled,
        added_at: new Date(),
        last_updated: new Date()
      };
      
      // Insert keyword in MongoDB
      await this.collection.insertOne(keywordDoc);
      
      // Recompile the pattern with the new keyword
      await this.compileKeywordPattern();
      
      return {
        success: true,
        message: `Added new keyword: ${keyword}`,
        updated: false,
        keyword: keywordDoc
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
  
  // Get all enabled keywords from the database
  async getEnabledKeywords() {
    try {
      return await this.collection.find({ enabled: true }).toArray();
    } catch (error) {
      throw new Error(`Error getting enabled keywords: ${error.message}`);
    }
  }
  
  // Import multiple keywords at once
  async importKeywords(keywordsList) {
    try {
      // Validation
      if (!keywordsList || !Array.isArray(keywordsList) || keywordsList.length === 0) {
        return { 
          success: false, 
          error: 'No keywords provided' 
        };
      }

      // Process keywords to ensure proper structure
      const processedKeywords = keywordsList.map(keywordData => {
        const keyword = typeof keywordData === 'object' ? 
          keywordData.keyword : 
          keywordData;

        // Validate keyword exists and is a string
        if (!keyword || typeof keyword !== 'string') {
          throw new Error('Invalid keyword object: keyword field is required and must be a string');
        }

        const category = typeof keywordData === 'object' ? 
          keywordData.category || null : 
          null;

        const description = typeof keywordData === 'object' ? 
          keywordData.description || null : 
          null;

        const enabled = typeof keywordData === 'object' ? 
          keywordData.enabled || true : true;

        return {
          keyword: keyword.toLowerCase().trim(),
          category,
          description,
          enabled,
          added_at: new Date(),
          last_updated: new Date()
        };
      });

      // Check for duplicates and remove them
      const uniqueKeywords = new Map();
      const uniqueProcessedKeywords = processedKeywords.filter(keyword => {
        const lowerCaseKeyword = keyword.keyword.toLowerCase();
        if (!uniqueKeywords.has(lowerCaseKeyword)) {
          uniqueKeywords.set(lowerCaseKeyword, true);
          return true;
        }
        return false;
      });

      // Insert keywords in MongoDB
      const result = await this.collection.insertMany(uniqueProcessedKeywords);

      // Recompile the pattern with the new keywords
      await this.compileKeywordPattern();

      return {
        success: true,
        message: `Imported ${result.insertedCount} unique keywords`,
        imported: result.insertedCount
      };
    } catch (error) {
      throw new Error(`Error importing keywords: ${error.message}`);
    }
  }

  /**
   * Extract all matched keywords from a given text
   * @param {string} text
   * @returns {Promise<string[]>} Array of matched keywords
   */
  async extractMatchedKeywords(text) {
    if (!text) return [];
    // Get all enabled keywords from the DB
    const keywords = await this.getEnabledKeywords();
    const matched = [];
    for (const k of keywords) {
      const kw = k.keyword;
      // Use word boundaries for precise matching, case-insensitive
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) {
        matched.push(kw);
      }
    }
    return matched;
  }
}

module.exports = KeywordManager;
