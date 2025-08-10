// backend/src/db/mongoose.js
require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    console.log('✅ Mongoose already connected');
    return;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI is missing. Check your .env file or dotenv path.');
    return;
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(uri, {
      dbName: 'ByteBasket'
    });
    console.log('✅ Mongoose connected to ByteBasket DB');
  } catch (err) {
    console.error('❌ Mongoose connection error:', err.message);
  }
}

module.exports = {connectDB, mongoose};
