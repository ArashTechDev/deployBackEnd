// backend/src/models/dietary/dietaryRestrictions.model.js
const mongoose = require('mongoose');

const DietaryRestrictionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    default: null,
  },
  icon: {
    type: String,
    default: null,
  }
}, {
  collection: 'dietary_restrictions',
  timestamps: true
});

const DietaryRestriction = mongoose.model('DietaryRestriction', DietaryRestrictionSchema);
module.exports = DietaryRestriction;
