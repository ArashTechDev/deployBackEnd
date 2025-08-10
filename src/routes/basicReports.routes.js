// backend/src/routes/basicReports.routes.js
const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/basicReports.controller');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');

// All report routes require authentication
router.use(authMiddleware);

// Dashboard data (accessible to all authenticated users)
router.get('/dashboard', reportsController.getDashboardData);

// Detailed reports (admin and staff only)
router.get('/inventory', requireRole('admin', 'staff'), reportsController.getInventoryReport);
router.get('/requests', requireRole('admin', 'staff'), reportsController.getRequestReport);
router.get('/donations', requireRole('admin', 'staff'), reportsController.getDonationReport);
router.get('/users', requireRole('admin'), reportsController.getUserReport);

// Export functionality (admin and staff only)
router.get('/export', requireRole('admin', 'staff'), reportsController.exportReport);

module.exports = router;
