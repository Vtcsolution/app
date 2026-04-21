const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 100,
    default: function() {
      return `${this.name.toLowerCase().replace(/\s+/g, '.')}@visitor.com`;
    }
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
    index: true
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }]
}, {
  timestamps: true
});

// Index for faster queries
commentSchema.index({ blogId: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ isApproved: 1 });

// Virtual for reply count
commentSchema.virtual('replyCount').get(function() {
  return this.replies?.length || 0;
});

// Ensure virtuals are included in JSON output
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema);