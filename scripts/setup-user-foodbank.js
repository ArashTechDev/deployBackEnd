// backend/scripts/setup-user-foodbank.js
require('dotenv').config(); // Load from current directory
const mongoose = require('mongoose');
const User = require('../src/db/models/User');
const FoodBank = require('../src/db/models/FoodBank');
const Inventory = require('../src/db/models/Inventory'); // Add this import

// Debug: Check if environment variables are loaded
console.log('🔍 Environment check:');
console.log('   MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('   NODE_ENV:', process.env.NODE_ENV);

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI not found in environment variables');
  console.error('   Make sure you have a .env file in the backend directory with:');
  console.error('   MONGO_URI=your_mongodb_connection_string');
  process.exit(1);
}

const setupUserFoodbank = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find foodbanks that have inventory items in "Produce Section"
    console.log('🔍 Looking for foodbanks with Produce Section items...');

    const produceSectionInventory = await Inventory.find({
      storage_location: { $regex: /produce section/i },
    }).populate('foodbank_id', 'name address');

    if (produceSectionInventory.length > 0) {
      // Get the foodbank that has the most produce section items
      const foodbankCounts = {};
      produceSectionInventory.forEach(item => {
        const fbId = item.foodbank_id._id.toString();
        foodbankCounts[fbId] = (foodbankCounts[fbId] || 0) + 1;
      });

      const primaryFoodbankId = Object.keys(foodbankCounts).reduce((a, b) =>
        foodbankCounts[a] > foodbankCounts[b] ? a : b
      );

      const targetFoodbank = await FoodBank.findById(primaryFoodbankId);
      const itemCount = foodbankCounts[primaryFoodbankId];

      console.log(`✅ Found foodbank with Produce Section items: ${targetFoodbank.name}`);
      console.log(`📦 This foodbank has ${itemCount} items in Produce Section`);

      // Show sample items in this foodbank's produce section
      const sampleItems = await Inventory.find({
        foodbank_id: targetFoodbank._id,
        storage_location: { $regex: /produce section/i },
      })
        .limit(5)
        .select('item_name quantity storage_location');

      console.log('📋 Sample Produce Section items:');
      sampleItems.forEach(item => {
        console.log(`   - ${item.item_name}: ${item.quantity} units (${item.storage_location})`);
      });

      // Update all users to be associated with this foodbank
      const usersToUpdate = await User.find({
        role: { $in: ['recipient', 'donor', 'volunteer'] },
      });

      if (usersToUpdate.length > 0) {
        console.log(
          `🔧 Updating ${usersToUpdate.length} users to be associated with ${targetFoodbank.name}...`
        );

        await User.updateMany(
          { role: { $in: ['recipient', 'donor', 'volunteer'] } },
          { $set: { foodbank_id: targetFoodbank._id } }
        );

        console.log('✅ Updated users successfully!');

        // Show updated users
        const updatedUsers = await User.find({ foodbank_id: targetFoodbank._id }).select(
          'name email role'
        );
        console.log('\n👥 Users now associated with Produce Section foodbank:');
        updatedUsers.forEach(user => {
          console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
        });

        // Show total inventory available to these users
        const totalInventory = await Inventory.countDocuments({ foodbank_id: targetFoodbank._id });
        console.log(`\n📦 Total inventory items available: ${totalInventory}`);
      } else {
        console.log('✅ No users found to update');
      }
    } else {
      console.log('❌ No inventory items found in Produce Section');
      console.log('🔧 Falling back to any available foodbank with inventory...');

      // Fallback: find any foodbank with inventory
      const anyInventory = await Inventory.findOne().populate('foodbank_id', 'name address');
      if (anyInventory) {
        const fallbackFoodbank = anyInventory.foodbank_id;
        console.log(`📦 Using fallback foodbank: ${fallbackFoodbank.name}`);

        await User.updateMany(
          { role: { $in: ['recipient', 'donor', 'volunteer'] } },
          { $set: { foodbank_id: fallbackFoodbank._id } }
        );

        console.log('✅ Updated users to fallback foodbank');
      } else {
        console.log('❌ No inventory found in any foodbank');
        console.log('💡 Please run the setup-demo script or add-test-inventory script first');
      }
    }

    console.log('\n🎉 Setup complete! You can now browse inventory and submit food requests.');
  } catch (error) {
    console.error('❌ Error setting up user-foodbank associations:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
  }
};

// Run the setup
setupUserFoodbank();
