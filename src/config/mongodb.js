// backend/src/config/mongodb.js
const mongoose = require('mongoose');

const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/bytebasket';
    
    const options = {
      dbName: process.env.MONGO_DB_NAME || 'bytebasket',
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      // Removed deprecated options:
      // - useNewUrlParser (default in Mongoose 6+)
      // - useUnifiedTopology (default in Mongoose 6+)
      // - bufferCommands (removed)
      // - bufferMaxEntries (removed)
    };

    await mongoose.connect(mongoURI, options);
    
    console.log(`✅ MongoDB connected successfully to ${options.dbName}`);
    console.log(`🔗 Connection string: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔒 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });
    
    return mongoose.connection;
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

// Test connection function
const testConnection = async () => {
  try {
    const connection = await connectMongoDB();
    console.log('🧪 Testing MongoDB connection...');
    await connection.db.admin().ping();
    console.log('✅ MongoDB connection test successful');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error);
    return false;
  }
};

module.exports = { connectMongoDB, testConnection };
