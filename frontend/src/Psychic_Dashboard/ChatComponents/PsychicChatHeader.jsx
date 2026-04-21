import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  DollarSign,
  User,
  Sparkles,
  Play,
  Pause,
  StopCircle
} from 'lucide-react';
import axios from 'axios';
import { usePsychicAuth } from "@/context/PsychicAuthContext";
import { useToast } from "@/hooks/use-toast";
import PsychicChatRequestModal from './PsychicChatRequestModal';
import io from "socket.io-client";

// Timer display formatter
const formatTimerDisplay = (seconds) => {
  if (!seconds || seconds <= 0) return "00:00";
 
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
 
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const PsychicChatHeader = ({ user, chatSessionId, onBack, isMobileView }) => {
  const { psychic } = usePsychicAuth();
  const { toast } = useToast();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  
  const socketRef = useRef(null);
  const timerCheckRef = useRef(null);
  const hasFetchedActiveSessionRef = useRef(false);

  // API instance
  const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('psychicToken')}`
    }
  });

  // Initialize socket and fetch data
  useEffect(() => {
    if (!user?._id || !psychic) return;

   const initializeSocket = () => {
  const token = localStorage.getItem('psychicToken');
  if (!token) return;

  socketRef.current = io(import.meta.env.VITE_BASE_URL || 'http://localhost:5001', {
    auth: {
      token,
      userId: psychic._id,
      role: 'psychic'
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    autoConnect: false  // Disable auto-connect
  });

      socketRef.current.on('connect', () => {
        console.log('Psychic header socket connected');
        socketRef.current.emit('join_room', `psychic_${psychic._id}`);
        
        // Also join user-specific room for targeted updates
        if (user?._id) {
          socketRef.current.emit('join_room', `user_${user._id}_psychic`);
        }
      });

      socketRef.current.on('disconnect', () => {
        console.log('Psychic header socket disconnected');
      });

      // Listen for new chat request in real-time (FIXED)
      socketRef.current.on('new_chat_request', (data) => {
        console.log('New chat request received in header:', data);
        if (data.chatRequest?.user?._id === user._id) {
          setPendingRequests(prev => {
            // Avoid duplicates
            if (prev.some(req => req._id === data.chatRequest._id)) {
              return prev;
            }
            return [...prev, data.chatRequest];
          });
          
          toast({
            title: "Nouvelle Demande de Chat",
            description: `De ${user.firstName} ${user.lastName}`,
            variant: "default"
          });
        }
      });

      // Listen for session started (FIXED - more robust)
      socketRef.current.on('session_started', (data) => {
        console.log('Session started received in header:', data);
        if (data.chatRequest?.user?._id === user._id) {
          // Fetch fresh session data
          checkActiveSession(true);
          toast({
            title: "Session Démarrée",
            description: "La session payante a démarré",
            variant: "default"
          });
        }
      });

      // Listen for timer ticks
      socketRef.current.on('timer_tick', (data) => {
        console.log('Timer tick received:', data);
        if (activeSession?._id === data.requestId) {
          setActiveSession(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              paidSession: {
                ...prev?.paidSession,
                remainingSeconds: data.remainingSeconds
              }
            };
          });
        }
      });

      // Listen for session ended
      socketRef.current.on('session_ended', (data) => {
        console.log('Session ended received:', data);
        if (data.requestId && activeSession?._id === data.requestId) {
          setActiveSession(null);
          toast({
            title: "Session Terminée",
            description: "La session payante est terminée",
            variant: "default"
          });
        }
      });

      // Listen for timer paused/resumed
      socketRef.current.on('timer_paused', (data) => {
        if (activeSession?._id === data.requestId) {
          setActiveSession(prev => ({
            ...prev,
            paidSession: {
              ...prev?.paidSession,
              isPaused: true
            }
          }));
        }
      });

      socketRef.current.on('timer_resumed', (data) => {
        if (activeSession?._id === data.requestId) {
          setActiveSession(prev => ({
            ...prev,
            paidSession: {
              ...prev?.paidSession,
              isPaused: false
            }
          }));
        }
      });

      // NEW: Listen for session updates from any source
      socketRef.current.on('session_updated', (data) => {
        console.log('Session updated in header:', data);
        if (data.chatSessionId && activeSession?._id === data.chatSessionId) {
          // Refresh session data
          checkActiveSession(false);
        }
      });

      // NEW: Listen for request accepted/rejected
      socketRef.current.on('request_processed', (data) => {
        console.log('Request processed:', data);
        if (data.userId === user._id) {
          // Remove from pending requests
          setPendingRequests(prev => 
            prev.filter(req => req._id !== data.requestId)
          );
          
          if (data.action === 'accepted') {
            // Fetch the new active session
            checkActiveSession(true);
          }
        }
      });
    };

    // Initialize socket
    initializeSocket();

    // Fetch initial data
    fetchPendingRequests();
    checkActiveSession();

    // Set up periodic check for active session (every 30 seconds)
    timerCheckRef.current = setInterval(() => {
      if (activeSession) {
        checkActiveSession(false);
      }
    }, 30000);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (timerCheckRef.current) {
        clearInterval(timerCheckRef.current);
      }
      hasFetchedActiveSessionRef.current = false;
    };
  }, [user, psychic]);

  // Check for active session (UPDATED)
  const checkActiveSession = async (force = false) => {
    if (!user?._id || !psychic) return;
    
    try {
      // Only set loading on forced refreshes or first load
      if (force || !hasFetchedActiveSessionRef.current) {
        setSessionLoading(true);
      }
      
      // Call the correct endpoint - using chat session ID if available
      let endpoint = '/api/psychic/active-session';
      if (chatSessionId) {
        endpoint = `/api/psychic/session/${chatSessionId}/status`;
      }
      
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        const sessionData = response.data.data || response.data.session;
        
        if (sessionData && sessionData.user?._id === user._id) {
          setActiveSession(sessionData);
          // Clear any pending requests for this user
          setPendingRequests(prev => 
            prev.filter(req => req.user?._id !== user._id)
          );
        } else {
          setActiveSession(null);
        }
      } else {
        setActiveSession(null);
      }
      
      hasFetchedActiveSessionRef.current = true;
    } catch (error) {
      console.error('Error checking active session:', error);
      // Don't clear active session on network errors to prevent flickering
      if (force) {
        setActiveSession(null);
      }
    } finally {
      setSessionLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get('/api/chatrequest/psychic/pending-requests');
     
      if (response.data.success) {
        const allRequests = response.data.data || [];
        // Filter requests for current user
        const userRequests = allRequests.filter(req => req.user?._id === user._id);
        setPendingRequests(userRequests);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      checkActiveSession(true),
      fetchPendingRequests()
    ]);
    setIsRefreshing(false);
   
    toast({
      title: "Actualisé",
      description: "Données de session mises à jour",
      variant: "default"
    });
  };

  const handleRequestAccepted = (requestData) => {
    console.log('Request accepted:', requestData);
    // Update active session
    setActiveSession(requestData);
    // Clear pending requests for this user
    setPendingRequests(prev => 
      prev.filter(req => req.user?._id !== user._id)
    );
    // Close modal
    setShowRequestModal(false);
    
    // Emit socket event for real-time update
    if (socketRef.current?.connected) {
      socketRef.current.emit('request_accepted', {
        requestId: requestData._id,
        userId: user._id,
        psychicId: psychic._id
      });
    }
  };

  const handleSessionEnd = async (sessionId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir terminer cette session ?')) return;
   
    try {
      const response = await api.post('/api/chatrequest/stop-timer-psychic', {
        requestId: sessionId
      });
     
      if (response.data.success) {
        setActiveSession(null);
        
        // Emit socket event
        if (socketRef.current?.connected) {
          socketRef.current.emit('session_ended_by_psychic', {
            requestId: sessionId,
            userId: user._id
          });
        }
        
        toast.success('Session terminée');
      }
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Échec de la fin de session');
    }
  };

  const handlePauseTimer = async (sessionId) => {
    try {
      const response = await api.post('/api/chatrequest/pause-timer-psychic', {
        requestId: sessionId
      });
     
      if (response.data.success) {
        // Update local state immediately
        setActiveSession(prev => ({
          ...prev,
          paidSession: {
            ...prev?.paidSession,
            isPaused: true
          }
        }));
        
        toast.success('Session en pause');
      }
    } catch (error) {
      console.error('Error pausing timer:', error);
      toast.error('Échec de la mise en pause');
    }
  };

  const handleResumeTimer = async (sessionId) => {
    try {
      const response = await api.post('/api/chatrequest/resume-timer-psychic', {
        requestId: sessionId
      });
     
      if (response.data.success) {
        // Update local state immediately
        setActiveSession(prev => ({
          ...prev,
          paidSession: {
            ...prev?.paidSession,
            isPaused: false
          }
        }));
        
        toast.success('Session reprise');
      }
    } catch (error) {
      console.error('Error resuming timer:', error);
      toast.error('Échec de la reprise');
    }
  };

  const handleRequestRejected = (requestId) => {
    setPendingRequests(prev => prev.filter(req => req._id !== requestId));
    setShowRequestModal(false);
    
    // Emit socket event
    if (socketRef.current?.connected) {
      socketRef.current.emit('request_rejected', {
        requestId,
        userId: user._id,
        psychicId: psychic._id
      });
    }
  };

  const hasPendingRequest = pendingRequests.some(req => req.user?._id === user?._id);
  const currentPendingRequest = pendingRequests.find(req => req.user?._id === user?._id);

  if (!user) return null;

  if (sessionLoading && !activeSession) {
    return (
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 animate-pulse" />
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
      {/* Left side: User Info and Back Button (mobile) */}
      <div className="flex-1 flex items-center gap-3">
        {isMobileView && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="mr-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
        )}
        
        <div className="relative">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
            {user?.firstName?.[0] || 'U'}
          </div>
          {hasPendingRequest && !activeSession && (
            <div className="absolute -top-1 -right-1">
              <Badge className="bg-amber-500 text-white animate-pulse px-2 py-0.5 text-xs">
                Demande
              </Badge>
            </div>
          )}
        </div>
       
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg text-gray-800">
              {user?.firstName} {user?.lastName}
            </h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <User className="h-3 w-3 mr-1" />
              Client
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <DollarSign className="h-3 w-3" />
              <span className="font-medium">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(psychic?.ratePerMin || 1)}/min</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-6 px-2"
            >
              <svg 
                className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Right side: Timer Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          {activeSession ? (
            // Active Paid Timer
            <div className="w-full bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-3 min-w-[250px]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">Session Payante</span>
                </div>
                <div className="text-xs text-gray-500">
                  Active
                </div>
              </div>
             
              <div className="text-center mb-3">
                <div className="text-2xl font-bold text-gray-800 font-mono">
                  {activeSession?.paidSession?.remainingSeconds
                    ? formatTimerDisplay(activeSession.paidSession.remainingSeconds)
                    : "00:00"}
                </div>
                <div className="text-xs text-gray-500">
                  {activeSession?.paidSession?.isPaused ? "EN PAUSE" : "TEMPS RESTANT"}
                </div>
              </div>
             
              <div className="flex gap-2">
                {activeSession?.paidSession?.isPaused ? (
                  <Button
                    onClick={() => handleResumeTimer(activeSession._id)}
                    variant="outline"
                    className="border-green-300 text-green-600 hover:bg-green-50 flex-1"
                    size="sm"
                  >
                    <Play className="mr-2 h-3 w-3" />
                    Reprendre
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePauseTimer(activeSession._id)}
                    variant="outline"
                    className="border-amber-300 text-amber-600 hover:bg-amber-50 flex-1"
                    size="sm"
                  >
                    <Pause className="mr-2 h-3 w-3" />
                    Pause
                  </Button>
                )}
               
                <Button
                  onClick={() => handleSessionEnd(activeSession._id)}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                  size="sm"
                >
                  <StopCircle className="mr-2 h-3 w-3" />
                  Terminer
                </Button>
              </div>
            </div>
          ) : hasPendingRequest ? (
            // Pending Request
            <div className="flex gap-2 w-full">
              <Button
                onClick={() => setShowRequestModal(true)}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Voir la Demande
              </Button>
            </div>
          ) : (
            // No Active Session
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200 min-w-[200px]">
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">En Attente de Demande</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Le client peut envoyer une demande de chat
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Chat Request Modal */}
      {currentPendingRequest && (
        <PsychicChatRequestModal
          request={currentPendingRequest}
          user={user}
          psychic={psychic}
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onAccepted={handleRequestAccepted}
          onRejected={handleRequestRejected}
        />
      )}
    </div>
  );
};

export default PsychicChatHeader;