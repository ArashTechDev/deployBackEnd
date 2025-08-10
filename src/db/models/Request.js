// backend/src/db/models/Request.js
const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema(
  {
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    foodbank_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodBank',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'fulfilled', 'rejected'],
      default: 'pending',
    },
    request_date: {
      type: Date,
      default: Date.now,
    },
    fulfillment_date: {
      type: Date,
      default: null,
    },
    items: [
      {
        item_name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    notes: {
      type: String,
      maxlength: 500,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    rejection_reason: {
      type: String,
      maxlength: 200,
    },
    processed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
RequestSchema.index({ recipient_id: 1 });
RequestSchema.index({ foodbank_id: 1 });
RequestSchema.index({ status: 1 });
RequestSchema.index({ request_date: -1 });

module.exports = mongoose.model('Request', RequestSchema);
