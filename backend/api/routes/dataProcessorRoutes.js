const express = require('express');
const router = express.Router();
const dataProcessorController = require('../controllers/dataProcessorController');
const searchCommentsController = require('../controllers/searchCommentsController');

// Data processing endpoint
router.post('/process-comments', dataProcessorController.processComments);
router.post('/process-posts', dataProcessorController.processPosts);

// Statistics endpoint
router.get('/stats', dataProcessorController.getStats);

// Extremes endpoint
router.get('/processed-comments/extremes', dataProcessorController.getProcessedCommentExtremes);

// Word cloud endpoint
router.get('/posts/wordcloud', dataProcessorController.getProcessedPostsWordCloud);

// Search comments endpoint
router.get('/search-comments', searchCommentsController.searchComments);

module.exports = router;
