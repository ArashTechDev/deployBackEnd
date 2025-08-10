// backend/src/services/donationItemsService.js
const { connectDB } = require('../mongoose.js');
const DonationItem = require('../models/createDonationItems.js');



/**
 * Ensures connection and gives access to the model.
 */
async function getDonationItemModel() {
  await connectDB();
  return DonationItem;
}

/**
 * Example: Fetch all donation items
 */
async function fetchAllItems() {
  await connectDB();
  return await DonationItem.find();
}

/**
 * Example: Fetch by ID
 */
async function fetchItemById(id) {
  await connectDB();
  return await DonationItem.findById(id);
}

/**
 * Example: Create item
 */
async function createItem(data) {
  await connectDB();
  const item = new DonationItem(data);
  return await item.save();
}

module.exports = {
  getDonationItemModel,
  fetchAllItems,
  fetchItemById,
  createItem,
};


