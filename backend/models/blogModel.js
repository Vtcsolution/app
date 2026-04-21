const mongoose = require('mongoose');

// Function to generate slug from title
const generateSlug = (title) => {
  if (!title) return null;
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
};

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined but maintain uniqueness for actual values
    index: true,
  },
  excerpt: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Tarot', 'Astrology', 'Numerology', 'Palmistry', 'Love & Relationships',
      'Career Guidance', 'Spiritual Growth', 'Dream Interpretation',
      'Meditation & Mindfulness', 'Crystal Healing', 'Aura Reading',
      'Past Life Regression', 'Chakra Healing', 'Angel Numbers', 'Psychic Development'
    ],
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
  authorBio: {
    type: String,
    trim: true,
  },
  authorImage: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  readTime: {
    type: String,
    required: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  image: {
    type: String,
    required: true,
  },
  images: [{
    type: String,
  }],
  tags: [{
    type: String,
    trim: true,
  }],
  featured: {
    type: Boolean,
    default: false,
  },
  trending: {
    type: Boolean,
    default: false,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  metaTitle: {
    type: String,
    trim: true,
  },
  metaDescription: {
    type: String,
    trim: true,
  },
  metaKeywords: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Generate slug before saving
blogSchema.pre('save', async function(next) {
  if (!this.isModified('title') && this.slug) {
    return next();
  }
  
  // Generate slug from title
  let slug = generateSlug(this.title);
  
  // Ensure uniqueness
  let uniqueSlug = slug;
  let counter = 1;
  let exists = await this.constructor.findOne({ slug: uniqueSlug, _id: { $ne: this._id } });
  
  while (exists) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
    exists = await this.constructor.findOne({ slug: uniqueSlug, _id: { $ne: this._id } });
  }
  
  this.slug = uniqueSlug;
  next();
});

// Indexes for better query performance
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ featured: 1 });
blogSchema.index({ trending: 1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('Blog', blogSchema);