/**
 * Data Anonymizer
 * 
 * Handles data anonymization tasks:
 * - Removal of personally identifiable information (PII)
 * - Masking usernames and other sensitive details
 * - Aggregating data where possible
 */

/**
 * Detect and remove email addresses from text
 * @param {string} text - Input text
 * @returns {string} - Text with emails masked
 */
function maskEmails(text) {
  if (!text) return '';
  // Email regex pattern
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  return text.replace(emailRegex, '[EMAIL]');
}

/**
 * Detect and remove phone numbers from text
 * @param {string} text - Input text
 * @returns {string} - Text with phone numbers masked
 */
function maskPhoneNumbers(text) {
  if (!text) return '';
  // Phone number regex patterns (handles various formats)
  const phoneRegex = /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
  return text.replace(phoneRegex, '[PHONE]');
}

/**
 * Detect and remove URLs from text
 * @param {string} text - Input text
 * @returns {string} - Text with URLs masked
 */
function maskUrls(text) {
  if (!text) return '';
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
  return text.replace(urlRegex, '[URL]');
}

/**
 * Mask usernames and user IDs
 * @param {string} text - Input text
 * @returns {string} - Text with usernames masked
 */
function maskUsernames(text) {
  if (!text) return '';
  // Basic username pattern (handles @mentions and common username formats)
  const usernameRegex = /(@[A-Za-z0-9_]+)|(\b[A-Za-z0-9_]+\b(?= user| username))/g;
  return text.replace(usernameRegex, '[USERNAME]');
}

/**
 * Detect and mask numeric IDs that might be identifiers
 * @param {string} text - Input text
 * @returns {string} - Text with numeric IDs masked
 */
function maskNumericIds(text) {
  if (!text) return '';
  // Look for patterns that might be IDs (numbers with 5+ digits or specific prefixes)
  const idRegex = /\b\d{5,}\b|(\b(id|user|account|order)#?\s*\d+\b)/gi;
  return text.replace(idRegex, '[ID]');
}

/**
 * Anonymize Facebook-specific identifiers in a comment object
 * @param {Object} comment - Comment object
 * @returns {Object} - Comment with anonymized identifiers
 */
function anonymizeFacebookIds(comment) {
  const anonymized = { ...comment };
  
  // Replace actual IDs with hashed versions
  if (anonymized.from_id) {
    anonymized.from_id = hashIdentifier(anonymized.from_id);
  }
  
  if (anonymized.from_name) {
    anonymized.from_name = `User_${hashIdentifier(anonymized.from_name).substr(0, 8)}`;
  }
  
  return anonymized;
}

/**
 * Generate a simple hash for an identifier (for consistent anonymization)
 * @param {string} identifier - Identifier to hash
 * @returns {string} - Hashed identifier
 */
function hashIdentifier(identifier) {
  if (!identifier) return '';
  
  // Simple hash function (not cryptographically secure but consistent)
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex string and ensure positive number
  return Math.abs(hash).toString(16);
}

/**
 * Main anonymization function for comment data
 * @param {Object} comment - Comment object to anonymize
 * @param {Object} options - Anonymization options
 * @returns {Object} - Anonymized comment
 */
function anonymizeData(comment, options = {}) {
  const {
    anonymizePII = true,
    anonymizeUsernames = true
  } = options;
  
  // Create a deep copy to avoid modifying the original
  const anonymizedComment = JSON.parse(JSON.stringify(comment));
  
  if (anonymizeUsernames) {
    // Anonymize Facebook-specific identifiers
    Object.assign(anonymizedComment, anonymizeFacebookIds(anonymizedComment));
  }
  
  if (anonymizePII && anonymizedComment.message) {
    // Apply all PII masking functions to the message
    let processedMessage = anonymizedComment.message;
    processedMessage = maskEmails(processedMessage);
    processedMessage = maskPhoneNumbers(processedMessage);
    processedMessage = maskUrls(processedMessage);
    processedMessage = maskNumericIds(processedMessage);
    
    if (anonymizeUsernames) {
      processedMessage = maskUsernames(processedMessage);
    }
    
    // Update the message with anonymized content
    anonymizedComment.message = processedMessage;
  }
  
  return anonymizedComment;
}

module.exports = {
  anonymizeData,
  maskEmails,
  maskPhoneNumbers,
  maskUrls,
  maskUsernames,
  maskNumericIds,
  anonymizeFacebookIds
};
require('dotenv/config');
