const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { body, validationResult } = require('express-validator');

// Validation middleware for adding a page
const validateAddPage = [
  body('page_id').notEmpty().withMessage('Page ID is required'),
  body('name').notEmpty().withMessage('Page name is required'),
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
 * @route   DELETE /api/pages/:page_id
 * @desc    Remove a page ID
 */
router.delete('/:page_id', pageController.removePage);

/**
 * @route   POST /api/pages/import
 * @desc    Import page IDs from a JSON array
 */
router.post('/import', pageController.importPages);

/**
 * @route   PATCH /api/pages/:page_id/enabled
 * @desc    Enable or disable a page ID
 */
router.patch('/:page_id/enabled', pageController.setPageEnabled);

module.exports = router;
