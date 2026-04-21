const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  image: { type: String, default: "" },
  gender: { type: String, enum: ['male', 'female']},
  password: { type: String, required: true, minlength: 6 },
  dob: { type: Date,  },
  birthTime: { type: String, },
  birthPlace: { type: String, },
  bio: { type: String, trim: true },
  hasUsedFreeAudioMinute: { 
    type: Boolean, 
    default: false 
  },
  socketId: { type: String },
  lastSeen: { type: Date, default: Date.now },
  hasUsedFreeAudioMinute: { 
    type: Boolean, 
    default: false 
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  hasRequestedFreeReport: { type: Boolean, default: false },
  hasUsedFreeMinute: { type: Boolean, default: false },
  
  // ===== NEW FIELDS FOR WARNING SYSTEM =====
  warnings: [{
    warningId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warning'
    },
    type: {
      type: String,
      enum: ['email', 'phone', 'link', 'other'],
      required: true
    },
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    chatSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HumanChatSession'
    },
    psychicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Psychic'
    },
    content: String,
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  warningCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deactivatedAt: {
    type: Date,
    default: null
  },
  deactivationReason: {
    type: String,
    enum: ['warning_limit', 'admin', 'other'],
    default: null
  }
}, { timestamps: true });

// Method to check if user can send messages
userSchema.methods.canSendMessage = function() {
  return this.isActive === true;
};

// Method to get warning status
userSchema.methods.getWarningStatus = function() {
  return {
    warningCount: this.warningCount,
    isActive: this.isActive,
    remainingWarnings: Math.max(0, 3 - this.warningCount),
    deactivatedAt: this.deactivatedAt
  };
};

module.exports = mongoose.model("User", userSchema);