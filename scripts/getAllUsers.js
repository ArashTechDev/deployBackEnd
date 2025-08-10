// backend/scripts/getAllUsers.js
// Fetch and print all users to the terminal

require('dotenv').config();
const mongoose = require('mongoose');

const { connectMongoDB } = require('../src/config/mongodb');
const User = require('../src/db/models/User');

(async () => {
  try {
    console.log('👤 Listing all users...');

    // Connect to MongoDB using shared config helper
    await connectMongoDB();
    console.log(`📂 Database: ${mongoose.connection.name}`);

    // Fetch users
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    console.log(`📊 Total users: ${users.length}`);

    if (users.length) {
      console.log('\n📝 Users:');
      users.forEach((u, idx) => {
        console.log(
          `${idx + 1}. id=${u._id} | name=${u.name} | email=${u.email} | role=${u.role} | active=${u.isActive} | verified=${u.isVerified} | createdAt=${u.createdAt}`
        );
      });
    }

    await mongoose.connection.close();
    console.log('🔒 Connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fetching users:', err.message);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  }
})();


