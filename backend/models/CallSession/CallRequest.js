// models/CallSession/CallRequest.js
const mongoose = require("mongoose");

const callRequestSchema = new mongoose.Schema({
  // Request info
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
  
  // Room name - ADD THIS FIELD
  roomName: {
    type: String,
    // DO NOT make it unique here - it causes problems
    sparse: true // Allows null/multiple
  },
  
  // Request status
  status: {
    type: String,
    enum: [
      'pending',      // Waiting for psychic response
      'accepted',     // Psychic accepted
      'rejected',     // Psychic rejected
      'expired',      // Request expired (not answered in time)
      'cancelled',    // User cancelled
      'busy',         // Psychic busy
      'no-credit'     // Insufficient credits
    ],
    default: 'pending'
  },
  
  // Time tracking
  requestedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 1000) // 30 seconds
  },
  respondedAt: {
    type: Date
  },
  
  // Call session reference (if accepted)
  callSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CallSession"
  },
  
  // Call identifier - UNIQUE
  callIdentifier: {
    type: String,
    unique: true
  },
  
  // Rate info
  ratePerMin: {
    type: Number,
    required: true
  },
  creditsPerMin: {
    type: Number,
    required: true
  },
  
  // User's current credits at time of request
  userCreditsAtRequest: {
    type: Number,
    required: true
  },
  
  // User token for Twilio
  userToken: String,
  
  // Rejection reason (if any)
  rejectionReason: String,
  
  // Push notification info
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationSentAt: Date,
  notificationId: String
  
}, { timestamps: true });

// Indexes - FIX: Use sparse index for roomName
callRequestSchema.index({ roomName: 1 }, { sparse: true }); // NOT unique
callRequestSchema.index({ callIdentifier: 1 }, { unique: true }); // Unique here
callRequestSchema.index({ psychicId: 1, status: 1, expiresAt: 1 });
callRequestSchema.index({ userId: 1, createdAt: -1 });
callRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Check if request is expired
callRequestSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

// Virtual for time remaining
callRequestSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const remaining = this.expiresAt - now;
  return Math.max(0, Math.floor(remaining / 1000));
});

module.exports = mongoose.model("CallRequest", callRequestSchema);