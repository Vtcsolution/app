// components/Doctor_Side_Bar.jsx (Admin version - Psychics focused)
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BadgeDollarSign,
  MessageCircle,
  Star,
  User,
  LogOut,
  Users,           
  UserPlus,        
  UserCheck,       
  UserCog,         
  MessageSquare,
  FileText,
  Mail,
  Settings,
  BookOpen,
  Menu,
  ChevronDown,
  DollarSign,
  Headphones,
  TrendingUp,
  Award,
  Home,
  Info,
  Phone,
  File,
  Globe,
  DotIcon,
  User2,
  ListEnd,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Doctor_Side_Bar = ({ side, setSide }) => {
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("dashboard");
  const [openDropdowns, setOpenDropdowns] = useState({
    psychics: false,
    blogs: false,
    pages: false,
  });

  // Color scheme
  const colors = {
    primary: "#2B1B3F",
    secondary: "#C9A24D",
    accent: "#9B7EDE",
    bgLight: "#3A2B4F",
    textLight: "#E8D9B0",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
  };

  // Determine active item based on current path
  useEffect(() => {
    const path = location.pathname;

    if (path === '/admin/dashboard') {
      setActiveItem('dashboard');
    }
    else if (path.includes('/admin/dashboard/add-humancoach')) {
      setActiveItem('add-psychic');
    }
    else if (path.includes('/admin/dashboard/humancoach')) {
      setActiveItem('all-psychics');
    }
    else if (path.includes('/admin/dashboard/newcoach')) {
      setActiveItem('new-psychics');
    }
    else if (path.includes('/admin/dashboard/psychic-earnings')) {
      setActiveItem('psychic-earning');
    }
    else if (path.includes('/admin/dashboard/human-reviews')) {
      setActiveItem('coach-reviews');
    }
    else if (path.includes('/admin/dashboard/transactions')) {
      setActiveItem('transactions');
    }
    else if (path.includes('/admin/dashboard/human-chat')) {
      setActiveItem('human-chats');
    }
    else if (path.includes('/admin/dashboard/blogs/add')) {
      setActiveItem('add-blogs');
    }
    else if (path.includes('/admin/dashboard/blogs')) {
      setActiveItem('blogs');
    }
    else if (path.includes('/admin/dashboard/comments')) {
      setActiveItem('comments');
    }
    else if (path.includes('/admin/dashboard/allusers')) {
      setActiveItem('users');
    }
    else if (path.includes('/admin/dashboard/pages/home')) {
      setActiveItem('page-home');
    }
    else if (path.includes('/admin/dashboard/pages/about')) {
      setActiveItem('page-about');
    }
    else if (path.includes('/admin/dashboard/pages/contact')) {
      setActiveItem('page-contact');
    }
    else if (path.includes('/admin/dashboard/pages/terms')) {
      setActiveItem('page-terms');
    }
    else if (path.includes('/admin/dashboard/pages/footer')) {
      setActiveItem('footer');
    }
    else if (path.includes('/admin/dashboard/pages/psychics')) {
      setActiveItem('packages');
    }
    else if (path.includes('/admin/dashboard/sendmail')) {
      setActiveItem('send-email');
    }
    else if (path.includes('/admin/dashboard/settings')) {
      setActiveItem('settings');
    }
  }, [location.pathname]);

  const toggleDropdown = (dropdown) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

  const dropdownVariants = {
    hidden: { 
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    visible: { 
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0,
      x: -10,
      transition: { duration: 0.2 }
    },
    visible: { 
      opacity: 1,
      x: 0,
      transition: { duration: 0.2 }
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/admin/dashboard',
      type: 'single',
    },
    {
      id: 'psychics',
      label: 'Psychics',
      icon: <Users className="h-5 w-5" />,
      type: 'dropdown',
      dropdown: 'psychics',
      children: [
        {
          id: 'add-psychic',
          label: 'Add Psychic',
          icon: <UserPlus className="h-5 w-5" />,
          path: '/admin/dashboard/add-humancoach',
        },
        {
          id: 'all-psychics',
          label: 'All Psychics',
          icon: <UserCheck className="h-5 w-5" />,
          path: '/admin/dashboard/humancoach',
        },
        {
          id: 'new-psychics',
          label: 'New Psychics',
          icon: <UserCog className="h-5 w-5" />,
          path: '/admin/dashboard/newcoach',
        },
      ],
    },
    {
      id: 'psychic-earning',
      label: 'Psychic Earnings',
      icon: <TrendingUp className="h-5 w-5" />,
      path: '/admin/dashboard/psychic-earnings',
      type: 'single',
    },
    {
      id: 'coach-reviews',
      label: 'Psychic Reviews',
      icon: <Award className="h-5 w-5" />,
      path: '/admin/dashboard/human-reviews',
      type: 'single',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: <BadgeDollarSign className="h-5 w-5" />,
      path: '/admin/dashboard/transactions',
      type: 'single',
    },
    {
      id: 'human-chats',
      label: 'Chat / Calls',
      icon: <Headphones className="h-5 w-5" />,
      path: '/admin/dashboard/human-chat',
      type: 'single',
    },
    {
      id: 'users',
      label: 'Users',
      icon: <User className="h-5 w-5" />,
      path: '/admin/dashboard/allusers',
      type: 'single',
    },
    {
      id: 'pages',
      label: 'Pages',
      icon: <Globe className="h-5 w-5" />,
      type: 'dropdown',
      dropdown: 'pages',
      children: [
        {
          id: 'page-home',
          label: 'Home Page',
          icon: <Home className="h-5 w-5" />,
          path: '/admin/dashboard/pages/home',
        },
        {
          id: 'page-about',
          label: 'About Us',
          icon: <Info className="h-5 w-5" />,
          path: '/admin/dashboard/pages/about',
        },
        {
          id: 'page-contact',
          label: 'Contact Us',
          icon: <Phone className="h-5 w-5" />,
          path: '/admin/dashboard/pages/contact',
        },
        {
          id: 'Psychics',
          label: 'Psychics',
          icon: <User2 className="h-5 w-5" />,
          path: '/admin/dashboard/pages/psychics',
        },
        {
          id: 'page-terms',
          label: 'Terms & Conditions',
          icon: <File className="h-5 w-5" />,
          path: '/admin/dashboard/pages/terms',
        },
        {
          id: 'footer',
          label: 'Footer',
          icon: <ListEnd className="h-5 w-5" />,
          path: '/admin/dashboard/pages/footer',
        },
        
      ],
    },
    {
      id: 'blogs',
      label: 'Blogs',
      icon: <BookOpen className="h-5 w-5" />,
      type: 'dropdown',
      dropdown: 'blogs',
      children: [
        {
          id: 'blogs',
          label: 'All Blogs',
          icon: <FileText className="h-5 w-5" />,
          path: '/admin/dashboard/blogs',
        },
        {
          id: 'add-blogs',
          label: 'Add Blog',
          icon: <FileText className="h-5 w-5" />,
          path: '/admin/dashboard/blogs/add',
        },
        {
          id: 'comments',
          label: 'Comments',
          icon: <MessageSquare className="h-5 w-5" />,
          path: '/admin/dashboard/comments',
        },
      ],
    },
    {
      id: 'send-email',
      label: 'Send Email',
      icon: <Mail className="h-5 w-5" />,
      path: '/admin/dashboard/sendmail',
      type: 'single',
    },
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('adminToken');
      sessionStorage.clear();
      window.location.href = '/admin/login';
    }
  };

  const isChildActive = (children) => {
    return children.some(child => child.id === activeItem);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSide(!side)}
        className="fixed top-4 left-4 z-[1001] md:hidden bg-white p-2 rounded-lg shadow-lg"
      >
        <Menu className="h-6 w-6" style={{ color: colors.primary }} />
      </button>

      <div
        className={`fixed left-0 top-0 h-screen z-[1000] transition-all duration-300 ease-in-out shadow-xl
          ${side ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ 
          width: '280px',
          backgroundColor: colors.primary,
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div className="h-full flex flex-col hover:overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
          {/* Header */}
          <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: colors.bgLight }}>
            <h2 className="font-bold text-xl tracking-tight" style={{ color: colors.secondary }}>
              Admin Panel
            </h2>
            <button
              onClick={() => setSide(false)}
              className="md:hidden text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <ul className="px-3 py-5 space-y-1 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {navItems.map((item) => {
              if (item.type === 'single') {
                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3.5 p-3.5 rounded-xl transition-all duration-200 relative ${
                        activeItem === item.id
                          ? 'bg-white/10 shadow-md scale-[1.02]'
                          : 'hover:bg-white/5'
                      }`}
                      style={{
                        color: activeItem === item.id ? colors.textLight : 'white',
                      }}
                      onClick={() => {
                        setActiveItem(item.id);
                        if (window.innerWidth < 768) {
                          setSide(false);
                        }
                      }}
                    >
                      <div
                        className="p-2 rounded-lg transition-all duration-200"
                        style={{
                          backgroundColor: activeItem === item.id
                            ? colors.secondary + '30'
                            : colors.bgLight + '60',
                        }}
                      >
                        {item.icon}
                      </div>
                      <span className="font-medium text-[15px]">{item.label}</span>
                      
                      {activeItem === item.id && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute right-3 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: colors.secondary }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </Link>
                  </motion.li>
                );
              }

              if (item.type === 'dropdown') {
                const hasActiveChild = isChildActive(item.children);
                
                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`flex items-center justify-between gap-3.5 p-3.5 rounded-xl cursor-pointer transition-all duration-200 ${
                        hasActiveChild ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                      style={{
                        color: hasActiveChild ? colors.textLight : 'white',
                      }}
                      onClick={() => toggleDropdown(item.dropdown)}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className="p-2 rounded-lg transition-all duration-200"
                          style={{
                            backgroundColor: hasActiveChild
                              ? colors.secondary + '30'
                              : colors.bgLight + '60',
                          }}
                        >
                          {item.icon}
                        </div>
                        <span className="font-medium text-[15px]">{item.label}</span>
                      </div>
                      
                      <motion.div
                        animate={{ rotate: openDropdowns[item.dropdown] ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.div>
                    </div>

                    <AnimatePresence initial={false}>
                      {openDropdowns[item.dropdown] && (
                        <motion.ul
                          className="mt-1 ml-11 space-y-1 overflow-hidden"
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          {item.children.map((child) => (
                            <motion.li
                              key={child.id}
                              variants={itemVariants}
                            >
                              <Link
                                to={child.path}
                                className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 relative ${
                                  activeItem === child.id
                                    ? 'bg-white/10'
                                    : 'hover:bg-white/5'
                                }`}
                                style={{
                                  color: activeItem === child.id ? colors.textLight : 'rgba(255,255,255,0.7)',
                                }}
                                onClick={() => {
                                  setActiveItem(child.id);
                                  if (window.innerWidth < 768) {
                                    setSide(false);
                                  }
                                }}
                              >
                                <div className="p-1.5 rounded-md transition-all duration-200" style={{
                                  backgroundColor: activeItem === child.id
                                    ? colors.secondary + '20'
                                    : 'transparent',
                                }}>
                                  {child.icon}
                                </div>
                                <span className="text-sm">{child.label}</span>
                                
                                {activeItem === child.id && (
                                  <motion.div
                                    layoutId="activeIndicator"
                                    className="absolute right-3 w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: colors.secondary }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                  />
                                )}
                              </Link>
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              }
              return null;
            })}
          </ul>

          {/* Logout */}
          <motion.div
            className="px-4 py-6 border-t mt-auto"
            style={{ borderColor: colors.bgLight }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div
              className="flex items-center gap-3.5 p-3.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all relative group"
              style={{ color: colors.danger }}
              onClick={handleLogout}
            >
              <div 
                className="p-2 rounded-lg transition-all duration-200 group-hover:scale-110"
                style={{ backgroundColor: colors.danger + '20' }}
              >
                <LogOut className="h-5 w-5" />
              </div>
              <span className="font-medium">Logout</span>
              
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ backgroundColor: colors.danger + '10' }}
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add these styles to your global CSS or create a separate CSS file */}
      <style>{`
        .sidebar-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .sidebar-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default Doctor_Side_Bar;