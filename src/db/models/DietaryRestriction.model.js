// backend/src/models/DietaryRestriction.model.js
const mongoose = require('mongoose');

const dietaryRestrictionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      required: true,
      enum: ['allergen', 'lifestyle', 'religious', 'medical'],
      index: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    icon: {
      type: String,
      maxlength: 255,
    },
    isAllergen: {
      type: Boolean,
      default: false,
      index: true,
    },
    severityLevels: {
      type: [String],
      enum: ['mild', 'strict'],
      default: ['mild', 'strict'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better performance
dietaryRestrictionSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('DietaryRestriction', dietaryRestrictionSchema);
