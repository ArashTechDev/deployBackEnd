/* eslint-disable linebreak-style */
// backend/test-connection.js
require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    console.log('🔄 Testing MongoDB Atlas connection...');
    console.log('URI:', process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'ByteBasket',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log('Database name:', mongoose.connection.name);
    
    // Test a simple operation
    await mongoose.connection.db.admin().ping();
    console.log('✅ Database ping successful!');
    
    await mongoose.connection.close();
    console.log('🔒 Connection closed');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('🔑 Check your username and password');
    }
    if (error.message.includes('network')) {
      console.log('🌐 Check your internet connection and Atlas IP whitelist');
    }
  }
};

testConnection();