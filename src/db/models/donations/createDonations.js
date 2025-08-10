// models/Donation.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const donationSchema = new Schema({
  donor_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  foodbank_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Foodbank',
  },
  donation_date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Received', 'Processed'],
    required: true,
  },
  receipt_generated: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    default: null,
  },
  scheduled_dropoff: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Donation', donationSchema);
