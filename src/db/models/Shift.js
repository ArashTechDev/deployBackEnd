// backend/src/db/models/Shift.js
const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  foodbank_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodBank',
    required: true,
    index: true
  },
  shift_id: {
    type: String,
    unique: true,
    required: false,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  shift_date: {
    type: Date,
    required: true,
    index: true
  },
  start_time: {
    type: String,
    required: true,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
  },
  end_time: {
    type: String,
    required: true,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  current_volunteers: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'in_progress', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  shift_type: {
    type: String,
    enum: ['regular', 'emergency', 'event', 'training'],
    default: 'regular',
    index: true
  },
  required_skills: [{
    skill_name: {
      type: String,
      required: true
    },
    required_level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  }],
  location: {
    type: String,
    required: true,
    maxlength: 300
  },
  activity_category: {
    type: String,
    enum: ['food_sorting', 'food_distribution', 'delivery', 'administrative', 'inventory', 'cleaning', 'event_setup', 'other'],
    required: true,
    index: true
  },
  coordinator_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: String,
  recurring: {
    is_recurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: function() { return this.recurring.is_recurring; }
    },
    end_date: Date
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  collection: 'shifts'
});

// Indexes for performance
shiftSchema.index({ foodbank_id: 1, shift_date: 1 });
shiftSchema.index({ shift_date: 1, status: 1 });
shiftSchema.index({ activity_category: 1, status: 1 });
shiftSchema.index({ coordinator_id: 1 });
shiftSchema.index({ status: 1, shift_date: 1 });

// Virtuals
shiftSchema.virtual('available_spots').get(function() {
  return this.capacity - this.current_volunteers;
});

shiftSchema.virtual('is_full').get(function() {
  return this.current_volunteers >= this.capacity;
});

shiftSchema.virtual('duration_hours').get(function() {
  const start = new Date(`1970-01-01T${this.start_time}:00`);
  const end = new Date(`1970-01-01T${this.end_time}:00`);
  const diff = end - start;
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
});

// Pre-save middleware to generate shift ID
shiftSchema.pre('save', async function(next) {
  if (!this.shift_id) {
    const date = new Date(this.shift_date);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.constructor.countDocuments({ 
      foodbank_id: this.foodbank_id,
      shift_date: {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      }
    });
    this.shift_id = `SHIFT-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
  }
  next();
});

// Methods
shiftSchema.methods.addVolunteer = async function() {
  if (this.current_volunteers < this.capacity) {
    this.current_volunteers += 1;
    return this.save();
  }
  throw new Error('Shift is at full capacity');
};

shiftSchema.methods.removeVolunteer = async function() {
  if (this.current_volunteers > 0) {
    this.current_volunteers -= 1;
    return this.save();
  }
  throw new Error('No volunteers to remove');
};

shiftSchema.methods.canAssignVolunteer = function(volunteer) {
  if (this.is_full) return false;
  if (this.status !== 'published') return false;
  if (this.shift_date < new Date()) return false;
  
  // Check if volunteer has required skills
  if (this.required_skills.length > 0) {
    const hasRequiredSkills = this.required_skills.every(reqSkill => {
      return volunteer.skills.some(volSkill => 
        volSkill.skill_name === reqSkill.skill_name &&
        this.getSkillLevel(volSkill.proficiency) >= this.getSkillLevel(reqSkill.required_level)
      );
    });
    if (!hasRequiredSkills) return false;
  }
  
  return true;
};

shiftSchema.methods.getSkillLevel = function(level) {
  const levels = { beginner: 1, intermediate: 2, advanced: 3 };
  return levels[level] || 0;
};

// Static methods
shiftSchema.statics.findUpcoming = function(foodbank_id) {
  return this.find({
    foodbank_id,
    shift_date: { $gte: new Date() },
    status: 'published'
  }).sort({ shift_date: 1 });
};

shiftSchema.statics.findByDateRange = function(foodbank_id, startDate, endDate) {
  return this.find({
    foodbank_id,
    shift_date: { $gte: startDate, $lte: endDate }
  }).sort({ shift_date: 1 });
};

shiftSchema.statics.findAvailableShifts = function(foodbank_id) {
  return this.find({
    foodbank_id,
    status: 'published',
    shift_date: { $gte: new Date() },
    $expr: { $lt: ['$current_volunteers', '$capacity'] }
  }).sort({ shift_date: 1 });
};

// Ensure virtual fields are serialized
shiftSchema.set('toJSON', { virtuals: true });
shiftSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Shift', shiftSchema);
