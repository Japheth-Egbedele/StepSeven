const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [100, 'Account name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Account type is required'],
    enum: {
      values: ['ASSET', 'LIABILITY', 'EQUITY'],
      message: 'Type must be ASSET, LIABILITY, or EQUITY'
    },
    uppercase: true
  },
  subType: {
    type: String,
    required: [true, 'Account subtype is required'],
    enum: {
      values: ['CASH', 'BANK', 'CREDIT_CARD', 'LOAN', 'INVESTMENT', 'INITIAL_BALANCE'],
      message: 'Invalid subtype'
    },
    uppercase: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Balance must be an integer (stored in subunits)'
    }
  },
  includeInTotal: {
    type: Boolean,
    default: true
  },
  currency: {
    type: String,
    default: 'NGN',
    uppercase: true
  },
  icon: {
    type: String,
    default: '💰'
  },
  color: {
    type: String,
    default: '#3B82F6',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Color must be a valid hex code'
    }
  },
  creditCardDetails: {
    creditLimit: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Credit limit must be an integer'
      }
    },
    billingCycleDay: {
      type: Number,
      min: [1, 'Billing cycle day must be between 1 and 31'],
      max: [31, 'Billing cycle day must be between 1 and 31']
    },
    statementDate: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v);
        },
        message: 'Statement date must be ISO 8601 format'
      }
    },
    dueDate: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v);
        },
        message: 'Due date must be ISO 8601 format'
      }
    }
  },
  loanDetails: {
    originalAmount: {
      type: Number,
      validate: {
        validator: Number.isInteger,
        message: 'Original amount must be an integer'
      }
    },
    interestRate: {
      type: Number,
      min: [0, 'Interest rate cannot be negative'],
      max: [100, 'Interest rate cannot exceed 100%']
    },
    minimumPayment: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Minimum payment must be an integer'
      }
    },
    startDate: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v);
        },
        message: 'Start date must be ISO 8601 format'
      }
    },
    endDate: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v);
        },
        message: 'End date must be ISO 8601 format'
      }
    }
  },
  sinkingFunds: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    targetAmount: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: 'Target amount must be an integer'
      }
    },
    currentAmount: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Current amount must be an integer'
      }
    },
    targetDate: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v);
        },
        message: 'Target date must be ISO 8601 format'
      }
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }
  }],
isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isEmergencyFund: {
    type: Boolean,
    default: false,
    index: true
  },
  order: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
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

// Compound indexes
AccountSchema.index({ user: 1, type: 1, isActive: 1 });
AccountSchema.index({ user: 1, subType: 1 });
AccountSchema.index({ user: 1, name: 1 });

// Update timestamp
AccountSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validation: Credit card details only for CREDIT_CARD subtype
AccountSchema.pre('save', function(next) {
  if (this.subType !== 'CREDIT_CARD') {
    this.creditCardDetails = undefined;
  }
  next();
});

// Validation: Loan details only for LOAN subtype
AccountSchema.pre('save', function(next) {
  if (this.subType !== 'LOAN') {
    this.loanDetails = undefined;
  }
  next();
});

module.exports = mongoose.model('Account', AccountSchema);