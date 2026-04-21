import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  ArrowRight,
  MessageSquare,
  Shield,
  Users,
  Star,
  CheckCircle,
  ChevronRight,
  Globe,
  Send,
  User,
  MailCheck,
  AlertCircle,
  Loader2
} from "lucide-react";
import React, { useState, useEffect } from "react";

const ContactPage = () => {
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContactData();
  }, []);

  const fetchContactData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/contact`);
      const data = await response.json();
      
      if (data.success) {
        setContactData(data.data);
      }
    } catch (error) {
      console.error('Error fetching contact data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/messages/contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      
      setSuccess(contactData?.contactForm?.successMessage || "Thank you for your message! We'll get back to you as soon as possible.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Icon mapping function
  const getIcon = (iconName, className = "h-6 w-6") => {
    const icons = {
      mail: <Mail className={className} />,
      'message-square': <MessageSquare className={className} />,
      phone: <Phone className={className} />,
      'map-pin': <MapPin className={className} />,
      shield: <Shield className={className} />,
      clock: <Clock className={className} />,
      star: <Star className={className} />,
      'check-circle': <CheckCircle className={className} />,
      users: <Users className={className} />,
      facebook: <Facebook className={className} />,
      instagram: <Instagram className={className} />,
      twitter: <Twitter className={className} />,
      linkedin: <Linkedin className={className} />,
      globe: <Globe className={className} />
    };
    return icons[iconName] || <Mail className={className} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F3EB" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#C9A24D" }} />
      </div>
    );
  }

  if (!contactData) return null;

  const colors = contactData.colors;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.softIvory }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ backgroundColor: colors.deepPurple }}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">
              {contactData.hero.title}
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              {contactData.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {contactData.hero.badges.map((badge, index) => (
                <div key={index} className="flex items-center text-white/90 bg-white/10 px-4 py-2 rounded-full">
                  {getIcon(badge.icon, "h-5 w-5 mr-2")}
                  <span className="text-sm">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Contact Info & Features */}
          <div className="lg:col-span-1 space-y-8">
            {/* Contact Information Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border" style={{ borderColor: colors.lightGold, boxShadow: `0 10px 25px ${colors.deepPurple}10` }}>
              <h2 className="text-2xl font-serif font-bold mb-6" style={{ color: colors.deepPurple }}>
                <span className="flex items-center">
                  <Users className="h-6 w-6 mr-2" style={{ color: colors.antiqueGold }} />
                  {contactData.contactInfo.title}
                </span>
              </h2>
              <div className="space-y-6">
                {contactData.contactInfo.points.map((point, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 rounded-xl transition-all duration-300 hover:shadow-md"
                    style={{
                      backgroundColor: index % 2 === 0 ? colors.softIvory : 'white',
                      border: `1px solid ${colors.lightGold}`
                    }}
                  >
                    <div className="p-3 rounded-lg" style={{ backgroundColor: colors.antiqueGold + "20" }}>
                      <div style={{ color: colors.antiqueGold }}>
                        {getIcon(point.icon)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg" style={{ color: colors.deepPurple }}>
                        {point.title}
                      </h3>
                      {point.link ? (
                        <a
                          href={point.link}
                          className="block text-sm mt-1 hover:underline font-medium"
                          style={{ color: colors.antiqueGold }}
                        >
                          {point.details}
                        </a>
                      ) : (
                        <p className="text-sm mt-1 font-medium" style={{ color: colors.deepPurple + "CC" }}>
                          {point.details}
                        </p>
                      )}
                      <p className="text-xs mt-1" style={{ color: colors.deepPurple + "80" }}>
                        {point.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border" style={{ borderColor: colors.lightGold, boxShadow: `0 10px 25px ${colors.deepPurple}10` }}>
              <h2 className="text-2xl font-serif font-bold mb-6" style={{ color: colors.deepPurple }}>
                <span className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2" style={{ color: colors.antiqueGold }} />
                  {contactData.benefits.title}
                </span>
              </h2>
              <ul className="space-y-4">
                {contactData.benefits.items.map((benefit, index) => (
                  <li key={index} className="flex items-start group">
                    <div className="flex-shrink-0 mt-1 mr-3">
                      <div className="w-2 h-2 rounded-full transform group-hover:scale-125 transition-transform"
                        style={{ backgroundColor: colors.antiqueGold }}></div>
                    </div>
                    <span className="text-sm font-medium group-hover:text-opacity-100 transition-colors"
                      style={{ color: colors.deepPurple + "CC" }}>
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonials Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border" style={{ borderColor: colors.lightGold, boxShadow: `0 10px 25px ${colors.deepPurple}10` }}>
              <h2 className="text-2xl font-serif font-bold mb-6" style={{ color: colors.deepPurple }}>
                <span className="flex items-center">
                  <Star className="h-6 w-6 mr-2" style={{ color: colors.antiqueGold }} />
                  {contactData.testimonials.title}
                </span>
              </h2>
              <div className="space-y-4">
                {contactData.testimonials.items.map((testimonial, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: colors.softIvory }}
                  >
                    <p className="text-sm italic mb-3" style={{ color: colors.deepPurple }}>
                      "{testimonial.text}"
                    </p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: colors.deepPurple }}>
                          {testimonial.name}
                        </p>
                        <p className="text-xs" style={{ color: colors.antiqueGold }}>
                          {testimonial.role}
                        </p>
                      </div>
                      <p className="text-xs" style={{ color: colors.deepPurple + "80" }}>
                        {testimonial.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form & FAQ */}
          <div className="lg:col-span-2">
            {/* Contact Form Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border mb-8"
              style={{
                borderColor: colors.lightGold,
                boxShadow: `0 10px 25px ${colors.deepPurple}10`
              }}>
              <div className="p-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-serif font-bold mb-3" style={{ color: colors.deepPurple }}>
                    {contactData.contactForm.title}
                  </h2>
                  <p className="text-lg" style={{ color: colors.deepPurple + "CC" }}>
                    {contactData.contactForm.subtitle}
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.deepPurple }}>
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Your Name *
                        </span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-all"
                        style={{
                          borderColor: colors.antiqueGold + "50",
                          backgroundColor: colors.softIvory,
                          color: colors.deepPurple,
                          borderWidth: '2px'
                        }}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.deepPurple }}>
                        <span className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          Email Address *
                        </span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-all"
                        style={{
                          borderColor: colors.antiqueGold + "50",
                          backgroundColor: colors.softIvory,
                          color: colors.deepPurple,
                          borderWidth: '2px'
                        }}
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.deepPurple }}>
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-all"
                      style={{
                        borderColor: colors.antiqueGold + "50",
                        backgroundColor: colors.softIvory,
                        color: colors.deepPurple,
                        borderWidth: '2px'
                      }}
                      placeholder="What is this regarding?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.deepPurple }}>
                      Your Message *
                    </label>
                    <textarea
                      name="message"
                      rows="6"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-all resize-none"
                      style={{
                        borderColor: colors.antiqueGold + "50",
                        backgroundColor: colors.softIvory,
                        color: colors.deepPurple,
                        borderWidth: '2px'
                      }}
                      placeholder="Please provide details about your inquiry..."
                    ></textarea>
                  </div>

                  {/* Status Messages */}
                  {success && (
                    <div className="p-4 rounded-lg animate-fadeIn"
                      style={{
                        backgroundColor: "#10B98120",
                        border: "1px solid #10B98140"
                      }}>
                      <div className="flex items-center">
                        <MailCheck className="h-5 w-5 mr-2" style={{ color: "#10B981" }} />
                        <p className="text-sm font-medium" style={{ color: "#065F46" }}>
                          {success}
                        </p>
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="p-4 rounded-lg animate-fadeIn"
                      style={{
                        backgroundColor: "#FEE2E220",
                        border: "1px solid #FECACA"
                      }}>
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" style={{ color: "#DC2626" }} />
                        <p className="text-sm font-medium" style={{ color: "#DC2626" }}>
                          {error}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full group relative flex items-center justify-center py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                      style={{
                        backgroundColor: colors.antiqueGold,
                        color: colors.deepPurple
                      }}
                    >
                      {submitting ? (
                        <span className="flex items-center">
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                          Sending Message...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Send className="h-5 w-5 mr-2" />
                          {contactData.contactForm.submitButtonText}
                          <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-2 transition-transform" />
                        </span>
                      )}
                    </button>
                    <p className="text-center text-xs mt-3" style={{ color: colors.deepPurple + "80" }}>
                      {contactData.contactForm.footerText}
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border mb-8"
              style={{
                borderColor: colors.lightGold,
                boxShadow: `0 10px 25px ${colors.deepPurple}10`
              }}>
              <h2 className="text-2xl font-serif font-bold mb-6" style={{ color: colors.deepPurple }}>
                <span className="flex items-center">
                  <MessageSquare className="h-6 w-6 mr-2" style={{ color: colors.antiqueGold }} />
                  {contactData.faq.title}
                </span>
              </h2>
              <div className="space-y-6">
                {contactData.faq.items.map((faq, index) => (
                  <div
                    key={index}
                    className="border-b pb-6 last:border-0 transition-all duration-300 hover:bg-gray-50 -mx-4 px-4 rounded-lg cursor-pointer"
                    style={{ borderColor: colors.lightGold }}
                  >
                    <div className="flex items-center justify-between group">
                      <h3 className="font-semibold text-lg group-hover:underline" style={{ color: colors.deepPurple }}>
                        {faq.question}
                      </h3>
                      <ChevronRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" style={{ color: colors.antiqueGold }} />
                    </div>
                    <p className="text-sm mt-3 pl-2 border-l-4"
                      style={{
                        color: colors.deepPurple + "CC",
                        borderLeftColor: colors.antiqueGold + "50"
                      }}>
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Hours */}
            <div className="bg-gradient-to-r rounded-2xl shadow-xl p-8 overflow-hidden relative mb-8"
              style={{
                background: `linear-gradient(135deg, ${colors.deepPurple} 0%, ${colors.darkPurple} 100%)`,
                boxShadow: `0 10px 25px ${colors.deepPurple}20`
              }}>
              <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent rounded-full"></div>
              </div>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <Clock className="h-8 w-8 mr-3" style={{ color: colors.antiqueGold }} />
                  <h3 className="text-2xl font-bold text-white">{contactData.supportHours.title}</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Standard Support */}
                  <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                    <p className="font-semibold text-lg text-white mb-3">{contactData.supportHours.standard.title}</p>
                    <div className="space-y-2">
                      {contactData.supportHours.standard.hours.map((schedule, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-white/80">{schedule.day}</span>
                          <span className="text-sm font-medium text-white">{schedule.hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* VIP Support */}
                  <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm"
                    style={{ border: `1px solid ${colors.antiqueGold}30` }}>
                    <div className="flex items-center mb-3">
                      <Star className="h-4 w-4 mr-2" style={{ color: colors.antiqueGold }} />
                      <p className="font-semibold text-lg text-white">{contactData.supportHours.vip.title}</p>
                    </div>
                    <div className="space-y-2">
                      {contactData.supportHours.vip.hours.map((schedule, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-white/80">{schedule.day}</span>
                          <span className="text-sm font-medium" style={{ color: colors.antiqueGold }}>
                            {schedule.hours}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="mt-12 relative overflow-hidden"
        style={{
          backgroundColor: colors.lightGold,
          borderTop: `1px solid ${colors.antiqueGold}30`,
          borderBottom: `1px solid ${colors.antiqueGold}30`
        }}>
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: colors.deepPurple }}>
              <MessageSquare className="h-8 w-8" style={{ color: colors.antiqueGold }} />
            </div>
            <h3 className="text-2xl md:text-3xl font-serif font-bold mb-3" style={{ color: colors.deepPurple }}>
              {contactData.ctaSection.title}
            </h3>
            <p className="text-lg mb-6 max-w-2xl mx-auto" style={{ color: colors.deepPurple + "CC" }}>
              {contactData.ctaSection.description}
            </p>
            <button
              className="inline-flex items-center px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl group"
              style={{
                backgroundColor: colors.deepPurple,
                color: colors.softIvory
              }}
              onClick={() => window.location.href = contactData.ctaSection.buttonAction}
            >
              <MessageSquare className="h-5 w-5 mr-3 group-hover:animate-pulse" />
              {contactData.ctaSection.buttonText}
              <ArrowRight className="ml-3 h-5 w-5 transform group-hover:translate-x-2 transition-transform" />
            </button>
            <p className="text-sm mt-4" style={{ color: colors.deepPurple + "80" }}>
              {contactData.ctaSection.footerText}
            </p>
          </div>
        </div>
      </div>

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

export default ContactPage;