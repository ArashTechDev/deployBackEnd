// backend/src/controllers/shift.controller.js
const Shift = require('../db/models/Shift');
const Volunteer = require('../db/models/Volunteer');
const VolunteerShift = require('../db/models/VolunteerShift');
const mongoose = require('mongoose');

/**
 * Get all shifts for a food bank
 */
exports.getShifts = async (req, res) => {
  try {
    const { foodbank_id } = req.params;
    const { 
      status, 
      activity_category, 
      start_date, 
      end_date, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const filter = { foodbank_id };
    if (status) filter.status = status;
    if (activity_category) filter.activity_category = activity_category;
    
    // Date range filter
    if (start_date && end_date) {
      filter.shift_date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    } else if (start_date) {
      filter.shift_date = { $gte: new Date(start_date) };
    } else if (end_date) {
      filter.shift_date = { $lte: new Date(end_date) };
    }
    
    const shifts = await Shift.find(filter)
      .populate('coordinator_id', 'name email')
      .populate('created_by', 'name')
      .sort({ shift_date: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Shift.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        shifts,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit
        }
      }
    });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shifts',
      error: error.message
    });
  }
};

/**
 * Get a specific shift by ID
 */
exports.getShift = async (req, res) => {
  try {
    const { id } = req.params;
    
    const shift = await Shift.findById(id)
      .populate('coordinator_id', 'name email')
      .populate('created_by', 'name');
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }
    
    // Get assigned volunteers for this shift
    const volunteerShifts = await VolunteerShift.find({ shift_id: id })
      .populate({
        path: 'volunteer_id',
        populate: { path: 'user_id', select: 'name email' }
      })
      .populate('user_id', 'name email');
    
    res.json({
      success: true,
      data: {
        shift,
        assigned_volunteers: volunteerShifts
      }
    });
  } catch (error) {
    console.error('Error fetching shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift',
      error: error.message
    });
  }
};

/**
 * Create a new shift
 */
exports.createShift = async (req, res) => {
  try {
    const shiftData = {
      ...req.body,
      created_by: req.user.id
    };
    
    const shift = await Shift.create(shiftData);
    await shift.populate('coordinator_id', 'name email');
    
    res.status(201).json({
      success: true,
      data: shift,
      message: 'Shift created successfully'
    });
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create shift',
      error: error.message
    });
  }
};

/**
 * Update a shift
 */
exports.updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updates.shift_id;
    delete updates.current_volunteers;
    delete updates.created_by;
    
    const shift = await Shift.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('coordinator_id', 'name email');
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }
    
    res.json({
      success: true,
      data: shift,
      message: 'Shift updated successfully'
    });
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shift',
      error: error.message
    });
  }
};

/**
 * Delete a shift
 */
exports.deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if shift has assigned volunteers
    const assignedVolunteers = await VolunteerShift.countDocuments({ 
      shift_id: id, 
      status: { $in: ['assigned', 'confirmed', 'checked_in'] }
    });
    
    if (assignedVolunteers > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete shift with assigned volunteers'
      });
    }
    
    const shift = await Shift.findByIdAndDelete(id);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }
    
    // Delete any volunteer shift assignments
    await VolunteerShift.deleteMany({ shift_id: id });
    
    res.json({
      success: true,
      message: 'Shift deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shift',
      error: error.message
    });
  }
};

/**
 * Get upcoming shifts
 */
exports.getUpcomingShifts = async (req, res) => {
  try {
    const { foodbank_id } = req.params;
    const { days = 7 } = req.query;
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days));
    
    const shifts = await Shift.find({
      foodbank_id,
      shift_date: { $gte: new Date(), $lte: endDate },
      status: 'published'
    })
      .populate('coordinator_id', 'name email')
      .sort({ shift_date: 1 });
    
    res.json({
      success: true,
      data: shifts
    });
  } catch (error) {
    console.error('Error fetching upcoming shifts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming shifts',
      error: error.message
    });
  }
};

/**
 * Get available shifts (not full)
 */
exports.getAvailableShifts = async (req, res) => {
  try {
    const { foodbank_id } = req.params;
    
    const shifts = await Shift.findAvailableShifts(foodbank_id)
      .populate('coordinator_id', 'name email');
    
    res.json({
      success: true,
      data: shifts
    });
  } catch (error) {
    console.error('Error fetching available shifts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available shifts',
      error: error.message
    });
  }
};

/**
 * Assign volunteer to a shift
 */
exports.assignVolunteer = async (req, res) => {
  try {
    const { shift_id, volunteer_id } = req.body;
    
    const shift = await Shift.findById(shift_id);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }
    
    const volunteer = await Volunteer.findById(volunteer_id).populate('user_id');
    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }
    
    // Check if volunteer can be assigned to this shift
    if (!shift.canAssignVolunteer(volunteer)) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer cannot be assigned to this shift'
      });
    }
    
    // Check if volunteer is already assigned
    const existing = await VolunteerShift.findOne({ volunteer_id, shift_id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer is already assigned to this shift'
      });
    }
    
    // Create volunteer shift assignment
    const volunteerShift = await VolunteerShift.create({
      volunteer_id,
      shift_id,
      user_id: volunteer.user_id._id,
      foodbank_id: shift.foodbank_id,
      work_date: shift.shift_date,
      created_by: req.user.id
    });
    
    // Update shift volunteer count
    await shift.addVolunteer();
    
    await volunteerShift.populate([
      { path: 'volunteer_id', populate: { path: 'user_id', select: 'name email' } },
      { path: 'shift_id', select: 'title shift_date start_time end_time' }
    ]);
    
    res.status(201).json({
      success: true,
      data: volunteerShift,
      message: 'Volunteer assigned to shift successfully'
    });
  } catch (error) {
    console.error('Error assigning volunteer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign volunteer',
      error: error.message
    });
  }
};

/**
 * Remove volunteer from shift
 */
exports.removeVolunteer = async (req, res) => {
  try {
    const { shift_id, volunteer_id } = req.body;
    
    const volunteerShift = await VolunteerShift.findOne({ volunteer_id, shift_id });
    if (!volunteerShift) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer assignment not found'
      });
    }
    
    // Cancel the volunteer shift
    await volunteerShift.cancel('Removed by coordinator', req.user.id);
    
    res.json({
      success: true,
      message: 'Volunteer removed from shift successfully'
    });
  } catch (error) {
    console.error('Error removing volunteer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove volunteer',
      error: error.message
    });
  }
};

/**
 * Get shift statistics
 */
exports.getShiftStats = async (req, res) => {
  try {
    const { foodbank_id } = req.params;
    const { start_date, end_date } = req.query;
    
    const dateFilter = { foodbank_id: new mongoose.Types.ObjectId(foodbank_id) };
    if (start_date && end_date) {
      dateFilter.shift_date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }
    
    const stats = await Shift.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          total_shifts: { $sum: 1 },
          published_shifts: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          },
          completed_shifts: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled_shifts: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          total_capacity: { $sum: '$capacity' },
          total_volunteers: { $sum: '$current_volunteers' },
          avg_capacity_utilization: {
            $avg: { $divide: ['$current_volunteers', '$capacity'] }
          }
        }
      }
    ]);
    
    const categoryStats = await Shift.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$activity_category',
          count: { $sum: 1 },
          total_capacity: { $sum: '$capacity' },
          filled_spots: { $sum: '$current_volunteers' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total_shifts: 0,
          published_shifts: 0,
          completed_shifts: 0,
          cancelled_shifts: 0,
          total_capacity: 0,
          total_volunteers: 0,
          avg_capacity_utilization: 0
        },
        category_breakdown: categoryStats
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
