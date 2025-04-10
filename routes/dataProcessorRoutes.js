const express = require('express');
const router = express.Router();
const dataProcessorController = require('../controllers/dataProcessorController');

// Data processing endpoint
router.post('/process', dataProcessorController.processComments);

// Statistics endpoint
router.get('/stats', dataProcessorController.getStats);

module.exports = router;
