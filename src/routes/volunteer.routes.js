// backend/src/routes/volunteer.routes.js
const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteer.controller');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/volunteers/foodbank/:foodbank_id
 * @desc    Get all volunteers for a food bank
 * @access  Private
 */
router.get('/foodbank/:foodbank_id', volunteerController.getVolunteers);

/**
 * @route   GET /api/volunteers/:id
 * @desc    Get a specific volunteer by ID
 * @access  Private
 */
router.get('/:id', volunteerController.getVolunteer);

/**
 * @route   POST /api/volunteers
 * @desc    Create a new volunteer
 * @access  Private
 */
router.post('/', volunteerController.createVolunteer);

/**
 * @route   PUT /api/volunteers/:id
 * @desc    Update a volunteer
 * @access  Private
 */
router.put('/:id', volunteerController.updateVolunteer);

/**
 * @route   DELETE /api/volunteers/:id
 * @desc    Delete a volunteer
 * @access  Private
 */
router.delete('/:id', volunteerController.deleteVolunteer);

/**
 * @route   PATCH /api/volunteers/:id/status
 * @desc    Update volunteer status
 * @access  Private
 */
router.patch('/:id/status', volunteerController.updateVolunteerStatus);

/**
 * @route   GET /api/volunteers/available
 * @desc    Get volunteers available for a specific shift
 * @access  Private
 */
router.get('/available', volunteerController.getAvailableVolunteers);

/**
 * @route   GET /api/volunteers/stats/foodbank/:foodbank_id
 * @desc    Get volunteer statistics for a food bank
 * @access  Private
 */
router.get('/stats/foodbank/:foodbank_id', volunteerController.getVolunteerStats);

module.exports = router;
