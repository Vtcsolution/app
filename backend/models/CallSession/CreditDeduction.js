const mongoose = require("mongoose");

const creditDeductionSchema = new mongoose.Schema({
  callSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CallSession",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  psychicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Psychic",
    required: true
  },
  
  // Deduction details
  creditsDeducted: {
    type: Number,
    required: true,
    min: 0
  },
  deductionTime: {
    type: Date,
    required: true
  },
  
  // Rate info
  ratePerMin: {
    type: Number,
    required: true
  },
  durationSeconds: {
    type: Number,
    required: true
  },
  
  // Before/after balances
  creditsBefore: {
    type: Number,
    required: true
  },
  creditsAfter: {
    type: Number,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['success', 'failed', 'refunded'],
    default: 'success'
  },
  
  // Metadata
  notes: String,
  errorMessage: String
}, { timestamps: true });

// Indexes
creditDeductionSchema.index({ userId: 1, deductionTime: -1 });
creditDeductionSchema.index({ callSessionId: 1 });
creditDeductionSchema.index({ psychicId: 1, deductionTime: -1 });

module.exports = mongoose.model("CreditDeduction", creditDeductionSchema);