import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  User,
  MessageSquare,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  BarChart3,
  Activity,
  Users,
  TrendingUp,
  Timer,
  Sparkles,
  Eye as ViewIcon,
  Crown,
  Target,
  Zap,
  CheckCircle,
  PhoneCall,
  Headphones,
  Phone,
  Calendar,
  Star,
  Percent,
  Wallet,
  TrendingDown,
  PieChart,
  Info,
  ArrowUp,
  ArrowDown,
  MessagesSquare
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/context/AdminAuthContext";
import Dashboard_Navbar from "../Admin_Navbar";
import Doctor_Side_Bar from "../SideBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axios from 'axios';
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";

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
  chartLine: "#0ea5e9",    // Sky blue for charts
  call: "#3B82F6",         // Blue for calls
  chat: "#10B981",         // Green for chats
  psychicShare: "#8B5CF6", // Purple for psychic earnings
  platformShare: "#3B82F6" // Blue for platform earnings
};

const COMMISSION_RATE = 0.25; // 25% to psychics, 75% to platform

const AdminHumanChatDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState(false);
  const [fetchingSessionIds, setFetchingSessionIds] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [showSplitInfo, setShowSplitInfo] = useState(true);

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    totals: {
      psychics: 0,
      sessions: 0,
      paidTimers: 0,
      chatRequests: 0,
      users: 0,
      callSessions: 0
    },
    currentStatus: {
      activeSessions: 0,
      activePaidTimers: 0,
      pendingRequests: 0,
      activeCallSessions: 0,
      completedCallSessions: 0
    },
    financials: {
      // Chat revenue
      chatTotalPaidByUsers: 0,
      chatPsychicEarnings: 0,
      chatPlatformEarnings: 0,
      totalPaidTime: 0,
      avgChatSessionValue: 0,
      
      // Call revenue
      callTotalPaidByUsers: 0,
      callPsychicEarnings: 0,
      callPlatformEarnings: 0,
      averageCallValue: 0,
      totalCallMinutes: 0,
      
      // Combined totals
      totalPaidByUsers: 0,
      totalPsychicEarnings: 0,
      totalPlatformEarnings: 0,
      totalSessions: 0
    },
    callStatistics: {
      totalSessions: 0,
      activeSessions: 0,
      completedSessions: 0,
      totalCreditsUsed: 0,
      totalPaidByUsers: 0,
      psychicEarnings: 0,
      platformEarnings: 0,
      averageCallDuration: 0
    },
    splitInfo: {
      psychicRate: '25%',
      platformRate: '75%',
      description: 'Psychics receive 25% of all payments, platform retains 75%'
    },
    lists: {
      psychics: [],
      recentPaidTimers: [],
      recentSessions: [],
      recentCallSessions: []
    }
  });

  const [sessionIdMap, setSessionIdMap] = useState({});

  useEffect(() => {
    if (admin) {
      fetchDashboardData();
    }
  }, [admin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setFetchingSessionIds(true);

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/admindata/chats`,
        {
          withCredentials: true
        }
      );

      console.log('✅ Dashboard Response:', response.data);

      if (response.data.success) {
        const data = response.data.data || {
          totals: {},
          currentStatus: {},
          financials: {},
          callStatistics: {},
          splitInfo: {},
          lists: {}
        };
        
        setDashboardData(data);
        
        await findSessionIdsForPaidTimers(data.lists.recentPaidTimers || []);
        await fetchMissingUserDetails(data.lists.recentPaidTimers || []);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to fetch dashboard data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setFetchingSessionIds(false);
    }
  };

  const fetchMissingUserDetails = async (paidTimers) => {
    const missingUserTimers = paidTimers.filter(
      timer => timer.username === 'Unknown User' || !timer.username || timer.username === 'User (Name Not Available)'
    );
    
    if (missingUserTimers.length === 0) return;
    
    for (const timer of missingUserTimers) {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/${timer._id}`,
          {
            withCredentials: true,
            timeout: 5000
          }
        );
        
        if (response.data.success && response.data.data?.participants?.user) {
          const user = response.data.data.participants.user;
          setUserDetails(prev => ({
            ...prev,
            [timer._id]: user
          }));
        }
      } catch (error) {
        console.error(`❌ Error fetching user details for timer ${timer._id}:`, error.message);
      }
    }
  };

  const findSessionIdsForPaidTimers = async (paidTimers) => {
    try {
      const newSessionIdMap = {};
      
      for (const timer of paidTimers) {
        if (timer._id) {
          try {
            const response = await axios.get(
              `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/${timer._id}`,
              {
                withCredentials: true,
                timeout: 5000
              }
            );

            if (response.data.success) {
              if (response.data.redirect || response.data.sessionId) {
                const sessionId = response.data.sessionId || response.data.redirect.split('/').pop();
                newSessionIdMap[timer._id] = sessionId;
              } else {
                newSessionIdMap[timer._id] = timer._id;
              }
            }
          } catch (error) {
            console.error(`❌ Error finding session for timer ${timer._id}:`, error.message);
            newSessionIdMap[timer._id] = null;
          }
        }
      }
      
      setSessionIdMap(newSessionIdMap);
    } catch (error) {
      console.error('❌ Error finding session IDs:', error);
    }
  };

  const handleViewChatDetails = async (itemId, isPaidTimer = false) => {
    try {
      let sessionId = itemId;
      
      if (isPaidTimer && sessionIdMap[itemId]) {
        sessionId = sessionIdMap[itemId];
      }
      
      if (!sessionId) {
        toast({
          title: "Finding chat session...",
          description: "Please wait while we find the chat session",
          variant: "default"
        });
        
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/${itemId}`,
          {
            withCredentials: true,
            timeout: 5000
          }
        );
        
        if (response.data.success && response.data.sessionId) {
          sessionId = response.data.sessionId;
        } else {
          toast({
            title: "No Chat Session",
            description: "No chat session found for this paid timer",
            variant: "destructive"
          });
          return;
        }
      }
      
      console.log(`🚀 Navigating to chat session: ${sessionId}`);
      navigate(`/admin/dashboard/chat-details/${sessionId}`);
      
    } catch (error) {
      console.error('❌ Error viewing chat details:', error);
      toast({
        title: "Error",
        description: "Failed to find chat session",
        variant: "destructive"
      });
    }
  };

  const handleViewCallDetails = (callId) => {
    // Navigate to call details page (create if needed)
    console.log('View call:', callId);
    toast({
      title: "Call Details",
      description: "Call details view coming soon",
      variant: "default"
    });
  };

  const getUserDisplayName = (timer, isPaidTimer = false) => {
    const timerId = timer._id;
    
    if (userDetails[timerId]) {
      const user = userDetails[timerId];
      if (user.username && user.username !== 'Unknown User') return user.username;
      if (user.username) return user.username;
      if (user.username || user.username) {
        return `${user.username || ''} ${user.username || ''}`.trim();
      }
      if (user.email) return user.email.split('@')[0];
    }
    
    if (typeof timer.user === 'string') {
      if (timer.user !== 'Unknown User' && timer.user !== 'User (Name Not Available)') {
        return timer.user;
      }
    }
    
    if (timer.user && typeof timer.user === 'object') {
      if (timer.user.username) return timer.user.username;
      if (timer.user.username) return timer.user.username;
      if (timer.user.username || timer.user.username) {
        return `${timer.user.username || ''} ${timer.user.username || ''}`.trim();
      }
      if (timer.user.email) return timer.user.email.split('@')[0];
    }
    
    if (isPaidTimer) {
      return 'User (Click to view details)';
    }
    
    return 'User (No Name)';
  };

  const getPsychicDisplayName = (item) => {
    if (typeof item === 'string') {
      return item === 'Unknown Psychic' ? 'Psychic (Name Not Available)' : item;
    }
    
    if (item && typeof item === 'object') {
      if (item.name) return item.name;
      if (item.email) return item.email.split('@')[0];
    }
    
    return 'Psychic (Name Not Available)';
  };

  const handleFetchUserDetails = async (timerId, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      toast({
        title: "Fetching user details...",
        description: "Please wait",
        variant: "default"
      });
      
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/${timerId}`,
        { withCredentials: true }
      );
      
      if (response.data.success && response.data.data?.participants?.user) {
        const user = response.data.data.participants.user;
        setUserDetails(prev => ({
          ...prev,
          [timerId]: user
        }));
        
        toast({
          title: "User details updated",
          description: `Found user: ${user.username || user.email || 'User'}`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (isToday) {
        return `Today, ${date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })}`;
      }

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return "N/A";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "N/A";
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDurationMinutes = (minutes) => {
    if (!minutes || minutes === 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatAmount = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  if (!admin) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: colors.background }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.secondary }} />
        <span className="ml-2" style={{ color: colors.primary + '70' }}>Loading admin data...</span>
      </div>
    );
  }

  return (


    
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
     
      <div className="flex">
        <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />
       
        <main className="flex-1 p-6 ml-0 mt-20 lg:ml-64 transition-all duration-300">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-6 w-6" style={{ color: colors.secondary }} />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: colors.primary }}>
                  Communication Management Dashboard
                </h1>
              </div>
              <p className="text-muted-foreground mt-1" style={{ color: colors.primary + '80' }}>
                Overview of all chat sessions, call sessions, and paid timers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={fetchDashboardData} 
                disabled={loading}
                className="hover:scale-105 transition-transform duration-200"
                style={{
                  borderColor: colors.secondary,
                  color: colors.secondary,
                }}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Split Info Banner */}
          {showSplitInfo && (
            <Card className="mb-6 border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Percent className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: colors.primary }}>
                        Revenue Split: 75% Platform / 25% Psychic
                      </p>
                      <p className="text-sm" style={{ color: colors.primary + '70' }}>
                        Psychics receive 25% of all payments, platform retains 75%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20">
                      Commission Rate: 25%
                    </Badge>
                    <button
                      onClick={() => setShowSplitInfo(false)}
                      className="p-1 hover:opacity-70"
                    >
                      <Info className="h-4 w-4" style={{ color: colors.primary + '60' }} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Statistics Cards - UPDATED to show split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {/* Total Psychics Card */}
            <Card className="border-none shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: colors.primary + '70' }}>Psychics</p>
                    <p className="text-xl font-bold mt-1" style={{ color: colors.primary }}>{dashboardData.totals.psychics || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)` }}>
                    <Users className="h-5 w-5" style={{ color: colors.textLight }} />
                  </div>
                </div>
              </CardContent>
            </Card>
           
            {/* Total Users Card */}
            <Card className="border-none shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: colors.primary + '70' }}>Users</p>
                    <p className="text-xl font-bold mt-1" style={{ color: colors.primary }}>{dashboardData.totals.users || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.success}80 100%)` }}>
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
           
            {/* Chat Sessions Card */}
            <Card className="border-none shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: colors.primary + '70' }}>Chat Sessions</p>
                    <p className="text-xl font-bold mt-1" style={{ color: colors.primary }}>{dashboardData.totals.sessions || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.chat} 0%, ${colors.chat}80 100%)` }}>
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
           
            {/* Call Sessions Card */}
            <Card className="border-none shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: colors.primary + '70' }}>Call Sessions</p>
                    <p className="text-xl font-bold mt-1" style={{ color: colors.primary }}>{dashboardData.totals.callSessions || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.call} 0%, ${colors.call}80 100%)` }}>
                    <PhoneCall className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
           
            {/* Paid Timers Card */}
            <Card className="border-none shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: colors.primary + '70' }}>Paid Timers</p>
                    <p className="text-xl font-bold mt-1" style={{ color: colors.primary }}>{dashboardData.totals.paidTimers || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.warning} 0%, ${colors.secondary} 100%)` }}>
                    <Timer className="h-5 w-5" style={{ color: colors.primary }} />
                  </div>
                </div>
              </CardContent>
            </Card>
           
            {/* Total Paid by Users Card */}
            <Card className="border-none shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <CardContent className="p-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between cursor-help">
                        <div>
                          <p className="text-xs font-medium" style={{ color: colors.primary + '70' }}>Total Paid by Users</p>
                          <p className="text-xl font-bold mt-1" style={{ color: colors.primary }}>
                            {formatAmount(dashboardData.financials.totalPaidByUsers || 0)}
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.warning} 100%)` }}>
                          <DollarSign className="h-5 w-5" style={{ color: colors.primary }} />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total amount users paid (100%) before split</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Split Cards - NEW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="border-none shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.psychicShare}10 0%, ${colors.psychicShare}20 100%)` }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" style={{ color: colors.psychicShare }} />
                    <span className="font-semibold" style={{ color: colors.psychicShare }}>Psychic Earnings (25%)</span>
                  </div>
                  <Badge className="bg-purple-500/10 text-purple-700">Total: {formatAmount(dashboardData.financials.totalPsychicEarnings || 0)}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs" style={{ color: colors.primary + '70' }}>From Chats</p>
                    <p className="text-lg font-bold" style={{ color: colors.psychicShare }}>{formatAmount(dashboardData.financials.chatPsychicEarnings || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: colors.primary + '70' }}>From Calls</p>
                    <p className="text-lg font-bold" style={{ color: colors.psychicShare }}>{formatAmount(dashboardData.financials.callPsychicEarnings || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.platformShare}10 0%, ${colors.platformShare}20 100%)` }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" style={{ color: colors.platformShare }} />
                    <span className="font-semibold" style={{ color: colors.platformShare }}>Platform Earnings (75%)</span>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-700">Total: {formatAmount(dashboardData.financials.totalPlatformEarnings || 0)}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs" style={{ color: colors.primary + '70' }}>From Chats</p>
                    <p className="text-lg font-bold" style={{ color: colors.platformShare }}>{formatAmount(dashboardData.financials.chatPlatformEarnings || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: colors.primary + '70' }}>From Calls</p>
                    <p className="text-lg font-bold" style={{ color: colors.platformShare }}>{formatAmount(dashboardData.financials.callPlatformEarnings || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-none shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Chats</p>
                    <p className="text-lg font-bold">{dashboardData.currentStatus.activeSessions || 0}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-700">Live</Badge>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <PhoneCall className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Calls</p>
                    <p className="text-lg font-bold">{dashboardData.currentStatus.activeCallSessions || 0}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700">Live</Badge>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Timer className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Timers</p>
                    <p className="text-lg font-bold">{dashboardData.currentStatus.activePaidTimers || 0}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">Active</Badge>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending Requests</p>
                    <p className="text-lg font-bold">{dashboardData.currentStatus.pendingRequests || 0}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-700">Pending</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Summary Cards - UPDATED to show split */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-none shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Chat Revenue</span>
                </div>
                <p className="text-lg font-bold text-green-600">{formatAmount(dashboardData.financials.chatTotalPaidByUsers || 0)}</p>
                <div className="flex justify-between text-xs mt-1">
                  <span style={{ color: colors.psychicShare }}>Psychic: {formatAmount(dashboardData.financials.chatPsychicEarnings || 0)}</span>
                  <span style={{ color: colors.platformShare }}>Platform: {formatAmount(dashboardData.financials.chatPlatformEarnings || 0)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{dashboardData.financials.totalPaidTime || 0} hours paid</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PhoneCall className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Call Revenue</span>
                </div>
                <p className="text-lg font-bold text-blue-600">{formatAmount(dashboardData.financials.callTotalPaidByUsers || 0)}</p>
                <div className="flex justify-between text-xs mt-1">
                  <span style={{ color: colors.psychicShare }}>Psychic: {formatAmount(dashboardData.financials.callPsychicEarnings || 0)}</span>
                  <span style={{ color: colors.platformShare }}>Platform: {formatAmount(dashboardData.financials.callPlatformEarnings || 0)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{dashboardData.financials.totalCallMinutes || 0} minutes</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Total Paid by Users</span>
                </div>
                <p className="text-lg font-bold text-purple-600">
                  {formatAmount(dashboardData.financials.totalPaidByUsers || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">100% of all payments</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Average Session</span>
                </div>
                <p className="text-lg font-bold text-purple-600">
                  {formatAmount(dashboardData.financials.totalSessions > 0 
                    ? dashboardData.financials.totalPaidByUsers / dashboardData.financials.totalSessions 
                    : 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">per session total</p>
              </CardContent>
            </Card>
          </div>

          {/* Call Statistics Card - NEW */}
          {dashboardData.callStatistics.totalSessions > 0 && (
            <Card className="mb-6 border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: colors.primary }}>
                  <PhoneCall className="h-4 w-4" />
                  Call Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Calls</p>
                    <p className="font-bold">{dashboardData.callStatistics.totalSessions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="font-bold">{dashboardData.callStatistics.completedSessions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                    <p className="font-bold">{formatAmount(dashboardData.callStatistics.totalPaidByUsers)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Psychic Share</p>
                    <p className="font-bold" style={{ color: colors.psychicShare }}>{formatAmount(dashboardData.callStatistics.psychicEarnings)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Platform Share</p>
                    <p className="font-bold" style={{ color: colors.platformShare }}>{formatAmount(dashboardData.callStatistics.platformEarnings)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs for different lists */}
          <Tabs defaultValue="recent-sessions" className="mb-6">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-transparent gap-2">
              
              <TabsTrigger 
                value="recent-calls"
                className="data-[state=active]:shadow-lg transition-all duration-200"
                style={{
                  backgroundColor: 'transparent',
                  color: colors.primary,
                  border: `1px solid ${colors.primary}20`,
                }}
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                Call Sessions
              </TabsTrigger>
              <TabsTrigger 
                value="recent-paid"
                className="data-[state=active]:shadow-lg transition-all duration-200"
                style={{
                  backgroundColor: 'transparent',
                  color: colors.primary,
                  border: `1px solid ${colors.primary}20`,
                }}
              >
                <MessagesSquare className="h-4 w-4 mr-2" />
              Chat Sessions
              </TabsTrigger>
              <TabsTrigger 
                value="recent-psychics"
                className="data-[state=active]:shadow-lg transition-all duration-200"
                style={{
                  backgroundColor: 'transparent',
                  color: colors.primary,
                  border: `1px solid ${colors.primary}20`,
                }}
              >
                <Crown className="h-4 w-4 mr-2" />
                Psychics
              </TabsTrigger>
            </TabsList>

            {/* Recent Chat Sessions Tab */}
            <TabsContent value="recent-sessions">
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                    <MessageSquare className="h-5 w-5" />
                    Recent Chat Sessions
                  </CardTitle>
                  <CardDescription style={{ color: colors.primary + '70' }}>
                    Latest chat sessions with HumanChatSession IDs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden border">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ backgroundColor: colors.primary + '05' }}>
                          <TableHead>User</TableHead>
                          <TableHead>Psychic</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Last Activity</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : dashboardData.lists.recentSessions?.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-8">No recent chat sessions</TableCell></TableRow>
                        ) : (
                          dashboardData.lists.recentSessions?.slice(0, 5).map((session, index) => (
                            <TableRow key={session._id || index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6"><AvatarFallback className="bg-green-100 text-green-600 text-xs">{session.user?.[0] || 'U'}</AvatarFallback></Avatar>
                                  <span className="text-sm">{getUserDisplayName(session, false)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6"><AvatarFallback className="bg-purple-100 text-purple-600 text-xs">{session.psychic?.[0] || 'P'}</AvatarFallback></Avatar>
                                  <span className="text-sm">{getPsychicDisplayName(session.psychic)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  session.status === 'active' ? 'bg-green-500/10 text-green-700' : 
                                  session.status === 'ended' ? 'bg-blue-500/10 text-blue-700' : 'bg-gray-500/10 text-gray-700'
                                }>{session.status}</Badge>
                              </TableCell>
                              <TableCell>{formatDuration(session.duration)}</TableCell>
                              <TableCell className="text-sm">{formatDate(session.lastMessageAt)}</TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm" onClick={() => handleViewChatDetails(session._id)}>
                                  <Eye className="h-3 w-3 mr-1" /> View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recent Call Sessions Tab - UPDATED to show split */}
            <TabsContent value="recent-calls">
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                    <PhoneCall className="h-5 w-5" />
                    Recent Call Sessions
                  </CardTitle>
                  <CardDescription style={{ color: colors.primary + '70' }}>
                    Latest audio call sessions with 75/25 split
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden border">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ backgroundColor: colors.primary + '05' }}>
                          <TableHead>User</TableHead>
                          <TableHead>Psychic</TableHead>
                          <TableHead>Total Paid</TableHead>
                          <TableHead>Psychic (25%)</TableHead>
                          <TableHead>Platform (75%)</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Start Time</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow><TableCell colSpan={9} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : dashboardData.lists.recentCallSessions?.length === 0 ? (
                          <TableRow><TableCell colSpan={9} className="text-center py-8">No recent call sessions</TableCell></TableRow>
                        ) : (
                          dashboardData.lists.recentCallSessions?.slice(0, 5).map((call, index) => (
                            <TableRow key={call._id || index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6"><AvatarFallback className="bg-blue-100 text-blue-600 text-xs">{call.user?.[0] || 'U'}</AvatarFallback></Avatar>
                                  <span className="text-sm">{call.user || 'Unknown'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6"><AvatarFallback className="bg-purple-100 text-purple-600 text-xs">{call.psychic?.[0] || 'P'}</AvatarFallback></Avatar>
                                  <span className="text-sm">{call.psychic || 'Unknown'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 text-yellow-600" />
                                  <span className="font-medium">{formatAmount(call.totalPaidByUsers || call.revenue || call.creditsUsed || 0)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 text-purple-600" />
                                  <span className="font-medium text-purple-600">{formatAmount(call.psychicEarnings || 0)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 text-blue-600" />
                                  <span className="font-medium text-blue-600">{formatAmount(call.platformEarnings || 0)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-blue-600" />
                                  <span className="text-sm">{formatDurationMinutes(call.duration)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  call.status === 'in-progress' ? 'bg-green-500/10 text-green-700' :
                                  call.status === 'ended' ? 'bg-blue-500/10 text-blue-700' :
                                  call.status === 'ringing' ? 'bg-yellow-500/10 text-yellow-700' : 'bg-gray-500/10 text-gray-700'
                                }>{call.status}</Badge>
                              </TableCell>
                              <TableCell className="text-sm">{formatDateTime(call.startTime)}</TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm" onClick={() => handleViewCallDetails(call._id)}>
                                  <Eye className="h-3 w-3 mr-1" /> Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recent Paid Timers Tab - UPDATED to show split */}
            <TabsContent value="recent-paid">
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                    <Timer className="h-5 w-5" />
                    Recent Paid Timer Sessions
                  </CardTitle>
                  <CardDescription style={{ color: colors.primary + '70' }}>
                    {fetchingSessionIds ? "Finding chat sessions..." : "Latest completed paid timer sessions with 75/25 split"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden border">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ backgroundColor: colors.primary + '05' }}>
                          <TableHead>User</TableHead>
                          <TableHead>Psychic</TableHead>
                          <TableHead>Total Paid</TableHead>
                          <TableHead>Psychic (25%)</TableHead>
                          <TableHead>Platform (75%)</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Ended At</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : dashboardData.lists.recentPaidTimers?.length === 0 ? (
                          <TableRow><TableCell colSpan={8} className="text-center py-8">No recent paid timers</TableCell></TableRow>
                        ) : (
                          dashboardData.lists.recentPaidTimers?.slice(0, 5).map((timer, index) => (
                            <TableRow key={timer._id || index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6"><AvatarFallback className="bg-green-100 text-green-600 text-xs">{timer.user?.[0] || 'U'}</AvatarFallback></Avatar>
                                  <span className="text-sm">{getUserDisplayName(timer, true)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6"><AvatarFallback className="bg-purple-100 text-purple-600 text-xs">{timer.psychic?.[0] || 'P'}</AvatarFallback></Avatar>
                                  <span className="text-sm">{getPsychicDisplayName(timer.psychic)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 text-yellow-600" />
                                  <span className="font-medium">{formatAmount(timer.amount)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 text-purple-600" />
                                  <span className="font-medium text-purple-600">{formatAmount(timer.psychicEarnings || timer.amount * COMMISSION_RATE)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 text-blue-600" />
                                  <span className="font-medium text-blue-600">{formatAmount((timer.amount || 0) * 0.75)}</span>
                                </div>
                              </TableCell>
                              <TableCell>{formatDuration(timer.duration)}</TableCell>
                              <TableCell className="text-sm">{formatDate(timer.endedAt)}</TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm" onClick={() => handleViewChatDetails(timer._id, true)}>
                                  <Eye className="h-3 w-3 mr-1" /> View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recent Psychics Tab */}
            <TabsContent value="recent-psychics">
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                    <Crown className="h-5 w-5" />
                    Recent Psychics
                  </CardTitle>
                  <CardDescription style={{ color: colors.primary + '70' }}>
                    Recently registered psychics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden border">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ backgroundColor: colors.primary + '05' }}>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rate/Min</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : dashboardData.lists.psychics?.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-8">No psychics found</TableCell></TableRow>
                        ) : (
                          dashboardData.lists.psychics?.slice(0, 5).map((psychic, index) => (
                            <TableRow key={psychic._id || index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6"><AvatarFallback className="bg-purple-100 text-purple-600 text-xs">{psychic.name?.[0] || 'P'}</AvatarFallback></Avatar>
                                  <span className="text-sm">{psychic.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{psychic.email}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 text-yellow-600" />
                                  <span>${(psychic.ratePerMin || 0).toFixed(2)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  <span>{(psychic.averageRating || 0).toFixed(1)}</span>
                                  <span className="text-xs">({psychic.totalRatings || 0})</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{formatDate(psychic.createdAt)}</TableCell>
                              <TableCell>
                                <Badge className={psychic.isVerified ? 'bg-green-500/10 text-green-700' : 'bg-yellow-500/10 text-yellow-700'}>
                                  {psychic.isVerified ? 'Verified' : 'Pending'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdminHumanChatDashboard;