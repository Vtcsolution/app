const mongoose = require('mongoose');

const footerSchema = new mongoose.Schema({
  // Company Information
  company: {
    name: {
      type: String,
      default: "HecateVoyance"
    },
    tagline: {
      type: String,
      default: "SPIRITUAL GUIDANCE"
    },
    description: {
      type: String,
      default: "Your trusted source for spiritual guidance, psychic readings, and personal transformation since 2020."
    },
    foundedYear: {
      type: Number,
      default: 2020
    }
  },

  // Social Media Links
  socialMedia: {
    instagram: {
      url: { type: String, default: "https://instagram.com/hecatevoyance" },
      active: { type: Boolean, default: true }
    },
    facebook: {
      url: { type: String, default: "https://facebook.com/hecatevoyance" },
      active: { type: Boolean, default: true }
    },
    linkedin: {
      url: { type: String, default: "https://linkedin.com/company/hecatevoyance" },
      active: { type: Boolean, default: true }
    },
    twitter: {
      url: { type: String, default: "https://twitter.com/hecatevoyance" },
      active: { type: Boolean, default: true }
    },
    tiktok: {
      url: { type: String, default: "https://tiktok.com/@hecatevoyance" },
      active: { type: Boolean, default: true }
    },
    youtube: {
      url: { type: String, default: "https://youtube.com/@hecatevoyance" },
      active: { type: Boolean, default: true }
    }
  },

  // Navigation Links - Explore Section
  exploreLinks: [
    {
      label: { type: String, default: "Home" },
      url: { type: String, default: "/" },
      active: { type: Boolean, default: true },
      order: { type: Number, default: 1 }
    },
    {
      label: { type: String, default: "About Us" },
      url: { type: String, default: "/about" },
      active: { type: Boolean, default: true },
      order: { type: Number, default: 2 }
    },
    {
      label: { type: String, default: "Our Psychics" },
      url: { type: String, default: "/psychics" },
      active: { type: Boolean, default: true },
      order: { type: Number, default: 3 }
    },
    {
      label: { type: String, default: "Blogs & Articles" },
      url: { type: String, default: "/blogs" },
      active: { type: Boolean, default: true },
      order: { type: Number, default: 4 }
    }
  ],

  // Legal Links
  legalLinks: [
    {
      label: { type: String, default: "Terms & Conditions" },
      url: { type: String, default: "/terms-&-conditions" },
      active: { type: Boolean, default: true },
      order: { type: Number, default: 1 }
    }
  ],

  // Contact Information
  contact: {
    email: {
      address: { type: String, default: "info@hecatevoyance.com" },
      displayText: { type: String, default: "info@hecatevoyance.com" },
      active: { type: Boolean, default: true }
    },
    support: {
      text: { type: String, default: "Support" },
      url: { type: String, default: "/contact" },
      active: { type: Boolean, default: true }
    }
  },

  // Bottom Bar
  bottomBar: {
    copyrightText: {
      type: String,
      default: "All rights reserved."
    },
    tagline: {
      type: String,
      default: "Spiritual guidance for the modern seeker"
    },
    showPaymentMethods: {
      type: Boolean,
      default: true
    }
  },

  // Payment Methods
  paymentMethods: {
    visa: { type: Boolean, default: true },
    mastercard: { type: Boolean, default: true },
    paypal: { type: Boolean, default: true },
    amex: { type: Boolean, default: false },
    applePay: { type: Boolean, default: false },
    googlePay: { type: Boolean, default: false }
  },

  // Colors (for theme customization)
  colors: {
    background: { type: String, default: "#F9FAFB" },
    text: { type: String, default: "#111827" },
    link: { type: String, default: "#4B5563" },
    linkHover: { type: String, default: "#7C3AED" },
    border: { type: String, default: "#E5E7EB" },
    iconColor: { type: String, default: "#6B7280" }
  },

  // SEO Settings
  seo: {
    metaTitle: { type: String, default: "HecateVoyance - Spiritual Guidance" },
    metaDescription: { type: String, default: "Connect with us for spiritual guidance and psychic readings." },
    metaKeywords: { type: String, default: "footer, contact, spiritual guidance" }
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

// Ensure only one active footer configuration
footerSchema.pre('save', async function(next) {
  if (this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false }
    );
  }
  next();
});

module.exports = mongoose.model('Footer', footerSchema);