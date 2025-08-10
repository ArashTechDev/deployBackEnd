require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/db/models/User');

const listAllUsers = async () => {
  try {
    console.log('🔍 Connecting to database to list all users...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bytebasket';
    const dbName = process.env.MONGO_DB_NAME || 'ByteBasket';

    // Construct full URI with database name
    const fullMongoUri = mongoUri.endsWith('/') ? `${mongoUri}${dbName}` : `${mongoUri}/${dbName}`;

    console.log('🔗 Connecting to:', fullMongoUri.replace(/\/\/.*@/, '//***:***@'));
    console.log('📊 Database Name:', dbName);

    await mongoose.connect(fullMongoUri);
    console.log('✅ Connected to MongoDB');
    console.log('📂 Database name:', mongoose.connection.name);

    // Get all users
    const users = await User.find({}).select('-password -verificationToken -passwordResetToken');

    console.log(`\n📊 Total users found: ${users.length}`);

    if (users.length === 0) {
      console.log('❌ No users found in database!');
    } else {
      console.log('\n👥 All users in database:');
      console.log('='.repeat(80));

      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User Details:`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Verified: ${user.isVerified}`);
        console.log(`   Created: ${user.createdAt}`);
        if (user.lastLogin) {
          console.log(`   Last Login: ${user.lastLogin}`);
        }
        if (user.foodbank_id) {
          console.log(`   Food Bank ID: ${user.foodbank_id}`);
        }
        console.log('   -'.repeat(40));
      });
    }

    // Show user count by role
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    if (roleStats.length > 0) {
      console.log('\n📈 Users by role:');
      roleStats.forEach(stat => {
        console.log(`   ${stat._id}: ${stat.count} users`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Connection closed');
  }
};

listAllUsers();
