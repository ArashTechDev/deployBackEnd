const mongoose = require('mongoose');

// Use the same dietary category enum as Cart and Inventory models
const dietaryCategoryEnum = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Kosher', 'Halal'];

const wishlistItemSchema = new mongoose.Schema({
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
    enum: dietaryCategoryEnum,
    default: null,
  },
  added_at: {
    type: Date,
    default: Date.now,
  },
});

const wishlistSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    items: [wishlistItemSchema],
    is_default: {
      type: Boolean,
      default: false,
    },
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
wishlistSchema.pre('save', function (next) {
  this.total_items = this.items.reduce((total, item) => total + item.quantity, 0);
  this.updated_at = Date.now();
  next();
});

// Add indexes
wishlistSchema.index({ user_id: 1 });
wishlistSchema.index({ name: 1, user_id: 1 });

// Check if model already exists before creating it
const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
