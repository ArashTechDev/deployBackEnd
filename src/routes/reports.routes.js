// backend/src/routes/reports.routes.js
const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/reports/hours
 * @desc    Generate volunteer hours report
 * @access  Private
 */
router.get('/hours', reportsController.generateHoursReport);

/**
 * @route   GET /api/reports/performance
 * @desc    Generate volunteer performance report
 * @access  Private
 */
router.get('/performance', reportsController.generatePerformanceReport);

/**
 * @route   GET /api/reports/attendance
 * @desc    Generate shift attendance report
 * @access  Private
 */
router.get('/attendance', reportsController.generateAttendanceReport);

/**
 * @route   GET /api/reports/monthly/:year/:month
 * @desc    Generate monthly volunteer report
 * @access  Private
 */
router.get('/monthly/:year/:month', reportsController.generateMonthlyReport);

/**
 * @route   GET /api/reports/dashboard
 * @desc    Get report dashboard data
 * @access  Private
 */
router.get('/dashboard', reportsController.getReportDashboard);

/**
 * @route   GET /api/reports/export/hours/csv
 * @desc    Export volunteer hours report as CSV
 * @access  Private
 */
router.get('/export/hours/csv', reportsController.exportHoursReportCSV);

/**
 * @route   GET /api/reports/export/performance/csv
 * @desc    Export volunteer performance report as CSV
 * @access  Private
 */
router.get('/export/performance/csv', reportsController.exportPerformanceReportCSV);

/**
 * @route   GET /api/reports/export/attendance/csv
 * @desc    Export shift attendance report as CSV
 * @access  Private
 */
router.get('/export/attendance/csv', reportsController.exportAttendanceReportCSV);

module.exports = router;
