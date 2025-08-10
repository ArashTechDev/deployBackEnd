const { AppError } = require('../utils/errors');

const errorHandler = (err, _req, res) => {
  let error = { ...err };
  error.message = err.message || 'Server Error';

  // Log full error in development
  console.error(`[ERROR] ${err.name || 'Error'}:`, err);

  // Mongoose: Invalid ObjectId
  if (err.name === 'CastError') {
    error = new AppError('Resource not found', 404);
  }

  // Mongoose: Duplicate key
  if (err.code === 11000) {
    error = new AppError('Duplicate field value entered', 400);
  }

  // Mongoose: Validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(messages, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  // Multer: File size too large
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File too large', 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
