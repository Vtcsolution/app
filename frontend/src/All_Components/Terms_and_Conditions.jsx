import { ScrollText, Users, CreditCard, RotateCcw, AlertTriangle, Shield, Copyright, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export default function TermsAndConditions() {
  const [termsData, setTermsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTermsData();
  }, []);

  const fetchTermsData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/terms`);
      const data = await response.json();
      if (data.success) {
        setTermsData(data.data);
      }
    } catch (error) {
      console.error('Error fetching terms data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get icon component based on icon name
  const getIcon = (iconName, className = "h-6 w-6") => {
    const icons = {
      'scroll-text': <ScrollText className={className} />,
      'users': <Users className={className} />,
      'credit-card': <CreditCard className={className} />,
      'rotate-ccw': <RotateCcw className={className} />,
      'alert-triangle': <AlertTriangle className={className} />,
      'shield': <Shield className={className} />,
      'copyright': <Copyright className={className} />
    };
    return icons[iconName] || <ScrollText className={className} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F3EB" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#C9A24D" }} />
      </div>
    );
  }

  if (!termsData) return null;

  const colors = termsData.colors;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.softIvory }}>
      {/* Hero Section - Exactly like Contact page */}
      <div className="relative overflow-hidden" style={{ backgroundColor: colors.deepPurple }}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
              style={{ backgroundColor: colors.antiqueGold + "20", color: colors.antiqueGold }}>
              {getIcon(termsData.hero.icon, "h-10 w-10")}
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">
              {termsData.hero.title}
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              {termsData.hero.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Exactly like Contact page structure */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-1 gap-8">
          {/* Quick Navigation - Centered */}
          <div className="mb-12">
            <div className="flex flex-wrap gap-2 justify-center">
              {termsData.quickNav.map((item) => (
                <a 
                  key={item.id}
                  href={`#${item.id}`}
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: colors.antiqueGold + "15",
                    color: colors.deepPurple,
                    border: `1px solid ${colors.antiqueGold}30`
                  }}
                >
                  {item.label}
                  <ChevronRight className="ml-1 h-3 w-3" />
                </a>
              ))}
            </div>
          </div>

          {/* Terms Content - Full width like Contact page */}
          <div className="space-y-8">
            {/* Section 1: User Responsibilities */}
            <section id={termsData.quickNav[0]?.id || "responsibilities"} className="scroll-mt-20">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border"
                style={{ borderColor: colors.antiqueGold + "30", boxShadow: `0 10px 25px ${colors.deepPurple}10` }}>
                <div className="p-2" style={{ backgroundColor: colors.deepPurple + "05" }}>
                  <div className="flex items-center p-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg mr-4"
                      style={{ backgroundColor: colors.deepPurple, color: colors.softIvory }}>
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: colors.deepPurple }}>
                        {termsData.userResponsibilities.title}
                      </h2>
                      <p className="text-sm opacity-75" style={{ color: colors.deepPurple }}>
                        {termsData.userResponsibilities.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <p className="text-gray-700 mb-6">
                    {termsData.userResponsibilities.description}
                  </p>
                  <ul className="space-y-4">
                    {termsData.userResponsibilities.items.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 mt-1 mr-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: colors.antiqueGold, color: colors.deepPurple }}>
                            {index + 1}
                          </div>
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 p-4 rounded-lg" 
                    style={{ backgroundColor: colors.antiqueGold + "10", borderLeft: `4px solid ${colors.antiqueGold}` }}>
                    <p className="font-medium" style={{ color: colors.deepPurple }}>
                      {termsData.userResponsibilities.importantNote}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Payment Terms */}
            <section id={termsData.quickNav[1]?.id || "payment"} className="scroll-mt-20">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border"
                style={{ borderColor: colors.antiqueGold + "30", boxShadow: `0 10px 25px ${colors.deepPurple}10` }}>
                <div className="p-2" style={{ backgroundColor: colors.deepPurple + "05" }}>
                  <div className="flex items-center p-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg mr-4"
                      style={{ backgroundColor: colors.deepPurple, color: colors.softIvory }}>
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: colors.deepPurple }}>
                        {termsData.paymentTerms.title}
                      </h2>
                      <p className="text-sm opacity-75" style={{ color: colors.deepPurple }}>
                        {termsData.paymentTerms.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="space-y-4 text-gray-700">
                    <p>{termsData.paymentTerms.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-6 my-6">
                      {termsData.paymentTerms.systems.map((system, index) => (
                        <div key={index} className="p-4 rounded-lg border" style={{ borderColor: colors.antiqueGold + "30" }}>
                          <h3 className="font-bold mb-2 text-lg" style={{ color: colors.deepPurple }}>{system.title}</h3>
                          <p dangerouslySetInnerHTML={{ __html: system.description }} />
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium mb-2">Important Notes:</p>
                      <ul className="space-y-2 text-sm">
                        {termsData.paymentTerms.importantNotes.map((note, index) => (
                          <li key={index} className="flex items-start">
                            <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" style={{ color: colors.antiqueGold }} />
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Refund Policy */}
            <section id={termsData.quickNav[2]?.id || "refund"} className="scroll-mt-20">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border"
                style={{ borderColor: colors.antiqueGold + "30", boxShadow: `0 10px 25px ${colors.deepPurple}10` }}>
                <div className="p-2" style={{ backgroundColor: colors.deepPurple + "05" }}>
                  <div className="flex items-center p-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg mr-4"
                      style={{ backgroundColor: colors.deepPurple, color: colors.softIvory }}>
                      <RotateCcw className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: colors.deepPurple }}>
                        {termsData.refundPolicy.title}
                      </h2>
                      <p className="text-sm opacity-75" style={{ color: colors.deepPurple }}>
                        {termsData.refundPolicy.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="space-y-6 text-gray-700">
                    <p>{termsData.refundPolicy.description}</p>
                    
                    <div className="p-4 rounded-lg" style={{ backgroundColor: "#FEF2F2", borderLeft: `4px solid #DC2626` }}>
                      <p className="font-semibold text-red-700">
                        {termsData.refundPolicy.finalSaleNote}
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg" style={{ backgroundColor: "#F0F9FF", borderLeft: `4px solid #0EA5E9` }}>
                      <p className="font-medium text-gray-700 mb-2">{termsData.refundPolicy.technicalIssue.title}</p>
                      <p>{termsData.refundPolicy.technicalIssue.description}</p>
                      <p className="text-sm mt-2">{termsData.refundPolicy.technicalIssue.responseTime}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium mb-2">Refund Exceptions:</p>
                      <ul className="space-y-2 text-sm">
                        {termsData.refundPolicy.exceptions.map((exception, index) => {
                          const dotColor = 
                            exception.type === 'no-refund' ? 'bg-red-500' : 
                            exception.type === 'refund-eligible' ? 'bg-green-500' : 'bg-blue-500';
                          return (
                            <li key={index} className="flex items-start">
                              <div className={`w-2 h-2 rounded-full ${dotColor} mt-2 mr-3 flex-shrink-0`}></div>
                              {exception.text}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Disclaimer */}
            <section id={termsData.quickNav[3]?.id || "disclaimer"} className="scroll-mt-20">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border"
                style={{ borderColor: colors.antiqueGold + "30", boxShadow: `0 10px 25px ${colors.deepPurple}10` }}>
                <div className="p-2" style={{ backgroundColor: colors.deepPurple + "05" }}>
                  <div className="flex items-center p-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg mr-4"
                      style={{ backgroundColor: colors.deepPurple, color: colors.softIvory }}>
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: colors.deepPurple }}>
                        {termsData.disclaimer.title}
                      </h2>
                      <p className="text-sm opacity-75" style={{ color: colors.deepPurple }}>
                        {termsData.disclaimer.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="space-y-4 text-gray-700">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: "#FEF3C7", border: `2px solid ${colors.antiqueGold}` }}>
                      <p className="font-bold text-lg text-center mb-2" style={{ color: colors.deepPurple }}>
                        {termsData.disclaimer.criticalWarning.title}
                      </p>
                      <p className="text-center">
                        {termsData.disclaimer.criticalWarning.text}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {termsData.disclaimer.points.map((point, index) => (
                        <div key={index} className="flex items-start p-3 rounded-lg" style={{ backgroundColor: colors.softIvory }}>
                          <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" style={{ color: colors.antiqueGold }} />
                          <div>
                            <p className="font-semibold mb-1">{point.title}</p>
                            <p className="text-sm" dangerouslySetInnerHTML={{ __html: point.description }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 rounded-lg border" style={{ borderColor: "#DC2626" }}>
                      <p className="text-red-600 text-center font-medium">
                        {termsData.disclaimer.liabilityNotice}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Intellectual Property */}
            <section id={termsData.quickNav[4]?.id || "property"} className="scroll-mt-20">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border"
                style={{ borderColor: colors.antiqueGold + "30", boxShadow: `0 10px 25px ${colors.deepPurple}10` }}>
                <div className="p-2" style={{ backgroundColor: colors.deepPurple + "05" }}>
                  <div className="flex items-center p-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg mr-4"
                      style={{ backgroundColor: colors.deepPurple, color: colors.softIvory }}>
                      <Copyright className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: colors.deepPurple }}>
                        {termsData.intellectualProperty.title}
                      </h2>
                      <p className="text-sm opacity-75" style={{ color: colors.deepPurple }}>
                        {termsData.intellectualProperty.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="space-y-4 text-gray-700">
                    <p>
                      {termsData.intellectualProperty.description}
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 my-6">
                      <div className="p-4 rounded-lg border" style={{ borderColor: colors.antiqueGold + "30" }}>
                        <h3 className="font-bold mb-2" style={{ color: colors.deepPurple }}>What We Protect</h3>
                        <ul className="space-y-2 text-sm">
                          {termsData.intellectualProperty.protected.map((item, index) => (
                            <li key={index} className="flex items-start">
                              <Shield className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" style={{ color: colors.antiqueGold }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="p-4 rounded-lg border" style={{ borderColor: colors.antiqueGold + "30" }}>
                        <h3 className="font-bold mb-2" style={{ color: colors.deepPurple }}>Restricted Activities</h3>
                        <ul className="space-y-2 text-sm">
                          {termsData.intellectualProperty.restricted.map((item, index) => (
                            <li key={index} className="flex items-start">
                              <div className="w-2 h-2 rounded-full bg-red-500 mt-2 mr-3 flex-shrink-0"></div>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colors.antiqueGold + "10" }}>
                      <p className="font-medium" style={{ color: colors.deepPurple }}>
                        {termsData.intellectualProperty.warning}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Acceptance Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border" 
              style={{ borderColor: colors.antiqueGold + "30", boxShadow: `0 10px 25px ${colors.deepPurple}10` }}>
              <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: colors.deepPurple }}>
                {termsData.acceptance.title}
              </h3>
              <p className="text-gray-700 mb-6 text-center">
                {termsData.acceptance.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="rounded-full px-8"
                  style={{ 
                    backgroundColor: colors.antiqueGold,
                    color: colors.deepPurple
                  }}
                >
                  {termsData.acceptance.backToTopText}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="rounded-full px-8"
                  style={{ 
                    borderColor: colors.antiqueGold,
                    color: colors.deepPurple
                  }}
                >
                  {termsData.acceptance.returnHomeText}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t" style={{ borderColor: colors.antiqueGold + "30" }}>
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 rounded-full mr-3 flex items-center justify-center" 
              style={{ backgroundColor: colors.deepPurple, color: colors.softIvory }}>
              <Copyright className="h-4 w-4" />
            </div>
            <h4 className="text-lg font-bold" style={{ color: colors.deepPurple }}>{termsData.footer.companyName}</h4>
          </div>
          <p className="text-gray-600 mb-2">Last updated: {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p className="text-gray-600">© {new Date().getFullYear()} {termsData.footer.companyName}. {termsData.footer.copyrightText}</p>
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
}