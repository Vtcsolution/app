import { ArrowRight, AlertTriangle, Clock, Dna, Microchip, Users, Sparkles, Globe, Award, Shield, Heart, Target, Star, ChevronRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";

const SimpleAboutUs = () => {
  const [aboutContent, setAboutContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default colors as fallback
  const [colors, setColors] = useState({
    deepPurple: "#2B1B3F",
    antiqueGold: "#C9A24D",
    softIvory: "#F5F3EB",
    lightGold: "#E8D9B0",
    darkPurple: "#1A1129",
  });

  // Icon mapping function
  const getIcon = (iconName, className = "h-6 w-6") => {
    const icons = {
      award: <Award className={className} />,
      users: <Users className={className} />,
      "trending-up": <TrendingUp className={className} />,
      target: <Target className={className} />,
      microchip: <Microchip className={className} />,
      clock: <Clock className={className} />,
      dna: <Dna className={className} />,
      globe: <Globe className={className} />,
      shield: <Shield className={className} />,
      heart: <Heart className={className} />,
      sparkles: <Sparkles className={className} />,
      "alert-triangle": <AlertTriangle className={className} />,
    };
    return icons[iconName] || <Sparkles className={className} />;
  };

  useEffect(() => {
    fetchAboutContent();
  }, []);

  const fetchAboutContent = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/about`);
      
      if (response.data.success) {
        setAboutContent(response.data.data);
        // Update colors if they exist in CMS
        if (response.data.data.colors) {
          setColors(response.data.data.colors);
        }
      }
    } catch (err) {
      console.error('Error fetching about content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.softIvory }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.antiqueGold }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.softIvory }}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" style={{ color: colors.antiqueGold }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: colors.deepPurple }}>Error Loading Content</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Use CMS data if available, otherwise use defaults
  const content = aboutContent || {
    hero: {
      badge: "Elite Psychic Guidance Since 2020",
      title: { line1: "Welcome to", line2: "HecateVoyance" },
      description: "Where ancient mystical traditions meet modern sophistication. Experience elite psychic consultations designed for discerning individuals seeking clarity and transformation.",
      button: { text: "Talk to Experts", action: "/" }
    },
    stats: [
      { label: "Years of Excellence", value: "4+", icon: "award" },
      { label: "Satisfied Clients", value: "10,000+", icon: "users" },
      { label: "Sessions Completed", value: "50,000+", icon: "trending-up" },
      { label: "Accuracy Rating", value: "95%+", icon: "target" }
    ],
    mission: {
      badge: "Our Mission",
      title: "Empowering Elite Decision-Making Through Spiritual Insight",
      description: "At HecateVoyance, we bridge timeless mystical traditions with contemporary sophistication to provide elite, personalized psychic consultations. Drawing inspiration from the ancient goddess Hecate – guardian of crossroads and illumination – we empower high-achievers to navigate life's complexities with confidence and clarity.",
      items: [
        { icon: "microchip", title: "Cutting-Edge Technology", description: "AI-enhanced analysis combined with ancient wisdom for unparalleled accuracy" },
        { icon: "clock", title: "24/7 Premium Access", description: "Exclusive availability ensuring guidance when inspiration strikes" },
        { icon: "dna", title: "Scientific Precision", description: "Evidence-based methodologies blended with intuitive spiritual arts" },
        { icon: "globe", title: "Global Elite Network", description: "Connecting discerning individuals worldwide with master psychics" }
      ]
    },
    vision: {
      badge: "Our Vision",
      title: "Redefining Psychic Guidance for the Modern Era",
      content: [
        "Founded in 2020, HecateVoyance has emerged as the premier destination for VIP psychic services, serving an exclusive clientele of business leaders, celebrities, and visionaries worldwide.",
        "Our vision extends beyond traditional psychic services. We aim to establish psychic voyance as an essential tool for elite decision-making, fostering a global community of enlightened individuals who harness spiritual insights for extraordinary success in both personal and professional domains.",
        "We believe in the transformative power of spiritual guidance when delivered with precision, discretion, and profound understanding of modern challenges."
      ],
      founder: {
        name: "Founder & Visionary",
        title: "Spiritual Innovator & Tech Entrepreneur",
        image: "../../public/psychics/profile_img2.jpg"
      }
    },
    problemSolution: {
      title: "Addressing Modern Challenges with Eternal Wisdom",
      description: "In today's complex world, traditional advisory services often fall short. We provide a superior alternative.",
      problems: {
        title: "The Modern Dilemma",
        icon: "alert-triangle",
        items: [
          "Extended wait times for traditional advisory services",
          "Limited perspectives constrained by conventional methodologies",
          "Lack of immediate, personalized spiritual guidance",
          "Generic advice that fails to address unique circumstances"
        ]
      },
      solutions: {
        title: "Our Revolutionary Solution",
        icon: "sparkles",
        items: [
          "Immediate access to master psychics 24/7",
          "AI-enhanced analysis of personal data for precise insights",
          "Bespoke profiles revealing your true potential",
          "Actionable advice from diverse spiritual traditions",
          "Complete confidentiality with bank-level security"
        ]
      },
      conclusion: "This is not mere novelty. This is the elevated standard in professional psychic voyance. Our commitment includes rigorous vetting, ongoing professional development, ethical practices, and cultivation of an exclusive community for mutual growth in a secure, private environment."
    },
    psychicsSection: {
      badge: "Meet Our Experts",
      title: "Our Elite Psychic Team",
      description: "Carefully selected master psychics with proven expertise and exceptional client satisfaction records",
      psychics: [
        { name: "KRS", specialty: "Master Astrologer", bio: "With over 15 years of experience in Vedic astrology, KRS provides profound insights into your life's path.", experience: "15+ years", rating: 4.9, sessions: "2,500+" },
        { name: "Arkana", specialty: "Tarot Master", bio: "Master tarot interpreter specializing in career and relationship guidance for elite clientele.", experience: "12+ years", rating: 4.8, sessions: "1,800+" },
        { name: "Numeron", specialty: "Numerology Expert", bio: "Renowned numerologist helping VIPs align their lives with cosmic numbers for success.", experience: "10+ years", rating: 4.9, sessions: "2,200+" },
        { name: "Amoura", specialty: "Love Specialist", bio: "Intuitive love specialist offering exclusive readings for harmonious relationships.", experience: "8+ years", rating: 4.7, sessions: "1,500+" }
      ]
    },
    featuresSection: {
      title: "Premium Features & Benefits",
      description: "Experience the difference with our exclusive services designed for discerning clients",
      features: [
        { icon: "shield", title: "Bank-Level Security", description: "Military-grade encryption ensures complete confidentiality for all interactions" },
        { icon: "clock", title: "24/7 Premium Support", description: "Dedicated concierge service for our VIP members, available round the clock" },
        { icon: "heart", title: "Personalized Matching", description: "Advanced algorithm connects you with psychics who perfectly match your needs" },
        { icon: "globe", title: "Global Network", description: "Access to master psychics from diverse traditions worldwide" }
      ]
    },
    testimonialsSection: {
      badge: "Client Testimonials",
      title: "Trusted by Visionary Leaders",
      description: "Hear from distinguished individuals who have transformed their journeys with our guidance",
      testimonials: [
        { quote: "HecateVoyance has transformed my decision-making process. Truly elite service with insights that have guided my business to new heights.", author: "Executive Client", role: "CEO, Fortune 500 Company", rating: 5 },
        { quote: "The insights from their psychics are unparalleled. A must for anyone seeking clarity in both personal and professional matters.", author: "VIP Member", role: "Celebrity Entrepreneur", rating: 5 },
        { quote: "Professional, discreet, and profoundly accurate. The guidance I've received has been instrumental in navigating international negotiations.", author: "High-Profile User", role: "International Diplomat", rating: 5 }
      ]
    },
    ctaSection: {
      title: "Begin Your Transformative Journey",
      description: "Experience elite psychic guidance designed for those who demand excellence in every aspect of life.",
      buttons: {
        primary: { text: "Start Your Journey", action: "/register" },
        secondary: { text: "Schedule a Consultation", action: "/contact" }
      },
      footer: "Join thousands of elite clients who trust HecateVoyance for transformative guidance"
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.softIvory }}>
      {/* Hero Section - Updated to match Contact page */}
      <div 
        className="relative overflow-hidden"
        style={{ 
          backgroundColor: colors.deepPurple,
          background: `linear-gradient(135deg, ${colors.darkPurple} 0%, ${colors.deepPurple} 100%)`
        }}
      >
        <div className="absolute inset-0 opacity-10">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${200 + i * 100}px`,
                height: `${200 + i * 100}px`,
                background: `radial-gradient(circle, ${colors.antiqueGold} 0%, transparent 70%)`,
                top: `${20 + i * 30}%`,
                right: `${10 + i * 20}%`,
              }}
            />
          ))}
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full" 
                style={{ backgroundColor: colors.antiqueGold + "20", color: colors.antiqueGold }}>
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">{content.hero.badge}</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 leading-tight">
                <span className="block text-white">{content.hero.title.line1}</span>
                <span style={{ 
                  background: `linear-gradient(135deg, ${colors.antiqueGold}, #FFD700)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}>{content.hero.title.line2}</span>
              </h1>
              
              <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed text-white/80">
                {content.hero.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:scale-105 transition-transform"
                  style={{ 
                    backgroundColor: colors.antiqueGold,
                    color: colors.deepPurple
                  }}
                  onClick={() => window.location.href = content.hero.button.action}
                >
                  {content.hero.button.text}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Section - Updated to max-w-7xl */}
      <div className="py-12 px-4" style={{ backgroundColor: colors.lightGold }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {content.stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                  style={{ backgroundColor: colors.deepPurple, color: colors.softIvory }}>
                  {getIcon(stat.icon, "h-6 w-6")}
                </div>
                <div className="text-3xl font-bold mb-2" style={{ color: colors.deepPurple }}>{stat.value}</div>
                <div className="text-sm font-medium" style={{ color: colors.deepPurple + "CC" }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission & Vision - Updated to max-w-7xl with inner max-w-6xl for content */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full" 
                style={{ backgroundColor: colors.antiqueGold + "20", color: colors.antiqueGold }}>
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium">{content.mission.badge}</span>
              </div>
              <h2 className="text-3xl font-bold mb-6" style={{ color: colors.deepPurple }}>
                {content.mission.title}
              </h2>
              <p className="text-lg leading-relaxed mb-6" style={{ color: colors.deepPurple + "CC" }}>
                {content.mission.description}
              </p>
            </div>
            
            <div className="space-y-6">
              {content.mission.items.map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-lg hover:shadow-md transition-shadow"
                  style={{ backgroundColor: colors.softIvory }}>
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colors.antiqueGold + "20", color: colors.antiqueGold }}>
                      {getIcon(item.icon, "h-6 w-6")}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: colors.deepPurple }}>{item.title}</h3>
                    <p className="text-sm" style={{ color: colors.deepPurple + "CC" }}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8" style={{ border: `2px solid ${colors.antiqueGold}30`, boxShadow: `0 10px 25px ${colors.deepPurple}10` }}>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full" 
                  style={{ backgroundColor: colors.deepPurple + "10", color: colors.deepPurple }}>
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">{content.vision.badge}</span>
                </div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: colors.deepPurple }}>
                  {content.vision.title}
                </h3>
              </div>
              
              <div className="space-y-4">
                {content.vision.content.map((paragraph, index) => (
                  <p key={index} className="leading-relaxed" style={{ color: colors.deepPurple + "CC" }}>
                    {paragraph}
                  </p>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t" style={{ borderColor: colors.antiqueGold + "30" }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2" style={{ borderColor: colors.antiqueGold }}>
                    <img 
                      src={content.vision.founder.image}
                      alt="Founder"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-bold" style={{ color: colors.deepPurple }}>{content.vision.founder.name}</div>
                    <div className="text-sm" style={{ color: colors.deepPurple + "CC" }}>{content.vision.founder.title}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem/Solution Section - Updated to max-w-7xl with inner max-w-6xl */}
      <section className="py-20 px-4" style={{ backgroundColor: colors.deepPurple + "05" }}>
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: colors.deepPurple }}>
              {content.problemSolution.title}
            </h2>
            <p className="text-lg" style={{ color: colors.deepPurple + "CC" }}>
              {content.problemSolution.description}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-xl"
              style={{ border: `2px solid ${colors.antiqueGold}30`, boxShadow: `0 10px 25px ${colors.deepPurple}10` }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" 
                  style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                  {getIcon(content.problemSolution.problems.icon, "h-6 w-6")}
                </div>
                <h3 className="text-xl font-bold" style={{ color: colors.deepPurple }}>{content.problemSolution.problems.title}</h3>
              </div>
              <ul className="space-y-3">
                {content.problemSolution.problems.items.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <ChevronRight className="h-4 w-4 mr-2 mt-1 flex-shrink-0" style={{ color: colors.antiqueGold }} />
                    <span style={{ color: colors.deepPurple + "CC" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-xl"
              style={{ border: `2px solid ${colors.antiqueGold}30`, boxShadow: `0 10px 25px ${colors.deepPurple}10` }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" 
                  style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>
                  {getIcon(content.problemSolution.solutions.icon, "h-6 w-6")}
                </div>
                <h3 className="text-xl font-bold" style={{ color: colors.deepPurple }}>{content.problemSolution.solutions.title}</h3>
              </div>
              <ul className="space-y-3">
                {content.problemSolution.solutions.items.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <ChevronRight className="h-4 w-4 mr-2 mt-1 flex-shrink-0" style={{ color: colors.antiqueGold }} />
                    <span style={{ color: colors.deepPurple + "CC" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
          
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-xl" style={{ border: `2px solid ${colors.antiqueGold}`, boxShadow: `0 10px 25px ${colors.deepPurple}10` }}>
              <div className="text-center">
                <p className="text-lg font-semibold" style={{ color: colors.deepPurple }}>
                  {content.problemSolution.conclusion}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Psychics Section - Updated to max-w-7xl with inner max-w-6xl */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full" 
            style={{ backgroundColor: colors.antiqueGold + "20", color: colors.antiqueGold }}>
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">{content.psychicsSection.badge}</span>
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: colors.deepPurple }}>
            {content.psychicsSection.title}
          </h2>
          <p className="text-lg" style={{ color: colors.deepPurple + "CC" }}>
            {content.psychicsSection.description}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {content.psychicsSection.psychics.map((psychic, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-2"
                style={{ border: `1px solid ${colors.antiqueGold}30`, boxShadow: `0 10px 25px ${colors.deepPurple}10` }}>
                
                <div className="p-6">
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative mb-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 mx-auto"
                        style={{ borderColor: colors.antiqueGold }}>
                        <div className={`w-full h-full flex items-center justify-center text-2xl font-bold`}
                          style={{ backgroundColor: colors.antiqueGold, color: colors.deepPurple }}>
                          {psychic.name[0]}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-1" style={{ color: colors.deepPurple }}>{psychic.name}</h3>
                    <p className="text-sm mb-3 px-3 py-1 rounded-full" 
                      style={{ backgroundColor: colors.antiqueGold + "20", color: colors.deepPurple }}>
                      {psychic.specialty}
                    </p>
                    
                    <div className="flex items-center mb-4">
                      {Array(5).fill(0).map((_, i) => (
                        <Star key={i} className="h-3 w-3" 
                          style={{ 
                            color: i < Math.floor(psychic.rating) ? colors.antiqueGold : "#E5E7EB",
                            fill: i < Math.floor(psychic.rating) ? colors.antiqueGold : "transparent"
                          }} />
                      ))}
                      <span className="ml-2 text-sm" style={{ color: colors.deepPurple + "CC" }}>
                        {psychic.rating}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-center mb-6" style={{ color: colors.deepPurple + "CC" }}>
                    {psychic.bio}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded" style={{ backgroundColor: colors.softIvory }}>
                      <div className="font-bold" style={{ color: colors.deepPurple }}>{psychic.experience}</div>
                      <div style={{ color: colors.deepPurple + "CC" }}>Experience</div>
                    </div>
                    <div className="p-2 rounded" style={{ backgroundColor: colors.softIvory }}>
                      <div className="font-bold" style={{ color: colors.deepPurple }}>{psychic.sessions}</div>
                      <div style={{ color: colors.deepPurple + "CC" }}>Sessions</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section - Updated to max-w-7xl */}
      <section className="py-20 px-4" style={{ backgroundColor: colors.lightGold }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4" style={{ color: colors.deepPurple }}>
              {content.featuresSection.title}
            </h2>
            <p className="text-lg" style={{ color: colors.deepPurple + "CC" }}>
              {content.featuresSection.description}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {content.featuresSection.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                  style={{ backgroundColor: colors.deepPurple, color: colors.softIvory }}>
                  {getIcon(feature.icon, "h-8 w-8")}
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: colors.deepPurple }}>{feature.title}</h3>
                <p className="text-sm" style={{ color: colors.deepPurple + "CC" }}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Updated to max-w-7xl with inner max-w-6xl */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full" 
            style={{ backgroundColor: colors.antiqueGold + "20", color: colors.antiqueGold }}>
            <Star className="h-4 w-4" />
            <span className="text-sm font-medium">{content.testimonialsSection.badge}</span>
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: colors.deepPurple }}>
            {content.testimonialsSection.title}
          </h2>
          <p className="text-lg" style={{ color: colors.deepPurple + "CC" }}>
            {content.testimonialsSection.description}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {content.testimonialsSection.testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 h-full transition-all duration-300 hover:-translate-y-2"
                style={{ border: `1px solid ${colors.antiqueGold}30`, boxShadow: `0 10px 25px ${colors.deepPurple}10` }}>
                
                <div className="flex mb-6">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className="h-4 w-4" 
                      style={{ 
                        color: colors.antiqueGold,
                        fill: i < testimonial.rating ? colors.antiqueGold : "transparent"
                      }} />
                  ))}
                </div>
                
                <p className="text-lg italic mb-8 leading-relaxed" style={{ color: colors.deepPurple + "CC" }}>
                  "{testimonial.quote}"
                </p>
                
                <div className="pt-6 border-t" style={{ borderColor: colors.antiqueGold + "30" }}>
                  <div className="font-bold" style={{ color: colors.deepPurple }}>{testimonial.author}</div>
                  <div className="text-sm" style={{ color: colors.deepPurple + "CC" }}>{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA - Updated to match Contact page style */}
      <section className="py-20 px-4" style={{ 
        backgroundColor: colors.deepPurple,
        background: `linear-gradient(135deg, ${colors.darkPurple} 0%, ${colors.deepPurple} 100%)`
      }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl p-8 md:p-12 overflow-hidden max-w-4xl mx-auto"
            style={{ 
              backgroundColor: colors.deepPurple + "DD",
              border: `2px solid ${colors.antiqueGold}`,
              backdropFilter: "blur(10px)",
              boxShadow: `0 20px 40px ${colors.deepPurple}40`
            }}
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                style={{ backgroundColor: colors.antiqueGold + "20", color: colors.antiqueGold }}>
                <Sparkles className="h-8 w-8" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6" style={{ color: colors.softIvory }}>
                {content.ctaSection.title}
              </h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: colors.softIvory + "CC" }}>
                {content.ctaSection.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg font-semibold shadow-xl hover:scale-105 transition-transform"
                  style={{ 
                    backgroundColor: colors.antiqueGold,
                    color: colors.deepPurple
                  }}
                  onClick={() => window.location.href = content.ctaSection.buttons.primary.action}
                >
                  {content.ctaSection.buttons.primary.text}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 py-6 text-lg font-semibold hover:scale-105 transition-transform"
                  style={{ 
                    borderColor: colors.antiqueGold,
                    color: colors.softIvory
                  }}
                  onClick={() => window.location.href = content.ctaSection.buttons.secondary.action}
                >
                  {content.ctaSection.buttons.secondary.text}
                </Button>
              </div>
              
              <p className="text-sm mt-8" style={{ color: colors.softIvory + "80" }}>
                {content.ctaSection.footer}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SimpleAboutUs;