/**
 * CommonJS-compatible shim for the DataProcessorManager module
 * This helps bridge ES Module and CommonJS in testing
 */

const DataProcessor = require('./dataProcessorManager.test.cjs');
module.exports = DataProcessor;
