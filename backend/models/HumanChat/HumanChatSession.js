const mongoose = require('mongoose');

const HumanChatSessionSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['active', 'ended', 'blocked', 'waiting'],
    default: 'waiting'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: null
  },
  unreadCounts: {
    user: { type: Number, default: 0 },
    psychic: { type: Number, default: 0 }
  },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  sessionDuration: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  settings: {
    allowEmojis: { type: Boolean, default: true },
    allowMedia: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true }
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'blockedByModel',
    default: null
  },
  blockedByModel: {
    type: String,
    enum: ['User', 'Psychic'],
    default: null
  },
  blockReason: { type: String, default: null }
}, { timestamps: true });

/* ✅ INDEXES */
HumanChatSessionSchema.index({ user: 1, psychic: 1, status: 1 });
HumanChatSessionSchema.index({ lastMessageAt: -1 });

/* ✅ VIRTUALS */
HumanChatSessionSchema.virtual('participants').get(function () {
  return {
    userId: this.user,
    psychicId: this.psychic
  };
});

/* ✅ MODEL */
const HumanChatSession = mongoose.model(
  'HumanChatSession',
  HumanChatSessionSchema
);

module.exports = HumanChatSession;
