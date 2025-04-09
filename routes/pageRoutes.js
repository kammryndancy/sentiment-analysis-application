const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { body, validationResult } = require('express-validator');

// Validation middleware for adding a page
const validateAddPage = [
  body('pageId').notEmpty().withMessage('Page ID is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

/**
 * @route   GET /api/pages
 * @desc    Get all page IDs with details
 */
router.get('/', pageController.listPages);

/**
 * @route   POST /api/pages
 * @desc    Add a new page ID
 */
router.post('/', validateAddPage, pageController.addPage);

/**
 * @route   DELETE /api/pages/:pageId
 * @desc    Remove a page ID
 */
router.delete('/:pageId', pageController.removePage);

/**
 * @route   POST /api/pages/import
 * @desc    Import page IDs from a JSON array
 */
router.post('/import', pageController.importPages);

module.exports = router;
