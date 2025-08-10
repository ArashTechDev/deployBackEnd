// backend/src/db/models/VolunteerShift.js
const mongoose = require('mongoose');

const volunteerShiftSchema = new mongoose.Schema({
  volunteer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer',
    required: true,
    index: true
  },
  shift_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  foodbank_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodBank',
    required: true,
    index: true
  },
  assignment_date: {
    type: Date,
    default: Date.now
  },
  work_date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['assigned', 'confirmed', 'checked_in', 'checked_out', 'completed', 'cancelled', 'no_show'],
    default: 'assigned',
    index: true
  },
  check_in_time: {
    type: String,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
  },
  check_out_time: {
    type: String,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
  },
  hours_worked: {
    type: Number,
    min: 0,
    default: 0
  },
  break_duration: {
    type: Number,
    min: 0,
    default: 0,
    comment: 'Break duration in minutes'
  },
  actual_start_time: String,
  actual_end_time: String,
  verified: {
    type: Boolean,
    default: false
  },
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verified_date: Date,
  activities_performed: [{
    activity_name: {
      type: String,
      required: true
    },
    time_spent: {
      type: Number,
      min: 0,
      comment: 'Time spent in minutes'
    },
    notes: String
  }],
  performance_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    volunteer_feedback: String,
    coordinator_feedback: String,
    improvements: String
  },
  cancelled_reason: String,
  cancelled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelled_date: Date,
  no_show_reason: String,
  notes: String,
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'volunteer_shifts'
});

// Compound indexes for performance
volunteerShiftSchema.index({ volunteer_id: 1, work_date: -1 });
volunteerShiftSchema.index({ shift_id: 1, status: 1 });
volunteerShiftSchema.index({ user_id: 1, work_date: -1 });
volunteerShiftSchema.index({ foodbank_id: 1, work_date: -1 });
volunteerShiftSchema.index({ work_date: 1, status: 1 });
volunteerShiftSchema.index({ verified: 1, work_date: -1 });

// Ensure one volunteer per shift
volunteerShiftSchema.index({ volunteer_id: 1, shift_id: 1 }, { unique: true });

// Virtuals
volunteerShiftSchema.virtual('calculated_hours').get(function() {
  if (this.check_in_time && this.check_out_time) {
    const checkIn = new Date(`1970-01-01T${this.check_in_time}:00`);
    const checkOut = new Date(`1970-01-01T${this.check_out_time}:00`);
    const diff = checkOut - checkIn;
    const hours = diff / (1000 * 60 * 60);
    const breakHours = this.break_duration / 60;
    return Math.round((hours - breakHours) * 100) / 100;
  }
  return 0;
});

volunteerShiftSchema.virtual('is_active').get(function() {
  return ['assigned', 'confirmed', 'checked_in'].includes(this.status);
});

volunteerShiftSchema.virtual('is_completed').get(function() {
  return this.status === 'completed';
});

// Pre-save middleware
volunteerShiftSchema.pre('save', async function(next) {
  // Auto-calculate hours if check-in/out times are provided
  if (this.check_in_time && this.check_out_time && this.hours_worked === 0) {
    this.hours_worked = this.calculated_hours;
  }
  
  // Auto-verify if completed with coordinator feedback
  if (this.status === 'completed' && this.feedback.coordinator_feedback && !this.verified) {
    this.verified = true;
    this.verified_date = new Date();
  }
  
  next();
});

// Post-save middleware to update volunteer total hours
volunteerShiftSchema.post('save', async function(doc) {
  if (doc.status === 'completed' && doc.hours_worked > 0) {
    const Volunteer = mongoose.model('Volunteer');
    const volunteer = await Volunteer.findById(doc.volunteer_id);
    if (volunteer) {
      await volunteer.updateTotalHours();
    }
  }
});

// Methods
volunteerShiftSchema.methods.checkIn = async function(time) {
  if (this.status !== 'confirmed') {
    throw new Error('Can only check in confirmed shifts');
  }
  this.check_in_time = time || new Date().toTimeString().slice(0, 5);
  this.status = 'checked_in';
  return this.save();
};

volunteerShiftSchema.methods.checkOut = async function(time) {
  if (this.status !== 'checked_in') {
    throw new Error('Must be checked in to check out');
  }
  this.check_out_time = time || new Date().toTimeString().slice(0, 5);
  this.status = 'checked_out';
  this.hours_worked = this.calculated_hours;
  return this.save();
};

volunteerShiftSchema.methods.complete = async function(feedback = {}) {
  if (this.status !== 'checked_out') {
    throw new Error('Must be checked out to complete shift');
  }
  this.status = 'completed';
  if (feedback.coordinator_feedback) {
    this.feedback.coordinator_feedback = feedback.coordinator_feedback;
  }
  if (feedback.performance_rating) {
    this.performance_rating = feedback.performance_rating;
  }
  return this.save();
};

volunteerShiftSchema.methods.cancel = async function(reason, cancelled_by) {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel completed shift');
  }
  this.status = 'cancelled';
  this.cancelled_reason = reason;
  this.cancelled_by = cancelled_by;
  this.cancelled_date = new Date();
  
  // Update shift volunteer count
  const Shift = mongoose.model('Shift');
  const shift = await Shift.findById(this.shift_id);
  if (shift) {
    await shift.removeVolunteer();
  }
  
  return this.save();
};

volunteerShiftSchema.methods.markNoShow = async function(reason) {
  this.status = 'no_show';
  this.no_show_reason = reason;
  return this.save();
};

volunteerShiftSchema.methods.verify = async function(verified_by) {
  this.verified = true;
  this.verified_by = verified_by;
  this.verified_date = new Date();
  return this.save();
};

// Static methods
volunteerShiftSchema.statics.findByVolunteer = function(volunteer_id, startDate, endDate) {
  const query = { volunteer_id };
  if (startDate && endDate) {
    query.work_date = { $gte: startDate, $lte: endDate };
  }
  return this.find(query).populate('shift_id').sort({ work_date: -1 });
};

volunteerShiftSchema.statics.findByShift = function(shift_id) {
  return this.find({ shift_id }).populate('volunteer_id user_id');
};

volunteerShiftSchema.statics.getHoursByVolunteer = function(volunteer_id, startDate, endDate) {
  const match = { 
    volunteer_id: new mongoose.Types.ObjectId(volunteer_id),
    status: 'completed'
  };
  
  if (startDate && endDate) {
    match.work_date = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: match },
    { 
      $group: {
        _id: null,
        total_hours: { $sum: '$hours_worked' },
        shift_count: { $sum: 1 }
      }
    }
  ]);
};

volunteerShiftSchema.statics.getHoursByFoodbank = function(foodbank_id, startDate, endDate) {
  const match = { 
    foodbank_id: new mongoose.Types.ObjectId(foodbank_id),
    status: 'completed'
  };
  
  if (startDate && endDate) {
    match.work_date = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$volunteer_id',
        total_hours: { $sum: '$hours_worked' },
        shift_count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'volunteers',
        localField: '_id',
        foreignField: '_id',
        as: 'volunteer'
      }
    },
    { $unwind: '$volunteer' },
    {
      $lookup: {
        from: 'users',
        localField: 'volunteer.user_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        volunteer_id: '$_id',
        volunteer_name: '$user.name',
        volunteer_email: '$user.email',
        total_hours: 1,
        shift_count: 1
      }
    },
    { $sort: { total_hours: -1 } }
  ]);
};

// Ensure virtual fields are serialized
volunteerShiftSchema.set('toJSON', { virtuals: true });
volunteerShiftSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VolunteerShift', volunteerShiftSchema);
