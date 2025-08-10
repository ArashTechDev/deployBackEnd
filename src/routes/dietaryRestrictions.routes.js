// backend/src/routes/dietaryRestrictions.routes.js
const express = require('express');
const router = express.Router();
const dietaryRestrictionsController = require('../controllers/dietaryRestrictions.controller');

// Simple auth and role check middleware placeholders
const authMiddleware = (req, res, next) => {
  // Simple placeholder - replace with your actual auth middleware
  req.user = {
    id: '507f1f77bcf86cd799439011', // Fake ObjectId for testing
    role: 'admin', // Set as admin for testing admin endpoints
  };
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
};

// Admin routes for managing dietary restrictions
router.post('/', authMiddleware, adminOnly, dietaryRestrictionsController.createRestriction);
router.get('/', authMiddleware, adminOnly, dietaryRestrictionsController.getAllRestrictions);
router.put('/:id', authMiddleware, adminOnly, dietaryRestrictionsController.updateRestriction);
router.delete('/:id', authMiddleware, adminOnly, dietaryRestrictionsController.deleteRestriction);

module.exports = router;
