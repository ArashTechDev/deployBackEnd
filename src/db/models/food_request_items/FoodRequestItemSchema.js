// models/FoodRequestItem.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const foodRequestItemSchema = new Schema({
  request_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'FoodRequest',
  },
  inventory_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Inventory',
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
}, {
  timestamps: true,
});

module.exports = mongoose.model('FoodRequestItem', foodRequestItemSchema);
