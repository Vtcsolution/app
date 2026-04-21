// models/Pages/psychicsPageModel.js
const mongoose = require('mongoose');

const psychicsPageSchema = new mongoose.Schema({
  // Hero Section
  hero: {
    badge: {
      type: String,
      default: "Our Gifted Community"
    },
    title: {
      type: String,
      default: "Meet Our Gifted Psychics"
    },
    highlightedText: {
      type: String,
      default: "Gifted Psychics"
    },
    description: {
      type: String,
      default: "Discover authentic spiritual guides ready to illuminate your path with wisdom, empathy, and profound insight."
    }
  },

  // Stats Section (for the stats bar)
  stats: [
    {
      label: { type: String, default: "Psychics Found" },
      valueKey: { type: String, default: "filteredCount" }, // dynamic key
      icon: { type: String, default: "users" },
      suffix: { type: String, default: "" }
    },
    {
      label: { type: String, default: "Available Now" },
      valueKey: { type: String, default: "availableCount" },
      icon: { type: String, default: "zap" },
      suffix: { type: String, default: "" }
    },
    {
      label: { type: String, default: "Average Rating" },
      valueKey: { type: String, default: "averageRating" },
      icon: { type: String, default: "star" },
      suffix: { type: String, default: "" }
    },
    {
      label: { type: String, default: "Total Readings" },
      valueKey: { type: String, default: "totalReadings" },
      icon: { type: String, default: "award" },
      suffix: { type: String, default: "+" }
    }
  ],

  // Search Bar Section
  searchSection: {
    placeholder: {
      type: String,
      default: "Search psychics by name, specialty, or ability..."
    },
    availableNowText: {
      type: String,
      default: "Available Now"
    },
    clearText: {
      type: String,
      default: "Clear"
    }
  },

  // Features Section
  featuresSection: {
    title: {
      type: String,
      default: "Why Choose Our Psychics?"
    },
    description: {
      type: String,
      default: "Every psychic in our community meets our high standards for authenticity and excellence"
    },
    features: [
      {
        icon: { type: String, default: "shield" },
        title: { type: String, default: "Rigorous Vetting" },
        description: { type: String, default: "Every psychic undergoes extensive screening, testing, and background checks." }
      },
      {
        icon: { type: String, default: "heart" },
        title: { type: String, default: "Empathetic Approach" },
        description: { type: String, default: "Our psychics provide compassionate guidance in a judgment-free space." }
      },
      {
        icon: { type: String, default: "award" },
        title: { type: String, default: "Proven Accuracy" },
        description: { type: String, default: "High client satisfaction rates and consistent positive feedback." }
      }
    ]
  },

  // CTA Section
  ctaSection: {
    title: {
      type: String,
      default: "Need Help Finding the Right Psychic?"
    },
    description: {
      type: String,
      default: "Our matching algorithm can connect you with the perfect psychic for your specific needs"
    },
    buttons: {
      primary: {
        text: { type: String, default: "Take Our Matching Quiz" },
        action: { type: String, default: "/quiz" }
      },
      secondary: {
        text: { type: String, default: "Contact Support" },
        action: { type: String, default: "/contact" }
      }
    }
  },

  // No Results Section
  noResultsSection: {
    title: {
      type: String,
      default: "No Psychics Found"
    },
    description: {
      type: String,
      default: "Try adjusting your search or turn off \"Available Now\" filter"
    },
    buttonText: {
      type: String,
      default: "Show All Psychics"
    }
  },

  // Colors (for theme customization)
  colors: {
    deepPurple: { type: String, default: "#2B1B3F" },
    antiqueGold: { type: String, default: "#C9A24D" },
    softIvory: { type: String, default: "#F5F3EB" },
    lightGold: { type: String, default: "#E8D9B0" },
    darkPurple: { type: String, default: "#1A1129" }
  },

  // SEO Settings
  seo: {
    metaTitle: { type: String, default: "Our Psychics - Meet Our Gifted Spiritual Guides | HecateVoyance" },
    metaDescription: { type: String, default: "Connect with our community of verified, gifted psychics. Get accurate readings and spiritual guidance from trusted advisors available 24/7." },
    metaKeywords: { type: String, default: "psychics, spiritual guides, tarot reading, astrology, psychic reading, online psychics" },
    ogImage: { type: String }
  },

  // Settings
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  lastPublishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  lastPublishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure only one active psychics page configuration
psychicsPageSchema.pre('save', async function(next) {
  if (this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false }
    );
  }
  next();
});

module.exports = mongoose.model('PsychicsPage', psychicsPageSchema);