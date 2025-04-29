const express = require('express');
const router = express.Router();
const keywordController = require('../controllers/keywordController');
const { body, validationResult } = require('express-validator');

// Validation middleware for adding a keyword
const validateAddKeyword = [
  body('keyword').notEmpty().withMessage('Keyword is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

/**
 * @route   GET /api/keywords
 * @desc    Get all keywords with details
 */
router.get('/', keywordController.listKeywords);

/**
 * @route   POST /api/keywords
 * @desc    Add a new keyword
 */
router.post('/', validateAddKeyword, keywordController.addKeyword);

/**
 * @route   DELETE /api/keywords/:keyword
 * @desc    Remove a keyword
 */
router.delete('/:keyword', keywordController.removeKeyword);

/**
 * @route   POST /api/keywords/import
 * @desc    Import keywords from a JSON array
 */
router.post('/import', keywordController.importKeywords);

/**
 * @route   PATCH /api/keywords/:keyword/enabled
 * @desc    Enable or disable a keyword
 */
router.patch('/:keyword/enabled', keywordController.setKeywordEnabled);

module.exports = router;
