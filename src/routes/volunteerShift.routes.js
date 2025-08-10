// backend/src/routes/volunteerShift.routes.js
const express = require('express');
const router = express.Router();
const volunteerShiftController = require('../controllers/volunteerShift.controller');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/volunteer-shifts
 * @desc    Get volunteer shifts with optional filters
 * @access  Private
 */
router.get('/', volunteerShiftController.getVolunteerShifts);

/**
 * @route   GET /api/volunteer-shifts/:id
 * @desc    Get a specific volunteer shift by ID
 * @access  Private
 */
router.get('/:id', volunteerShiftController.getVolunteerShift);

/**
 * @route   POST /api/volunteer-shifts/:id/check-in
 * @desc    Check in a volunteer for their shift
 * @access  Private
 */
router.post('/:id/check-in', volunteerShiftController.checkInVolunteer);

/**
 * @route   POST /api/volunteer-shifts/:id/check-out
 * @desc    Check out a volunteer from their shift
 * @access  Private
 */
router.post('/:id/check-out', volunteerShiftController.checkOutVolunteer);

/**
 * @route   POST /api/volunteer-shifts/:id/complete
 * @desc    Complete a volunteer shift
 * @access  Private
 */
router.post('/:id/complete', volunteerShiftController.completeShift);

/**
 * @route   POST /api/volunteer-shifts/:id/cancel
 * @desc    Cancel a volunteer shift
 * @access  Private
 */
router.post('/:id/cancel', volunteerShiftController.cancelShift);

/**
 * @route   POST /api/volunteer-shifts/:id/no-show
 * @desc    Mark a volunteer as no-show for their shift
 * @access  Private
 */
router.post('/:id/no-show', volunteerShiftController.markNoShow);

/**
 * @route   POST /api/volunteer-shifts/:id/verify
 * @desc    Verify a volunteer shift
 * @access  Private
 */
router.post('/:id/verify', volunteerShiftController.verifyShift);

/**
 * @route   PUT /api/volunteer-shifts/:id/feedback
 * @desc    Update feedback for a volunteer shift
 * @access  Private
 */
router.put('/:id/feedback', volunteerShiftController.updateFeedback);

/**
 * @route   GET /api/volunteer-shifts/stats
 * @desc    Get volunteer shift statistics
 * @access  Private
 */
router.get('/stats', volunteerShiftController.getShiftStats);

module.exports = router;
