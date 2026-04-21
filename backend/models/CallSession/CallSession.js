const mongoose = require("mongoose");

const callSessionSchema = new mongoose.Schema({
  // Call identifier
  callSid: {
    type: String,
    unique: true,
    default: function() {
      return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  },
  
  // Room name
  roomName: {
    type: String,
    required: true
  },
  
  // Twilio room SID
  roomSid: String,
  
  // Participants
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  psychicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Psychic",
    required: true,
    index: true
  },
  
  // Status
  status: {
    type: String,
    enum: [
      'initiated', 'ringing', 'active', 'in-progress', 'completed', 
      'rejected', 'cancelled', 'missed', 'failed', 'pending'
    ],
    default: 'initiated',
    index: true
  },
  
  endReason: {
    type: String,
    enum: [
      'completed_normally', 'ended_by_user', 'ended_by_psychic', 
      'insufficient_credits', 'participant_disconnected', 'call_timeout', 
      'psychic_busy', 'user_cancelled', 'technical_error', 'other',
      'max_duration_reached', 'abandoned'
    ]
  },
  
  // Timing
  startTime: Date,
  endTime: Date,
  durationSeconds: {
    type: Number,
    default: 0
  },
  
  // Rate info
  ratePerMin: {
    type: Number,
    required: true,
    default: 1
  },
  creditsPerMin: {
    type: Number,
    required: true,
    default: 1
  },
  totalCreditsUsed: {
    type: Number,
    default: 0
  },
  
  // Earnings
  psychicEarnings: {
    type: Number,
    default: 0
  },
  platformFee: {
    type: Number,
    default: 0
  },
  
  // Tokens
  twilioToken: String,
  participantTokens: {
    user: String,
    psychic: String
  },
  
  // Recording
  recordingUrl: String,
  recordingSid: String,
  
  // Billing
  lastBilledAt: Date,
  
  // Free session
  isFreeSession: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  errorMessage: String,
  userPlatform: String,
  psychicPlatform: String,
  
  // References
  callRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CallRequest",
    index: true
  },
  activeSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ActiveCallSession",
    index: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes
callSessionSchema.index({ userId: 1, createdAt: -1 });
callSessionSchema.index({ psychicId: 1, createdAt: -1 });
callSessionSchema.index({ status: 1, createdAt: -1 });
callSessionSchema.index({ roomName: 1 });
callSessionSchema.index({ callSid: 1 });
callSessionSchema.index({ callRequestId: 1 });
callSessionSchema.index({ activeSessionId: 1 });

// Virtuals
callSessionSchema.virtual('formattedDuration').get(function() {
  if (!this.durationSeconds) return '0:00';
  const minutes = Math.floor(this.durationSeconds / 60);
  const seconds = this.durationSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

callSessionSchema.virtual('callCost').get(function() {
  return (this.durationSeconds / 60) * this.ratePerMin;
});

// Pre-save hook
callSessionSchema.pre('save', function(next) {
  if (this.startTime && this.endTime && !this.durationSeconds) {
    this.durationSeconds = Math.max(0, Math.floor((this.endTime - this.startTime) / 1000));
  }
  this.updatedAt = new Date();
  next();
});

// Methods
callSessionSchema.methods.endCall = function(reason = 'ended_by_user') {
  this.status = 'completed';
  this.endReason = reason;
  this.endTime = new Date();
  if (this.startTime && this.endTime) {
    this.durationSeconds = Math.max(0, Math.floor((this.endTime - this.startTime) / 1000));
  }
  return this.save();
};

// Static method to get user's call history with pagination
callSessionSchema.statics.getUserHistory = async function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const [calls, total] = await Promise.all([
    this.find({ userId })
      .populate('psychicId', 'name image ratePerMin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments({ userId })
  ]);
  
  return { calls, total, page, limit, pages: Math.ceil(total / limit) };
};

module.exports = mongoose.model("CallSession", callSessionSchema);