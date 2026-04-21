const mongoose = require('mongoose');

const termsSchema = new mongoose.Schema({
  // Hero Section
  hero: {
    title: {
      type: String,
      default: "Terms & Conditions"
    },
    subtitle: {
      type: String,
      default: "HecateVoyance - Clear, Transparent, and Professional"
    },
    icon: {
      type: String,
      default: "scroll-text"
    }
  },

  // Quick Navigation Items
  quickNav: [
    {
      label: { type: String, default: "User Responsibilities" },
      id: { type: String, default: "responsibilities" }
    },
    {
      label: { type: String, default: "Payment Terms" },
      id: { type: String, default: "payment" }
    },
    {
      label: { type: String, default: "Refund Policy" },
      id: { type: String, default: "refund" }
    },
    {
      label: { type: String, default: "Disclaimer" },
      id: { type: String, default: "disclaimer" }
    },
    {
      label: { type: String, default: "Intellectual Property" },
      id: { type: String, default: "property" }
    }
  ],

  // User Responsibilities Section
  userResponsibilities: {
    title: {
      type: String,
      default: "User Responsibilities"
    },
    subtitle: {
      type: String,
      default: "Your commitment to ethical use"
    },
    description: {
      type: String,
      default: "By using HecateVoyance services, you agree to the following responsibilities:"
    },
    items: [
      { type: String, default: "Providing accurate and truthful information for personal spiritual analysis." },
      { type: String, default: "Respecting our psychics and adhering to community guidelines at all times." },
      { type: String, default: "Avoiding service misuse for unethical or illegal purposes." },
      { type: String, default: "Maintaining the confidentiality of your account credentials." },
      { type: String, default: "Using our services responsibly and in accordance with all applicable laws." }
    ],
    importantNote: {
      type: String,
      default: "You are solely responsible for any insights or decisions made based on psychic guidance received through our platform."
    }
  },

  // Payment Terms Section
  paymentTerms: {
    title: {
      type: String,
      default: "Payment Terms"
    },
    subtitle: {
      type: String,
      default: "Transparent pricing and billing"
    },
    description: {
      type: String,
      default: "HecateVoyance operates on a credit-based system and/or subscription model."
    },
    systems: [
      {
        title: { type: String, default: "Credit System" },
        description: { type: String, default: "Purchase credits for specific consultations (e.g., $3.99/min for chat sessions)." }
      },
      {
        title: { type: String, default: "Subscription Plans" },
        description: { type: String, default: "Monthly packages for premium features and discounted rates." }
      }
    ],
    importantNotes: [
      { type: String, default: "All prices are clearly displayed before payment confirmation" },
      { type: String, default: "Rates may vary based on psychic expertise and service type" },
      { type: String, default: "You will be notified of any price changes 30 days in advance" }
    ]
  },

  // Refund Policy Section
  refundPolicy: {
    title: {
      type: String,
      default: "Refund Policy"
    },
    subtitle: {
      type: String,
      default: "Our commitment to fair service"
    },
    description: {
      type: String,
      default: "Due to the digital and immediate nature of our services:"
    },
    finalSaleNote: {
      type: String,
      default: "All sales are final. No refunds will be issued for completed psychic sessions."
    },
    technicalIssue: {
      title: { type: String, default: "Technical Issue Resolution:" },
      description: { type: String, default: "If you experience technical problems (e.g., system errors, not receiving your consultation), contact our support team within 24 hours for assessment and possible compensation." },
      responseTime: { type: String, default: "Support response time: 1-2 business days" }
    },
    exceptions: [
      {
        type: { type: String, default: "no-refund" },
        text: { type: String, default: "No refunds for subjective dissatisfaction with reading outcomes" }
      },
      {
        type: { type: String, default: "refund-eligible" },
        text: { type: String, default: "Refunds may be considered for verified technical failures preventing service delivery" }
      },
      {
        type: { type: String, default: "pro-rated" },
        text: { type: String, default: "Unused subscription portions may be eligible for pro-rated refunds (case-by-case basis)" }
      }
    ]
  },

  // Disclaimer Section
  disclaimer: {
    title: {
      type: String,
      default: "Important Disclaimer"
    },
    subtitle: {
      type: String,
      default: "Understanding the nature of our services"
    },
    criticalWarning: {
      title: { type: String, default: "⚠️ CRITICAL INFORMATION" },
      text: { type: String, default: "Psychic insights provided on HecateVoyance are for spiritual guidance and entertainment purposes only." }
    },
    points: [
      {
        title: { type: String, default: "Not Professional Advice" },
        description: { type: String, default: "Our services are NOT a substitute for professional legal, medical, psychological, or financial advice." }
      },
      {
        title: { type: String, default: "Personal Judgment Required" },
        description: { type: String, default: "Users must exercise their own judgment when interpreting readings and making life decisions." }
      },
      {
        title: { type: String, default: "For Entertainment Purposes" },
        description: { type: String, default: "The platform is intended for entertainment and spiritual exploration purposes." }
      }
    ],
    liabilityNotice: {
      type: String,
      default: "HecateVoyance and its psychics are not liable for any decisions, actions, or outcomes resulting from guidance received through our platform."
    }
  },

  // Intellectual Property Section
  intellectualProperty: {
    title: {
      type: String,
      default: "Intellectual Property"
    },
    subtitle: {
      type: String,
      default: "Protecting our content and your rights"
    },
    description: {
      type: String,
      default: "All content on the platform, including but not limited to UI designs, logos, psychic profiles, reading methodologies, and generated insights are protected intellectual property of HecateVoyance."
    },
    protected: [
      { type: String, default: "Platform design and interface" },
      { type: String, default: "Psychic profiles and branding" },
      { type: String, default: "Reading methodologies and systems" },
      { type: String, default: "Generated content and insights" }
    ],
    restricted: [
      { type: String, default: "Reproducing or copying platform content" },
      { type: String, default: "Modifying or creating derivative works" },
      { type: String, default: "Distributing or commercializing our content" },
      { type: String, default: "Using our branding without permission" }
    ],
    warning: {
      type: String,
      default: "Any unauthorized use of HecateVoyance intellectual property will result in immediate termination of service and may lead to legal action."
    }
  },

  // Acceptance Section
  acceptance: {
    title: {
      type: String,
      default: "Agreement Acceptance"
    },
    description: {
      type: String,
      default: "By using HecateVoyance services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions."
    },
    backToTopText: {
      type: String,
      default: "Back to Top"
    },
    returnHomeText: {
      type: String,
      default: "Return Home"
    }
  },

  // Footer
  footer: {
    companyName: {
      type: String,
      default: "HecateVoyance"
    },
    copyrightText: {
      type: String,
      default: "All rights reserved."
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
    metaTitle: { type: String, default: "Terms & Conditions - HecateVoyance" },
    metaDescription: { type: String, default: "Read HecateVoyance's Terms & Conditions. Understand our policies on user responsibilities, payment terms, refunds, disclaimers, and intellectual property." },
    metaKeywords: { type: String, default: "terms and conditions, terms of service, user agreement, payment terms, refund policy, disclaimer, intellectual property" },
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

// Ensure only one active terms page configuration
termsSchema.pre('save', async function(next) {
  if (this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false }
    );
  }
  next();
});

module.exports = mongoose.model('Terms', termsSchema);