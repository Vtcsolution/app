const mongoose = require('mongoose');

const chatRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  psychic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Psychic',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'active', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: Date,
  rejectedAt: Date,
  startedAt: Date,
  endedAt: Date,
  
  // Timer and Payment Details
  ratePerMin: {
    type: Number,
    default: 1,
    required: true
  },
  initialBalance: {
    type: Number,
    required: true
  },
  remainingBalance: {
    type: Number,
    default: 0
  },
  totalMinutesAllowed: {
    type: Number,
    default: 0
  },
  totalSecondsAllowed: {
    type: Number,
    default: 0
  },
  
  // Real-time Session Tracking
  paidSession: {
    isActive: {
      type: Boolean,
      default: false
    },
    startTime: Date,
    endTime: Date,
    totalSeconds: {
      type: Number,
      default: 0
    },
    remainingSeconds: {
      type: Number,
      default: 0
    },
    lastDeductionTime: Date,
    isPaused: {
      type: Boolean,
      default: false
    },
    pausedAt: Date,
    pauseDuration: {
      type: Number,
      default: 0
    },
    lastSyncTime: {
      type: Date,
      default: Date.now
    }
  },
  
  // Financial tracking
  deductions: [{
    timestamp: Date,
    secondsUsed: Number,
    amount: Number,
    remainingBalance: Number
  }],
  totalAmountPaid: {
    type: Number,
    default: 0
  },
  
  // Timer reference
  paidTimerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaidTimer'
  },
  
  // Metadata
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
chatRequestSchema.index({ user: 1, psychic: 1, status: 1 });
chatRequestSchema.index({ status: 1, createdAt: 1 });
chatRequestSchema.index({ 'paidSession.isActive': 1 });
chatRequestSchema.index({ 'paidSession.remainingSeconds': 1 });

// Pre-save middleware
chatRequestSchema.pre('save', function(next) {
  this.lastUpdatedAt = new Date();
  
  if (this.isModified('initialBalance') || this.isModified('ratePerMin')) {
    this.totalMinutesAllowed = Math.floor(this.initialBalance / this.ratePerMin);
    this.totalSecondsAllowed = this.totalMinutesAllowed * 60;
    if (!this.remainingBalance) {
      this.remainingBalance = this.initialBalance;
    }
  }
  
  // Update paidSession.remainingSeconds if it's not set
  if (this.paidSession && this.paidSession.isActive && !this.paidSession.remainingSeconds) {
    if (this.totalSecondsAllowed > 0) {
      const elapsed = Date.now() - new Date(this.startedAt).getTime();
      const elapsedSeconds = Math.floor(elapsed / 1000);
      this.paidSession.remainingSeconds = Math.max(0, this.totalSecondsAllowed - elapsedSeconds);
    }
  }
  
  next();
});

// Method to calculate remaining seconds
chatRequestSchema.methods.calculateRemainingSeconds = function() {
  if (!this.paidSession.isActive) return 0;
  
  if (this.paidSession.remainingSeconds && this.paidSession.remainingSeconds > 0) {
    return this.paidSession.remainingSeconds;
  }
  
  if (this.totalSecondsAllowed > 0 && this.startedAt) {
    const now = new Date();
    const elapsed = Math.floor((now - new Date(this.startedAt)) / 1000);
    const remaining = Math.max(0, this.totalSecondsAllowed - elapsed);
    return remaining;
  }
  
  return 0;
};

// Method to calculate remaining balance
chatRequestSchema.methods.calculateRemainingBalance = function() {
  if (!this.paidSession.isActive) return this.remainingBalance || 0;
  
  const remainingSeconds = this.calculateRemainingSeconds();
  const usedSeconds = Math.max(0, (this.totalSecondsAllowed || 0) - remainingSeconds);
  const usedMinutes = usedSeconds / 60;
  const usedCredits = usedMinutes * (this.ratePerMin || 1);
  
  return Math.max(0, (this.initialBalance || 0) - usedCredits);
};

module.exports = mongoose.model('ChatRequest', chatRequestSchema);