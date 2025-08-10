// backend/src/routes/dietaryPreferences.routes.js
const express = require('express');
const router = express.Router();
const dietaryPreferencesController = require('../controllers/dietaryPreferences.controller');

// For now, we'll create a simple auth middleware placeholder
// You can replace this with your actual auth middleware later
const authMiddleware = (req, res, next) => {
  // Simple placeholder - in a real app you'd verify JWT tokens
  // For testing, we'll just set a fake user
  req.user = {
    id: '507f1f77bcf86cd799439011', // Fake ObjectId for testing
    role: 'recipient',
  };
  next();
};

// User routes for dietary preferences
router.get('/', authMiddleware, dietaryPreferencesController.getUserPreferences);
router.put('/', authMiddleware, dietaryPreferencesController.updateUserPreferences);
router.get('/restrictions', authMiddleware, dietaryPreferencesController.getAvailableRestrictions);
router.post('/test-matching', authMiddleware, dietaryPreferencesController.testDietaryMatching);

module.exports = router;
