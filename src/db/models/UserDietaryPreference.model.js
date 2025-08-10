// backend/src/models/UserDietaryPreference.model.js
const mongoose = require('mongoose');

const userDietaryPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    restrictionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DietaryRestriction',
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['mild', 'strict'],
      default: 'mild',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate preferences and optimize queries
userDietaryPreferenceSchema.index({ userId: 1, restrictionId: 1 }, { unique: true });
userDietaryPreferenceSchema.index({ userId: 1, isActive: 1 });
userDietaryPreferenceSchema.index({ restrictionId: 1, severity: 1 });

module.exports = mongoose.model('UserDietaryPreference', userDietaryPreferenceSchema);
