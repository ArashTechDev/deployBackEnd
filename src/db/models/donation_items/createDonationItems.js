// backend/src/models/DonationItem.js
const mongoose = require('mongoose');

const donationItemSchema = new mongoose.Schema({
  donation_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Donation',
  },
  inventory_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    default: null,
  },
  item_name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  expiration_date: {
    type: Date,
    default: null,
  },
  category: {
    type: String,
    enum: ['Canned', 'Dry', 'Fresh', 'Personal'],
    required: true,
  },
  dietary_info: {
    type: String,
    default: null,
  },
}, {
  collection: 'donation_items',
  strict: true,
});

const DonationItem = mongoose.model('DonationItem', donationItemSchema);

module.exports = DonationItem;
