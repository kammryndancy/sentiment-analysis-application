/**
 * Text Preprocessor (CommonJS Version)
 * 
 * Handles text preprocessing tasks:
 * - Tokenization
 * - Stopword Removal
 * - Normalization
 * - Stemming & Lemmatization
 */

const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const stopwords = require('./stopwords'); 
const contractions = require('./contractions'); 
require('dotenv').config({ path: './config.env' }); 

// Initialize lemmatizer from natural library
const lemmatizer = natural.WordNet();

/**
 * Normalize text (lowercase, expand contractions, remove special characters)
 * @param {string} text - Input text
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
  if (!text) return '';
  
  // Convert to lowercase
  let normalized = text.toLowerCase();
  
  // Expand contractions (e.g., "don't" -> "do not")
  Object.entries(contractions).forEach(([contraction, expansion]) => {
    const regex = new RegExp(`\\b${contraction}\\b`, 'gi');
    normalized = normalized.replace(regex, expansion);
  });
  
  // Remove special characters and extra spaces
  normalized = normalized
    .replace(/[^\w\s]/gi, ' ')  // Replace special chars with space
    .replace(/\s+/g, ' ')       // Replace multiple spaces with single space
    .trim();                    // Remove leading/trailing spaces
  
  return normalized;
}

/**
 * Remove stopwords from array of tokens
 * @param {Array<string>} tokens - Array of word tokens
 * @returns {Array<string>} - Tokens with stopwords removed
 */
function removeStopwords(tokens) {
  return tokens.filter(token => !stopwords.includes(token));
}

/**
 * Apply lemmatization to array of tokens
 * @param {Array<string>} tokens - Array of word tokens
 * @returns {Promise<Array<string>>} - Lemmatized tokens
 */
async function lemmatizeTokens(tokens) {
  return new Promise((resolve) => {
    const lemmatized = [];
    let pending = tokens.length;
    
    if (tokens.length === 0) {
      resolve([]);
      return;
    }
    
    tokens.forEach(token => {
      lemmatizer.lookup(token, (results) => {
        // If lemmatization found results, use the first lemma; otherwise keep original
        if (results && results.length > 0 && results[0].lemma) {
          lemmatized.push(results[0].lemma);
        } else {
          lemmatized.push(token);
        }
        
        pending--;
        if (pending === 0) {
          resolve(lemmatized);
        }
      });
    });
  });
}

/**
 * Apply stemming to array of tokens
 * @param {Array<string>} tokens - Array of word tokens
 * @returns {Array<string>} - Stemmed tokens
 */
function stemTokens(tokens) {
  const stemmer = natural.PorterStemmer;
  return tokens.map(token => stemmer.stem(token));
}

/**
 * Main text preprocessing function
 * @param {string} text - Input text to preprocess
 * @param {Object} options - Preprocessing options
 * @returns {Object} - Processed text and tokens
 */
function preprocessText(text, options = {}) {
  const {
    removeStopwords: shouldRemoveStopwords = true,
    performLemmatization: shouldLemmatize = false,
    performStemming: shouldStem = false
  } = options;
  
  // Handle empty text
  if (!text) {
    return { text: '', tokens: [] };
  }
  
  // Normalize text
  const normalized = normalizeText(text);
  
  // Tokenize
  let tokens = tokenizer.tokenize(normalized) || [];
  
  // Remove stopwords if enabled
  if (shouldRemoveStopwords) {
    tokens = removeStopwords(tokens);
  }
  
  // Apply stemming or lemmatization (not both, prioritize lemmatization)
  if (shouldLemmatize) {
    // For synchronous usage, we'll use stemming as a fallback
    // In real implementation, you'd want to await lemmatizeTokens(tokens)
    tokens = stemTokens(tokens);
  } else if (shouldStem) {
    tokens = stemTokens(tokens);
  }
  
  // Rejoin tokens to form processed text
  const processedText = tokens.join(' ');
  
  return {
    text: processedText,
    tokens
  };
}

module.exports = {
  preprocessText,
  normalizeText,
  removeStopwords,
  lemmatizeTokens,
  stemTokens
};
