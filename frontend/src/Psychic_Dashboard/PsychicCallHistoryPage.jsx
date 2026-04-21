import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePsychicAuth } from '../context/PsychicAuthContext';
import { 
  Phone, Clock, User, Calendar, DollarSign, ArrowLeft,
  AlertCircle, CheckCircle, XCircle, Loader2, RefreshCw,
  Volume2, VolumeX, Filter, BarChart, PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import io from 'socket.io-client';

// Import the sound file
import incomingCallSound from '../assets/new_chat_request.mp3';

const PsychicCallHistoryPage = () => {
  const navigate = useNavigate();
  const { psychic, colors } = usePsychicAuth();
  
  // State for both pending and history
  const [pendingCalls, setPendingCalls] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState({
    pending: false,
    history: false
  });
  const [stats, setStats] = useState({
    totalCalls: 0,
    totalEarnings: 0,
    totalDuration: 0,
    pendingCount: 0,
    acceptedCount: 0,
    completedCount: 0,
    rejectedCount: 0,
    expiredCount: 0
  });
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [ringingCallIds, setRingingCallIds] = useState(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  const API_BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5001';
  
  // Create axios instance
  const api = useRef(
    axios.create({
      baseURL: API_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  );

  // Add request interceptor
  useEffect(() => {
    const requestInterceptor = api.current.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('psychicToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('✅ Token added to request:', token.substring(0, 20) + '...');
        } else {
          console.log('❌ No token found in localStorage');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.current.interceptors.request.eject(requestInterceptor);
    };
  }, []);
  
  // Use ref for socket to avoid re-renders
  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const ringIntervalRef = useRef(null);

  // Debug logging
  useEffect(() => {
    console.log('🎯 PsychicCallHistoryPage mounted');
    console.log('Psychic:', psychic);
    console.log('Has token:', !!localStorage.getItem('psychicToken'));
    console.log('VITE_BASE_URL:', import.meta.env.VITE_BASE_URL);
    console.log('Using API_BASE:', API_BASE);
  }, []);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('psychicToken');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/psychic/login');
      return;
    }
    
    if (!psychic) {
      console.log('Waiting for psychic context to load...');
      return;
    }
  }, [psychic, navigate]);

  // Fetch call history when tab changes or filter changes
  useEffect(() => {
    if (activeTab === 'history') {
      fetchCallHistory();
    }
  }, [activeTab, statusFilter, pagination.page]);

  // Function to get client name safely (using username)
  const getClientName = (call) => {
    if (!call) return 'Client';
    
    // Try different possible paths for user data
    const user = call.user || call.userId || call.client || {};
    
    // Check for username first (as per your DB)
    if (user.username) {
      return user.username;
    } else if (user.name) {
      return user.name;
    } else if (user.fullName) {
      return user.fullName;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.email) {
      return user.email.split('@')[0];
    }
    
    // Check if username is directly on the call object
    if (call.username) {
      return call.username;
    }
    
    return 'Client';
  };

  // Function to get client image safely
  const getClientImage = (call) => {
    if (!call) return 'https://via.placeholder.com/48';
    
    // Try different possible paths for user image
    const user = call.user || call.userId || call.client || {};
    
    if (user.image) return user.image;
    if (user.avatar) return user.avatar;
    if (user.profileImage) return user.profileImage;
    
    // Check if image is directly on the call object
    if (call.image) return call.image;
    
    return 'https://via.placeholder.com/48';
  };

  // Function to start continuous ringing
  const startRinging = (callId) => {
    if (isSoundMuted) return;
    
    // Add to ringing set
    setRingingCallIds(prev => new Set([...prev, callId]));
    
    // Clear any existing interval
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
    }
    
    // Start new interval for continuous ringing
    ringIntervalRef.current = setInterval(() => {
      if (audioRef.current && !isSoundMuted) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.log('⚠️ Could not play sound:', err);
        });
      }
    }, 3000); // Ring every 3 seconds
    
    // Play immediately
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.log('⚠️ Could not play sound:', err);
      });
    }
  };

  // Function to stop ringing for a specific call
  const stopRinging = (callId) => {
    setRingingCallIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(callId);
      
      // If no more ringing calls, clear the interval
      if (newSet.size === 0 && ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      
      return newSet;
    });
  };

  // Function to play incoming call sound
  const playIncomingSound = (callId) => {
    if (isSoundMuted) return;
    
    // Start continuous ringing for this call
    startRinging(callId);
  };

  // Toggle sound mute
  const toggleSound = () => {
    setIsSoundMuted(!isSoundMuted);
    
    if (!isSoundMuted) {
      // Muting - stop all ringing
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      toast.info('Son coupé');
    } else {
      // Unmuting - restart ringing for existing pending calls
      toast.info('Son activé');
      if (pendingCalls.length > 0) {
        pendingCalls.forEach(call => {
          const callId = call._id || call.callRequestId;
          startRinging(callId);
        });
      }
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!psychic?._id) return;
    
    // Initialize audio for notifications
    audioRef.current = new Audio(incomingCallSound);
    audioRef.current.volume = 0.7;
    audioRef.current.loop = false;
    
    console.log('🔌 Initializing Socket.IO connection...');
    const token = localStorage.getItem('psychicToken');
    
    socketRef.current = io(`${API_BASE}/audio-calls`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    // Socket event handlers...
    socketRef.current.on('connect', () => {
      console.log('✅ Connected to audio namespace');
      setConnectionStatus('connected');
      socketRef.current.emit('psychic-register', psychic._id);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setConnectionStatus('error');
      toast.error('Échec de connexion au service en temps réel. Utilisation du mode polling.');
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setConnectionStatus('disconnected');
    });

    socketRef.current.on('registration-success', (data) => {
      console.log('✅ Psychic registered:', data);
      setConnectionStatus('registered');
    });

    socketRef.current.on('pending-calls-initial', (data) => {
      console.log('📋 Initial pending calls:', data);
      if (data.calls) {
        const processedCalls = data.calls.map(call => ({
          ...call,
          user: call.user || call.userId || {}
        }));
        setPendingCalls(processedCalls);
        setStats(prev => ({ ...prev, pendingCount: data.count || 0 }));
        
        if (!isSoundMuted) {
          processedCalls.forEach(call => {
            startRinging(call._id || call.callRequestId);
          });
        }
      }
    });

    socketRef.current.on('pending-calls-update', (data) => {
      console.log('🔄 Pending calls update:', data);
      if (data.calls) {
        const processedCalls = data.calls.map(call => ({
          ...call,
          user: call.user || call.userId || {}
        }));
        setPendingCalls(processedCalls);
        setStats(prev => ({ ...prev, pendingCount: data.count || 0 }));
        
        if (!isSoundMuted) {
          processedCalls.forEach(call => {
            startRinging(call._id || call.callRequestId);
          });
        }
      }
    });

    socketRef.current.on('incoming-call', (callData) => {
      console.log('📞 New incoming call:', callData);
      
      const processedCall = {
        ...callData,
        user: callData.user || callData.userId || {}
      };
      
      const callId = processedCall._id || processedCall.callRequestId;
      
      playIncomingSound(callId);
      
      setPendingCalls(prev => {
        const exists = prev.some(call => (call._id || call.callRequestId) === callId);
        if (!exists) {
          return [processedCall, ...prev];
        }
        return prev;
      });
      
      setStats(prev => ({ 
        ...prev, 
        pendingCount: prev.pendingCount + 1 
      }));
      
      const clientName = getClientName(processedCall);
      toast.info(`📞 Nouvel appel de ${clientName} !`, {
        duration: 5000,
        action: {
          label: 'Voir',
          onClick: () => setActiveTab('pending')
        }
      });
    });

    socketRef.current.on('new-pending-call', (callData) => {
      console.log('➕ New pending call:', callData);
      
      const processedCall = {
        ...callData,
        user: callData.user || callData.userId || {}
      };
      
      const callId = processedCall._id || processedCall.callRequestId;
      
      playIncomingSound(callId);
      
      setPendingCalls(prev => {
        const exists = prev.some(call => (call._id || call.callRequestId) === callId);
        if (!exists) {
          return [processedCall, ...prev];
        }
        return prev;
      });
    });

    socketRef.current.on('pending-call-removed', (data) => {
      console.log('➖ Pending call removed:', data);
      
      const callId = data.callRequestId;
      
      stopRinging(callId);
      
      setPendingCalls(prev => 
        prev.filter(call => (call._id || call.callRequestId) !== callId)
      );
      
      setStats(prev => ({ 
        ...prev, 
        pendingCount: Math.max(0, prev.pendingCount - 1)
      }));
      
      if (data.reason) {
        toast.info(`Appel ${data.reason === 'expired' ? 'expiré' : 
                       data.reason === 'accepted' ? 'accepté' : 
                       data.reason === 'rejected' ? 'refusé' : 
                       data.reason === 'cancelled' ? 'annulé' : 
                       data.reason}`, {
          duration: 3000
        });
      }
    });

    // Fetch initial data
    fetchAllData();

    return () => {
      console.log('🧹 Cleaning up socket');
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    };
  }, [psychic?._id, API_BASE]);

  // Fetch both pending and history
  const fetchAllData = async () => {
    console.log('🔄 Starting to fetch all data');
    await Promise.all([
      fetchPendingCalls(),
      fetchCallHistory()
    ]);
  };

  const fetchPendingCalls = async () => {
    console.log('📞 Fetching pending calls via HTTP...');
    setIsLoading(prev => ({ ...prev, pending: true }));
    
    try {
      const response = await api.current.get('/api/calls/pending');
      
      console.log('📊 Pending calls response:', response.data);
      
      if (response.data.success) {
        let data = response.data.data || [];
        
        // Process calls to ensure user data is properly structured
        data = data.map(call => ({
          ...call,
          user: call.user || call.userId || {}
        }));
        
        console.log(`✅ Found ${data.length} pending calls`);
        setPendingCalls(data);
        setStats(prev => ({ ...prev, pendingCount: data.length }));
        
        // Start ringing for all pending calls
        if (!isSoundMuted && data.length > 0) {
          data.forEach(call => {
            startRinging(call._id || call.callRequestId);
          });
        }
      } else {
        setPendingCalls([]);
      }
    } catch (error) {
      console.error('❌ Error fetching pending calls:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      
      if (error.response?.status === 401) {
        localStorage.removeItem('psychicToken');
        localStorage.removeItem('psychicData');
        toast.error('Session expirée. Veuillez vous reconnecter.');
        setTimeout(() => navigate('/psychic/login'), 1000);
      } else if (error.response?.status === 404) {
        console.log('ℹ️ Pending calls endpoint not found (404)');
        setPendingCalls([]);
      } else {
        setPendingCalls([]);
      }
    } finally {
      setIsLoading(prev => ({ ...prev, pending: false }));
    }
  };

  const fetchCallHistory = async () => {
    console.log('📋 Fetching call history...');
    setIsLoading(prev => ({ ...prev, history: true }));
    
    try {
      let url = `/api/calls/psychic/history?page=${pagination.page}&limit=${pagination.limit}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      
      console.log('Fetching from URL:', url);
      
      const response = await api.current.get(url);
      
      console.log('📊 Call history response:', response.data);
      
      if (response.data.success) {
        const data = response.data.data || {};
        const calls = data.calls || [];
        
        console.log(`✅ Found ${calls.length} call history records`);
        console.log('Sample call:', calls[0]);
        
        setCallHistory(calls);
        setPagination(data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 1
        });
        
        // Update stats
        if (data.summary) {
          setStats(prev => ({
            ...prev,
            totalCalls: data.summary.total || calls.length,
            totalEarnings: data.summary.totalEarnings || 0,
            totalDuration: data.summary.totalDuration || 0,
            acceptedCount: data.summary.accepted || 0,
            completedCount: data.summary.completed || 0,
            rejectedCount: data.summary.rejected || 0,
            expiredCount: data.summary.expired || 0,
            cancelledCount: data.summary.cancelled || 0,
            failedCount: data.summary.failed || 0
          }));
        }
      } else {
        console.log('❌ API returned success: false');
        setCallHistory([]);
        toast.error('Échec du chargement de l\'historique des appels');
      }
    } catch (error) {
      console.error('❌ Error fetching call history:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      });
      
      if (error.response?.status === 404) {
        console.log('ℹ️ Call history endpoint not found (404)');
        setCallHistory([]);
      } else if (error.response?.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('psychicToken');
        navigate('/psychic/login');
      } else {
        toast.error('Échec du chargement de l\'historique des appels');
        setCallHistory([]);
      }
    } finally {
      setIsLoading(prev => ({ ...prev, history: false }));
    }
  };

  // Also add this useEffect to log when callHistory changes
  useEffect(() => {
    console.log('📊 callHistory updated:', {
      length: callHistory.length,
      firstItem: callHistory[0],
      allItems: callHistory.map(c => ({ id: c._id, status: c.status }))
    });
  }, [callHistory]);

  const handleAcceptCall = async (call) => {
    const callId = call._id || call.callRequestId;
    
    if (!callId) {
      console.error('❌ No call ID provided');
      toast.error('Impossible d\'accepter l\'appel : ID de demande manquant');
      return;
    }
    
    console.log(`✅ Accepting call: ${callId}`);
    
    // Stop ringing for this call
    stopRinging(callId);
    
    try {
      const response = await api.current.post(`/api/calls/accept/${callId}`, {});
      
      if (response.data.success) {
        if (socketRef.current?.connected) {
          socketRef.current.emit('call-accepted', {
            callRequestId: callId,
            psychicId: psychic._id
          });
        }
        
        toast.success('Appel accepté !');
        
        navigate(`/psychic/call/${callId}`, {
          state: {
            callData: call,
            token: response.data.token
          }
        });
      }
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('psychicToken');
        navigate('/psychic/login');
      } else {
        toast.error(error.response?.data?.message || 'Échec de l\'acceptation de l\'appel');
      }
    }
  };

  const handleRejectCall = async (call) => {
    const callId = call._id || call.callRequestId;
    
    if (!callId) {
      console.error('❌ No call ID provided');
      toast.error('Impossible de refuser l\'appel : ID de demande manquant');
      return;
    }
    
    console.log(`❌ Rejecting call: ${callId}`);
    
    // Stop ringing for this call
    stopRinging(callId);
    
    try {
      const response = await api.current.post(`/api/calls/reject/${callId}`, {
        reason: 'Not available'
      });
      
      console.log('✅ Reject response:', response.data);
      
      if (response.data.success) {
        // Emit socket event for real-time update
        if (socketRef.current?.connected) {
          socketRef.current.emit('call-rejected', {
            callRequestId: callId,
            psychicId: psychic._id
          });
        }
        
        toast.success('Appel refusé');
        
        // Remove from pending calls immediately
        setPendingCalls(prev => prev.filter(c => (c._id || c.callRequestId) !== callId));
        
        // Refresh pending calls to sync with server
        setTimeout(() => {
          fetchPendingCalls();
        }, 500);
      } else {
        toast.error(response.data.message || 'Échec du refus de l\'appel');
      }
    } catch (error) {
      console.error('❌ Error rejecting call:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('psychicToken');
        navigate('/psychic/login');
      } else if (error.response?.status === 404) {
        toast.error('Appel non trouvé. Il a peut-être expiré.');
        // Remove from pending calls
        setPendingCalls(prev => prev.filter(c => (c._id || c.callRequestId) !== callId));
        fetchPendingCalls();
      } else {
        toast.error(error.response?.data?.message || 'Échec du refus de l\'appel');
      }
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeRemaining = (seconds) => {
    if (seconds == null) return 'Pas d\'expiration';
    if (seconds <= 0) return 'Expiré';
    
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status) => {
    const config = {
      'completed': { color: 'bg-green-500', text: 'Terminé', icon: CheckCircle },
      'accepted': { color: 'bg-blue-500', text: 'Accepté', icon: Phone },
      'pending': { color: 'bg-yellow-500', text: 'En attente', icon: AlertCircle },
      'rejected': { color: 'bg-red-500', text: 'Refusé', icon: XCircle },
      'expired': { color: 'bg-gray-500', text: 'Expiré', icon: XCircle },
      'cancelled': { color: 'bg-gray-500', text: 'Annulé', icon: XCircle },
      'failed': { color: 'bg-red-500', text: 'Échoué', icon: XCircle },
      'in-progress': { color: 'bg-green-600', text: 'En cours', icon: Phone }
    }[status] || { color: 'bg-gray-500', text: status, icon: AlertCircle };
    
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1 text-xs sm:text-sm`}>
        <Icon className="h-3 w-3" />
        <span className="hidden xs:inline">{config.text}</span>
      </Badge>
    );
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh...');
    fetchAllData();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // If no psychic, show loading
  if (!psychic) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors?.softIvory || '#F5F3EB' }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin mx-auto mb-4" style={{ color: colors?.antiqueGold || '#C9A24D' }} />
          <span className="text-sm sm:text-base" style={{ color: colors?.deepPurple || '#2B1B3F' }}>Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors?.softIvory || '#F5F3EB' }}>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/psychic/dashboard')}
              className="p-1 sm:p-2 h-auto"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: colors?.deepPurple || '#2B1B3F' }}>
                Appels Audio
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Gérez vos sessions d'appel audio</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              onClick={toggleSound}
              variant="outline"
              size="sm"
              className="p-1 sm:px-2 sm:py-1 h-auto"
              title={isSoundMuted ? "Activer le son" : "Couper le son"}
            >
              {isSoundMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span className="hidden sm:inline ml-1 text-xs">{isSoundMuted ? 'Activer' : 'Couper'}</span>
            </Button>
            
            <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
              ID: {psychic?._id?.slice(-6)}
            </div>
            
            <div className={`text-xs px-2 py-1 rounded ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-700' : 
              connectionStatus === 'error' ? 'bg-red-100 text-red-700' : 
              'bg-yellow-100 text-yellow-700'
            }`}>
              {connectionStatus === 'connected' ? '🟢 En direct' : 
               connectionStatus === 'registered' ? '🔵 Enreg' : 
               connectionStatus === 'error' ? '🔴 Erreur' : '🟡 Polling'}
            </div>
            
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading.pending || isLoading.history}
              className="p-1 sm:px-2 sm:py-1 h-auto"
            >
              {isLoading.pending || isLoading.history ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Card className="p-2 sm:p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600">En attente</p>
                <h3 className="text-sm sm:text-base md:text-lg font-bold" style={{ color: colors?.deepPurple || '#2B1B3F' }}>
                  {stats.pendingCount}
                </h3>
              </div>
              <div className="p-1 rounded-full" style={{ backgroundColor: colors?.lightGold || '#E8D9B0' }}>
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: colors?.antiqueGold || '#C9A24D' }} />
              </div>
            </div>
          </Card>

          <Card className="p-2 sm:p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600">Acceptés</p>
                <h3 className="text-sm sm:text-base md:text-lg font-bold" style={{ color: colors?.deepPurple || '#2B1B3F' }}>
                  {stats.acceptedCount}
                </h3>
              </div>
              <div className="p-1 rounded-full" style={{ backgroundColor: colors?.lightGold || '#E8D9B0' }}>
                <Phone className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: colors?.antiqueGold || '#C9A24D' }} />
              </div>
            </div>
          </Card>

          <Card className="p-2 sm:p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600">Terminés</p>
                <h3 className="text-sm sm:text-base md:text-lg font-bold" style={{ color: colors?.deepPurple || '#2B1B3F' }}>
                  {stats.completedCount}
                </h3>
              </div>
              <div className="p-1 rounded-full" style={{ backgroundColor: colors?.lightGold || '#E8D9B0' }}>
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: colors?.antiqueGold || '#C9A24D' }} />
              </div>
            </div>
          </Card>

          <Card className="p-2 sm:p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600">Refusés</p>
                <h3 className="text-sm sm:text-base md:text-lg font-bold" style={{ color: colors?.deepPurple || '#2B1B3F' }}>
                  {stats.rejectedCount}
                </h3>
              </div>
              <div className="p-1 rounded-full" style={{ backgroundColor: colors?.lightGold || '#E8D9B0' }}>
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: colors?.antiqueGold || '#C9A24D' }} />
              </div>
            </div>
          </Card>

          <Card className="p-2 sm:p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600">Expirés</p>
                <h3 className="text-sm sm:text-base md:text-lg font-bold" style={{ color: colors?.deepPurple || '#2B1B3F' }}>
                  {stats.expiredCount}
                </h3>
              </div>
              <div className="p-1 rounded-full" style={{ backgroundColor: colors?.lightGold || '#E8D9B0' }}>
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: colors?.antiqueGold || '#C9A24D' }} />
              </div>
            </div>
          </Card>

          <Card className="p-2 sm:p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600">Gains</p>
                <h3 className="text-sm sm:text-base md:text-lg font-bold" style={{ color: colors?.deepPurple || '#2B1B3F' }}>
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.totalEarnings)}
                </h3>
              </div>
              <div className="p-1 rounded-full" style={{ backgroundColor: colors?.lightGold || '#E8D9B0' }}>
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: colors?.antiqueGold || '#C9A24D' }} />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs for Pending Calls and History */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">En attente</span>
              <span className="xs:hidden">Attente</span>
              {pendingCalls.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0.5">
                  {pendingCalls.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Historique</span>
              <span className="xs:hidden">Hist</span>
              {callHistory.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5">
                  {callHistory.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pending Calls Tab */}
          <TabsContent value="pending">
            <Card className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg md:text-xl font-bold" style={{ color: colors?.deepPurple || '#2B1B3F' }}>
                  Demandes d'appel entrantes
                </h2>
                <div className="text-xs sm:text-sm text-gray-500">
                  {connectionStatus === 'connected' ? '🔵 Temps réel' : '🟡 Interrogation'}
                </div>
              </div>

              {isLoading.pending ? (
                <div className="flex justify-center p-6 sm:p-8 md:p-12">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 animate-spin" style={{ color: colors?.antiqueGold || '#C9A24D' }} />
                </div>
              ) : pendingCalls.length === 0 ? (
                <div className="text-center py-6 sm:py-8 md:py-12">
                  <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-3 sm:mb-4" style={{ color: colors?.antiqueGold || '#C9A24D' }} />
                  <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2" style={{ color: colors?.deepPurple || '#2B1B3F' }}>
                    Aucun appel en attente
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 px-2">
                    Vous n'avez aucune demande d'appel entrante pour le moment
                  </p>
                  <Button onClick={fetchPendingCalls} variant="outline" size="sm" className="text-xs sm:text-sm">
                    Vérifier à nouveau
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
                    Cliquez sur "Accepter" pour commencer un appel ou "Refuser" pour décliner
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {pendingCalls.map((call) => {
                      const callId = call._id || call.callRequestId;
                      const isRinging = ringingCallIds.has(callId);
                      const clientName = getClientName(call);
                      const clientImage = getClientImage(call);
                      
                      return (
                        <Card key={callId} className="p-3 sm:p-4 hover:shadow-lg transition-shadow border border-gray-200 relative">
                          {isRinging && !isSoundMuted && (
                            <div className="absolute top-2 right-2">
                              <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-purple-100 border-2 border-yellow-500 flex-shrink-0">
                              <img
                                src={clientImage}
                                alt={clientName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/48';
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-sm sm:text-base truncate">
                                {clientName}
                              </h4>
                              <p className="text-xs text-gray-500">Client</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 text-xs sm:text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tarif :</span>
                              <span className="font-semibold">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(call.ratePerMin || 1)}/min</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Temps restant :</span>
                              <span className={`font-semibold ${call.timeRemaining != null && call.timeRemaining > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                <Clock className="inline h-3 w-3 mr-1" />
                                {formatTimeRemaining(call.timeRemaining)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Demandé :</span>
                              <span className="text-xs">
                                {call.requestedAt ? new Date(call.requestedAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                              </span>
                            </div>
                            {call.isFreeSession && (
                              <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded text-center">
                                ⭐ Première minute gratuite
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleAcceptCall(call)}
                              disabled={call.timeRemaining != null && call.timeRemaining <= 0}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm py-1 sm:py-2"
                              size="sm"
                            >
                              <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="hidden xs:inline">Accepter</span>
                            </Button>
                            <Button
                              onClick={() => handleRejectCall(call)}
                              variant="outline"
                              className="flex-1 border-red-600 text-red-600 hover:bg-red-50 text-xs sm:text-sm py-1 sm:py-2"
                              size="sm"
                            >
                              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="hidden xs:inline">Refuser</span>
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>
          </TabsContent>

          {/* Call History Tab */}
          <TabsContent value="history">
            <Card className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg md:text-xl font-bold" style={{ color: colors?.deepPurple || '#2B1B3F' }}>
                  Historique des Appels
                </h2>
                
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[120px] sm:w-[150px] h-8 text-xs">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les appels</SelectItem>
                      <SelectItem value="accepted">Acceptés</SelectItem>
                      <SelectItem value="completed">Terminés</SelectItem>
                      <SelectItem value="rejected">Refusés</SelectItem>
                      <SelectItem value="expired">Expirés</SelectItem>
                      <SelectItem value="cancelled">Annulés</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={() => {
                      setPagination(prev => ({ ...prev, page: 1 }));
                      fetchCallHistory();
                    }}
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={isLoading.history}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isLoading.history ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Actualiser</span>
                  </Button>
                </div>
              </div>

              {isLoading.history ? (
                <div className="flex justify-center p-6 sm:p-8 md:p-12">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 animate-spin" style={{ color: colors?.antiqueGold || '#C9A24D' }} />
                </div>
              ) : callHistory.length === 0 ? (
                <div className="text-center py-6 sm:py-8 md:py-12">
                  <Phone className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-3 sm:mb-4" style={{ color: colors?.antiqueGold || '#C9A24D' }} />
                  <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2" style={{ color: colors?.deepPurple || '#2B1B3F' }}>
                    Aucun historique d'appel
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                    Votre historique d'appels apparaîtra ici après avoir terminé des appels
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden border border-gray-200 rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="text-xs whitespace-nowrap px-2 sm:px-4 py-2">Client</TableHead>
                              <TableHead className="text-xs whitespace-nowrap px-2 sm:px-4 py-2">Date</TableHead>
                              <TableHead className="text-xs whitespace-nowrap px-2 sm:px-4 py-2">Durée</TableHead>
                              <TableHead className="text-xs whitespace-nowrap px-2 sm:px-4 py-2">Gains</TableHead>
                              <TableHead className="text-xs whitespace-nowrap px-2 sm:px-4 py-2">Statut</TableHead>
                              <TableHead className="text-xs whitespace-nowrap px-2 sm:px-4 py-2">Tarif</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {callHistory.map((call) => (
                              <TableRow key={call._id} className="hover:bg-gray-50">
                                <TableCell className="px-2 sm:px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                      <img
                                        src={call.userId?.image || 'https://via.placeholder.com/32'}
                                        alt={call.userId?.username || 'Client'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.src = 'https://via.placeholder.com/32';
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-none">
                                      {call.userId?.username || call.userId?.firstName || 'Client'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-2 sm:px-4 py-2 text-xs">
                                  <div className="flex flex-col">
                                    <span>{new Date(call.createdAt).toLocaleDateString('fr-FR')}</span>
                                    <span className="text-gray-500 text-[10px] sm:text-xs">
                                      {new Date(call.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-2 sm:px-4 py-2 text-xs">
                                  {formatTime(call.durationSeconds)}
                                </TableCell>
                                <TableCell className="px-2 sm:px-4 py-2 text-xs font-semibold text-green-600">
                                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(call.psychicEarnings || 0)}
                                </TableCell>
                                <TableCell className="px-2 sm:px-4 py-2">
                                  {getStatusBadge(call.status)}
                                </TableCell>
                                <TableCell className="px-2 sm:px-4 py-2 text-xs">
                                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(call.ratePerMin || 0)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-xs text-gray-500">
                        Page {pagination.page} sur {pagination.pages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.pages}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PsychicCallHistoryPage;