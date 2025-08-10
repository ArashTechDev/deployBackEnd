// backend/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError, catchAsync } = require('../utils/errors');
const User = require('../db/models/User');
const {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail,
} = require('../services/emailService');

const generateToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user,
    },
  });
};

const register = async (req, res, next) => {
  try {
    let { name, email, password, role = 'donor' } = req.body;

    if (!name || !email || !password) {
      return next(new AppError('Please provide name, email and password', 400));
    }

    role = role.toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('User already exists with this email', 400));
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Pass plain password here, model pre-save hook will hash it
    const newUser = await User.create({
      name,
      email,
      password,
      role,
      verificationToken,
      isVerified: false,
    });

    // Send verification email
    try {
      await sendVerificationEmail(newUser, verificationToken);

      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        data: {
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            isVerified: newUser.isVerified,
          },
        },
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);

      // Still return success but mention email issue
      res.status(201).json({
        success: true,
        message:
          "Registration successful! However, we couldn't send the verification email. Please contact support.",
        data: {
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            isVerified: newUser.isVerified,
          },
        },
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    next(error);
  }
};

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log(`Login attempt for email: ${email}`);

  if (!email || !password) {
    console.log('Email or password missing');
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    console.log('User not found');
    return next(new AppError('Incorrect email or password', 401));
  }

  const isPasswordCorrect = await user.correctPassword(password, user.password);
  console.log(`Password match: ${isPasswordCorrect}`);

  if (!isPasswordCorrect) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // Check if user is verified
  if (!user.isVerified) {
    return next(
      new AppError(
        'Please verify your email address before logging in. Check your inbox for the verification email.',
        401
      )
    );
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});

const logout = catchAsync(async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.query;

  console.log('🔄 Verifying email with token:', token);

  if (!token) {
    console.log('❌ No token provided');
    return next(new AppError('Verification token is required', 400));
  }

  // Find user with this verification token
  console.log('🔍 Searching for user with token...');
  console.log('🔗 Token received:', token);
  console.log('📏 Token length:', token?.length);
  console.log('🗃️ MongoDB URI:', process.env.MONGO_URI ? 'Set' : 'Not set');

  const user = await User.findOne({ verificationToken: token });
  console.log('👤 User found:', user ? 'Yes' : 'No');

  // Additional debugging: count all users with tokens
  const usersWithTokens = await User.countDocuments({
    verificationToken: { $exists: true, $ne: null },
  });
  console.log('📊 Total users with verification tokens in DB:', usersWithTokens);

  if (!user) {
    console.log('❌ No user found with token');
    return next(new AppError('Invalid or expired verification token', 400));
  }

  if (user.isVerified) {
    return res.status(200).json({
      success: true,
      message: 'Email already verified. You can now log in.',
      data: { user: { email: user.email, name: user.name, role: user.role } },
    });
  }

  // Update user verification status
  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save({ validateBeforeSave: false });

  // Send welcome email
  try {
    await sendWelcomeEmail(user);
  } catch (error) {
    console.error('Welcome email sending failed:', error);
    // Don't fail the verification process if welcome email fails
  }

  res.status(200).json({
    success: true,
    message: 'Email verified successfully! You can now log in.',
    data: { user: { email: user.email, name: user.name, role: user.role } },
  });
});

const resendVerificationEmail = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('No user found with this email address', 404));
  }

  if (user.isVerified) {
    return next(new AppError('Email is already verified', 400));
  }

  // Generate new verification token
  const verificationToken = generateVerificationToken();
  user.verificationToken = verificationToken;
  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    await sendVerificationEmail(user, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.',
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    return next(new AppError('Failed to send verification email. Please try again later.', 500));
  }
});

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  resendVerificationEmail,
};
