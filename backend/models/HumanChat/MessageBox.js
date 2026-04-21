const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Reference to the chat room/session - CHANGED TO HumanChatSession
  chatSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HumanChatSession', // Changed from 'ChatSession'
    required: true,
    index: true
  },
  
  // Sender information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel'
  },
  
  // Dynamic reference to either User or Psychic model
  senderModel: {
    type: String,
    required: true,
    enum: ['User', 'Psychic']
  },
  
  // Receiver information
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'receiverModel'
  },
  
  // Dynamic reference to either User or Psychic model
  receiverModel: {
    type: String,
    required: true,
    enum: ['User', 'Psychic']
  },
  
  // Message content
  content: {
    type: String,
    trim: true,
    required: function() {
      return this.messageType === 'text';
    }
  },
  
  // Message type for handling different content
  messageType: {
    type: String,
    enum: ['text', 'emoji', 'image', 'file', 'system'],
    default: 'text'
  },
  
  // File URL if message contains image/file
  mediaUrl: {
    type: String,
    default: null
  },
  
  // File metadata
  mediaType: {
    type: String,
    default: null
  },
  
  // File size in bytes
  fileSize: {
    type: Number,
    default: null
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false
  },
  
  // Read timestamp
  readAt: {
    type: Date,
    default: null
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // For emoji reactions
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'reactions.userModel'
    },
    userModel: {
      type: String,
      enum: ['User', 'Psychic']
    },
    emoji: {
      type: String,
      required: true
    },
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // For replying to specific messages
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  // Delete status (for soft delete)
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  // Deleted for specific users (for selective delete)
  deletedFor: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'deletedFor.userModel'
    },
    userModel: {
      type: String,
      enum: ['User', 'Psychic']
    }
  }],
  
  // ===== NEW FIELDS FOR WARNING SYSTEM =====
  // Flag if this message contains prohibited content
  containsProhibitedContent: {
    type: Boolean,
    default: false
  },
  
  // What type of prohibited content was detected
  prohibitedContentTypes: [{
    type: String,
    enum: ['email', 'phone', 'link', 'other']
  }],
  
  // Warning ID if this message triggered a warning
  warningId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warning',
    default: null
  },
  
  // Whether this message was blocked
  isBlocked: {
    type: Boolean,
    default: false
  },
  
  // Redacted content (for display when blocked)
  redactedContent: {
    type: String,
    default: null
  },
  
  // Timestamp when warning was issued
  warningIssuedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster queries
messageSchema.index({ chatSession: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ containsProhibitedContent: 1 });
messageSchema.index({ warningId: 1 });

// Method to check if message was flagged
messageSchema.methods.isFlagged = function() {
  return this.containsProhibitedContent === true || this.isBlocked === true;
};

// Method to get safe content for display
messageSchema.methods.getSafeContent = function() {
  if (this.isBlocked && this.redactedContent) {
    return this.redactedContent;
  }
  return this.content;
};

const MessageBox = mongoose.model('MessageBox', messageSchema);

module.exports = MessageBox;