// backend/src/controllers/volunteer.controller.js
const Volunteer = require('../db/models/Volunteer');
const User = require('../db/models/User');
const mongoose = require('mongoose');

/**
 * Get all volunteers for a food bank
 */
exports.getVolunteers = async (req, res) => {
  try {
    const { foodbank_id } = req.params;
    const { status, page = 1, limit = 10, search } = req.query;

    const filter = { foodbank_id };
    if (status) filter.status = status;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'user_id', select: 'name email' },
        { path: 'created_by', select: 'name' },
      ],
      sort: { last_activity: -1 },
    };

    let query = Volunteer.find(filter);

    // Add search functionality
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      const userIds = users.map(user => user._id);
      query = query.where('user_id').in(userIds);
    }

    const volunteers = await query
      .populate('user_id', 'name email')
      .populate('created_by', 'name')
      .sort({ last_activity: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Volunteer.countDocuments(filter);

    res.json({
      success: true,
      data: {
        volunteers,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch volunteers',
      error: error.message,
    });
  }
};

/**
 * Get a specific volunteer by ID
 */
exports.getVolunteer = async (req, res) => {
  try {
    const { id } = req.params;

    const volunteer = await Volunteer.findById(id)
      .populate('user_id', 'name email')
      .populate('created_by', 'name');

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found',
      });
    }

    res.json({
      success: true,
      data: volunteer,
    });
  } catch (error) {
    console.error('Error fetching volunteer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch volunteer',
      error: error.message,
    });
  }
};

/**
 * Create a new volunteer
 */
exports.createVolunteer = async (req, res) => {
  try {
    const { user_id, foodbank_id, skills, availability, emergency_contact, notes } = req.body;

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if volunteer already exists for this foodbank
    const existingVolunteer = await Volunteer.findOne({ user_id, foodbank_id });
    if (existingVolunteer) {
      return res.status(400).json({
        success: false,
        message: 'User is already a volunteer for this food bank',
      });
    }

    const volunteer = await Volunteer.create({
      user_id,
      foodbank_id,
      skills: skills || [],
      availability: availability || {},
      emergency_contact,
      notes,
      created_by: req.user.id,
    });

    await volunteer.populate('user_id', 'name email');

    res.status(201).json({
      success: true,
      data: volunteer,
      message: 'Volunteer created successfully',
    });
  } catch (error) {
    console.error('Error creating volunteer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create volunteer',
      error: error.message,
    });
  }
};

/**
 * Update a volunteer
 */
exports.updateVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.user_id;
    delete updates.foodbank_id;
    delete updates.volunteer_id;
    delete updates.total_hours;
    delete updates.created_by;

    const volunteer = await Volunteer.findByIdAndUpdate(
      id,
      { ...updates, last_activity: new Date() },
      { new: true, runValidators: true }
    ).populate('user_id', 'name email');

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found',
      });
    }

    res.json({
      success: true,
      data: volunteer,
      message: 'Volunteer updated successfully',
    });
  } catch (error) {
    console.error('Error updating volunteer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update volunteer',
      error: error.message,
    });
  }
};

/**
 * Delete a volunteer
 */
exports.deleteVolunteer = async (req, res) => {
  try {
    const { id } = req.params;

    const volunteer = await Volunteer.findByIdAndDelete(id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found',
      });
    }

    res.json({
      success: true,
      message: 'Volunteer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting volunteer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete volunteer',
      error: error.message,
    });
  }
};

/**
 * Update volunteer status
 */
exports.updateVolunteerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const volunteer = await Volunteer.findByIdAndUpdate(
      id,
      { status, last_activity: new Date() },
      { new: true, runValidators: true }
    ).populate('user_id', 'name email');

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found',
      });
    }

    res.json({
      success: true,
      data: volunteer,
      message: 'Volunteer status updated successfully',
    });
  } catch (error) {
    console.error('Error updating volunteer status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update volunteer status',
      error: error.message,
    });
  }
};

/**
 * Get volunteers available for a specific shift
 */
exports.getAvailableVolunteers = async (req, res) => {
  try {
    const { foodbank_id, day_of_week, shift_time } = req.query;

    const volunteers = await Volunteer.findAvailableForShift(foodbank_id, day_of_week, shift_time);

    res.json({
      success: true,
      data: volunteers,
    });
  } catch (error) {
    console.error('Error fetching available volunteers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available volunteers',
      error: error.message,
    });
  }
};

/**
 * Get volunteer statistics
 */
exports.getVolunteerStats = async (req, res) => {
  try {
    const { foodbank_id } = req.params;

    const stats = await Volunteer.aggregate([
      { $match: { foodbank_id: new mongoose.Types.ObjectId(foodbank_id) } },
      {
        $group: {
          _id: null,
          total_volunteers: { $sum: 1 },
          active_volunteers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          inactive_volunteers: {
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] },
          },
          pending_volunteers: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          total_hours: { $sum: '$total_hours' },
          avg_hours_per_volunteer: { $avg: '$total_hours' },
        },
      },
    ]);

    const statusBreakdown = await Volunteer.aggregate([
      { $match: { foodbank_id: new mongoose.Types.ObjectId(foodbank_id) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total_volunteers: 0,
          active_volunteers: 0,
          inactive_volunteers: 0,
          pending_volunteers: 0,
          total_hours: 0,
          avg_hours_per_volunteer: 0,
        },
        status_breakdown: statusBreakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching volunteer stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch volunteer statistics',
      error: error.message,
    });
  }
};
