// backend/src/routes/foodRequest.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const foodRequestController = require('../controllers/foodRequest.controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleAuth');

// All routes require authentication
router.use(authMiddleware);

// Validation rules
const createRequestValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.item_name').trim().isLength({ min: 1 }).withMessage('Item name is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('preferredPickupDate').isISO8601().withMessage('Valid pickup date is required'),
  body('preferredPickupTime').trim().isLength({ min: 1 }).withMessage('Pickup time is required'),
];

const updateStatusValidation = [
  body('status')
    .isIn(['Pending', 'Approved', 'Ready', 'Fulfilled', 'Cancelled'])
    .withMessage('Invalid status'),
];

// Routes

// POST /api/food-requests - Create a new food request (recipients only)
router.post(
  '/',
  requireRole('recipient'),
  createRequestValidation,
  foodRequestController.createRequest
);

// GET /api/food-requests/my-requests - Get current user's requests (recipients only)
router.get('/my-requests', requireRole('recipient'), foodRequestController.getUserRequests);

// GET /api/food-requests - Get all requests (admin/staff only)
router.get('/', requireRole('admin', 'staff'), foodRequestController.getAllRequests);

// GET /api/food-requests/stats - Get request statistics
router.get('/stats', requireRole('admin', 'staff'), foodRequestController.getRequestStats);

// GET /api/food-requests/:id - Get specific request
router.get('/:id', foodRequestController.getRequestById);

// PUT /api/food-requests/:id/status - Update request status (admin/staff only)
router.put(
  '/:id/status',
  requireRole('admin', 'staff'),
  updateStatusValidation,
  foodRequestController.updateRequestStatus
);

module.exports = router;
