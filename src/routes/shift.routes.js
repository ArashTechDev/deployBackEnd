// backend/src/routes/shift.routes.js
const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shift.controller');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/shifts/foodbank/:foodbank_id
 * @desc    Get all shifts for a food bank
 * @access  Private
 */
router.get('/foodbank/:foodbank_id', shiftController.getShifts);

/**
 * @route   GET /api/shifts/:id
 * @desc    Get a specific shift by ID
 * @access  Private
 */
router.get('/:id', shiftController.getShift);

/**
 * @route   POST /api/shifts
 * @desc    Create a new shift
 * @access  Private
 */
router.post('/', shiftController.createShift);

/**
 * @route   PUT /api/shifts/:id
 * @desc    Update a shift
 * @access  Private
 */
router.put('/:id', shiftController.updateShift);

/**
 * @route   DELETE /api/shifts/:id
 * @desc    Delete a shift
 * @access  Private
 */
router.delete('/:id', shiftController.deleteShift);

/**
 * @route   GET /api/shifts/upcoming/foodbank/:foodbank_id
 * @desc    Get upcoming shifts for a food bank
 * @access  Private
 */
router.get('/upcoming/foodbank/:foodbank_id', shiftController.getUpcomingShifts);

/**
 * @route   GET /api/shifts/available/foodbank/:foodbank_id
 * @desc    Get available shifts (not full) for a food bank
 * @access  Private
 */
router.get('/available/foodbank/:foodbank_id', shiftController.getAvailableShifts);

/**
 * @route   POST /api/shifts/assign-volunteer
 * @desc    Assign a volunteer to a shift
 * @access  Private
 */
router.post('/assign-volunteer', shiftController.assignVolunteer);

/**
 * @route   POST /api/shifts/remove-volunteer
 * @desc    Remove a volunteer from a shift
 * @access  Private
 */
router.post('/remove-volunteer', shiftController.removeVolunteer);

/**
 * @route   GET /api/shifts/stats/foodbank/:foodbank_id
 * @desc    Get shift statistics for a food bank
 * @access  Private
 */
router.get('/stats/foodbank/:foodbank_id', shiftController.getShiftStats);

module.exports = router;
