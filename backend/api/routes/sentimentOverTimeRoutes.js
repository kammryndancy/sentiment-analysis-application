const express = require('express');
const router = express.Router();
const sentimentOverTimeController = require('../controllers/sentimentOverTimeController');

/**
 * @route   GET /api/sentiment-over-time
 * @desc    Get sentiment over time for a keyword or pageId within a date range
 * @query   keyword, pageId, startDate, endDate
 */
router.get('/', sentimentOverTimeController.getSentimentOverTime);

module.exports = router;
