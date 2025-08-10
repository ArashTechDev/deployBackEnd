const mongoose = require('mongoose');

const FoodBankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: String,
  province: String,
  postalCode: String,
  contactEmail: String,
  contactPhone: String,
  operatingHours: { type: mongoose.Schema.Types.Mixed }, 
  latitude: Number,
  longitude: Number,
}, {
  timestamps: true, 
});

const FoodBank = mongoose.model('FoodBank', FoodBankSchema);

module.exports = FoodBank;
