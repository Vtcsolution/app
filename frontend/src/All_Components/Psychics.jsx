// Psychics.jsx - UPDATED to fetch admin content
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Star, 
  Sparkles, 
  Users, 
  Clock, 
  Shield, 
  Award,
  MessageCircle,
  Phone,
  User,
  Zap,
  Heart,
  Globe,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  ChevronRight,
  Loader,
  Wifi,
  WifiOff,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "./screen/AuthContext";
import io from 'socket.io-client';

const Psychics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for admin content
  const [pageContent, setPageContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(true);
  
  // Colors from admin (will be overridden by API)
  const [colors, setColors] = useState({
    deepPurple: "#2B1B3F",
    antiqueGold: "#C9A24D",
    softIvory: "#F5F3EB",
    lightGold: "#E8D9B0",
    darkPurple: "#1A1129",
  });

  // Socket reference
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const subscribedPsychicsRef = useRef(new Set());

  // State
  const [psychics, setPsychics] = useState([]);
  const [filteredPsychics, setFilteredPsychics] = useState([]);
  const [displayedPsychics, setDisplayedPsychics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [psychicStatuses, setPsychicStatuses] = useState({});
  const [ratingSummaries, setRatingSummaries] = useState({});
  
  // Pagination
  const [itemsPerPage] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Status configuration
  const statusConfig = {
    online: { color: '#10b981', label: 'Online', bg: '#10b98110', glow: '#10b98140' },
    away:   { color: '#f59e0b', label: 'Away',   bg: '#f59e0b10', glow: '#f59e0b40' },
    busy:   { color: '#f97316', label: 'Busy',   bg: '#f9731610', glow: '#f9731640' },
    offline:{ color: '#9ca3af', label: 'Offline', bg: '#9ca3af10', glow: '#9ca3af40' },
  };

  // Fetch admin page content
  useEffect(() => {
    const fetchPageContent = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/psychics-page`);
        
        if (response.data.success) {
          setPageContent(response.data.data);
          // Update colors from admin
          if (response.data.data.colors) {
            setColors(response.data.data.colors);
          }
        }
      } catch (error) {
        console.error('Error fetching psychics page content:', error);
        // Use default content if admin fetch fails
        setPageContent({
          hero: {
            badge: "Our Gifted Community",
            title: "Meet Our Gifted Psychics",
            highlightedText: "Gifted Psychics",
            description: "Discover authentic spiritual guides ready to illuminate your path with wisdom, empathy, and profound insight."
          },
          stats: [
            { label: "Psychics Found", suffix: "", icon: "users" },
            { label: "Available Now", suffix: "", icon: "zap" },
            { label: "Average Rating", suffix: "", icon: "star" },
            { label: "Total Readings", suffix: "+", icon: "award" }
          ],
          searchSection: {
            placeholder: "Search psychics by name, specialty, or ability...",
            availableNowText: "Available Now",
            clearText: "Clear"
          },
          featuresSection: {
            title: "Why Choose Our Psychics?",
            description: "Every psychic in our community meets our high standards for authenticity and excellence",
            features: [
              { icon: "shield", title: "Rigorous Vetting", description: "Every psychic undergoes extensive screening, testing, and background checks." },
              { icon: "heart", title: "Empathetic Approach", description: "Our psychics provide compassionate guidance in a judgment-free space." },
              { icon: "award", title: "Proven Accuracy", description: "High client satisfaction rates and consistent positive feedback." }
            ]
          },
          ctaSection: {
            title: "Need Help Finding the Right Psychic?",
            description: "Our matching algorithm can connect you with the perfect psychic for your specific needs",
            buttons: {
              primary: { text: "Take Our Matching Quiz", action: "/quiz" },
              secondary: { text: "Contact Support", action: "/contact" }
            }
          },
          noResultsSection: {
            title: "No Psychics Found",
            description: "Try adjusting your search or turn off \"Available Now\" filter",
            buttonText: "Show All Psychics"
          }
        });
      } finally {
        setContentLoading(false);
      }
    };
    
    fetchPageContent();
  }, []);

  // Fetch psychic rating summary
  const fetchPsychicRatingSummary = async (psychicId) => {
    try {
      const endpoints = [
        `${import.meta.env.VITE_BASE_URL}/api/psychic/${psychicId}/summary`,
        `${import.meta.env.VITE_BASE_URL}/api/ratings/psychic/${psychicId}/summary`,
        `${import.meta.env.VITE_BASE_URL}/api/human-psychics/${psychicId}/summary`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { timeout: 3000 });
          if (response.data && response.data.success) {
            return response.data.data;
          }
        } catch (err) {
          // Try next endpoint
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Socket setup (same as before)
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userId = user?._id || '';
    
    if (!userId) return;
    
    if (socketRef.current?.connected) {
      return;
    }
    
    const newSocket = io(`${import.meta.env.VITE_BASE_URL}`, {
      auth: { token, userId, role: 'user' },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      setSocketConnected(true);
      newSocket.emit('join_room', 'psychic_list_status');
    });

    newSocket.on('disconnect', () => {
      setSocketConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
    });

    const handlePsychicStatusUpdate = (data) => {
      setPsychicStatuses(prev => ({
        ...prev,
        [data.psychicId]: {
          status: data.status,
          lastSeen: data.lastSeen,
          lastActive: data.lastActive,
          lastUpdate: Date.now(),
          isOnline: data.status === 'online'
        }
      }));
    };

    newSocket.on('psychic_status_changed', handlePsychicStatusUpdate);
    newSocket.on('psychic_status_update', handlePsychicStatusUpdate);
    newSocket.on('psychic_online', handlePsychicStatusUpdate);

    newSocket.on('psychic_statuses_response', (data) => {
      if (data.statuses && !data.error) {
        const newStatuses = {};
        Object.keys(data.statuses).forEach(psychicId => {
          newStatuses[psychicId] = {
            status: data.statuses[psychicId].status || 'offline',
            lastSeen: data.statuses[psychicId].lastSeen,
            lastActive: data.statuses[psychicId].lastActive,
            lastUpdate: Date.now(),
            isOnline: data.statuses[psychicId].status === 'online'
          };
        });
        setPsychicStatuses(prev => ({ ...prev, ...newStatuses }));
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      subscribedPsychicsRef.current.clear();
    };
  }, [user?._id]);

  // Subscribe to psychic statuses
  useEffect(() => {
    if (!socketConnected || !socketRef.current || psychics.length === 0) return;

    const allPsychicIds = psychics.map(p => p._id).filter(id => id && !subscribedPsychicsRef.current.has(id));

    if (allPsychicIds.length === 0) return;

    socketRef.current.emit('subscribe_to_psychic_status', { psychicIds: allPsychicIds });
    socketRef.current.emit('get_psychic_statuses', { psychicIds: allPsychicIds });
    allPsychicIds.forEach(id => subscribedPsychicsRef.current.add(id));

    const refreshInterval = setInterval(() => {
      if (socketConnected && allPsychicIds.length > 0) {
        socketRef.current.emit('get_psychic_statuses', { psychicIds: allPsychicIds });
      }
    }, 60000);

    return () => clearInterval(refreshInterval);
  }, [socketConnected, psychics]);

  // Helper functions
  const getPsychicStatus = (psychicId) => {
    const statusData = psychicStatuses[psychicId];
    if (!statusData) return 'offline';
    
    if (statusData.status === 'online' && statusData.lastUpdate) {
      const minutesSinceUpdate = (Date.now() - statusData.lastUpdate) / (1000 * 60);
      if (minutesSinceUpdate > 2) {
        return 'away';
      }
    }
    return statusData.status || 'offline';
  };

  const isPsychicAvailable = (psychicId) => {
    const status = getPsychicStatus(psychicId);
    return status === 'online' || status === 'away';
  };

  const getPsychicCategory = (psychic) => {
    return psychic.category || "Reading";
  };

  // Fetch psychics from API
  useEffect(() => {
    const fetchPsychics = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const url = `${import.meta.env.VITE_BASE_URL}/api/human-psychics?all=true`;
        
        const response = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        });
        
        const data = response.data;
        if (data.success && Array.isArray(data.psychics)) {
          const formattedPsychics = data.psychics.map(p => ({
            ...p,
            category: p.category || "Reading",
            isHuman: true,
            type: p.type || "Human Psychic",
            modalities: p.modalities || p.abilities || [p.category || "Psychic Reading"],
            experienceYears: p.experience || p.experienceYears || 3,
            successRate: p.successRate || 95,
            clientsHelped: p.clientsHelped || 500,
            rating: p.rating || { avgRating: 4.5, totalReviews: 100 }
          }));

          // Fetch rating summaries
          const ratingSummaryPromises = formattedPsychics.map(async (psychic) => {
            const summary = await fetchPsychicRatingSummary(psychic._id);
            return { psychicId: psychic._id, summary };
          });

          const summaries = await Promise.all(ratingSummaryPromises);
          const summaryMap = {};
          summaries.forEach(item => {
            if (item.summary) {
              summaryMap[item.psychicId] = item.summary;
            }
          });
          setRatingSummaries(prev => ({ ...prev, ...summaryMap }));

          const psychicsWithRatings = formattedPsychics.map(psychic => ({
            ...psychic,
            rating: summaryMap[psychic._id] || psychic.rating || { avgRating: 4.5, totalReviews: 100 }
          }));

          setPsychics(psychicsWithRatings);
          
          // Fetch initial statuses
          const psychicIds = formattedPsychics.map(p => p._id);
          if (psychicIds.length > 0) {
            try {
              const statusResponse = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/api/human-psychics/statuses-fast`,
                { psychicIds },
                { headers: token ? { Authorization: `Bearer ${token}` } : {}, timeout: 2000 }
              );
              
              if (statusResponse.data.success) {
                const newStatuses = {};
                Object.keys(statusResponse.data.statuses).forEach(id => {
                  newStatuses[id] = {
                    status: statusResponse.data.statuses[id].status,
                    lastSeen: statusResponse.data.statuses[id].lastSeen,
                    lastActive: statusResponse.data.statuses[id].lastActive,
                    lastUpdate: Date.now()
                  };
                });
                setPsychicStatuses(prev => ({ ...prev, ...newStatuses }));
              }
            } catch (statusError) {
              console.warn("Status fetch failed:", statusError);
            }
          }
        } else {
          throw new Error(data.message || "Failed to fetch psychics");
        }
      } catch (error) {
        console.error("Error fetching psychics:", error);
        toast.error(error.response?.data?.message || "Failed to load psychics. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPsychics();
  }, []);

  // Filter psychics
  useEffect(() => {
    let result = [...psychics];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(psychic =>
        psychic.name?.toLowerCase().includes(query) ||
        psychic.bio?.toLowerCase().includes(query) ||
        psychic.specialty?.toLowerCase().includes(query) ||
        (psychic.category || "Reading").toLowerCase().includes(query) ||
        psychic.modalities?.some(m => m?.toLowerCase().includes(query))
      );
    }

    if (availableOnly) {
      result = result.filter(psychic => isPsychicAvailable(psychic._id));
    }

    setFilteredPsychics(result);
    setCurrentPage(1);
  }, [psychics, searchQuery, availableOnly, psychicStatuses]);

  // Pagination effect
  useEffect(() => {
    const endIndex = currentPage * itemsPerPage;
    const newDisplayed = filteredPsychics.slice(0, endIndex);
    setDisplayedPsychics(newDisplayed);
    setHasMore(endIndex < filteredPsychics.length);
  }, [filteredPsychics, currentPage, itemsPerPage]);

  const loadMorePsychics = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setIsLoadingMore(false);
    }, 500);
  };

  // Handle chat initiation
  const handlePsychicSelect = async (psychic) => {
    if (!user) {
      toast.error("Please log in to chat with a psychic");
      navigate("/login");
      return;
    }

    const isAvailable = isPsychicAvailable(psychic._id);
    if (!isAvailable) {
      toast.error(`This psychic is currently not available. Please try again later.`);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      
      try {
        const check = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/humanchat/sessions/check/${psychic._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (check.data.exists) {
          navigate(`/message/${psychic._id}`, {
            state: { chatSession: check.data.session, psychic: psychic, fromHome: true, timestamp: Date.now() }
          });
          return;
        }
      } catch (checkError) {}
      
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/humanchat/sessions`,
        { psychicId: psychic._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        navigate(`/message/${psychic._id}`, {
          state: { chatSession: response.data.chatSession, psychic: psychic, fromHome: true, timestamp: Date.now() }
        });
        toast.success("Chat session started!");
      } else {
        toast.error(response.data.message || "Failed to start chat.");
      }
    } catch (error) {
      console.error("Chat session error:", error);
      toast.error(error.response?.data?.message || "Failed to start chat. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle audio call initiation
  const initiateAudioCall = async (psychic) => {
    if (!user) {
      toast.error("Please log in to start a call");
      navigate("/login");
      return;
    }

    const isAvailable = isPsychicAvailable(psychic._id);
    if (!isAvailable) {
      toast.error(`This psychic is currently not available for calls.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/calls/initiate/${psychic._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      
      if (response.data.success) {
        const { callSessionId, roomName, isFreeSession, expiresAt } = response.data.data;
        navigate(`/audio-call/${callSessionId}`, {
          state: { callSessionId, roomName, psychic, isFreeSession, expiresAt, user, fromHome: true, status: 'initiated' }
        });
        toast.success("Call initiated! Waiting for psychic to accept...");
      } else {
        toast.error(response.data.message || "Failed to initiate call");
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || "Failed to start call");
      } else if (error.response?.status === 403) {
        toast.error("Insufficient credits to start a call.");
      } else {
        toast.error("Failed to start audio call. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate dynamic stats values
  const getStatsValues = () => {
    const availableCount = psychics.filter(p => isPsychicAvailable(p._id)).length;
    const totalReviews = psychics.reduce((acc, p) => acc + (p.rating?.totalReviews || 0), 0);
    const avgRating = psychics.length > 0 
      ? (psychics.reduce((acc, p) => acc + (p.rating?.avgRating || 0), 0) / psychics.length).toFixed(1)
      : 4.8;
    
    return {
      filteredCount: filteredPsychics.length,
      availableCount: availableCount,
      averageRating: avgRating,
      totalReadings: totalReviews
    };
  };

  const statsValues = getStatsValues();

  // Loading state
  if (isLoading || contentLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.softIvory }}>
        <div className="relative py-16 px-4" style={{ backgroundColor: colors.deepPurple }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <Skeleton className="h-8 w-48 mx-auto mb-6 rounded-full" />
              <Skeleton className="h-12 w-96 mx-auto mb-6" />
              <Skeleton className="h-6 w-2/3 mx-auto" />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <Skeleton className="h-16" style={{ backgroundColor: colors.deepPurple }} />
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-20 h-20 rounded-2xl" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.softIvory }}>
      {/* Connection Status */}
      {!socketConnected && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <Badge className="px-4 py-2 bg-yellow-500 text-white rounded-full flex items-center gap-2 shadow-lg">
            <WifiOff className="h-4 w-4" />
            Connecting to real-time updates...
          </Badge>
        </div>
      )}

      {/* Hero Header - Using Admin Content */}
      <div 
        className="relative py-16 px-4 overflow-hidden"
        style={{ 
          backgroundColor: colors.deepPurple,
          background: `linear-gradient(135deg, ${colors.darkPurple} 0%, ${colors.deepPurple} 100%)`
        }}
      >
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${100 + i * 50}px`,
                height: `${100 + i * 50}px`,
                background: `radial-gradient(circle, ${colors.antiqueGold} 0%, transparent 70%)`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
              transition={{ duration: 10 + i * 3, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full"
              style={{ backgroundColor: colors.antiqueGold + "20", color: colors.antiqueGold }}
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">{pageContent?.hero?.badge}</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              style={{ color: colors.softIvory }}
            >
              {pageContent?.hero?.title?.split(pageContent?.hero?.highlightedText)[0]}
              <span style={{ color: colors.antiqueGold }}>{pageContent?.hero?.highlightedText}</span>
              {pageContent?.hero?.title?.split(pageContent?.hero?.highlightedText)[1]}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl max-w-3xl mx-auto mb-8"
              style={{ color: colors.softIvory + "CC" }}
            >
              {pageContent?.hero?.description}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Search Bar - Using Admin Content */}
      <div className="sticky top-0 z-10 py-4 px-4 shadow-md backdrop-blur-sm"
        style={{ backgroundColor: colors.softIvory + "F2", borderBottom: `1px solid ${colors.lightGold}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                  style={{ color: colors.deepPurple + "80" }} />
                <Input
                  placeholder={pageContent?.searchSection?.placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full border-2 py-6"
                  style={{ borderColor: colors.lightGold, backgroundColor: "white", color: colors.deepPurple }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <X className="h-4 w-4" style={{ color: colors.deepPurple + "80" }} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant={availableOnly ? "default" : "outline"}
                onClick={() => setAvailableOnly(!availableOnly)}
                className="rounded-full gap-2 flex-1 sm:flex-none"
                style={{
                  backgroundColor: availableOnly ? colors.antiqueGold : "transparent",
                  borderColor: colors.antiqueGold,
                  color: availableOnly ? colors.deepPurple : colors.deepPurple
                }}
              >
                <Zap className="h-4 w-4" />
                {pageContent?.searchSection?.availableNowText}
                {availableOnly && <Check className="h-3 w-3" />}
              </Button>

              {(searchQuery || availableOnly) && (
                <Button
                  variant="ghost"
                  onClick={() => { setSearchQuery(""); setAvailableOnly(false); }}
                  className="rounded-full px-4"
                  style={{ color: colors.deepPurple + "CC" }}
                >
                  {pageContent?.searchSection?.clearText}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar - Using Admin Content with Dynamic Values */}
      <div className="py-4 px-4" style={{ backgroundColor: colors.lightGold }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pageContent?.stats?.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold" style={{ color: colors.deepPurple }}>
                  {statsValues[stat.valueKey] || statsValues.filteredCount}
                  {stat.suffix}
                </div>
                <div className="text-sm" style={{ color: colors.deepPurple + "CC" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Psychics Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {displayedPsychics.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
              style={{ backgroundColor: colors.lightGold }}>
              <Search className="h-10 w-10" style={{ color: colors.deepPurple }} />
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: colors.deepPurple }}>
              {pageContent?.noResultsSection?.title}
            </h3>
            <p className="mb-6" style={{ color: colors.deepPurple + "CC" }}>
              {pageContent?.noResultsSection?.description}
            </p>
            <Button
              onClick={() => { setSearchQuery(""); setAvailableOnly(false); }}
              style={{ backgroundColor: colors.antiqueGold, color: colors.deepPurple }}
              className="rounded-full px-8 py-6"
            >
              {pageContent?.noResultsSection?.buttonText}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              <AnimatePresence>
                {displayedPsychics.map((psychic, index) => {
                  const psychicStatus = getPsychicStatus(psychic._id);
                  const status = statusConfig[psychicStatus] || statusConfig.offline;
                  const isAvailable = isPsychicAvailable(psychic._id);
                  const rating = ratingSummaries[psychic._id] || psychic.rating || { avgRating: 4.5, totalReviews: 100 };
                  const psychicCategory = getPsychicCategory(psychic);
                  const memberSince = psychic.createdAt ? new Date(psychic.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Recently";
                  
                  return (
                    <motion.div
                      key={psychic._id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ delay: index * 0.08, duration: 0.5 }}
                      className="relative group h-full"
                    >
                      <div 
                        className="absolute -inset-0.5 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"
                        style={{ background: `radial-gradient(circle at 30% 30%, ${colors.antiqueGold}40, transparent 70%)` }}
                      />
                      
                      <div
                        className="relative bg-white rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col"
                        style={{ border: `1px solid ${colors.antiqueGold}20`, boxShadow: `0 4px 20px ${colors.deepPurple}0d` }}
                      >
                        <div className="h-16 bg-gradient-to-r from-[#2B1B3F] to-[#1A1129] relative overflow-hidden">
                          <div className="absolute inset-0 opacity-10">
                            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
                            <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/5" />
                          </div>
                          <div className="absolute bottom-3 right-4">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-sm" style={{ backgroundColor: `${status.color}20`, border: `1px solid ${status.color}30` }}>
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: status.color }} />
                                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: status.color }} />
                              </span>
                              <span className="text-xs font-medium" style={{ color: status.color }}>{status.label}</span>
                            </div>
                          </div>
                        </div>

                        <div className="relative px-5">
                          <div className="absolute -top-10 left-5">
                            <div className="relative">
                              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white shadow-xl" style={{ border: `2px solid ${colors.antiqueGold}` }}>
                                <img
                                  src={psychic.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(psychic.name)}&background=7c3aed&color=fff&size=256`}
                                  alt={psychic.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(psychic.name)}&background=7c3aed&color=fff&size=256`; }}
                                />
                              </div>
                              {psychic.isVerified && (
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 ring-2 ring-white">
                                  <CheckCircle className="h-3.5 w-3.5 text-white" />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="ml-24 pt-3">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-lg leading-tight truncate" style={{ color: colors.deepPurple }}>{psychic.name}</h3>
                                <p className="text-xs mt-0.5 truncate" style={{ color: colors.deepPurple + "B3" }}>{psychic.specialty || psychicCategory}</p>
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                <div className="px-3 py-1.5 rounded-xl text-center" style={{ backgroundColor: colors.deepPurple }}>
                                  <div className="text-sm font-bold leading-none" style={{ color: colors.antiqueGold }}>${(psychic.ratePerMin || 1.00).toFixed(2)}</div>
                                  <div className="text-[8px] mt-0.5 opacity-70" style={{ color: colors.softIvory }}>/min</div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex gap-0.5">
                                {Array(5).fill(0).map((_, j) => (
                                  <Star key={j} className="h-3.5 w-3.5" style={{ color: j < Math.round(rating?.avgRating || 4.5) ? colors.antiqueGold : "#E5E7EB", fill: j < Math.round(rating?.avgRating || 4.5) ? colors.antiqueGold : "transparent" }} />
                                ))}
                              </div>
                              <span className="text-xs font-medium" style={{ color: colors.deepPurple }}>{(rating?.avgRating || 4.5).toFixed(1)}</span>
                              <span className="text-[10px]" style={{ color: colors.deepPurple + "99" }}>({rating?.totalReviews || 0})</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 px-5 mt-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: colors.antiqueGold + "12", color: colors.antiqueGold, border: `1px solid ${colors.antiqueGold}25` }}>
                            {psychicCategory}
                          </span>
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: colors.deepPurple + "08", color: colors.deepPurple, border: `1px solid ${colors.deepPurple}15` }}>
                            <User className="h-3 w-3" />
                            Human
                          </span>
                          {psychic.gender && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: colors.lightGold + "50", color: colors.deepPurple, border: `1px solid ${colors.antiqueGold}25` }}>
                              {psychic.gender.charAt(0).toUpperCase() + psychic.gender.slice(1)}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-px mx-5 mt-4 rounded-xl overflow-hidden" style={{ backgroundColor: colors.antiqueGold + "15" }}>
                          <div className="py-2.5 text-center bg-white/80">
                            <div className="text-xs font-semibold" style={{ color: colors.deepPurple }}>{psychic.responseTime ? `${psychic.responseTime} min` : "Instant"}</div>
                            <div className="text-[9px] mt-0.5" style={{ color: colors.deepPurple + "99" }}>Response</div>
                          </div>
                          <div className="py-2.5 text-center bg-white/80">
                            <div className="text-xs font-semibold" style={{ color: colors.deepPurple }}>{psychic.experienceYears || psychic.experience || "3"}+ yrs</div>
                            <div className="text-[9px] mt-0.5" style={{ color: colors.deepPurple + "99" }}>Experience</div>
                          </div>
                          <div className="py-2.5 text-center bg-white/80">
                            <div className="text-xs font-semibold" style={{ color: colors.deepPurple }}>{memberSince}</div>
                            <div className="text-[9px] mt-0.5" style={{ color: colors.deepPurple + "99" }}>Joined</div>
                          </div>
                        </div>

                        <div className="mx-5 mt-4 p-3 rounded-xl" style={{ backgroundColor: colors.softIvory + "80" }}>
                          <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: colors.deepPurple + "CC" }}>{psychic.bio || `Specializes in ${psychicCategory.toLowerCase()} guidance. Compassionate and insightful readings.`}</p>
                        </div>

                        <div className="px-5 mt-3">
                          {(psychic.modalities?.length > 0 || psychic.abilities?.length > 0) && (
                            <div className="mb-3">
                              <h4 className="font-semibold mb-2 text-xs" style={{ color: colors.deepPurple }}>Specialties</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {(psychic.modalities || psychic.abilities || []).slice(0, 3).map((modality, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[10px] rounded-full px-2 py-0.5" style={{ borderColor: colors.antiqueGold + "30", color: colors.deepPurple + "CC", backgroundColor: colors.softIvory + "50" }}>
                                    {modality}
                                  </Badge>
                                ))}
                                {(psychic.modalities?.length > 3 || psychic.abilities?.length > 3) && (
                                  <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0.5" style={{ borderColor: colors.antiqueGold + "30", color: colors.deepPurple + "CC", backgroundColor: colors.softIvory + "50" }}>
                                    +{(psychic.modalities?.length || psychic.abilities?.length) - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {psychic.languages?.length > 0 && (
                            <div className="mb-3">
                              <h4 className="font-semibold mb-2 text-xs" style={{ color: colors.deepPurple }}>Languages</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {psychic.languages.slice(0, 2).map((lang, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[10px] rounded-full px-2 py-0.5 flex items-center gap-1" style={{ borderColor: colors.antiqueGold + "30", color: colors.deepPurple + "CC", backgroundColor: colors.softIvory + "50" }}>
                                    <Globe className="h-2.5 w-2.5" />
                                    {lang}
                                  </Badge>
                                ))}
                                {psychic.languages.length > 2 && (
                                  <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0.5" style={{ borderColor: colors.antiqueGold + "30", color: colors.deepPurple + "CC", backgroundColor: colors.softIvory + "50" }}>
                                    +{psychic.languages.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <h4 className="font-semibold mb-1 text-[10px]" style={{ color: colors.deepPurple + "99" }}>Success Rate</h4>
                              <div className="text-sm font-bold" style={{ color: colors.deepPurple }}>{psychic.successRate || "95"}%</div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-1 text-[10px]" style={{ color: colors.deepPurple + "99" }}>Clients Helped</h4>
                              <div className="text-sm font-bold" style={{ color: colors.deepPurple }}>{psychic.clientsHelped || "500"}+</div>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            onClick={() => navigate(`/psychic/${psychic._id}`)}
                            className="w-full rounded-xl py-2 text-xs font-medium mt-2"
                            style={{ borderColor: colors.antiqueGold, color: colors.deepPurple }}
                          >
                            View Complete Profile
                          </Button>
                        </div>

                        <div className="flex gap-2 px-5 py-4 mt-auto border-t" style={{ borderColor: colors.antiqueGold + "15" }}>
                          <Button
                            onClick={() => handlePsychicSelect(psychic)}
                            disabled={isSubmitting || !isAvailable}
                            className="flex-1 h-9 rounded-xl text-xs font-semibold gap-1.5 transition-all hover:scale-105"
                            style={{ backgroundColor: colors.deepPurple, color: colors.softIvory, opacity: (isSubmitting || !isAvailable) ? 0.5 : 1 }}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Chat
                          </Button>
                          <Button
                            onClick={() => initiateAudioCall(psychic)}
                            disabled={isSubmitting || !isAvailable}
                            className="flex-1 h-9 rounded-xl text-xs font-semibold gap-1.5 transition-all hover:scale-105"
                            style={{ backgroundColor: colors.antiqueGold, color: colors.deepPurple, opacity: (isSubmitting || !isAvailable) ? 0.5 : 1 }}
                          >
                            <Phone className="h-3.5 w-3.5" />
                            Call
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={loadMorePsychics}
                  disabled={isLoadingMore}
                  className="rounded-full px-8 py-6 min-w-[200px] transition-all hover:scale-105"
                  style={{ borderColor: colors.antiqueGold, color: colors.deepPurple, backgroundColor: colors.softIvory }}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader className="h-5 w-5 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Psychics
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <p className="text-sm mt-4" style={{ color: colors.deepPurple + "CC" }}>
                  Showing {displayedPsychics.length} of {filteredPsychics.length} psychics
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Features Section - Using Admin Content */}
      <div className="py-12 px-4" style={{ backgroundColor: colors.deepPurple }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: colors.softIvory }}>
              {pageContent?.featuresSection?.title}
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.softIvory + "CC" }}>
              {pageContent?.featuresSection?.description}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pageContent?.featuresSection?.features?.map((feature, idx) => {
              const IconComponent = {
                shield: Shield,
                heart: Heart,
                award: Award,
                users: Users,
                zap: Zap
              }[feature.icon] || Shield;
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center p-6 rounded-2xl"
                  style={{ backgroundColor: colors.darkPurple, border: `1px solid ${colors.antiqueGold}30` }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: colors.antiqueGold + "20", color: colors.antiqueGold }}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: colors.softIvory }}>{feature.title}</h3>
                  <p style={{ color: colors.softIvory + "CC" }}>{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section - Using Admin Content */}
      <div className="py-12 px-4" style={{ backgroundColor: colors.softIvory }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl p-8 md:p-12 overflow-hidden"
            style={{ backgroundColor: colors.deepPurple, background: `linear-gradient(135deg, ${colors.deepPurple}, ${colors.darkPurple})`, border: `2px solid ${colors.antiqueGold}` }}
          >
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: colors.antiqueGold }}></div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: colors.softIvory }}>
              {pageContent?.ctaSection?.title}
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: colors.softIvory + "CC" }}>
              {pageContent?.ctaSection?.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-semibold shadow-xl"
                style={{ backgroundColor: colors.antiqueGold, color: colors.deepPurple }}
                onClick={() => navigate(pageContent?.ctaSection?.buttons?.primary?.action || "/quiz")}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {pageContent?.ctaSection?.buttons?.primary?.text}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 py-6 text-lg font-semibold border-2"
                style={{ borderColor: colors.antiqueGold, color: colors.softIvory, backgroundColor: "transparent" }}
                onClick={() => navigate(pageContent?.ctaSection?.buttons?.secondary?.action || "/contact")}
              >
                {pageContent?.ctaSection?.buttons?.secondary?.text}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Psychics;