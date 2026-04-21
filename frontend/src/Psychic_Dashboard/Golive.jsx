// Golive.jsx - COMPLETE FIXED VERSION (No infinite loop)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePsychicAuth } from "../context/PsychicAuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Wifi, WifiOff, Loader2, Sparkles, Crown, Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import io from 'socket.io-client';

const colors = {
  primary: "#2B1B3F",
  secondary: "#C9A24D",
  accent: "#9B7EDE",
  bgLight: "#3A2B4F",
  textLight: "#E8D9B0",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  background: "#F5F3EB",
  onlineGreen: "#22C55E",
  offlineGray: "#6B7280",
};

const Golive = () => {
  const { psychic, loading: authLoading, isAuthenticated } = usePsychicAuth();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('offline');
  const [updating, setUpdating] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [warningInfo, setWarningInfo] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Refs for socket and timers
  const socketRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const statusCheckIntervalRef = useRef(null);
  const isOnlineManuallyRef = useRef(false);
  const hasFetchedStatusRef = useRef(false); // ✅ Prevent duplicate fetches
  const fetchStatusTimeoutRef = useRef(null);
  
  const socketUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

  // Initialize Socket.IO connection with keepalive
  const initializeSocket = useCallback(() => {
    if (!isAuthenticated || !psychic?._id) return;
    
    const token = localStorage.getItem('psychicToken');
    if (!token) return;
    
    // Close existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Create new socket connection
    const socket = io(socketUrl, {
      auth: {
        token: token,
        userId: psychic._id,
        role: 'psychic'
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      pingInterval: 25000,
      pingTimeout: 60000,
      upgrade: true,
      forceNew: true
    });
    
    socketRef.current = socket;
    
    // Socket event handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setConnectionStatus('connected');
      
      // Send initial status to server
      if (status === 'online' || isOnlineManuallyRef.current) {
        socket.emit('psychic_status_update', {
          psychicId: psychic._id,
          status: 'online'
        });
        
        // Start heartbeat
        startHeartbeat();
      }
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);
      setConnectionStatus('disconnected');
      stopHeartbeat();
      
      // If manually online, try to reconnect
      if (isOnlineManuallyRef.current && status === 'online') {
        console.log('🔄 Attempting to reconnect...');
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (socketRef.current && !socketRef.current.connected) {
            socketRef.current.connect();
          }
        }, 2000);
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setConnectionStatus('error');
    });
    
    socket.on('psychic_status_changed', (data) => {
      console.log('📡 Status changed event:', data);
      if (data.psychicId === psychic._id) {
        setStatus(data.status);
        if (data.status === 'offline') {
          isOnlineManuallyRef.current = false;
        }
      }
    });
    
    socket.on('account_deactivated', (data) => {
      console.warn('⚠️ Account deactivated:', data);
      setWarningInfo(data);
      setStatus('offline');
      isOnlineManuallyRef.current = false;
      toast.error(data.message || 'Your account has been deactivated');
    });
    
    socket.on('active_warnings', (data) => {
      if (data.count > 0) {
        setWarningInfo({ count: data.count, warnings: data.warnings });
        toast.warning(`You have ${data.count} active warning(s) on your account`);
      }
    });
    
    return socket;
  }, [isAuthenticated, psychic?._id, socketUrl, status]);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.connected && psychic?._id && status === 'online') {
        socketRef.current.emit('psychic_heartbeat', {
          psychicId: psychic._id,
          timestamp: Date.now()
        });
        console.log('💓 Heartbeat sent');
      }
    }, 30000);
  }, [psychic?._id, status]);
  
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);
  
  // ✅ FIXED: Fetch current status from backend - ONLY ONCE
  const fetchMyStatus = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchingStatus) {
      console.log('Already fetching status, skipping...');
      return;
    }
    
    // Prevent fetching if already fetched successfully
    if (hasFetchedStatusRef.current && status !== 'offline') {
      console.log('Status already fetched, skipping...');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping status fetch');
      return;
    }
    
    setFetchingStatus(true);
    try {
      const token = localStorage.getItem("psychicToken");
      if (!token) {
        throw new Error('No token found');
      }
      
      console.log('Fetching psychic status...');
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/human-psychics/my-status`,
        {
          headers: { "Authorization": `Bearer ${token}` },
          timeout: 10000
        }
      );
      
      console.log('Status response:', response.data);
      
      if (response.data.success) {
        const newStatus = response.data.status;
        setStatus(newStatus);
        hasFetchedStatusRef.current = true;
        
        if (newStatus === 'online') {
          isOnlineManuallyRef.current = true;
        } else {
          isOnlineManuallyRef.current = false;
        }
        
        // Mark initial load as complete
        setInitialLoadComplete(true);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error.response?.data || error.message);
      // Set default status on error
      setStatus('offline');
      setInitialLoadComplete(true);
    } finally {
      setFetchingStatus(false);
    }
  }, [isAuthenticated, fetchingStatus, status]);

  // Update status on server
  const updateStatus = useCallback(async (newStatus) => {
    if (!psychic) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem("psychicToken");
      
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/human-psychics/status`,
        { status: newStatus },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          timeout: 10000
        }
      );
      
      if (response.data.success) {
        setStatus(newStatus);
        
        if (newStatus === 'online') {
          isOnlineManuallyRef.current = true;
          toast.success('You are now online and visible to clients');
          
          // Initialize socket connection
          initializeSocket();
        } else {
          isOnlineManuallyRef.current = false;
          stopHeartbeat();
          toast.success('You are now offline');
          
          // Notify server via socket
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('psychic_status_update', {
              psychicId: psychic._id,
              status: 'offline'
            });
          }
        }
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error("Failed to update status");
      
      // If error and trying to go online, revert
      if (newStatus === 'online') {
        setStatus('offline');
        isOnlineManuallyRef.current = false;
      }
    } finally {
      setUpdating(false);
    }
  }, [psychic, initializeSocket, stopHeartbeat]);
  
  const toggleStatus = useCallback(() => {
    if (updating || fetchingStatus) return;
    const newStatus = status === 'online' ? 'offline' : 'online';
    updateStatus(newStatus);
  }, [updating, fetchingStatus, status, updateStatus]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (statusCheckIntervalRef.current) clearInterval(statusCheckIntervalRef.current);
      if (fetchStatusTimeoutRef.current) clearTimeout(fetchStatusTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  // ✅ FIXED: Check authentication with proper cleanup
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      // Clear any pending timeouts
      if (fetchStatusTimeoutRef.current) {
        clearTimeout(fetchStatusTimeoutRef.current);
      }
      navigate("/psychic/login");
    }
  }, [authLoading, isAuthenticated, navigate]);
  
  // ✅ FIXED: Fetch status ONLY ONCE when authenticated
  useEffect(() => {
    // Only fetch if authenticated, not already fetched, and not currently fetching
    if (isAuthenticated && !hasFetchedStatusRef.current && !fetchingStatus && !initialLoadComplete) {
      console.log('Starting initial status fetch...');
      // Small delay to ensure everything is ready
      fetchStatusTimeoutRef.current = setTimeout(() => {
        fetchMyStatus();
      }, 500);
    }
  }, [isAuthenticated, fetchingStatus, initialLoadComplete, fetchMyStatus]);
  
  // ✅ FIXED: Initialize socket only when status is online and not already connected
  useEffect(() => {
    if (status === 'online' && psychic?._id && isAuthenticated && !socketRef.current?.connected) {
      initializeSocket();
    } else if (status === 'offline' && socketRef.current?.connected) {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      stopHeartbeat();
    }
  }, [status, psychic?._id, isAuthenticated, initializeSocket, stopHeartbeat]);
  
  // Sync status from psychic context (only once)
  useEffect(() => {
    if (psychic?.status && psychic.status !== status && !updating && initialLoadComplete) {
      console.log('Syncing status from context:', psychic.status);
      setStatus(psychic.status);
      if (psychic.status === 'online') {
        isOnlineManuallyRef.current = true;
      } else {
        isOnlineManuallyRef.current = false;
      }
    }
  }, [psychic?.status, status, updating, initialLoadComplete]);
  
  // ✅ FIXED: Loading state - only show when actually loading
  if (authLoading || (!initialLoadComplete && fetchingStatus)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{ 
                backgroundColor: colors.primary,
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.bgLight} 100%)`
              }}>
              <Sparkles className="h-8 w-8 animate-pulse" style={{ color: colors.secondary }} />
            </div>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: colors.secondary }} />
          </div>
          <span className="text-lg font-medium" style={{ color: colors.primary }}>Loading your status...</span>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) return null;
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: colors.background }}>
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Warning Banner */}
        {warningInfo && warningInfo.count > 0 && (
          <div className="rounded-xl p-4 border-2" style={{ backgroundColor: colors.warning + '20', borderColor: colors.warning }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5" style={{ color: colors.warning }} />
              <span className="font-bold" style={{ color: colors.warning }}>Warning Notice</span>
            </div>
            <p className="text-sm">
              You have {warningInfo.count} active warning(s) on your account. 
              Please review our community guidelines.
            </p>
          </div>
        )}
        
        {/* Header */}
        <div>
          <div className="relative mb-4">
            <div className="h-16 w-16 mx-auto rounded-full flex items-center justify-center border-4"
              style={{ 
                backgroundColor: colors.primary,
                borderColor: colors.secondary,
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.bgLight} 100%)`
              }}>
              <Sparkles className="h-8 w-8" style={{ color: colors.secondary }} />
            </div>
            <div className="absolute -top-2 -right-2">
              <Crown className="h-6 w-6" style={{ color: colors.secondary }} />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold" style={{ color: colors.primary }}>Go Live</h1>
          <p className="mt-2" style={{ color: colors.bgLight }}>Control your availability for clients</p>
          
          {/* Connection Status Indicator */}
          {status === 'online' && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className={`h-2 w-2 rounded-full ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: connectionStatus === 'connected' ? colors.onlineGreen : colors.warning }}></div>
              <span className="text-xs" style={{ color: colors.bgLight }}>
                {connectionStatus === 'connected' ? 'Connected to server' : 
                 connectionStatus === 'error' ? 'Connection issue - retrying...' : 'Connecting...'}
              </span>
            </div>
          )}
          
          {/* Psychic Info */}
          {psychic?.name && (
            <div className="mt-6 p-4 rounded-xl shadow-sm border"
              style={{ 
                backgroundColor: colors.primary + '10',
                borderColor: colors.secondary + '30'
              }}>
              <p className="font-medium" style={{ color: colors.bgLight }}>Connected as:</p>
              <p className="text-xl font-bold mt-1" style={{ color: colors.secondary }}>{psychic.name}</p>
              {psychic?.specialty && (
                <p className="text-sm mt-1" style={{ color: colors.accent }}>{psychic.specialty}</p>
              )}
            </div>
          )}
        </div>
        
        {/* Status Card */}
        <div className="rounded-xl shadow-lg p-8 border"
          style={{ 
            backgroundColor: 'white',
            borderColor: colors.secondary + '30',
            background: `linear-gradient(135deg, white 0%, ${colors.background} 100%)`
          }}>
          <div className="mb-6">
            <div className={`h-24 w-24 mx-auto rounded-full flex items-center justify-center mb-4 border-4 ${
              status === 'online' ? 'animate-pulse' : ''
            }`}
              style={{ 
                backgroundColor: status === 'online' ? colors.onlineGreen + '15' : colors.offlineGray + '15',
                borderColor: status === 'online' ? colors.onlineGreen : colors.offlineGray
              }}>
              {status === 'online' ? (
                <Wifi className="h-12 w-12" style={{ color: colors.onlineGreen }} />
              ) : (
                <WifiOff className="h-12 w-12" style={{ color: colors.offlineGray }} />
              )}
            </div>
            
            <h2 className="text-xl font-semibold mb-2" style={{ color: colors.primary }}>
              {status === 'online' ? 'You are ONLINE' : 'You are OFFLINE'}
            </h2>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={`h-3 w-3 rounded-full ${status === 'online' ? 'animate-pulse' : ''}`}
                style={{ 
                  backgroundColor: status === 'online' ? colors.onlineGreen : colors.offlineGray 
                }}></div>
              <p style={{ color: colors.bgLight }}>
                {status === 'online' 
                  ? 'Clients can see you and start chats'
                  : 'You are not visible to clients'
                }
              </p>
            </div>
          </div>
          
          {/* Toggle Button */}
          <Button
            onClick={toggleStatus}
            disabled={updating}
            size="lg"
            className={`w-full rounded-full text-lg font-medium transition-all duration-300 hover:scale-[1.02]`}
            style={{
              backgroundColor: status === 'online' ? colors.danger : colors.success,
              color: 'white'
            }}
          >
            {updating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Updating...
              </>
            ) : status === 'online' ? (
              <>
                <WifiOff className="h-5 w-5 mr-2" />
                Go Offline
              </>
            ) : (
              <>
                <Wifi className="h-5 w-5 mr-2" />
                Go Online
              </>
            )}
          </Button>
          
          {/* Refresh button */}
          <Button
            onClick={() => {
              hasFetchedStatusRef.current = false;
              fetchMyStatus();
            }}
            disabled={fetchingStatus}
            variant="outline"
            className="w-full mt-4 transition-all duration-200 hover:scale-[1.02]"
            style={{ 
              borderColor: colors.secondary,
              color: colors.primary,
              backgroundColor: colors.secondary + '10'
            }}
          >
            {fetchingStatus ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" style={{ color: colors.secondary }} />
                Refresh Status
              </>
            )}
          </Button>
        </div>
        
        {/* Status Info */}
        <div className="text-sm p-4 rounded-lg border"
          style={{ 
            backgroundColor: colors.primary + '05',
            borderColor: colors.secondary + '20',
            color: colors.bgLight
          }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Home className="h-4 w-4" style={{ color: colors.secondary }} />
            <p className="font-medium">Status Information</p>
          </div>
          <p>
            When you are online, you appear in search results and can receive chat requests.
            Your status will remain online until you manually go offline.
          </p>
          <div className="mt-3 p-2 rounded bg-white border"
            style={{ 
              borderColor: colors.accent + '30',
              color: colors.primary
            }}>
            <p className="font-medium">
              Current Status: <span className="font-bold" style={{ color: status === 'online' ? colors.onlineGreen : colors.offlineGray }}>
                {status === 'online' ? 'ONLINE' : 'OFFLINE'}
              </span>
            </p>
            <p className="text-xs mt-1" style={{ color: colors.bgLight }}>
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        {/* Online Status Message */}
        {status === 'online' && (
          <div className="mt-4 p-4 rounded-xl border"
            style={{ 
              backgroundColor: colors.success + '10',
              borderColor: colors.success + '30',
              color: colors.success
            }}>
            <div className="flex items-center justify-center gap-2">
              <Crown className="h-5 w-5" />
              <p className="font-bold">Ready to earn!</p>
            </div>
            <p className="text-sm mt-1">You are visible to clients and can start earning</p>
            {connectionStatus !== 'connected' && (
              <p className="text-xs mt-2" style={{ color: colors.warning }}>
                ⚠️ Connecting to server... you will appear online once connected
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Golive;