// src/hooks/usePsychicCalls.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import audioSocketManager from '@/utils/audioSocket';

export const usePsychicCalls = () => {
  const [pendingCalls, setPendingCalls] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [callTimers, setCallTimers] = useState({});
  
  const socketRef = useRef(null);
  const timerRef = useRef({});
  const pollIntervalRef = useRef(null);
  const pendingCallTimerRef = useRef(null);
  
  const psychicId = localStorage.getItem('psychicId');
  const psychicToken = localStorage.getItem('psychicToken');

  // Create axios instance with auth
  const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${psychicToken}`
    }
  });

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!psychicId || !psychicToken) {
      console.log('❌ Cannot initialize: Missing psychic credentials');
      return null;
    }

    console.log('🔌 Initializing audio socket for psychic:', psychicId);
    
    // Disconnect existing
    audioSocketManager.disconnect();
    
    // Connect to audio namespace
    const socket = audioSocketManager.connect(psychicId, psychicToken);
    socketRef.current = socket;

    // Socket event handlers
    socket.on('connect', () => {
      console.log('✅ Audio socket connected');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Audio socket disconnected');
      setSocketConnected(false);
    });

    socket.on('pending-calls', (calls) => {
      console.log('📋 Received pending calls:', calls?.length || 0);
      
      // Add time remaining to each call
      const now = new Date();
      const callsWithTimers = (calls || []).map(call => {
        let timeRemaining = null;
        if (call.expiresAt) {
          const expiresAt = new Date(call.expiresAt);
          timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        }
        return { ...call, timeRemaining };
      }).filter(call => call.timeRemaining === null || call.timeRemaining > 0);
      
      setPendingCalls(callsWithTimers);
      setIsLoading(false);
    });

    socket.on('incoming-call', (data) => {
      console.log('📞 Incoming call:', data);
      
      // Check if already exists
      setPendingCalls(prev => {
        const exists = prev.find(call => call._id === data.callRequestId);
        if (exists) return prev;
        
        // Calculate time remaining
        let timeRemaining = 30; // Default 30 seconds
        if (data.expiresAt) {
          const expiresAt = new Date(data.expiresAt);
          timeRemaining = Math.max(0, Math.floor((expiresAt - new Date()) / 1000));
        }
        
        const newCall = {
          _id: data.callRequestId,
          callRequestId: data.callRequestId,
          userId: data.userId,
          user: data.user,
          status: 'pending',
          requestedAt: data.requestedAt || new Date(),
          expiresAt: data.expiresAt,
          roomName: data.roomName,
          isFreeSession: data.isFreeSession,
          timeRemaining
        };
        
        toast.info(`📞 Incoming call from ${data.user?.firstName || 'User'}`, {
          duration: 30000,
          action: {
            label: 'Answer',
            onClick: () => {
              window.open(`/psychic/call/${data.callRequestId}`, '_blank');
            }
          }
        });
        
        return [...prev, newCall];
      });
    });

    socket.on('call-token', (data) => {
      console.log('🔑 Call token received:', data);
      
      setActiveCall({
        ...data,
        status: 'accepted',
        acceptedAt: new Date()
      });
      
      toast.success('Call accepted! Connecting...');
    });

    socket.on('timer-started', (data) => {
      console.log('⏱️ Timer started:', data);
      
      setActiveCall(prev => ({
        ...prev,
        status: 'active',
        startTime: data.startTime
      }));
    });

    socket.on('timer-sync', (data) => {
      console.log('⏱️ Timer sync:', data);
      
      if (activeCall && activeCall.callSessionId === data.callSessionId) {
        setActiveCall(prev => ({
          ...prev,
          elapsedSeconds: data.elapsedSeconds,
          startTime: data.startTime
        }));
      }
    });

    socket.on('call-completed', (data) => {
      console.log('📞 Call completed:', data);
      
      // Clear active call
      setActiveCall(null);
      
      // Remove from pending if present
      if (data.callRequestId) {
        setPendingCalls(prev => 
          prev.filter(call => call._id !== data.callRequestId && call.callRequestId !== data.callRequestId)
        );
      }
      
      const endMessage = data.endReason === 'ended_by_user' 
        ? 'User ended the call' 
        : data.endReason === 'ended_by_psychic'
        ? 'You ended the call'
        : data.endReason === 'insufficient_credits'
        ? 'Call ended - User has insufficient credits'
        : data.endReason === 'expired'
        ? 'Call request expired'
        : 'Call completed';
      
      toast.info(endMessage);
      
      // Update psychic status
      api.put('/api/psychic/status', { status: 'online' }).catch(console.error);
    });

    socket.on('call-cancelled', (data) => {
      console.log('❌ Call cancelled:', data);
      
      setPendingCalls(prev => 
        prev.filter(call => call._id !== data.callRequestId)
      );
      
      setActiveCall(prev => {
        if (prev && prev._id === data.callRequestId) {
          return null;
        }
        return prev;
      });
      
      toast.info('Call cancelled by user');
    });

    socket.on('call-ended-insufficient-credits', (data) => {
      console.log('💰 Call ended - insufficient credits:', data);
      
      setActiveCall(null);
      toast.error('Call ended - User has insufficient credits');
    });

    socket.on('call-expired', (data) => {
      console.log('⏰ Call expired:', data);
      
      setPendingCalls(prev => 
        prev.filter(call => call._id !== data.callRequestId)
      );
      
      toast.error('Call request expired');
    });

    socket.on('call-error', (error) => {
      console.error('❌ Call error:', error);
      toast.error(error.message || 'Call error occurred');
    });

    socket.on('registration-success', (data) => {
      console.log('✅ Registration success:', data);
    });

    return socket;
  }, [psychicId, psychicToken, activeCall]);

  // Fetch pending calls from API
  const fetchPendingCalls = useCallback(async () => {
    if (!psychicId) return;
    
    try {
      setIsLoading(true);
      const response = await api.get('/api/calls/pending');
      
      if (response.data.success) {
        const calls = response.data.data || [];
        
        // Add time remaining
        const now = new Date();
        const callsWithTimers = calls.map(call => {
          let timeRemaining = null;
          if (call.expiresAt) {
            const expiresAt = new Date(call.expiresAt);
            timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
          }
          return { ...call, timeRemaining };
        }).filter(call => call.timeRemaining === null || call.timeRemaining > 0);
        
        setPendingCalls(callsWithTimers);
      }
    } catch (error) {
      console.error('Error fetching pending calls:', error);
    } finally {
      setIsLoading(false);
    }
  }, [psychicId, api]);

  // Refresh timers for pending calls
  const refreshPendingCallTimers = useCallback(async () => {
    if (!psychicId || pendingCalls.length === 0) return;
    
    try {
      const response = await api.get('/api/calls/pending');
      
      if (response.data.success) {
        const serverCalls = response.data.data || [];
        const serverCallMap = new Map(serverCalls.map(c => [c._id, c]));
        
        setPendingCalls(prev => 
          prev.map(call => {
            const serverCall = serverCallMap.get(call._id);
            if (serverCall && serverCall.expiresAt) {
              const expiresAt = new Date(serverCall.expiresAt);
              const timeRemaining = Math.max(0, Math.floor((expiresAt - new Date()) / 1000));
              
              // Remove if expired
              if (timeRemaining <= 0) {
                return null;
              }
              
              return { ...call, timeRemaining };
            }
            return call;
          }).filter(Boolean)
        );
      }
    } catch (error) {
      console.error('Error refreshing timers:', error);
    }
  }, [psychicId, pendingCalls.length, api]);

  // Accept call
  const acceptCall = useCallback(async (callRequestId) => {
    if (!socketRef.current?.connected) {
      toast.error('Not connected to audio server');
      return false;
    }

    try {
      console.log('✅ Accepting call:', callRequestId);
      
      const callRequest = pendingCalls.find(call => call._id === callRequestId);
      if (!callRequest) {
        toast.error('Call request not found');
        return false;
      }

      // Check if expired
      if (callRequest.timeRemaining !== null && callRequest.timeRemaining <= 0) {
        toast.error('Call request has expired');
        refreshPendingCallTimers();
        return false;
      }

      // Emit accept event
      socketRef.current.emit('accept-call', {
        callRequestId,
        roomName: callRequest.roomName
      });

      // Remove from pending
      setPendingCalls(prev => prev.filter(call => call._id !== callRequestId));
      
      toast.success('Accepting call...');
      return true;
      
    } catch (error) {
      console.error('Error accepting call:', error);
      toast.error(error.message || 'Failed to accept call');
      return false;
    }
  }, [pendingCalls, refreshPendingCallTimers]);

  // Reject call
  const rejectCall = useCallback(async (callRequestId, reason = 'Not available') => {
    if (!socketRef.current?.connected) {
      toast.error('Not connected to server');
      return;
    }

    try {
      socketRef.current.emit('reject-call', {
        callRequestId,
        reason
      });

      setPendingCalls(prev => prev.filter(call => call._id !== callRequestId));
      toast.info('Call rejected');
      
    } catch (error) {
      console.error('Error rejecting call:', error);
      toast.error('Failed to reject call');
    }
  }, []);

  // End active call
  const endCall = useCallback(async (endReason = 'ended_by_psychic') => {
    if (!socketRef.current?.connected || !activeCall) {
      toast.error('No active call');
      return;
    }

    try {
      const callSessionId = activeCall.callSessionId || activeCall._id;
      
      if (!callSessionId) {
        toast.error('No call session ID');
        return;
      }

      console.log('🛑 Ending call:', callSessionId);
      
      socketRef.current.emit('call-ended', {
        callSessionId,
        endReason
      });

      setActiveCall(null);
      
      // Update psychic status
      try {
        await api.put('/api/psychic/status', { status: 'online' });
      } catch (error) {
        console.error('Error updating status:', error);
      }
      
      toast.info('Call ended');
      
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Failed to end call');
    }
  }, [activeCall, api]);

  // Sync timer with server
  const syncTimer = useCallback((callSessionId) => {
    if (socketRef.current?.connected && callSessionId) {
      socketRef.current.emit('sync-timer', { callSessionId });
    }
  }, []);

  // Get time remaining for call request
  const getTimeRemaining = useCallback((expiresAt) => {
    if (!expiresAt) return 0;
    const now = new Date();
    const expires = new Date(expiresAt);
    return Math.max(0, Math.floor((expires - now) / 1000));
  }, []);

  // Format time for display
  const formatTimeRemaining = useCallback((seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    if (seconds <= 0) return 'Expired';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (psychicId && psychicToken) {
      console.log('🔧 Initializing psychic calls...');
      initializeSocket();
      fetchPendingCalls();
    } else {
      console.log('❌ Missing psychic credentials');
      setIsLoading(false);
    }

    return () => {
      audioSocketManager.disconnect();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (pendingCallTimerRef.current) {
        clearInterval(pendingCallTimerRef.current);
      }
      Object.values(timerRef.current).forEach(clearInterval);
    };
  }, [initializeSocket, fetchPendingCalls, psychicId, psychicToken]);

  // Poll for pending call updates every 5 seconds
  useEffect(() => {
    if (psychicId && socketConnected) {
      pollIntervalRef.current = setInterval(refreshPendingCallTimers, 5000);
      
      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [psychicId, socketConnected, refreshPendingCallTimers]);

  // Update local timers for pending calls every second
  useEffect(() => {
    if (pendingCalls.length === 0) return;
    
    pendingCallTimerRef.current = setInterval(() => {
      setPendingCalls(prev => 
        prev.map(call => {
          if (call.expiresAt) {
            const expiresAt = new Date(call.expiresAt);
            const timeRemaining = Math.max(0, Math.floor((expiresAt - new Date()) / 1000));
            
            if (timeRemaining <= 0) {
              // Remove expired call
              return null;
            }
            
            return { ...call, timeRemaining };
          }
          return call;
        }).filter(Boolean)
      );
    }, 1000);
    
    return () => {
      if (pendingCallTimerRef.current) {
        clearInterval(pendingCallTimerRef.current);
      }
    };
  }, [pendingCalls.length]);

  // Timer sync for active call
  useEffect(() => {
    if (activeCall?.status === 'active' && activeCall.callSessionId) {
      const syncInterval = setInterval(() => {
        syncTimer(activeCall.callSessionId);
      }, 3000);
      
      return () => clearInterval(syncInterval);
    }
  }, [activeCall?.status, activeCall?.callSessionId, syncTimer]);

  return {
    pendingCalls,
    activeCall,
    socket: socketRef.current,
    socketConnected,
    isLoading,
    fetchPendingCalls,
    refreshPendingCallTimers,
    acceptCall,
    rejectCall,
    endCall,
    syncTimer,
    getTimeRemaining,
    formatTimeRemaining,
    initializeSocket
  };
};