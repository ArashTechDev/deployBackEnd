// backend/src/routes/cart.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const cartController = require('../controllers/cart.controller');
const authMiddleware = require('../middleware/auth');

// All cart routes require authentication
router.use(authMiddleware);

// Validation rules
const addToCartValidation = [
  body('inventory_id').isMongoId().withMessage('Valid inventory ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
];

const updateCartValidation = [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
];

const saveWishlistValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Wishlist name is required and must be less than 100 characters'),
];

// Routes
router.get('/', cartController.getCart);
router.post('/add', addToCartValidation, cartController.addToCart);
router.put('/items/:itemId', updateCartValidation, cartController.updateCartItem);
router.delete('/items/:itemId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);
router.post('/save-wishlist', saveWishlistValidation, cartController.saveAsWishlist);

module.exports = router;
