const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
  // Hero Section
  hero: {
    badge: {
      type: String,
      default: "Trusted by Thousands Worldwide"
    },
    title: {
      line1: { type: String, default: "Discover Your" },
      line2: { type: String, default: "Spiritual Path" }
    },
    description: {
      type: String,
      default: "Connect with gifted, certified psychics for personalized guidance, clarity, and spiritual growth. Experience authentic connections that illuminate your life's journey."
    },
    buttons: {
      primary: {
        text: { type: String, default: "Start Chatting Now" },
        action: { type: String, default: "chat" }
      },
      secondary: {
        text: { type: String, default: "Begin Free Trial" },
        action: { type: String, default: "register" }
      }
    },
    trustIndicators: [
      {
        icon: { type: String, default: "star" },
        text: { type: String, default: "4.9/5 Rating" },
        value: { type: String, default: "4.9" }
      },
      {
        icon: { type: String, default: "users" },
        text: { type: String, default: "10,000+ Satisfied Clients" },
        value: { type: String, default: "10000" }
      },
      {
        icon: { type: String, default: "globe" },
        text: { type: String, default: "Global Community" },
        value: { type: String, default: "global" }
      }
    ],
    featuredPsychic: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: "Top-Rated Psychic" },
      quote: { type: String, default: "I've helped over 500 clients find clarity and direction in their lives. Let me guide you on your spiritual journey." }
    }
  },

  // Trust & Security Section
  trustSection: {
    title: { type: String, default: "Trust & Security" },
    items: [
      {
        icon: { type: String, default: "shield" },
        title: { type: String, default: "100% Secure" },
        description: { type: String, default: "End-to-end encryption" }
      },
      {
        icon: { type: String, default: "lock" },
        title: { type: String, default: "Private" },
        description: { type: String, default: "Confidential sessions" }
      },
      {
        icon: { type: String, default: "check-circle" },
        title: { type: String, default: "Verified" },
        description: { type: String, default: "Certified psychics" }
      },
      {
        icon: { type: String, default: "clock" },
        title: { type: String, default: "24/7 Support" },
        description: { type: String, default: "Always available" }
      }
    ]
  },

  // Featured Psychics Section
  featuredSection: {
    badge: {
      type: String,
      default: "Our Human Psychics"
    },
    title: {
      type: String,
      default: "Meet Our Top-Rated Psychics"
    },
    description: {
      type: String,
      default: "Carefully selected for their exceptional accuracy, empathy, and client satisfaction"
    },
    displayCount: {
      type: Number,
      default: 6
    },
    showViewAllButton: {
      type: Boolean,
      default: true
    }
  },

  // Features Section
  featuresSection: {
    badge: {
      type: String,
      default: "Why HecateVoyance Stands Out"
    },
    title: {
      type: String,
      default: "The Ultimate Spiritual Guidance Platform"
    },
    description: {
      type: String,
      default: "We combine ancient wisdom with modern technology to provide authentic, transformative experiences"
    },
    features: [
      {
        icon: { type: String, default: "🎯" },
        title: { type: String, default: "Precision Matching" },
        description: { type: String, default: "Our advanced algorithm connects you with psychics whose specialties align perfectly with your needs." },
        features: [
          { type: String, default: "Skill-based matching" },
          { type: String, default: "Personality compatibility" },
          { type: String, default: "Client success rates" }
        ]
      },
      {
        icon: { type: String, default: "🔮" },
        title: { type: String, default: "Diverse Modalities" },
        description: { type: String, default: "Access specialists in tarot, astrology, mediumship, numerology, and more for comprehensive guidance." },
        features: [
          { type: String, default: "Multiple reading types" },
          { type: String, default: "Specialized experts" },
          { type: String, default: "Cross-disciplinary insights" }
        ]
      },
      {
        icon: { type: String, default: "💖" },
        title: { type: String, default: "Empathetic Connections" },
        description: { type: String, default: "Build meaningful relationships with psychics who genuinely care about your spiritual journey." },
        features: [
          { type: String, default: "Compassionate listeners" },
          { type: String, default: "Non-judgmental space" },
          { type: String, default: "Personalized approach" }
        ]
      },
      {
        icon: { type: String, default: "🛡️" },
        title: { type: String, default: "Rigorous Vetting" },
        description: { type: String, default: "Every psychic undergoes thorough screening, testing, and ongoing quality assessment." },
        features: [
          { type: String, default: "Background checks" },
          { type: String, default: "Skill verification" },
          { type: String, default: "Client feedback review" }
        ]
      },
      {
        icon: { type: String, default: "⚡" },
        title: { type: String, default: "Instant Access" },
        description: { type: String, default: "Connect with available psychics immediately or schedule sessions at your convenience." },
        features: [
          { type: String, default: "Live availability" },
          { type: String, default: "Flexible scheduling" },
          { type: String, default: "Global timezone support" }
        ]
      },
      {
        icon: { type: String, default: "📈" },
        title: { type: String, default: "Growth-Focused" },
        description: { type: String, default: "Tools and resources to track your spiritual development and reading history." },
        features: [
          { type: String, default: "Session records" },
          { type: String, default: "Progress insights" },
          { type: String, default: "Personalized recommendations" }
        ]
      }
    ]
  },

  // CTA Section
  ctaSection: {
    title: {
      type: String,
      default: "Ready to Begin Your Spiritual Journey?"
    },
    description: {
      type: String,
      default: "Join thousands who have found clarity, direction, and peace through authentic psychic connections"
    },
    button: {
      text: { type: String, default: "Start Chatting Now" },
      action: { type: String, default: "chat" }
    },
    footer: {
      type: String,
      default: "No credit card required for trial · Cancel anytime · 100% satisfaction guarantee"
    }
  },

  // SEO Settings
  seo: {
    metaTitle: { 
      type: String, 
      default: "HecateVoyance - Spiritual Guidance & Psychic Readings" 
    },
    metaDescription: { 
      type: String, 
      default: "Connect with gifted psychics for personalized guidance, clarity, and spiritual growth. Experience authentic connections that illuminate your life's journey." 
    },
    metaKeywords: { 
      type: String, 
      default: "psychic, spiritual guidance, tarot, astrology, mediumship, numerology" 
    },
    ogImage: { type: String, default: "" }
  },

  // Colors (for theme customization)
  colors: {
    deepPurple: { type: String, default: "#2B1B3F" },
    antiqueGold: { type: String, default: "#C9A24D" },
    softIvory: { type: String, default: "#F5F3EB" },
    lightGold: { type: String, default: "#E8D9B0" },
    darkPurple: { type: String, default: "#1A1129" }
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

// Ensure only one active home page configuration
homeSchema.pre('save', async function(next) {
  if (this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false }
    );
  }
  next();
});

module.exports = mongoose.model('Home', homeSchema);