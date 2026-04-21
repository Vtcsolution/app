const mongoose = require('mongoose');

const paidTimerSchema = new mongoose.Schema({
  chatRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRequest',
    required: true,
    unique: true
  },
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
  // Timer details
  totalSeconds: {
    type: Number,
    required: true
  },
  remainingSeconds: {
    type: Number,
    required: true
  },
  ratePerMin: {
    type: Number,
    required: true
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'stopped', 'expired'],
    default: 'active'
  },
  // Time tracking
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  lastDeductionTime: Date,
  // Pause tracking
  isPaused: {
    type: Boolean,
    default: false
  },
  pauseStartTime: Date,
  totalPauseDuration: {
    type: Number,
    default: 0
  },
  // Balance tracking
  initialBalance: Number,
  remainingBalance: Number,
  deductions: [{
    timestamp: Date,
    secondsUsed: Number,
    amount: Number,
    newBalance: Number
  }]
}, {
  timestamps: true
});

// Indexes
paidTimerSchema.index({ chatRequestId: 1, status: 1 });
paidTimerSchema.index({ status: 1, remainingSeconds: 1 });
paidTimerSchema.index({ user: 1, psychic: 1 });

module.exports = mongoose.models.PaidTimer || mongoose.model('PaidTimer', paidTimerSchema);
