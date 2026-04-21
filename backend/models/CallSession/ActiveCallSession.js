const mongoose = require("mongoose");

const activeCallSessionSchema = new mongoose.Schema({
  // Basic info
  roomName: { 
    type: String, 
    required: true,
    default: function() {
      return `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  },
  
  // Call identifier
  callIdentifier: {
    type: String,
    unique: true,
    sparse: true
  },
  
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
  
  // Call status
  status: {
    type: String,
    enum: [
      'initiated',
      'ringing',
      'in-progress',
      'ended',
      'failed',
      'rejected'
    ],
    default: 'initiated',
    index: true
  },
  
  // Timing
  startTime: {
    type: Date,
    index: true
  },
  endTime: Date,
  
  // Credit tracking - CRITICAL FOR BILLING
  creditsPerMin: {
    type: Number,
    default: 1
  },
  ratePerMin: {
    type: Number,
    default: 1
  },
  lastDeductedMinute: {
    type: Number,
    default: 0
  },
  totalCreditsUsed: {
    type: Number,
    default: 0
  },
  lastChargeTime: Date,
  
  // Free session tracking
  isFreeSession: {
    type: Boolean,
    default: false
  },
  freeSessionUsed: {
    type: Boolean,
    default: false
  },
  freeEndTime: Date,
  remainingFreeTime: {
    type: Number,
    default: 0
  },
  
  // Twilio info
  twilioRoomSid: String,
  roomSid: String,
  participantTokens: {
    user: String,
    psychic: String
  },
  recordingUrl: String,
  recordingSid: String,
  
  // Job processing locks
  lock: {
    type: Boolean,
    default: false,
    index: true
  },
  lastProcessed: {
    type: Date,
    index: true
  },
  
  // Metadata
  endReason: {
    type: String,
    enum: [
      'completed_normally',
      'ended_by_user',
      'ended_by_psychic',
      'insufficient_credits',
      'participant_disconnected',
      'call_timeout',
      'user_cancelled',
      'psychic_rejected',
      'max_duration_reached',
      'abandoned'
    ]
  },
  endedBy: {
    type: String,
    enum: ['user', 'psychic', 'system']
  },
  errorMessage: String,
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Platform info
  userPlatform: String,
  psychicPlatform: String,
  
  // References
  callRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CallRequest",
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

// Compound indexes for performance
activeCallSessionSchema.index({ userId: 1, status: 1 });
activeCallSessionSchema.index({ psychicId: 1, status: 1 });
activeCallSessionSchema.index({ status: 1, isArchived: 1, lock: 1 });
activeCallSessionSchema.index({ roomName: 1 });
activeCallSessionSchema.index({ callIdentifier: 1 }, { unique: true, sparse: true });

// Update timestamp before save
activeCallSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to calculate current duration
activeCallSessionSchema.methods.getCurrentDuration = function() {
  if (!this.startTime) return 0;
  if (this.status !== 'in-progress') return this.durationSeconds || 0;
  return Math.floor((new Date() - this.startTime) / 1000);
};

// Method to calculate credits used
activeCallSessionSchema.methods.getCreditsUsed = function() {
  const durationSeconds = this.getCurrentDuration();
  const minutesUsed = Math.ceil(durationSeconds / 60);
  return minutesUsed * (this.creditsPerMin || 1);
};

// Method to check if call should end due to insufficient credits
activeCallSessionSchema.methods.shouldEndDueToCredits = async function() {
  const Wallet = mongoose.model('Wallet');
  const wallet = await Wallet.findOne({ userId: this.userId });
  
  if (!wallet) return true;
  
  const creditsNeeded = this.getCreditsUsed() - (this.totalCreditsUsed || 0);
  return wallet.credits < creditsNeeded;
};

module.exports = mongoose.model("ActiveCallSession", activeCallSessionSchema);