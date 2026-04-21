const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema({
  // Hero Section
  hero: {
    badge: {
      type: String,
      default: "Elite Psychic Guidance Since 2020"
    },
    title: {
      line1: { type: String, default: "Welcome to" },
      line2: { type: String, default: "HecateVoyance" }
    },
    description: {
      type: String,
      default: "Where ancient mystical traditions meet modern sophistication. Experience elite psychic consultations designed for discerning individuals seeking clarity and transformation."
    },
    button: {
      text: { type: String, default: "Talk to Experts" },
      action: { type: String, default: "/" }
    }
  },

  // Stats Section
  stats: [
    {
      label: { type: String, default: "Years of Excellence" },
      value: { type: String, default: "4+" },
      icon: { type: String, default: "award" }
    },
    {
      label: { type: String, default: "Satisfied Clients" },
      value: { type: String, default: "10,000+" },
      icon: { type: String, default: "users" }
    },
    {
      label: { type: String, default: "Sessions Completed" },
      value: { type: String, default: "50,000+" },
      icon: { type: String, default: "trending-up" }
    },
    {
      label: { type: String, default: "Accuracy Rating" },
      value: { type: String, default: "95%+" },
      icon: { type: String, default: "target" }
    }
  ],

  // Mission & Vision Section
  mission: {
    badge: {
      type: String,
      default: "Our Mission"
    },
    title: {
      type: String,
      default: "Empowering Elite Decision-Making Through Spiritual Insight"
    },
    description: {
      type: String,
      default: "At HecateVoyance, we bridge timeless mystical traditions with contemporary sophistication to provide elite, personalized psychic consultations. Drawing inspiration from the ancient goddess Hecate – guardian of crossroads and illumination – we empower high-achievers to navigate life's complexities with confidence and clarity."
    },
    items: [
      {
        icon: { type: String, default: "microchip" },
        title: { type: String, default: "Cutting-Edge Technology" },
        description: { type: String, default: "AI-enhanced analysis combined with ancient wisdom for unparalleled accuracy" }
      },
      {
        icon: { type: String, default: "clock" },
        title: { type: String, default: "24/7 Premium Access" },
        description: { type: String, default: "Exclusive availability ensuring guidance when inspiration strikes" }
      },
      {
        icon: { type: String, default: "dna" },
        title: { type: String, default: "Scientific Precision" },
        description: { type: String, default: "Evidence-based methodologies blended with intuitive spiritual arts" }
      },
      {
        icon: { type: String, default: "globe" },
        title: { type: String, default: "Global Elite Network" },
        description: { type: String, default: "Connecting discerning individuals worldwide with master psychics" }
      }
    ]
  },

  // Vision Section
  vision: {
    badge: {
      type: String,
      default: "Our Vision"
    },
    title: {
      type: String,
      default: "Redefining Psychic Guidance for the Modern Era"
    },
    content: [
      {
        type: String,
        default: "Founded in 2020, HecateVoyance has emerged as the premier destination for VIP psychic services, serving an exclusive clientele of business leaders, celebrities, and visionaries worldwide."
      },
      {
        type: String,
        default: "Our vision extends beyond traditional psychic services. We aim to establish psychic voyance as an essential tool for elite decision-making, fostering a global community of enlightened individuals who harness spiritual insights for extraordinary success in both personal and professional domains."
      },
      {
        type: String,
        default: "We believe in the transformative power of spiritual guidance when delivered with precision, discretion, and profound understanding of modern challenges."
      }
    ],
    founder: {
      name: { type: String, default: "Founder & Visionary" },
      title: { type: String, default: "Spiritual Innovator & Tech Entrepreneur" },
      image: { type: String, default: "../../public/psychics/profile_img2.jpg" }
    }
  },

  // Problem/Solution Section
  problemSolution: {
    title: {
      type: String,
      default: "Addressing Modern Challenges with Eternal Wisdom"
    },
    description: {
      type: String,
      default: "In today's complex world, traditional advisory services often fall short. We provide a superior alternative."
    },
    problems: {
      title: { type: String, default: "The Modern Dilemma" },
      icon: { type: String, default: "alert-triangle" },
      items: [
        { type: String, default: "Extended wait times for traditional advisory services" },
        { type: String, default: "Limited perspectives constrained by conventional methodologies" },
        { type: String, default: "Lack of immediate, personalized spiritual guidance" },
        { type: String, default: "Generic advice that fails to address unique circumstances" }
      ]
    },
    solutions: {
      title: { type: String, default: "Our Revolutionary Solution" },
      icon: { type: String, default: "sparkles" },
      items: [
        { type: String, default: "Immediate access to master psychics 24/7" },
        { type: String, default: "AI-enhanced analysis of personal data for precise insights" },
        { type: String, default: "Bespoke profiles revealing your true potential" },
        { type: String, default: "Actionable advice from diverse spiritual traditions" },
        { type: String, default: "Complete confidentiality with bank-level security" }
      ]
    },
    conclusion: {
      type: String,
      default: "This is not mere novelty. This is the elevated standard in professional psychic voyance. Our commitment includes rigorous vetting, ongoing professional development, ethical practices, and cultivation of an exclusive community for mutual growth in a secure, private environment."
    }
  },

  // Psychics Section (for about page)
  psychicsSection: {
    badge: {
      type: String,
      default: "Meet Our Experts"
    },
    title: {
      type: String,
      default: "Our Elite Psychic Team"
    },
    description: {
      type: String,
      default: "Carefully selected master psychics with proven expertise and exceptional client satisfaction records"
    },
    psychics: [
      {
        name: { type: String, default: "KRS" },
        specialty: { type: String, default: "Master Astrologer" },
        bio: { type: String, default: "With over 15 years of experience in Vedic astrology, KRS provides profound insights into your life's path." },
        experience: { type: String, default: "15+ years" },
        rating: { type: Number, default: 4.9 },
        sessions: { type: String, default: "2,500+" }
      },
      {
        name: { type: String, default: "Arkana" },
        specialty: { type: String, default: "Tarot Master" },
        bio: { type: String, default: "Master tarot interpreter specializing in career and relationship guidance for elite clientele." },
        experience: { type: String, default: "12+ years" },
        rating: { type: Number, default: 4.8 },
        sessions: { type: String, default: "1,800+" }
      },
      {
        name: { type: String, default: "Numeron" },
        specialty: { type: String, default: "Numerology Expert" },
        bio: { type: String, default: "Renowned numerologist helping VIPs align their lives with cosmic numbers for success." },
        experience: { type: String, default: "10+ years" },
        rating: { type: Number, default: 4.9 },
        sessions: { type: String, default: "2,200+" }
      },
      {
        name: { type: String, default: "Amoura" },
        specialty: { type: String, default: "Love Specialist" },
        bio: { type: String, default: "Intuitive love specialist offering exclusive readings for harmonious relationships." },
        experience: { type: String, default: "8+ years" },
        rating: { type: Number, default: 4.7 },
        sessions: { type: String, default: "1,500+" }
      }
    ]
  },

  // Features Section
  featuresSection: {
    title: {
      type: String,
      default: "Premium Features & Benefits"
    },
    description: {
      type: String,
      default: "Experience the difference with our exclusive services designed for discerning clients"
    },
    features: [
      {
        icon: { type: String, default: "shield" },
        title: { type: String, default: "Bank-Level Security" },
        description: { type: String, default: "Military-grade encryption ensures complete confidentiality for all interactions" }
      },
      {
        icon: { type: String, default: "clock" },
        title: { type: String, default: "24/7 Premium Support" },
        description: { type: String, default: "Dedicated concierge service for our VIP members, available round the clock" }
      },
      {
        icon: { type: String, default: "heart" },
        title: { type: String, default: "Personalized Matching" },
        description: { type: String, default: "Advanced algorithm connects you with psychics who perfectly match your needs" }
      },
      {
        icon: { type: String, default: "globe" },
        title: { type: String, default: "Global Network" },
        description: { type: String, default: "Access to master psychics from diverse traditions worldwide" }
      }
    ]
  },

  // Testimonials Section
  testimonialsSection: {
    badge: {
      type: String,
      default: "Client Testimonials"
    },
    title: {
      type: String,
      default: "Trusted by Visionary Leaders"
    },
    description: {
      type: String,
      default: "Hear from distinguished individuals who have transformed their journeys with our guidance"
    },
    testimonials: [
      {
        quote: { type: String, default: "HecateVoyance has transformed my decision-making process. Truly elite service with insights that have guided my business to new heights." },
        author: { type: String, default: "Executive Client" },
        role: { type: String, default: "CEO, Fortune 500 Company" },
        rating: { type: Number, default: 5 }
      },
      {
        quote: { type: String, default: "The insights from their psychics are unparalleled. A must for anyone seeking clarity in both personal and professional matters." },
        author: { type: String, default: "VIP Member" },
        role: { type: String, default: "Celebrity Entrepreneur" },
        rating: { type: Number, default: 5 }
      },
      {
        quote: { type: String, default: "Professional, discreet, and profoundly accurate. The guidance I've received has been instrumental in navigating international negotiations." },
        author: { type: String, default: "High-Profile User" },
        role: { type: String, default: "International Diplomat" },
        rating: { type: Number, default: 5 }
      }
    ]
  },

  // CTA Section
  ctaSection: {
    title: {
      type: String,
      default: "Begin Your Transformative Journey"
    },
    description: {
      type: String,
      default: "Experience elite psychic guidance designed for those who demand excellence in every aspect of life."
    },
    buttons: {
      primary: {
        text: { type: String, default: "Start Your Journey" },
        action: { type: String, default: "/register" }
      },
      secondary: {
        text: { type: String, default: "Schedule a Consultation" },
        action: { type: String, default: "/contact" }
      }
    },
    footer: {
      type: String,
      default: "Join thousands of elite clients who trust HecateVoyance for transformative guidance"
    }
  },

  // SEO Settings
  seo: {
    metaTitle: { type: String, default: "About HecateVoyance - Elite Psychic Guidance Since 2020" },
    metaDescription: { type: String, default: "Discover HecateVoyance, where ancient mystical traditions meet modern sophistication. Meet our elite psychics and learn about our mission to provide transformative guidance." },
    metaKeywords: { type: String, default: "about us, psychic guidance, elite psychics, spiritual consulting, HecateVoyance" },
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

// Ensure only one active about page configuration
aboutSchema.pre('save', async function(next) {
  if (this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false }
    );
  }
  next();
});

module.exports = mongoose.model('About', aboutSchema);