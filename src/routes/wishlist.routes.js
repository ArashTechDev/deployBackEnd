// backend/src/routes/wishlist.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const wishlistController = require('../controllers/wishlist.controller');
const authMiddleware = require('../middleware/auth');

// All wishlist routes require authentication
router.use(authMiddleware);

// Validation rules
const createWishlistValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Wishlist name is required and must be less than 100 characters'),
];

// Routes
router.get('/', wishlistController.getWishlists);
router.post('/', createWishlistValidation, wishlistController.createWishlist);
router.post('/:wishlistId/load-to-cart', wishlistController.loadToCart);
router.delete('/:wishlistId', wishlistController.deleteWishlist);

module.exports = router;
