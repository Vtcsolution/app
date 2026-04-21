const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    // Optional: link to specific chat session
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create compound index for unique user-psychic rating (one rating per user per psychic)
ratingSchema.index({ user: 1, psychic: 1 }, { unique: true });

// Virtual for formatted rating text
ratingSchema.virtual('ratingText').get(function() {
  const ratings = {
    1: 'Very Poor',
    2: 'Poor',
    3: 'Average',
    4: 'Good',
    5: 'Excellent'
  };
  return ratings[this.rating] || 'Not Rated';
});

// Calculate average rating for a psychic (static method)
ratingSchema.statics.getAverageRating = async function(psychicId) {
  const result = await this.aggregate([
    { $match: { psychic: psychicId } },
    { $group: {
        _id: '$psychic',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
    }}
  ]);
  
  return result[0] || { averageRating: 0, totalRatings: 0 };
};

// Get ratings with user details (instance method)
ratingSchema.statics.getRatingsWithUsers = async function(psychicId, limit = 10, skip = 0) {
  return await this.find({ psychic: psychicId })
    .populate('user', 'firstName lastName username image')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;