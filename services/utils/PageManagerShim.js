/**
 * CommonJS-compatible shim for the PageManager module
 * This helps bridge ES Module and CommonJS in testing
 */

const PageManager = require('./PageManager.cjs');
module.exports = PageManager;
