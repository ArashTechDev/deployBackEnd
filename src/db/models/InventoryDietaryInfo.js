// backend/src/db/models/InventoryDietaryInfo.js
const mongoose = require('mongoose');

const inventoryDietaryInfoSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
      index: true,
    },
    dietaryCategories: [
      {
        type: String,
        enum: [
          'Vegan',
          'Vegetarian',
          'Gluten-Free',
          'Kosher',
          'Halal',
          'Dairy-Free',
          'Nut-Free',
          'Soy-Free',
        ],
      },
    ],
    allergens: [
      {
        restrictionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'DietaryRestriction',
          required: true,
        },
        confidence: {
          type: Number,
          min: 0,
          max: 1,
          default: 1,
        },
      },
    ],
    ingredients: [
      {
        name: String,
        isAllergen: Boolean,
        allergenType: String,
      },
    ],
    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
      sodium: Number,
    },
    certifications: [
      {
        type: String,
        enum: ['organic', 'non-gmo', 'fair-trade', 'kosher-certified', 'halal-certified'],
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'inventory_dietary_info',
  }
);

inventoryDietaryInfoSchema.index({ inventoryId: 1 }, { unique: true });
inventoryDietaryInfoSchema.index({ 'allergens.restrictionId': 1 });
inventoryDietaryInfoSchema.index({ dietaryCategories: 1 });

module.exports = mongoose.model('InventoryDietaryInfo', inventoryDietaryInfoSchema);
