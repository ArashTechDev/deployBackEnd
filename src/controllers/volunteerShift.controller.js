// backend/src/controllers/volunteerShift.controller.js
const VolunteerShift = require('../db/models/VolunteerShift');
const Volunteer = require('../db/models/Volunteer');
const Shift = require('../db/models/Shift');
const mongoose = require('mongoose');

/**
 * Get volunteer shifts
 */
exports.getVolunteerShifts = async (req, res) => {
  try {
    const { volunteer_id, start_date, end_date, status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (volunteer_id) filter.volunteer_id = volunteer_id;
    if (status) filter.status = status;
    
    // Date range filter
    if (start_date && end_date) {
      filter.work_date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    } else if (start_date) {
      filter.work_date = { $gte: new Date(start_date) };
    } else if (end_date) {
      filter.work_date = { $lte: new Date(end_date) };
    }
    
    const volunteerShifts = await VolunteerShift.find(filter)
      .populate({
        path: 'volunteer_id',
        populate: { path: 'user_id', select: 'name email' }
      })
      .populate('shift_id', 'title start_time end_time location activity_category')
      .populate('verified_by', 'name')
      .sort({ work_date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await VolunteerShift.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        volunteer_shifts: volunteerShifts,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit
        }
      }
    });
  } catch (error) {
    console.error('Error fetching volunteer shifts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch volunteer shifts',
      error: error.message
    });
  }
};

/**
 * Get specific volunteer shift
 */
exports.getVolunteerShift = async (req, res) => {
  try {
    const { id } = req.params;
    
    const volunteerShift = await VolunteerShift.findById(id)
      .populate({
        path: 'volunteer_id',
        populate: { path: 'user_id', select: 'name email' }
      })
      .populate('shift_id')
      .populate('verified_by', 'name')
      .populate('cancelled_by', 'name');
    
    if (!volunteerShift) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer shift not found'
      });
    }
    
    res.json({
      success: true,
      data: volunteerShift
    });
  } catch (error) {
    console.error('Error fetching volunteer shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch volunteer shift',
      error: error.message
    });
  }
};

/**
 * Check in volunteer
 */
exports.checkInVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const { check_in_time } = req.body;
    
    const volunteerShift = await VolunteerShift.findById(id);
    if (!volunteerShift) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer shift not found'
      });
    }
    
    await volunteerShift.checkIn(check_in_time);
    
    res.json({
      success: true,
      data: volunteerShift,
      message: 'Volunteer checked in successfully'
    });
  } catch (error) {
    console.error('Error checking in volunteer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in volunteer',
      error: error.message
    });
  }
};

/**
 * Check out volunteer
 */
exports.checkOutVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const { check_out_time, break_duration, activities_performed } = req.body;
    
    const volunteerShift = await VolunteerShift.findById(id);
    if (!volunteerShift) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer shift not found'
      });
    }
    
    await volunteerShift.checkOut(check_out_time);
    
    // Update additional fields if provided
    if (break_duration !== undefined) {
      volunteerShift.break_duration = break_duration;
    }
    if (activities_performed) {
      volunteerShift.activities_performed = activities_performed;
    }
    
    await volunteerShift.save();
    
    res.json({
      success: true,
      data: volunteerShift,
      message: 'Volunteer checked out successfully'
    });
  } catch (error) {
    console.error('Error checking out volunteer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check out volunteer',
      error: error.message
    });
  }
};

/**
 * Complete volunteer shift
 */
exports.completeShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { coordinator_feedback, performance_rating, hours_worked } = req.body;
    
    const volunteerShift = await VolunteerShift.findById(id);
    if (!volunteerShift) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer shift not found'
      });
    }
    
    // Update hours if provided
    if (hours_worked !== undefined) {
      volunteerShift.hours_worked = hours_worked;
    }
    
    await volunteerShift.complete({
      coordinator_feedback,
      performance_rating
    });
    
    res.json({
      success: true,
      data: volunteerShift,
      message: 'Volunteer shift completed successfully'
    });
  } catch (error) {
    console.error('Error completing shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete shift',
      error: error.message
    });
  }
};

/**
 * Cancel volunteer shift
 */
exports.cancelShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelled_reason } = req.body;
    
    const volunteerShift = await VolunteerShift.findById(id);
    if (!volunteerShift) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer shift not found'
      });
    }
    
    await volunteerShift.cancel(cancelled_reason, req.user.id);
    
    res.json({
      success: true,
      data: volunteerShift,
      message: 'Volunteer shift cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel shift',
      error: error.message
    });
  }
};

/**
 * Mark volunteer as no-show
 */
exports.markNoShow = async (req, res) => {
  try {
    const { id } = req.params;
    const { no_show_reason } = req.body;
    
    const volunteerShift = await VolunteerShift.findById(id);
    if (!volunteerShift) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer shift not found'
      });
    }
    
    await volunteerShift.markNoShow(no_show_reason);
    
    res.json({
      success: true,
      data: volunteerShift,
      message: 'Volunteer marked as no-show'
    });
  } catch (error) {
    console.error('Error marking no-show:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark no-show',
      error: error.message
    });
  }
};

/**
 * Verify volunteer shift
 */
exports.verifyShift = async (req, res) => {
  try {
    const { id } = req.params;
    
    const volunteerShift = await VolunteerShift.findById(id);
    if (!volunteerShift) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer shift not found'
      });
    }
    
    await volunteerShift.verify(req.user.id);
    
    res.json({
      success: true,
      data: volunteerShift,
      message: 'Volunteer shift verified successfully'
    });
  } catch (error) {
    console.error('Error verifying shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify shift',
      error: error.message
    });
  }
};

/**
 * Update volunteer shift feedback
 */
exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { volunteer_feedback, coordinator_feedback, improvements } = req.body;
    
    const volunteerShift = await VolunteerShift.findById(id);
    if (!volunteerShift) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer shift not found'
      });
    }
    
    if (volunteer_feedback !== undefined) {
      volunteerShift.feedback.volunteer_feedback = volunteer_feedback;
    }
    if (coordinator_feedback !== undefined) {
      volunteerShift.feedback.coordinator_feedback = coordinator_feedback;
    }
    if (improvements !== undefined) {
      volunteerShift.feedback.improvements = improvements;
    }
    
    await volunteerShift.save();
    
    res.json({
      success: true,
      data: volunteerShift,
      message: 'Feedback updated successfully'
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback',
      error: error.message
    });
  }
};

/**
 * Get volunteer shift statistics
 */
exports.getShiftStats = async (req, res) => {
  try {
    const { volunteer_id, foodbank_id, start_date, end_date } = req.query;
    
    const filter = {};
    if (volunteer_id) filter.volunteer_id = new mongoose.Types.ObjectId(volunteer_id);
    if (foodbank_id) filter.foodbank_id = new mongoose.Types.ObjectId(foodbank_id);
    
    // Date range filter
    if (start_date && end_date) {
      filter.work_date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }
    
    const stats = await VolunteerShift.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_shifts: { $sum: 1 },
          completed_shifts: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled_shifts: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          no_show_shifts: {
            $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] }
          },
          total_hours: { $sum: '$hours_worked' },
          verified_shifts: {
            $sum: { $cond: ['$verified', 1, 0] }
          },
          avg_performance_rating: {
            $avg: '$performance_rating'
          }
        }
      }
    ]);
    
    const statusBreakdown = await VolunteerShift.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total_hours: { $sum: '$hours_worked' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total_shifts: 0,
          completed_shifts: 0,
          cancelled_shifts: 0,
          no_show_shifts: 0,
          total_hours: 0,
          verified_shifts: 0,
          avg_performance_rating: 0
        },
        status_breakdown: statusBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching shift stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift statistics',
      error: error.message
    });
  }
};
