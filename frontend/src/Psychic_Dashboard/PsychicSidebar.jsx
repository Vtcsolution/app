// components/PsychicSidebar.jsx - UPDATED & FIXED
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Phone, PhoneOff, Clock, LayoutDashboard, MessageCircle, 
  Settings, User, DollarSign, Star, LogOut, History,
  Bell, Home, Headphones
} from 'lucide-react';
import { usePsychicAuth } from "@/context/PsychicAuthContext";
import { MdBookOnline, MdOnlinePrediction } from "react-icons/md";

const PsychicSidebar = ({ side }) => {
  const [activeItem, setActiveItem] = useState("dashboard");
  const location = useLocation();
  const { logout, psychic, pendingCalls, activeCall } = usePsychicAuth();
  const navigate = useNavigate();

  // Update active item based on current path
  useEffect(() => {
    const path = location.pathname;
    
    if (path.includes('/psychic/dashboard/profile')) {
      setActiveItem('profile');
    } else if (path.includes('/psychic/dashboard/golive')) {
      setActiveItem('golive');
    } else if (path.includes('/psychic/dashboard/chats')) {
      setActiveItem('chats');
    } else if (path.includes('/psychic/dashboard/call-history')) {
      setActiveItem('call-history');
    } else if (path.includes('/psychic/call/')) {
      setActiveItem('active-call');
    } else if (path.includes('/psychic/dashboard/earning')) {
      setActiveItem('earning');
    } else if (path.includes('/psychic/dashboard/reviews')) {
      setActiveItem('reviews');
    } else if (path.includes('/psychic/dashboard/settings')) {
      setActiveItem('settings');
    } else if (path.includes('/psychic/dashboard')) {
      setActiveItem('dashboard');
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      try {
        await logout();
        navigate('/psychic/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  // Custom color scheme
  const colors = {
    primary: "#2B1B3F",      // Deep purple
    secondary: "#C9A24D",    // Antique gold
    accent: "#9B7EDE",       // Light purple
    bgLight: "#3A2B4F",      // Lighter purple
    textLight: "#E8D9B0",    // Light gold text
    success: "#10B981",      // Green
    warning: "#F59E0B",      // Yellow
    danger: "#EF4444",       // Red
  };

  // Navigation items with icons and paths
  const navItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: <LayoutDashboard className="h-5 w-5" />, path: '/psychic/dashboard' },
    { id: 'profile', label: 'Profil', icon: <User className="h-5 w-5" />, path: '/psychic/dashboard/profile' },
    { id: 'golive', label: 'Être en ligne', icon: <MdOnlinePrediction className="h-5 w-5" />, path: '/psychic/dashboard/golive' },
    { id: 'chats', label: 'Sessions Chat', icon: <MessageCircle className="h-5 w-5" />, path: '/psychic/dashboard/chats' },
    { id: 'call-history', label: 'Sessions Appel', icon: <Headphones className="h-5 w-5" />, path: '/psychic/dashboard/call-history' },
    { id: 'earning', label: 'Gains', icon: <DollarSign className="h-5 w-5" />, path: '/psychic/dashboard/earning' },
    { id: 'reviews', label: 'Avis', icon: <Star className="h-5 w-5" />, path: '/psychic/dashboard/reviews' },
  ];

  return (
    <div>
      <div 
        id="sidebar-wrapper" 
        className={`${side ? "open" : ""}`}
        style={{ backgroundColor: colors.primary }}
      >
        <div className="sidebar hover:overflow-y-auto h-full scrollbar-hide">
          {/* Psychic Info Header */}
          <div className="p-6 border-b" style={{ borderColor: colors.bgLight }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2" style={{ borderColor: colors.secondary }}>
                {psychic?.image ? (
                  <img 
                    src={psychic.image} 
                    alt={psychic.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: colors.secondary }}
                  >
                    <span className="text-lg font-bold" style={{ color: colors.primary }}>
                      {psychic?.name?.charAt(0) || 'P'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white">{psychic?.name || 'Médium'}</h3>
                <div className="flex items-center gap-1">
                  <div 
                    className={`h-2 w-2 rounded-full ${
                      activeCall ? 'bg-red-500 animate-pulse' :
                      pendingCalls?.length > 0 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                  ></div>
                  <span className="text-xs" style={{ color: colors.textLight }}>
                    {activeCall ? 'En appel' : 
                     pendingCalls?.length > 0 ? `${pendingCalls.length} en attente` : 'Disponible'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <ul className="px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <Link 
                  to={item.path} 
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                    activeItem === item.id 
                      ? 'bg-opacity-30 shadow-lg transform scale-[1.02]' 
                      : 'hover:bg-opacity-20'
                  }`}
                  style={{
                    backgroundColor: activeItem === item.id ? colors.secondary + '30' : 'transparent',
                    color: activeItem === item.id ? colors.textLight : 'white',
                  }}
                  onClick={() => setActiveItem(item.id)}
                >
                  <div 
                    className={`p-1.5 rounded-md ${
                      activeItem === item.id 
                        ? 'bg-opacity-20' 
                        : ''
                    }`}
                    style={{
                      backgroundColor: activeItem === item.id ? colors.secondary + '20' : colors.bgLight + '50',
                    }}
                  >
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                  
                  {/* Notification badges */}
                  {item.id === 'call-history' && pendingCalls?.length > 0 && (
                    <span 
                      className="ml-auto px-2 py-0.5 text-xs rounded-full animate-pulse"
                      style={{ backgroundColor: colors.warning, color: colors.primary }}
                    >
                      {pendingCalls.length}
                    </span>
                  )}
                </Link>
              </li>
            ))}
            
            {/* Active Call Quick Access */}
            {activeCall && (
              <li className="mt-4">
                <Link 
                  to={`/psychic/call/${activeCall.callRequestId || activeCall._id}`}
                  className="flex items-center gap-3 p-3 rounded-lg animate-pulse border"
                  style={{
                    backgroundColor: colors.danger + '15',
                    borderColor: colors.danger,
                    color: colors.textLight,
                  }}
                >
                  <div className="p-1.5 rounded-md bg-red-500 bg-opacity-20">
                    <Phone className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold">Appel actif</span>
                    <div className="text-xs opacity-80">Cliquez pour rejoindre</div>
                  </div>
                </Link>
              </li>
            )}
            
            {/* Divider */}
            <div className="h-px my-4" style={{ backgroundColor: colors.bgLight }}></div>
            
            {/* Logout Button */}
            <li>
              <div 
                onClick={handleLogout}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-opacity-20"
                style={{
                  color: colors.danger,
                  backgroundColor: activeItem === 'logout' ? colors.danger + '15' : 'transparent',
                }}
              >
                <div className="p-1.5 rounded-md bg-red-500 bg-opacity-20">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="font-medium">Déconnexion</span>
              </div>
            </li>
          </ul>
          
          {/* Footer Status */}
          <div className="px-4 py-3 border-t mt-auto" style={{ borderColor: colors.bgLight }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className={`h-2 w-2 rounded-full ${
                    activeCall ? 'animate-pulse bg-red-500' :
                    pendingCalls?.length > 0 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                ></div>
                <span className="text-xs" style={{ color: colors.textLight }}>
                  {activeCall ? 'Occupé' : 
                   pendingCalls?.length > 0 ? 'Appels en attente' : 'En ligne'}
                </span>
              </div>
              {psychic?.ratePerMin && (
                <div className="text-xs" style={{ color: colors.secondary }}>
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(psychic.ratePerMin)}/min
                </div>
              )}
            </div>
            {psychic?.specialties && psychic.specialties.length > 0 && (
              <div className="text-xs mt-2" style={{ color: colors.textLight + '80' }}>
                Spécialités : {psychic.specialties.slice(0, 2).join(', ')}
                {psychic.specialties.length > 2 && '...'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .sidebar {
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        #sidebar-wrapper {
          width: 260px;
          height: 100vh;
          position: fixed;
          left: -260px;
          transition: left 0.3s ease-in-out;
          z-index: 1000;
        }
        
        #sidebar-wrapper.open {
          left: 0;
        }
        
        @media (min-width: 768px) {
          #sidebar-wrapper {
            left: 0;
          }
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Smooth animations */
        .transform {
          transition: transform 0.2s ease-in-out;
        }
        
        /* Hover effects */
        li a:hover, li div:hover {
          transform: translateX(2px);
        }
      `}</style>
    </div>
  );
};

export default PsychicSidebar;