const express = require('express');
const router = express.Router();
const dataProcessorController = require('../controllers/dataProcessorController');

// Data processing endpoint
router.post('/process-comments', dataProcessorController.processComments);
router.post('/process-posts', dataProcessorController.processPosts);

// Statistics endpoint
router.get('/stats', dataProcessorController.getStats);

module.exports = router;
