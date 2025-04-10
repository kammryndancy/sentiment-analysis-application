/**
 * CommonJS-compatible shim for the FacebookScraper
 * This helps bridge ES Module and CommonJS in testing
 */

const FacebookScraper = require('./facebookScraper.cjs');
module.exports = FacebookScraper;
