/**
 * CommonJS-compatible shim for the Anonymizer module
 * This helps bridge ES Module and CommonJS in testing
 */

const { anonymizeData } = require('./anonymizer');
module.exports = { anonymizeData };
