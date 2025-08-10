// backend/src/db/models/Inventory.js 
const mongoose = require('mongoose');

// Define the dietary category enum 
const dietaryCategoryEnum = [
  'Vegan',
  'Vegetarian', 
  'Gluten-Free',
  'Kosher',
  'Halal'
  // Note: null is handled automatically by making field optional
];

const inventorySchema = new mongoose.Schema({
  foodbank_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodBank', // FIXED: Changed from 'Foodbank' to 'FoodBank'
    required: true,
    index: true
  },
  item_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be an integer'
    }
  },
  expiration_date: {
    type: Date,
    default: null,
    index: true
  },
  storage_location: {
    type: String,
    trim: true,
    maxlength: 100,
    default: null
  },
  dietary_category: {
    type: String,
    enum: dietaryCategoryEnum,
    default: null
  },
  date_added: {
    type: Date,
    default: Date.now,
    index: true
  },
  barcode: {
    type: String,
    trim: true,
    maxlength: 50,
    default: null,
    sparse: true,
    index: true
  },
  minimum_stock_level: {
    type: Number,
    default: 10,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Minimum stock level must be an integer'
    }
  },
  low_stock: {
    type: Boolean,
    default: false,
    index: true
  },
  // Additional fields for better tracking
  last_updated: {
    type: Date,
    default: Date.now
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    default: null
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'inventory'
});

// Indexes for performance - matching your collection setup
inventorySchema.index({ foodbank_id: 1, category: 1 });
inventorySchema.index({ foodbank_id: 1, low_stock: 1 });
inventorySchema.index({ expiration_date: 1, quantity: 1 });
inventorySchema.index({ item_name: 'text', category: 'text' });

// Unique barcode per foodbank with PARTIAL INDEX (better than sparse for nulls)
inventorySchema.index(
  { barcode: 1, foodbank_id: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { 
      // eslint-disable-next-line no-dupe-keys
      barcode: { $exists: true, $ne: null, $ne: '' } 
    },
    name: 'barcode_foodbank_partial_unique'
  }
);

// Virtual for checking if item is expiring soon
inventorySchema.virtual('is_expiring_soon').get(function() {
  if (!this.expiration_date) return false;
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  return this.expiration_date <= sevenDaysFromNow && this.expiration_date >= new Date();
});

// Virtual for days until expiration
inventorySchema.virtual('days_until_expiration').get(function() {
  if (!this.expiration_date) return null;
  const today = new Date();
  const expirationDate = new Date(this.expiration_date);
  const timeDiff = expirationDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Pre-save middleware to update low_stock status and last_updated
inventorySchema.pre('save', function(next) {
  this.low_stock = this.quantity <= this.minimum_stock_level;
  this.last_updated = new Date();
  next();
});

// Pre-update middleware
inventorySchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  const update = this.getUpdate();
  if (update.quantity !== undefined || update.minimum_stock_level !== undefined) {
    const quantity = update.quantity || this.quantity;
    const minLevel = update.minimum_stock_level || this.minimum_stock_level || 10;
    update.low_stock = quantity <= minLevel;
  }
  update.last_updated = new Date();
  next();
});

// Static methods for common queries
inventorySchema.statics.findLowStock = function(foodbank_id) {
  return this.find({ foodbank_id, low_stock: true });
};

inventorySchema.statics.findExpiringSoon = function(foodbank_id, days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return this.find({
    foodbank_id,
    expiration_date: { $lte: futureDate, $gte: new Date() }
  });
};

inventorySchema.statics.findByCategory = function(foodbank_id, category) {
  return this.find({ foodbank_id, category });
};

// Instance methods
inventorySchema.methods.updateStock = function(newQuantity, updatedBy = null) {
  this.quantity = newQuantity;
  this.low_stock = newQuantity <= this.minimum_stock_level;
  this.last_updated = new Date();
  if (updatedBy) {
    this.updated_by = updatedBy;
  }
  return this.save();
};

module.exports = mongoose.model('Inventory', inventorySchema);