const mongoose = require('mongoose');

const StorageLocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  foodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodBank', required: true },
}, {
  timestamps: true, 
});

const StorageLocation = mongoose.model('StorageLocation', StorageLocationSchema);

module.exports = StorageLocation;
