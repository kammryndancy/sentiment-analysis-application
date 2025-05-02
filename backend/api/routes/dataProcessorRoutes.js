const express = require('express');
const router = express.Router();
const dataProcessorController = require('../controllers/dataProcessorController');

// Data processing endpoint
router.post('/process-comments', dataProcessorController.processComments);
router.post('/process-posts', dataProcessorController.processPosts);

// Statistics endpoint
router.get('/stats', dataProcessorController.getStats);

// Extremes endpoint
router.get('/processed-comments/extremes', dataProcessorController.getProcessedCommentExtremes);

// Word cloud endpoint
router.get('/posts/wordcloud', dataProcessorController.getProcessedPostsWordCloud);

module.exports = router;
