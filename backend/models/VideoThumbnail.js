
const mongoose = require('mongoose');

const VideoThumbnailSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'single_thumbnail', // Fixed ID to ensure only one document
  },
  thumbnailUrl: {
    type: String,
    required: true, // thumbnail image URL
  },
  metadata: {
    type: Object,
    default: {},
  },
}, { 
  timestamps: true, // adds createdAt and updatedAt
});

// Ensure only one document can exist by overriding the default _id behavior
VideoThumbnailSchema.pre('save', async function (next) {
  const count = await mongoose.model('VideoThumbnail').countDocuments();
  if (count > 0 && this.isNew) {
    throw new Error('Only one thumbnail can be stored in the database');
  }
  next();
});

module.exports = mongoose.model('VideoThumbnail', VideoThumbnailSchema);
