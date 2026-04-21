// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  currency: {
    code: { 
      type: String, 
      default: 'NGN',
      uppercase: true,
      enum: ['NGN', 'USD', 'EUR', 'GBP']
    },
    symbol: { type: String, default: '₦' },
    subunitName: { type: String, default: 'kobo' },
    subunitToUnit: { type: Number, default: 100 }
  },
  preferences: {
    theme: { 
      type: String, 
      enum: ['light', 'dark'], 
      default: 'light' 
    },
    startOfWeek: { 
      type: Number, 
      default: 1,
      min: 0,
      max: 6
    },
    dateFormat: { 
      type: String, 
      default: 'DD/MM/YYYY',
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']
    },
    burnRateDailySubunits: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'burnRateDailySubunits must be an integer (stored in subunits)'
      },
      min: [0, 'burnRateDailySubunits cannot be negative']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update timestamp
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Get public profile
// In User model, ensure this method exists:
UserSchema.methods.getPublicProfile = function () {
  return {
    _id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    currency: this.currency,
    preferences: this.preferences,
    createdAt: this.createdAt
  };
};

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', UserSchema);