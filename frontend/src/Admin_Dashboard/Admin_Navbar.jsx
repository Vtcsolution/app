import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { 
  AlertTriangle, Bell, Calendar, Heart, Info, LayoutDashboard, 
  LogOut, Menu, MessageSquare, Settings, ShoppingCart, User, 
  ExternalLink 
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";
import axios from "axios";
import { toast } from "sonner";

// Color scheme matching psychic dashboard
const colors = {
  primary: "#2B1B3F",      // Deep purple
  secondary: "#C9A24D",    // Antique gold
  accent: "#9B7EDE",       // Light purple
  bgLight: "#3A2B4F",      // Lighter purple
  textLight: "#E8D9B0",    // Light gold text
  success: "#10B981",      // Green
  warning: "#F59E0B",      // Yellow
  danger: "#EF4444",       // Red
  background: "#F5F3EB",   // Soft ivory
};

const Dashboard_Navbar = ({ side, setSide }) => {
  const [isOpen1, setIsOpen1] = useState(false);
  const { admin, setAdmin } = useAdminAuth();
  const navigate = useNavigate();

  // Website URL from environment variables
  const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://www.spiritueelchatten.nl';

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/admin/logout`, {}, { withCredentials: true });
      toast.success("Logged out successfully");
      setAdmin(null);
      navigate("/admin/login");
    } catch (err) {
      console.error("Logout failed", err);
      toast.error("Failed to logout");
    }
  };

  const toggleDropdown = () => setIsOpen1(!isOpen1);

  // Handle visit website redirect
  const handleVisitWebsite = () => {
    window.open(WEBSITE_URL, '_blank'); // Opens in new tab
  };

  return (
    <div 
      className="h-[70px] border-b fixed top-0 left-0 right-0 z-[100] flex justify-between items-center lg:px-20 md:px-10 px-4 shadow-lg"
      style={{ 
        backgroundColor: colors.primary,
        borderColor: colors.secondary + '30',
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.bgLight} 100%)`,
      }}
    >
      
      {/* Logo + Menu Button */}
      <div className="logo flex items-center gap-2 md:gap-4">
        <button
          className="p-2 rounded-lg hover:scale-105 transition-all duration-200 md:hidden"
          onClick={() => setSide(!side)}
          style={{
            backgroundColor: colors.secondary + '20',
            color: colors.textLight,
          }}
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {/* Logo */}
        <div className="flex items-center gap-3">
         <div 
  className="w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200"
  style={{ 
    borderColor: colors.secondary,
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.bgLight} 100%)`,
  }}
  title="Hecatevoyance"
>
  <span 
    className="text-sm font-bold uppercase"
    style={{ color: colors.textLight }}
  >
    H
  </span>
</div>
          <div className="hidden md:block">
            <h1 className="text-lg font-bold" style={{ color: colors.textLight }}>Admin Dashboard</h1>
            <p className="text-xs" style={{ color: colors.textLight + '80' }}>
              {admin?.name || 'Administrator'}
            </p>
          </div>
        </div>
      </div>

      {/* Center Section - Visit Website Button */}
      <div className="flex-1 flex justify-center items-center mx-4 hidden md:flex">
        <Button
          variant="outline"
          size="sm"
          onClick={handleVisitWebsite}
          className="flex items-center gap-2 backdrop-blur-sm transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: colors.secondary,
            color: colors.primary,
            borderColor: colors.secondary + '50',
          }}
        >
          <ExternalLink className="h-4 w-4" />
          <span className="font-semibold">Visit Website</span>
        </Button>
      </div>

      {/* Admin Avatar Dropdown */}
      <div className="flex items-center gap-4 relative">
        {/* Mobile Visit Website Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleVisitWebsite}
          className="md:hidden hover:scale-110 transition-transform duration-200"
          style={{
            color: colors.textLight,
          }}
          title="Visit Website"
        >
          <ExternalLink className="h-5 w-5" />
        </Button>

        {/* Avatar with dropdown */}
        <div className="relative">
          <button
            className="relative rounded-full transition-all duration-200 hover:scale-105 hover:shadow-lg"
            onClick={toggleDropdown}
            style={{
              backgroundColor: colors.secondary + '20',
              border: `2px solid ${colors.secondary + '30'}`,
            }}
          >
            <Avatar className="w-11 h-11">
              {admin?.image ? (
                <AvatarImage 
                  src={admin.image} 
                  alt="admin avatar" 
                  className="object-cover"
                />
              ) : (
                <AvatarFallback 
                  className="font-bold"
                  style={{
                    backgroundColor: colors.secondary,
                    color: colors.primary,
                  }}
                >
                  <User className="w-6 h-6" />
                </AvatarFallback>
              )}
            </Avatar>
            
            {/* Online indicator */}
            <div 
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{
                backgroundColor: colors.success,
                borderColor: colors.primary,
              }}
            />
          </button>

          <AnimatePresence>
            {isOpen1 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-16 z-50 w-64 rounded-xl shadow-2xl overflow-hidden"
                style={{
                  backgroundColor: colors.primary,
                  border: `1px solid ${colors.secondary + '30'}`,
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Dropdown header */}
                <div 
                  className="p-4 border-b"
                  style={{ borderColor: colors.secondary + '20' }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      {admin?.image ? (
                        <AvatarImage 
                          src={admin.image} 
                          alt="admin avatar" 
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback 
                          className="font-bold"
                          style={{
                            backgroundColor: colors.secondary,
                            color: colors.primary,
                          }}
                        >
                          <User className="w-5 h-5" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p 
                        className="font-bold text-sm"
                        style={{ color: colors.textLight }}
                      >
                        {admin?.name || 'Administrator'}
                      </p>
                      <p 
                        className="text-xs"
                        style={{ color: colors.textLight + '70' }}
                      >
                        {admin?.email || 'admin@example.com'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dropdown menu items */}
                <ul className="p-2 space-y-1">
                  <Link to="/admin/dashboard/profile">
                    <li 
                      className="flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                      style={{
                        color: colors.textLight,
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.secondary + '20'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: colors.secondary + '10' }}
                      >
                        <LayoutDashboard className="h-4 w-4" style={{ color: colors.secondary }} />
                      </div>
                      <span className="font-medium">Profile</span>
                    </li>
                  </Link>
                  
                
                  
                  <li 
                    className="flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all duration-200 hover:scale-[1.02] mt-2"
                    onClick={handleLogout}
                    style={{
                      color: colors.danger,
                      backgroundColor: colors.danger + '10',
                      border: `1px solid ${colors.danger + '20'}`,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.danger + '20'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.danger + '10'}
                  >
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: colors.danger + '20' }}
                    >
                      <LogOut className="h-4 w-4" style={{ color: colors.danger }} />
                    </div>
                    <span className="font-medium">Logout</span>
                  </li>
                </ul>
                
                {/* Footer */}
                <div 
                  className="p-3 border-t text-center"
                  style={{ borderColor: colors.secondary + '20' }}
                >
                  <p 
                    className="text-xs"
                    style={{ color: colors.textLight + '50' }}
                  >
                    Admin Panel v1.0
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard_Navbar;