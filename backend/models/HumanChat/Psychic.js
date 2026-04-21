const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the category enum
const psychicCategories = [
  'Tarot Reading',
  'Astrology',
  'Reading',
  'Love & Relationships',
  'Career & Finance',
  'Spiritual Guidance',
  'Numerology',
  'Clairvoyant',
  'Dream Analysis'
];

const psychicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  ratePerMin: {
    type: Number,
    required: true,
  },
  bio: {
    type: String,
    required: true,
  },
  socketId: { type: String },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other'],
  },
  category: {
    type: String,
    required: true,
    enum: psychicCategories,
    default: 'Reading'
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
    default: ''
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  },
  type: {
    type: String,
    default: 'Human Psychic'
  },
  abilities: {
    type: [String],
    default: []
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    default: ''
  },
  languages: {
    type: [String],
    default: ['English']
  },
  experience: {
    type: Number,
    default: 0
  },
  specialization: {
    type: String,
    default: ''
  },
  // Status tracking
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  // For session tracking
  currentSessions: {
    type: Number,
    default: 0
  },
  maxSessions: {
    type: Number,
    default: 1
  },
  availability: {
    type: Boolean,
    default: true
  },
  responseTime: {
    type: Number,
    default: 5
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  // Store active session IDs for reference
  activeSessionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRequest'
  }],
  
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
}, {
  timestamps: true,
});

psychicSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

psychicSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for formatted rating display
psychicSchema.virtual('ratingDisplay').get(function() {
  if (this.totalRatings === 0) return 'No ratings yet';
  return `${this.averageRating.toFixed(1)} (${this.totalRatings} reviews)`;
});

// Method to update rating stats
psychicSchema.methods.updateRatingStats = async function() {
  const Rating = require('./Rating');
  
  const stats = await Rating.aggregate([
    { $match: { psychic: this._id } },
    { $group: {
        _id: '$psychic',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
    }}
  ]);
  
  if (stats[0]) {
    this.averageRating = stats[0].averageRating || 0;
    this.totalRatings = stats[0].totalRatings || 0;
    await this.save();
  }
  
  return {
    averageRating: this.averageRating,
    totalRatings: this.totalRatings
  };
};

// Method to check if psychic can send messages
psychicSchema.methods.canSendMessage = function() {
  return this.isActive === true;
};

// Method to get warning status
psychicSchema.methods.getWarningStatus = function() {
  return {
    warningCount: this.warningCount,
    isActive: this.isActive,
    remainingWarnings: Math.max(0, 3 - this.warningCount),
    deactivatedAt: this.deactivatedAt
  };
};

module.exports = mongoose.model('Psychic', psychicSchema);
module.exports.psychicCategories = psychicCategories;