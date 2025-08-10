const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorName: {
    type: String,
    required: true,
    trim: true
  },
  donorEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  donorPhone: {
    type: String,
    trim: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true,
    enum: ['pieces', 'kg', 'lbs', 'cans', 'boxes', 'bags', 'liters'],
    default: 'pieces'
  },
  category: {
    type: String,
    required: true,
    enum: ['canned-goods', 'fresh-produce', 'dairy', 'meat', 'grains', 'beverages', 'snacks', 'other'],
    default: 'other'
  },
  expirationDate: {
    type: Date
  },
  scheduledPickupDate: {
    type: Date,
    required: true
  },
  scheduledPickupTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'picked-up', 'cancelled', 'completed'],
    default: 'pending'
  },
  productImage: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String
  },
  notes: {
    type: String,
    trim: true
  },
  receiptGenerated: {
    type: Boolean,
    default: false
  },
  receiptPath: {
    type: String
  },
  inventoryLinked: {
    type: Boolean,
    default: false
  },
  inventoryItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem'
  },
  foodBankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodBank'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

donationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

donationSchema.index({ donorEmail: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ scheduledPickupDate: 1 });
donationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);