/**
 * Text Preprocessor
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
 * @param {string} text - Input text to normalize
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
  if (!text) return '';
  
  // Convert to lowercase
  let normalized = text.toLowerCase();
  
  // Expand contractions (e.g., "don't" -> "do not")
  Object.keys(contractions).forEach(contraction => {
    normalized = normalized.replace(
      new RegExp('\\b' + contraction + '\\b', 'gi'),
      contractions[contraction]
    );
  });
  
  // Remove special characters and extra whitespace
  normalized = normalized
    .replace(/[^\w\s]/g, ' ')  // Replace special chars with space
    .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
    .trim();                    // Trim whitespace from ends
  
  return normalized;
}

/**
 * Remove stopwords from tokens
 * @param {string[]} tokens - Array of tokens
 * @returns {string[]} - Tokens with stopwords removed
 */
function removeStopwords(tokens) {
  return tokens.filter(token => !stopwords.includes(token));
}

/**
 * Apply lemmatization to tokens (reduce to root form)
 * @param {string[]} tokens - Array of tokens
 * @returns {Promise<string[]>} - Lemmatized tokens
 */
async function lemmatizeTokens(tokens) {
  const lemmatizedTokens = [];
  
  for (const token of tokens) {
    try {
      // Using a simple promise wrapper around the callback-based lemmatizer
      const lemma = await new Promise((resolve) => {
        lemmatizer.lookup(token, (results) => {
          if (results && results.length > 0) {
            resolve(results[0].lemma);
          } else {
            resolve(token); // If no lemma found, use original token
          }
        });
      });
      
      lemmatizedTokens.push(lemma);
    } catch (error) {
      // If error occurs, use original token
      lemmatizedTokens.push(token);
    }
  }
  
  return lemmatizedTokens;
}

/**
 * Stemming function using Porter Stemmer
 * @param {string[]} tokens - Array of tokens
 * @returns {string[]} - Stemmed tokens
 */
function stemTokens(tokens) {
  return tokens.map(token => natural.PorterStemmer.stem(token));
}

/**
 * Preprocess text by applying various text preprocessing techniques
 * @param {string} text - Input text to preprocess
 * @param {Object} options - Preprocessing options
 * @returns {Object} - Processed text and tokens
 */
async function preprocessText(text, options = {}) {
  const {
    removeStopwords: shouldRemoveStopwords = true,
    performLemmatization: shouldLemmatize = true,
    performStemming: shouldStem = false  // Default to lemmatization over stemming
  } = options;
  
  // Normalize text
  const normalizedText = normalizeText(text);
  
  // Tokenize text
  let tokens = tokenizer.tokenize(normalizedText);
  
  // Remove stopwords if enabled
  if (shouldRemoveStopwords) {
    tokens = removeStopwords(tokens);
  }
  
  // Apply lemmatization or stemming
  if (shouldLemmatize) {
    tokens = await lemmatizeTokens(tokens);
  } else if (shouldStem) {
    tokens = stemTokens(tokens);
  }
  
  // Rejoin tokens to form processed text
  const processedText = tokens.join(' ');
  
  return {
    original: text,
    normalized: normalizedText,
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
