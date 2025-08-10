// backend/scripts/cleanTestData.js

require('dotenv').config();
const mongoose = require('mongoose');
const UserDietaryPreference = require('../src/db/models/UserDietaryPreference.model');

const cleanTestData = async () => {
  try {
    console.log('🧹 Cleaning test user data...');

    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri, { dbName: 'test' });
    console.log('✅ Connected to MongoDB');

    // Delete all preferences for the test user
    const testUserId = '507f1f77bcf86cd799439011';
    const result = await UserDietaryPreference.deleteMany({
      userId: testUserId,
    });

    console.log(`🗑️ Deleted ${result.deletedCount} test user preferences`);
    console.log('✅ Test data cleaned successfully');
  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Connection closed');
  }
};

cleanTestData();
