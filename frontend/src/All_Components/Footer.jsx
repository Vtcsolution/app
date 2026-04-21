import { 
  Instagram, 
  Facebook, 
  Youtube, 
  Mail, 
  MessageSquare,
  Linkedin,
  Twitter,
  Sparkles,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.04-.1z" />
  </svg>
);

export default function ModernFooter() {
  const [footerData, setFooterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching footer data from:', `${import.meta.env.VITE_BASE_URL}/api/footer`);
      
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/footer`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Footer API response:', data);

      if (data.success) {
        setFooterData(data.data);
        console.log('Footer data loaded successfully:', data.data);
      } else {
        // If no data found, create default data structure
        console.log('No footer data found, using defaults');
        setFooterData(null); // This will trigger default data usage
      }
    } catch (error) {
      console.error('Error fetching footer data:', error);
      setError(error.message);
      // Still set footerData to null to use defaults
      setFooterData(null);
    } finally {
      setLoading(false);
    }
  };

  // Default data structure matching your static design
  const defaultData = {
    company: {
      name: "HecateVoyance",
      tagline: "SPIRITUAL GUIDANCE",
      description: "Your trusted source for spiritual guidance, psychic readings, and personal transformation since 2020."
    },
    socialMedia: {
      instagram: { url: "https://instagram.com/hecatevoyance", active: true },
      facebook: { url: "https://facebook.com/hecatevoyance", active: true },
      linkedin: { url: "https://linkedin.com/company/hecatevoyance", active: true },
      twitter: { url: "https://twitter.com/hecatevoyance", active: true },
      tiktok: { url: "https://tiktok.com/@hecatevoyance", active: true },
      youtube: { url: "https://youtube.com/@hecatevoyance", active: true }
    },
    exploreLinks: [
      { label: "Home", url: "/", active: true, order: 1 },
      { label: "About Us", url: "/about", active: true, order: 2 },
      { label: "Our Psychics", url: "/psychics", active: true, order: 3 },
      { label: "Blogs & Articles", url: "/blogs", active: true, order: 4 }
    ],
    legalLinks: [
      { label: "Terms & Conditions", url: "/terms-&-conditions", active: true, order: 1 }
    ],
    contact: {
      email: {
        address: "info@hecatevoyance.com",
        displayText: "info@hecatevoyance.com",
        active: true
      },
      support: {
        text: "Support",
        url: "/contact",
        active: true
      }
    },
    bottomBar: {
      copyrightText: "All rights reserved.",
      tagline: "Spiritual guidance for the modern seeker",
      showPaymentMethods: true
    },
    paymentMethods: {
      visa: true,
      mastercard: true,
      paypal: true
    },
    colors: {
      background: "#F9FAFB",
      text: "#111827",
      link: "#4B5563",
      linkHover: "#7C3AED",
      border: "#E5E7EB",
      iconColor: "#6B7280"
    }
  };

  // Use API data if available, otherwise use defaults
  const data = footerData || defaultData;

  // Debug log
  console.log('Rendering with data:', data);

  // Get hover color based on platform
  const getHoverColor = (platform) => {
    switch(platform) {
      case 'instagram': return 'hover:text-pink-600';
      case 'facebook': return 'hover:text-blue-600';
      case 'linkedin': return 'hover:text-blue-700';
      case 'twitter': return 'hover:text-blue-400';
      case 'tiktok': return 'hover:text-black';
      case 'youtube': return 'hover:text-red-600';
      default: return 'hover:text-purple-700';
    }
  };

  // Get icon component based on platform
  const getSocialIcon = (platform, className = "w-5 h-5") => {
    switch(platform) {
      case 'instagram': return <Instagram className={className} />;
      case 'facebook': return <Facebook className={className} />;
      case 'linkedin': return <Linkedin className={className} />;
      case 'twitter': return <Twitter className={className} />;
      case 'tiktok': return <TikTokIcon />;
      case 'youtube': return <Youtube className={className} />;
      default: return null;
    }
  };

  // Sort links by order
  const sortedExploreLinks = data.exploreLinks
    ?.filter(link => link.active)
    ?.sort((a, b) => a.order - b.order) || [];

  const sortedLegalLinks = data.legalLinks
    ?.filter(link => link.active)
    ?.sort((a, b) => a.order - b.order) || [];

  const activeSocialMedia = data.socialMedia
    ? Object.entries(data.socialMedia).filter(([_, platform]) => platform?.active)
    : [];

  if (loading) {
    return (
      <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200 py-10 px-4">
        <div className="max-w-6xl mx-auto flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#C9A24D" }} />
          <span className="ml-2 text-sm text-gray-600">Loading footer...</span>
        </div>
      </footer>
    );
  }

  if (error && !footerData) {
    return (
      <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200 py-10 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
          <p className="text-sm text-red-600">Error loading footer: {error}</p>
          <button 
            onClick={fetchFooterData}
            className="mt-2 text-xs text-purple-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </footer>
    );
  }

  return (
    <footer 
      className="bg-gradient-to-b border-t py-10 px-4"
      style={{ 
        background: `linear-gradient(to bottom, ${data.colors?.background || '#F9FAFB'}, ${data.colors?.background || '#F9FAFB'}dd)`,
        borderColor: data.colors?.border || '#E5E7EB'
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info & Social Media */}
          <div className="space-y-4">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: data.colors?.linkHover || '#7C3AED' }} />
                <h4 className="text-lg font-semibold" style={{ color: data.colors?.text || '#111827' }}>
                  {data.company?.name || 'HecateVoyance'}
                </h4>
              </div>
              <span className="text-xs font-medium tracking-wider mt-0.5" style={{ color: data.colors?.linkHover || '#7C3AED' }}>
                {data.company?.tagline || 'SPIRITUAL GUIDANCE'}
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-xs" style={{ color: data.colors?.link || '#4B5563' }}>
              {data.company?.description || 'Your trusted source for spiritual guidance, psychic readings, and personal transformation since 2020.'}
            </p>
            <div className="space-y-2">
              <h5 className="text-sm font-medium" style={{ color: data.colors?.text || '#111827' }}>Connect With Us</h5>
              <div className="flex flex-wrap gap-3">
                {activeSocialMedia.length > 0 ? (
                  activeSocialMedia.map(([platform, platformData]) => (
                    <Link
                      key={platform}
                      to={platformData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-gray-500 transition-all hover:scale-110 ${getHoverColor(platform)}`}
                      style={{ color: data.colors?.iconColor || '#6B7280' }}
                      aria-label={platform}
                    >
                      {getSocialIcon(platform, "w-5 h-5")}
                    </Link>
                  ))
                ) : (
                  // Default social media links if none active
                  <>
                    <Link to="https://instagram.com/hecatevoyance" target="_blank" className="text-gray-500 hover:text-pink-600 transition-all hover:scale-110">
                      <Instagram className="w-5 h-5" />
                    </Link>
                    <Link to="https://facebook.com/hecatevoyance" target="_blank" className="text-gray-500 hover:text-blue-600 transition-all hover:scale-110">
                      <Facebook className="w-5 h-5" />
                    </Link>
                    <Link to="https://linkedin.com/company/hecatevoyance" target="_blank" className="text-gray-500 hover:text-blue-700 transition-all hover:scale-110">
                      <Linkedin className="w-5 h-5" />
                    </Link>
                    <Link to="https://twitter.com/hecatevoyance" target="_blank" className="text-gray-500 hover:text-blue-400 transition-all hover:scale-110">
                      <Twitter className="w-5 h-5" />
                    </Link>
                    <Link to="https://tiktok.com/@hecatevoyance" target="_blank" className="text-gray-500 hover:text-black transition-all hover:scale-110">
                      <TikTokIcon />
                    </Link>
                    <Link to="https://youtube.com/@hecatevoyance" target="_blank" className="text-gray-500 hover:text-red-600 transition-all hover:scale-110">
                      <Youtube className="w-5 h-5" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Links - Main Pages */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: data.colors?.text || '#111827' }}>
              Explore
            </h4>
            <ul className="space-y-2">
              {sortedExploreLinks.length > 0 ? (
                sortedExploreLinks.map((link, index) => (
                  <li key={index}>
                    <Link 
                      to={link.url} 
                      className="text-sm transition-colors"
                      style={{ color: data.colors?.link || '#4B5563' }}
                      onMouseEnter={(e) => e.target.style.color = data.colors?.linkHover || '#7C3AED'}
                      onMouseLeave={(e) => e.target.style.color = data.colors?.link || '#4B5563'}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))
              ) : (
                // Default explore links
                <>
                  <li><Link to="/" className="text-sm text-gray-600 hover:text-purple-700">Home</Link></li>
                  <li><Link to="/about" className="text-sm text-gray-600 hover:text-purple-700">About Us</Link></li>
                  <li><Link to="/psychics" className="text-sm text-gray-600 hover:text-purple-700">Our Psychics</Link></li>
                  <li><Link to="/blogs" className="text-sm text-gray-600 hover:text-purple-700">Blogs & Articles</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Legal Pages */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: data.colors?.text || '#111827' }}>
              Legal
            </h4>
            <ul className="space-y-2">
              {sortedLegalLinks.length > 0 ? (
                sortedLegalLinks.map((link, index) => (
                  <li key={index}>
                    <Link 
                      to={link.url} 
                      className="text-sm transition-colors"
                      style={{ color: data.colors?.link || '#4B5563' }}
                      onMouseEnter={(e) => e.target.style.color = data.colors?.linkHover || '#7C3AED'}
                      onMouseLeave={(e) => e.target.style.color = data.colors?.link || '#4B5563'}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))
              ) : (
                <li><Link to="/terms-&-conditions" className="text-sm text-gray-600 hover:text-purple-700">Terms & Conditions</Link></li>
              )}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: data.colors?.text || '#111827' }}>
              Contact
            </h4>
            <div className="space-y-3">
              {(data.contact?.email?.active !== false) && (
                <Link 
                  to={`mailto:${data.contact?.email?.address || 'info@hecatevoyance.com'}`} 
                  className="flex items-center gap-2 text-sm transition-colors group"
                  style={{ color: data.colors?.link || '#4B5563' }}
                  onMouseEnter={(e) => e.target.style.color = data.colors?.linkHover || '#7C3AED'}
                  onMouseLeave={(e) => e.target.style.color = data.colors?.link || '#4B5563'}
                >
                  <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" style={{ color: data.colors?.iconColor || '#6B7280' }} />
                  <span>{data.contact?.email?.displayText || 'info@hecatevoyance.com'}</span>
                </Link>
              )}
              
              {(data.contact?.support?.active !== false) && (
                <Link 
                  to={data.contact?.support?.url || '/contact'} 
                  className="flex items-center gap-2 text-sm transition-colors group"
                  style={{ color: data.colors?.link || '#4B5563' }}
                  onMouseEnter={(e) => e.target.style.color = data.colors?.linkHover || '#7C3AED'}
                  onMouseLeave={(e) => e.target.style.color = data.colors?.link || '#4B5563'}
                >
                  <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" style={{ color: data.colors?.iconColor || '#6B7280' }} />
                  <span>{data.contact?.support?.text || 'Support'}</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t" style={{ borderColor: data.colors?.border || '#E5E7EB' }}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs" style={{ color: data.colors?.link || '#4B5563' }}>
              © {currentYear} {data.company?.name || 'HecateVoyance'}. {data.bottomBar?.copyrightText || 'All rights reserved.'} 
              <span className="hidden sm:inline mx-2">•</span>
              <br className="sm:hidden" />
              {data.bottomBar?.tagline || 'Spiritual guidance for the modern seeker'}
            </p>
            
            {/* Payment Methods or Trust Badges */}
            {(data.bottomBar?.showPaymentMethods !== false) && (
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: data.colors?.link || '#4B5563' }}>Secure Payment:</span>
                <div className="flex gap-2">
                  {data.paymentMethods?.visa !== false && (
                    <img 
                      src="https://cdn.visa.com/v2/assets/images/logos/visa/blue/logo.svg" 
                      alt="Visa" 
                      className="h-4 w-auto opacity-60 hover:opacity-100 transition-opacity" 
                    />
                  )}
                  {data.paymentMethods?.mastercard !== false && (
                    <img 
                      src="https://www.mastercard.com/content/dam/public/mastercardcom/mea/en/logos/mc-logo-52.svg" 
                      alt="Mastercard" 
                      className="h-4 w-auto opacity-60 hover:opacity-100 transition-opacity" 
                    />
                  )}
                  {data.paymentMethods?.paypal !== false && (
                    <img 
                      src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" 
                      alt="PayPal" 
                      className="h-4 w-auto opacity-60 hover:opacity-100 transition-opacity" 
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}