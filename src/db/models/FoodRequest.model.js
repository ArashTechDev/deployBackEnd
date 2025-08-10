// backend/src/db/models/FoodRequest.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const foodRequestSchema = new Schema(
  {
    recipient_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    foodbank_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'FoodBank',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Ready', 'Fulfilled', 'Cancelled'],
      default: 'Pending',
      required: true,
    },
    items: [
      {
        inventory_id: {
          type: Schema.Types.ObjectId,
          ref: 'Inventory',
          required: true,
        },
        item_name: {
          type: String,
          required: true,
        },
        quantity_requested: {
          type: Number,
          required: true,
          min: 1,
        },
        quantity_fulfilled: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
    preferred_pickup_date: {
      type: Date,
      default: null,
    },
    pickup_time: {
      type: String,
      default: null,
    },
    special_instructions: {
      type: String,
      default: null,
    },
    recurring: {
      type: Boolean,
      default: false,
    },
    frequency: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    processed_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    processed_at: {
      type: Date,
      default: null,
    },
    total_items: {
      type: Number,
      default: 0,
    },
    fulfilled_items: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // This adds created_at and updated_at fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for completion percentage
foodRequestSchema.virtual('completion_percentage').get(function () {
  if (this.total_items === 0) return 0;
  return Math.round((this.fulfilled_items / this.total_items) * 100);
});

// Virtual for is_overdue (if pickup date has passed)
foodRequestSchema.virtual('is_overdue').get(function () {
  if (!this.preferred_pickup_date) return false;
  return new Date() > this.preferred_pickup_date && this.status !== 'Fulfilled';
});

// Index for efficient queries
foodRequestSchema.index({ recipient_id: 1, created_at: -1 });
foodRequestSchema.index({ foodbank_id: 1, status: 1 });
foodRequestSchema.index({ status: 1, preferred_pickup_date: 1 });
foodRequestSchema.index({ created_at: -1 });

// Pre-save middleware to update total_items count
foodRequestSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    this.total_items = this.items.reduce((total, item) => total + item.quantity_requested, 0);
    this.fulfilled_items = this.items.reduce((total, item) => total + item.quantity_fulfilled, 0);
  }
  next();
});

// Static method to get requests by status
foodRequestSchema.statics.findByStatus = function (status, foodbank_id = null) {
  const query = { status };
  if (foodbank_id) {
    query.foodbank_id = foodbank_id;
  }
  return this.find(query)
    .populate('recipient_id', 'name email phone')
    .populate('foodbank_id', 'name location phone')
    .sort({ created_at: -1 });
};

// Static method to get pending requests
foodRequestSchema.statics.getPendingRequests = function (foodbank_id = null) {
  return this.findByStatus('Pending', foodbank_id);
};

// Instance method to mark as fulfilled
foodRequestSchema.methods.markAsFulfilled = function (processed_by_id) {
  this.status = 'Fulfilled';
  this.processed_by = processed_by_id;
  this.processed_at = new Date();
  return this.save();
};

// Instance method to approve request
foodRequestSchema.methods.approve = function (processed_by_id) {
  this.status = 'Approved';
  this.processed_by = processed_by_id;
  this.processed_at = new Date();
  return this.save();
};

module.exports = mongoose.model('FoodRequest', foodRequestSchema);
