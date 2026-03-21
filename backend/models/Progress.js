const mongoose = require('mongoose');
const ProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true,
    index: true
  },
  currentStep: {
    type: Number,
    required: true,
    default: 1,
    min: [1, 'Current step must be between 1 and 7'],
    max: [7, 'Current step must be between 1 and 7']
  },
  step1: {
    targetAmount: {
      type: Number,
      default: 12500000,
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
    completed: {
      type: Boolean,
      default: false
    },
    completedDate: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v);
        },
        message: 'Completed date must be ISO 8601 format'
      }
    }
  },
  step2: {
    debts: [{
      accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
      },
      name: String,
      originalBalance: Number,
      currentBalance: Number,
      minimumPayment: Number,
      order: Number,
      isPaidOff: {
        type: Boolean,
        default: false
      },
      paidOffDate: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v);
          },
          message: 'Paid off date must be ISO 8601 format'
        }
      }
    }],
    totalDebtOriginal: {
      type: Number,
      default: 0
    },
    totalDebtRemaining: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedDate: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v);
        },
        message: 'Completed date must be ISO 8601 format'
      }
    }
  },
  step3: {
    targetAmount: {
      type: Number,
      default: 0
    },
    monthsOfExpenses: {
      type: Number,
      default: 6,
      min: 3,
      max: 12
    },
    currentAmount: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedDate: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v);
        },
        message: 'Completed date must be ISO 8601 format'
      }
    }
  },
  step4: {
    active: {
      type: Boolean,
      default: false
    }
  },
  step5: {
    active: {
      type: Boolean,
      default: false
    }
  },
  step6: {
    active: {
      type: Boolean,
      default: false
    }
  },
  step7: {
    active: {
      type: Boolean,
      default: false
    }
  },
  lastCalculated: {
    type: String,
    default: () => new Date().toISOString(),
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v);
      },
      message: 'Last calculated must be ISO 8601 format'
    }
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

module.exports = mongoose.model('Progress', ProgressSchema);