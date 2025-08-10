// backend/src/db/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Core authentication fields (from User.js)
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      select: false,
    },

    // Additional fields (from User.js) - optional for backward compatibility
    username: {
      type: String,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    full_name: {
      type: String,
      trim: true,
      // If full_name is provided, use it; otherwise use name
      get: function () {
        return this._full_name || this.name;
      },
      set: function (value) {
        this._full_name = value;
      },
    },
    phone: {
      type: String,
      trim: true,
    },

    // Role management
    role: {
      type: String,
      enum: ['admin', 'staff', 'volunteer', 'donor', 'recipient'],
      default: 'donor',
    },

    // Food bank association
    foodbank_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodBank',
      required: function () {
        return ['admin', 'staff'].includes(this.role);
      },
    },

    // Dietary information
    dietary_restrictions: {
      type: [String],
      default: [],
    },

    // Status fields
    isActive: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Boolean,
      default: true,
      // Alias for isActive for backward compatibility
      get: function () {
        return this.isActive;
      },
      set: function (value) {
        this.isActive = value;
      },
    },

    // Verification system
    isVerified: {
      type: Boolean,
      default: false,
    },
    verification_status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      // Sync with isVerified
      get: function () {
        if (this.isVerified) return 'verified';
        return this._verification_status || 'pending';
      },
      set: function (value) {
        this._verification_status = value;
        this.isVerified = value === 'verified';
      },
    },

    // Authentication tokens
    verificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Activity tracking
    lastLogin: Date,
  },
  {
    timestamps: true,
    // Handle virtual fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ foodbank_id: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isVerified: 1 });

// Virtual for ID
userSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Transform output to clean up sensitive data
userSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.__v;
    delete ret.verificationToken;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret._full_name;
    delete ret._verification_status;
    return ret;
  },
});

// Pre-save middleware
userSchema.pre('save', async function (next) {
  // Normalize role to lowercase
  if (this.isModified('role') && this.role) {
    this.role = this.role.toLowerCase();
  }

  // Generate username from email if not provided
  if (!this.username && this.email) {
    const baseUsername = this.email.split('@')[0];
    let username = baseUsername;
    let counter = 1;

    // Ensure username uniqueness
    while (await this.constructor.findOne({ username, _id: { $ne: this._id } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    this.username = username;
  }

  // Hash password only if modified
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function () {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Static methods
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function () {
  return this.find({ isActive: true, isVerified: true });
};

// Ensure model doesn't already exist to prevent OverwriteModelError
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
