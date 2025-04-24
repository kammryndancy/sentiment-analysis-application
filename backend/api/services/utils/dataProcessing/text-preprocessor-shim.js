/**
 * CommonJS-compatible shim for the text-preprocessor module
 * This helps bridge ES Module and CommonJS in testing
 */

const textPreprocessor = require('./text-preprocessor.cjs');
module.exports = textPreprocessor;
