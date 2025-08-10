// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../db/models/User');
require('../utils/errors');

exports.authMiddleware = async (req, res, next) => {
  try {
    console.log('Auth middleware triggered');
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token provided or invalid format');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token extracted:', token ? 'Token present' : 'No token');

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', { id: decoded.id });

      // Get user from database to ensure they still exist
      const user = await User.findById(decoded.id).select('-password');
      console.log('User lookup result:', user ? 'User found' : 'User not found');

      if (!user) {
        console.log('User not found in database');
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user no longer exists',
        });
      }

      if (!user.isActive) {
        console.log('User account is deactivated');
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated',
        });
      }

      // Attach user info to request
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        foodbank_id: user.foodbank_id,
      };

      console.log('Auth middleware success:', {
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
      });

      next(); // Allow the request to proceed
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);

      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format',
        });
      }

      return res.status(403).json({
        success: false,
        message: 'Invalid token',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Role-based authorization middleware
exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('No user in request object');
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log(`User role ${req.user.role} not in allowed roles:`, roles);
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: insufficient permissions',
      });
    }

    console.log(`Role authorization success for ${req.user.role}`);
    next();
  };
};
