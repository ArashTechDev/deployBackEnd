/* eslint-disable indent */
// backend/src/index.js
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

require('./models'); // This will register all models

const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import all route files
const authRoutes = require('./api/auth.routes');
const inventoryRoutes = require('./api/routes/inventory');
const donationRoutes = require('./routes/donation.routes');
const dietaryPreferencesRoutes = require('./routes/dietaryPreferences.routes');
const dietaryRestrictionsRoutes = require('./routes/dietaryRestrictions.routes');

// Import foodbank routes
const foodbankRoutes = require('./api/foodbank');

// Import storage location routes
const storageLocationRoutes = require('./api/storageLocations');

// Import volunteer routes
const volunteerRoutes = require('./routes/volunteer.routes');
const shiftRoutes = require('./routes/shift.routes');
const volunteerShiftRoutes = require('./routes/volunteerShift.routes');

// Import cart/wishlist and reports routes
const cartRoutes = require('./routes/cart.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const basicReportsRoutes = require('./routes/basicReports.routes');
const foodRequestRoutes = require('./routes/foodRequest.routes');

const app = express();

// Database connection function
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bytebasket', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['self'],
        styleSrc: ['self', 'unsafe-inline'],
        scriptSrc: ['self'],
        imgSrc: ['self', 'data:', 'https:'],
      },
    },
  })
);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// CORS configuration
const corsOptions = {
  origin: '*',
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongoose: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    models: Object.keys(mongoose.models), // This will show which models are registered
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/foodbanks', foodbankRoutes);
app.use('/api/storage', storageLocationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/dietary-preferences', dietaryPreferencesRoutes);
app.use('/api/dietary-restrictions', dietaryRestrictionsRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/volunteer-shifts', volunteerShiftRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlists', wishlistRoutes);
app.use('/api/reports', basicReportsRoutes);
app.use('/api/food-requests', foodRequestRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await connectMongoDB();

    // Log registered models after connection
    console.log('📚 Registered Mongoose models:', Object.keys(mongoose.models));

    app.listen(PORT, () => {
      console.log(
        `🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
      console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🏪 Food Banks API: http://localhost:${PORT}/api/foodbanks`);
      console.log(`📦 Storage API: http://localhost:${PORT}/api/storage`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  console.error('Shutting down the server due to unhandled promise rejection');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err.message);
  console.error('Shutting down the server due to uncaught exception');
  process.exit(1);
});

startServer();
