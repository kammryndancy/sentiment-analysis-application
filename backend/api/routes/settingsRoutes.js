const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const adminMiddleware = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/facebook-credentials', adminMiddleware, settingsController.getFacebookCredentials);
router.post('/facebook-credentials', adminMiddleware, settingsController.saveFacebookCredentials);

router.get('/google-nlp-key-status', authMiddleware, settingsController.getGoogleCloudNLPKeyStatus);
router.post('/google-nlp-key', adminMiddleware, settingsController.saveGoogleCloudNLPKey);

// These routes should be visible to both admin and user roles
router.get('/huggingface-key-status', authMiddleware, settingsController.getHuggingFaceKeyStatus);
router.get('/huggingface-models', authMiddleware, settingsController.getHuggingFaceModels);
router.get('/huggingface-selection', authMiddleware, settingsController.getHuggingFaceSelection);

router.post('/huggingface-key', adminMiddleware, settingsController.saveHuggingFaceKeyAndModel);

module.exports = router;
