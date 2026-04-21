const mongoose = require('mongoose');

const warningSchema = new mongoose.Schema({
  // Who issued the warning (system)
  issuedBy: {
    type: String,
    default: 'system',
    enum: ['system', 'admin']
  },
  
  // The psychic who received the warning
  psychicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Psychic',
    required: true,
    index: true
  },
  
  // The user involved in the chat
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // The chat session where violation occurred
  chatSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HumanChatSession',
    required: true,
    index: true
  },
  
  // The message that triggered the warning
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageBox',
    required: true
  },
  
  // Type of violation
  warningType: {
    type: String,
    enum: ['email', 'phone', 'link', 'other'],
    required: true
  },
  
  // The content that was detected
  detectedContent: {
    type: String,
    required: true
  },
  
  // Full message content (for reference)
  fullMessage: {
    type: String,
    required: true
  },
  
  // Warning number (1st, 2nd, 3rd)
  warningNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  
  // Status of the warning
  status: {
    type: String,
    enum: ['active', 'appealed', 'expired', 'resolved'],
    default: 'active'
  },
  
  // Whether this warning led to deactivation
  ledToDeactivation: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // When the warning was acknowledged by the psychic
  acknowledgedAt: {
    type: Date,
    default: null
  },
  
  // Expiry date (warnings could expire after time)
  expiresAt: {
    type: Date,
    default: function() {
      // Warnings expire after 30 days by default
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },
  
  // Admin notes (if reviewed)
  adminNotes: {
    type: String,
    default: null
  },
  
  // Reviewed by admin
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for finding warnings
warningSchema.index({ psychicId: 1, status: 1, createdAt: -1 });
warningSchema.index({ chatSessionId: 1, createdAt: -1 });

// Method to check if warning is still active
warningSchema.methods.isActive = function() {
  return this.status === 'active' && (!this.expiresAt || this.expiresAt > new Date());
};

// Method to expire warning
warningSchema.methods.expire = async function() {
  this.status = 'expired';
  return this.save();
};

// Static method to get active warning count for a psychic
warningSchema.statics.getActiveWarningCount = async function(psychicId) {
  const count = await this.countDocuments({
    psychicId,
    status: 'active',
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });
  return count;
};

// Static method to check if psychic should be deactivated
warningSchema.statics.shouldDeactivate = async function(psychicId) {
  const activeCount = await this.getActiveWarningCount(psychicId);
  return activeCount >= 3;
};

module.exports = mongoose.model('Warning', warningSchema);