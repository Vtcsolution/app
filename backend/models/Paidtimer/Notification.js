
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientModel'
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['User', 'Psychic']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['User', 'Psychic']
  },
  type: {
    type: String,
    enum: [
      'chat_request',
      'chat_accepted',
      'chat_rejected',
      'timer_started',
      'timer_paused',
      'timer_stopped',
      'balance_low',
      'session_ended',
      'payment_deducted'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  chatRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRequest'
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, recipientModel: 1, createdAt: -1 });
module.exports =
  mongoose.models.Notification ||
  mongoose.model('Notification', notificationSchema);
