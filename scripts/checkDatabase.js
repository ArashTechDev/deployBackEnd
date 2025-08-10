require('dotenv').config();
const mongoose = require('mongoose');
const DietaryRestriction = require('../src/db/models/DietaryRestriction.model');

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking database connection and data...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bytebasket';
    console.log('🔗 Connecting to:', mongoUri.replace(/\/\/.*@/, '//***:***@'));

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    console.log('📂 Database name:', mongoose.connection.name);

    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(
      '📋 Available collections:',
      collections.map(c => c.name)
    );

    // Count dietary restrictions
    const count = await DietaryRestriction.countDocuments();
    console.log('📊 Dietary restrictions count:', count);

    if (count > 0) {
      console.log('\n📝 First few dietary restrictions:');
      const restrictions = await DietaryRestriction.find().limit(3);
      restrictions.forEach(r => {
        console.log(`  - ${r.name} (${r.category})`);
      });
    } else {
      console.log('❌ No dietary restrictions found in database!');

      // Check if collection exists but is empty
      const collectionExists = collections.some(c => c.name === 'dietaryrestrictions');
      if (collectionExists) {
        console.log('📂 Collection exists but is empty');
      } else {
        console.log('📂 Collection does not exist');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Connection closed');
  }
};

checkDatabase();
