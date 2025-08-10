// backend/src/db/models/Volunteer.js
const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
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
  volunteer_id: {
    type: String,
    unique: true,
    required: false,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'active',
    index: true
  },
  skills: [{
    skill_name: {
      type: String,
      required: true
    },
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  }],
  availability: {
    days_of_week: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    preferred_shifts: [{
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night']
    }],
    max_hours_per_week: {
      type: Number,
      default: 40,
      min: 1
    }
  },
  emergency_contact: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    relationship: {
      type: String,
      required: true
    }
  },
  background_check: {
    completed: {
      type: Boolean,
      default: false
    },
    completion_date: Date,
    expires_date: Date,
    notes: String
  },
  training_status: {
    orientation_completed: {
      type: Boolean,
      default: false
    },
    orientation_date: Date,
    certifications: [{
      name: String,
      date_obtained: Date,
      expires_date: Date
    }]
  },
  total_hours: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: String,
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  last_activity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'volunteers'
});

// Indexes for performance
volunteerSchema.index({ foodbank_id: 1, status: 1 });
volunteerSchema.index({ volunteer_id: 1 }, { unique: true });
volunteerSchema.index({ user_id: 1, foodbank_id: 1 }, { unique: true });
volunteerSchema.index({ 'availability.days_of_week': 1 });
volunteerSchema.index({ total_hours: -1 });
volunteerSchema.index({ last_activity: -1 });

// Virtual for full volunteer info with user data
volunteerSchema.virtual('full_info', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to generate volunteer ID
volunteerSchema.pre('save', async function(next) {
  if (!this.volunteer_id) {
    const count = await this.constructor.countDocuments({ foodbank_id: this.foodbank_id });
    this.volunteer_id = `VOL-${this.foodbank_id.toString().slice(-6)}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Methods
volunteerSchema.methods.updateTotalHours = async function() {
  const VolunteerShift = mongoose.model('VolunteerShift');
  const result = await VolunteerShift.aggregate([
    { $match: { volunteer_id: this._id, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$hours_worked' } } }
  ]);
  this.total_hours = result[0] ? result[0].total : 0;
  return this.save();
};

volunteerSchema.methods.getMonthlyHours = async function(year, month) {
  const VolunteerShift = mongoose.model('VolunteerShift');
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const result = await VolunteerShift.aggregate([
    {
      $match: {
        volunteer_id: this._id,
        status: 'completed',
        work_date: { $gte: startDate, $lte: endDate }
      }
    },
    { $group: { _id: null, total: { $sum: '$hours_worked' } } }
  ]);
  
  return result[0] ? result[0].total : 0;
};

// Static methods
volunteerSchema.statics.findByFoodbank = function(foodbank_id) {
  return this.find({ foodbank_id, status: 'active' }).populate('user_id', 'name email');
};

volunteerSchema.statics.findAvailableForShift = function(foodbank_id, day_of_week, shift_time) {
  return this.find({
    foodbank_id,
    status: 'active',
    'availability.days_of_week': day_of_week,
    'availability.preferred_shifts': shift_time
  }).populate('user_id', 'name email');
};

// Ensure virtual fields are serialized
volunteerSchema.set('toJSON', { virtuals: true });
volunteerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Volunteer', volunteerSchema);
