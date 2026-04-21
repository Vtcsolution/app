const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  // Hero Section
  hero: {
    title: {
      type: String,
      default: "Connect With Our Spiritual Guides"
    },
    subtitle: {
      type: String,
      default: "Your journey deserves personalized attention. Reach out to our team of experienced psychics and spiritual advisors."
    },
    badges: [
      {
        icon: { type: String, default: "shield" },
        text: { type: String, default: "100% Confidential" }
      },
      {
        icon: { type: String, default: "clock" },
        text: { type: String, default: "24h Response Time" }
      },
      {
        icon: { type: String, default: "star" },
        text: { type: String, default: "Premium Support" }
      },
      {
        icon: { type: String, default: "check-circle" },
        text: { type: String, default: "Satisfaction Guarantee" }
      }
    ]
  },

  // Contact Information Section
  contactInfo: {
    title: {
      type: String,
      default: "Contact Information"
    },
    points: [
      {
        icon: { type: String, default: "mail" },
        title: { type: String, default: "General Inquiries" },
        details: { type: String, default: "info@spiritueelchatten.com" },
        link: { type: String, default: "mailto:info@spiritueelchatten.com" },
        description: { type: String, default: "For general questions and support" }
      },
      {
        icon: { type: String, default: "message-square" },
        title: { type: String, default: "VIP Client Support" },
        details: { type: String, default: "vip@spiritueelchatten.com" },
        link: { type: String, default: "mailto:vip@spiritueelchatten.com" },
        description: { type: String, default: "Dedicated support for premium members" }
      },
      {
        icon: { type: String, default: "phone" },
        title: { type: String, default: "Phone Support" },
        details: { type: String, default: "+1 (555) 123-4567" },
        link: { type: String, default: "tel:+15551234567" },
        description: { type: String, default: "Mon-Fri, 9AM-6PM EST" }
      },
      {
        icon: { type: String, default: "map-pin" },
        title: { type: String, default: "Headquarters" },
        details: { type: String, default: "123 Mystic Avenue, Suite 500" },
        description: { type: String, default: "New York, NY 10001" }
      }
    ]
  },

  // Benefits Section
  benefits: {
    title: {
      type: String,
      default: "Why Choose Us"
    },
    items: [
      { type: String, default: "24-hour response time guarantee" },
      { type: String, default: "Complete confidentiality" },
      { type: String, default: "Expert spiritual guidance" },
      { type: String, default: "Personalized consultations" },
      { type: String, default: "Secure communication" },
      { type: String, default: "Satisfaction guarantee" }
    ]
  },

  // Testimonials Section
  testimonials: {
    title: {
      type: String,
      default: "Client Testimonials"
    },
    items: [
      {
        name: { type: String, default: "Sarah M." },
        role: { type: String, default: "Premium Member" },
        text: { type: String, default: "The support team was incredibly helpful and responsive. My psychic reading was life-changing!" },
        date: { type: String, default: "2 weeks ago" }
      },
      {
        name: { type: String, default: "Michael R." },
        role: { type: String, default: "First-time Client" },
        text: { type: String, default: "Quick response time and professional service. Will definitely use again." },
        date: { type: String, default: "1 month ago" }
      },
      {
        name: { type: String, default: "Emma L." },
        role: { type: String, default: "VIP Member" },
        text: { type: String, default: "The 24/7 VIP support is amazing. Always there when I need guidance." },
        date: { type: String, default: "3 days ago" }
      }
    ]
  },

  // Contact Form Section
  contactForm: {
    title: {
      type: String,
      default: "Send Us a Message"
    },
    subtitle: {
      type: String,
      default: "Fill out the form below and our team will get back to you as soon as possible."
    },
    submitButtonText: {
      type: String,
      default: "Send Message"
    },
    successMessage: {
      type: String,
      default: "Thank you for your message! We'll get back to you as soon as possible."
    },
    footerText: {
      type: String,
      default: "* Required fields. By submitting, you agree to our privacy policy and terms of service."
    }
  },

  // FAQ Section
  faq: {
    title: {
      type: String,
      default: "Frequently Asked Questions"
    },
    items: [
      {
        question: { type: String, default: "How quickly will I receive a response?" },
        answer: { type: String, default: "We guarantee a response within 24 hours for all inquiries. VIP members receive priority response within 6 hours." }
      },
      {
        question: { type: String, default: "Is my information kept confidential?" },
        answer: { type: String, default: "Absolutely. We adhere to strict privacy policies and all communications are encrypted and confidential." }
      },
      {
        question: { type: String, default: "Do you offer refunds?" },
        answer: { type: String, default: "Yes, we offer a satisfaction guarantee. If you're not satisfied with our service, contact us within 7 days for a full refund." }
      },
      {
        question: { type: String, default: "Can I schedule a live consultation?" },
        answer: { type: String, default: "Yes, our premium psychics offer live chat, audio, and video consultations. Contact us to schedule an appointment." }
      },
      {
        question: { type: String, default: "What payment methods do you accept?" },
        answer: { type: String, default: "We accept all major credit cards, PayPal, and cryptocurrency for your convenience." }
      },
      {
        question: { type: String, default: "Are your psychics certified?" },
        answer: { type: String, default: "All our psychics undergo a rigorous vetting process and are certified professionals with years of experience." }
      }
    ]
  },

  // Support Hours Section
  supportHours: {
    title: {
      type: String,
      default: "Support Hours"
    },
    standard: {
      title: { type: String, default: "Standard Support" },
      hours: [
        {
          day: { type: String, default: "Monday - Friday" },
          hours: { type: String, default: "9AM - 6PM EST" }
        },
        {
          day: { type: String, default: "Saturday" },
          hours: { type: String, default: "10AM - 4PM EST" }
        },
        {
          day: { type: String, default: "Sunday" },
          hours: { type: String, default: "Emergency Only" }
        }
      ]
    },
    vip: {
      title: { type: String, default: "VIP Priority Support" },
      hours: [
        {
          day: { type: String, default: "24/7 Support" },
          hours: { type: String, default: "Available Anytime" }
        },
        {
          day: { type: String, default: "Live Chat" },
          hours: { type: String, default: "Instant Connection" }
        },
        {
          day: { type: String, default: "Priority Email" },
          hours: { type: String, default: "Within 6 hours" }
        }
      ]
    }
  },

  // CTA Section
  ctaSection: {
    title: {
      type: String,
      default: "Need Immediate Spiritual Guidance?"
    },
    description: {
      type: String,
      default: "Our premium psychics are available for live consultations 24/7"
    },
    buttonText: {
      type: String,
      default: "Start Live Chat Now"
    },
    buttonAction: {
      type: String,
      default: "/chat"
    },
    footerText: {
      type: String,
      default: "Available 24/7 for premium members • Instant connection • No appointment needed"
    }
  },

  // Social Media Links
  socialMedia: {
    facebook: { type: String, default: "https://facebook.com/hecatevoyance" },
    instagram: { type: String, default: "https://instagram.com/hecatevoyance" },
    twitter: { type: String, default: "https://twitter.com/hecatevoyance" },
    linkedin: { type: String, default: "https://linkedin.com/company/hecatevoyance" }
  },

  // SEO Settings
  seo: {
    metaTitle: { type: String, default: "Contact HecateVoyance - Elite Psychic Guidance & Spiritual Support" },
    metaDescription: { type: String, default: "Connect with HecateVoyance's spiritual guides. Reach out for personalized psychic consultations, VIP support, and transformative guidance. 24/7 availability." },
    metaKeywords: { type: String, default: "contact us, psychic support, spiritual guidance, customer service, psychic consultation, spiritual advisors" },
    ogImage: { type: String }
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

// Ensure only one active contact page configuration
contactSchema.pre('save', async function(next) {
  if (this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false }
    );
  }
  next();
});

module.exports = mongoose.model('Contact', contactSchema);