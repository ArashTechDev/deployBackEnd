const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  inventory_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
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
  price: {
    type: Number,
    default: 0,
  },
  dietary_category: {
    type: String,
    enum: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Kosher', 'Halal'],
  },
  added_at: {
    type: Date,
    default: Date.now,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [cartItemSchema],
    total_items: {
      type: Number,
      default: 0,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update total_items before saving
cartSchema.pre('save', function (next) {
  this.total_items = this.items.reduce((total, item) => total + item.quantity, 0);
  this.updated_at = Date.now();
  next();
});

// Add indexes
cartSchema.index({ user_id: 1 });

// Check if model already exists before creating it
const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

module.exports = Cart;
