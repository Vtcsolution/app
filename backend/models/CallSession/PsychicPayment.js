// models/Admin/PsychicPayment.js

const mongoose = require('mongoose');

const psychicPaymentSchema = new mongoose.Schema({
  psychicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Psychic',
    required: true
  },
  // Payment details
  amount: {
    type: Number,
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe', 'cash', 'other'],
    default: 'bank_transfer'
  },
  // Split information
  totalEarnings: {
    type: Number,
    required: true
  },
  platformCommission: {
    type: Number,
    required: true
  },
  psychicPayout: {
    type: Number,
    required: true
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'processed', 'failed', 'cancelled'],
    default: 'processed'
  },
  // Breakdown from both models
  earningsBreakdown: {
    chatEarnings: {
      type: Number,
      default: 0
    },
    callEarnings: {
      type: Number,
      default: 0
    },
    sessionsBreakdown: [{
      sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'earningsBreakdown.sessionsBreakdown.sessionType'
      },
      sessionType: {
        type: String,
        enum: ['ChatRequest', 'ActiveCallSession']
      },
      amount: Number,
      date: Date,
      duration: Number
    }]
  },
  // Before payment stats
  beforePaymentStats: {
    totalEarnings: Number,
    paidAmount: Number,
    pendingAmount: Number
  },
  // After payment stats
  afterPaymentStats: {
    totalEarnings: Number,
    paidAmount: Number,
    pendingAmount: Number
  },
  // Admin info
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  notes: String,
  // Metadata
  paymentDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
psychicPaymentSchema.index({ psychicId: 1, paymentDate: -1 });
psychicPaymentSchema.index({ status: 1 });
psychicPaymentSchema.index({ paymentId: 1 }, { unique: true });

module.exports = mongoose.model('PsychicPayment', psychicPaymentSchema);