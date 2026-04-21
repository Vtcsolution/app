// src/pages/user/AudioCallPage.jsx - COMPLETE WITH CREDIT TRACKING AND AUTO-END
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Phone, PhoneOff, Clock, User, MessageCircle, Volume2, Mic, MicOff, Video, VideoOff, X, AlertCircle, RefreshCw, CreditCard, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import axios from 'axios';
import io from 'socket.io-client';
import twilioService from '@/services/twilioService';

const AudioCallPage = () => {
  const { callSessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // State from navigation or fetch
  const [callData, setCallData] = useState(location.state || {});
  const [status, setStatus] = useState(location.state?.status || 'loading');
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [twilioToken, setTwilioToken] = useState('');
  const [roomName, setRoomName] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [initialCredits, setInitialCredits] = useState(0);
  const [isFreeSession, setIsFreeSession] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastServerSync, setLastServerSync] = useState(Date.now());
  const [syncStatus, setSyncStatus] = useState('synced');
  const [userId, setUserId] = useState(null);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  
  // Track if call is already ending
  const [isEnding, setIsEnding] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [lowCreditWarningShown, setLowCreditWarningShown] = useState(false);
  const [callEndedDueToCredits, setCallEndedDueToCredits] = useState(false);

  // Refs
  const socketRef = useRef(null);
  const countdownRef = useRef(null);
  const audioPermissionRef = useRef(null);
  const callSessionIdRef = useRef(callSessionId || location.state?.callSessionId);
  const callRequestIdRef = useRef(location.state?.callRequestId);
  const syncIntervalRef = useRef(null);
  const verifyIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const initializedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const twilioConnectedRef = useRef(false);
  const creditCheckIntervalRef = useRef(null);
  const walletSocketRef = useRef(null);
  const ratePerMinRef = useRef(1);

  // Color scheme
  const colors = {
    deepPurple: "#2B1B3F",
    antiqueGold: "#C9A24D",
    softIvory: "#F5F3EB",
    lightGold: "#E8D9B0",
    darkPurple: "#1A1129",
  };

  // Status colors
  const statusColors = {
    loading: 'bg-gray-500',
    initiated: 'bg-yellow-500',
    ringing: 'bg-blue-500',
    active: 'bg-green-500',
    accepted: 'bg-green-500',
    rejected: 'bg-red-500',
    cancelled: 'bg-gray-500',
    completed: 'bg-purple-500',
    failed: 'bg-red-500',
    expired: 'bg-red-500'
  };

  // API instance with auth
  const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    },
    withCredentials: true
  });

  // Add token to requests
  api.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Get user ID from token
  const getUserIdFromToken = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decoded = JSON.parse(jsonPayload);
      return decoded.id || decoded.userId || decoded.sub;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }, []);

  // Clean up all intervals
  const stopAllIntervals = useCallback(() => {
    console.log('🛑 Stopping all intervals');
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    if (verifyIntervalRef.current) {
      clearInterval(verifyIntervalRef.current);
      verifyIntervalRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (creditCheckIntervalRef.current) {
      clearInterval(creditCheckIntervalRef.current);
      creditCheckIntervalRef.current = null;
    }
  }, []);

  // Clean up Twilio resources
  const cleanupTwilio = useCallback(() => {
    console.log('🧹 Cleaning up Twilio');
    try {
      twilioService.endCall();
      twilioService.cleanup();
    } catch (error) {
      console.error('Error cleaning up Twilio:', error);
    }
    twilioConnectedRef.current = false;
    removeAudioPermissionHandler();
    setIsAudioPlaying(false);
  }, []);

  // Remove audio permission handler
  const removeAudioPermissionHandler = useCallback(() => {
    if (audioPermissionRef.current) {
      document.removeEventListener('click', audioPermissionRef.current);
      audioPermissionRef.current = null;
    }
  }, []);

  // Fetch wallet balance directly from API
  const fetchWalletBalance = useCallback(async () => {
    if (!userId && !getUserIdFromToken()) return null;
    
    try {
      const response = await api.get('/api/wallet/balance');
      if (response.data.success) {
        const balance = response.data.balance || response.data.credits || 0;
        console.log(`💰 Wallet balance fetched: ${balance}`);
        return balance;
      }
      return null;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return null;
    }
  }, [api, userId, getUserIdFromToken]);

  // Calculate maximum allowed minutes based on credits
  const getMaxAllowedMinutes = useCallback(() => {
    const ratePerMin = ratePerMinRef.current || callData.psychic?.ratePerMin || 1;
    return Math.floor(currentCredits / ratePerMin);
  }, [currentCredits, callData.psychic?.ratePerMin]);

  // Check if credits are exhausted
  const checkAndEndCallIfCreditsExhausted = useCallback(async () => {
    const ratePerMin = ratePerMinRef.current || callData.psychic?.ratePerMin || 1;
    const maxMinutes = Math.floor(currentCredits / ratePerMin);
    const currentMinutes = Math.ceil(timer / 60);
    
    console.log(`💰 Credit check: current=${currentCredits}, rate=${ratePerMin}, maxMinutes=${maxMinutes}, currentMinutes=${currentMinutes}, timer=${timer}s`);
    
    // If current minutes used >= max allowed minutes, end the call
    if (currentMinutes >= maxMinutes && currentCredits <= 0) {
      console.log('💰⚠️ CREDITS EXHAUSTED! Ending call automatically.');
      
      if (!callEndedDueToCredits && !isEnding && !hasEnded) {
        setCallEndedDueToCredits(true);
        
        toast.error('Call ended: You have used all your credits!', {
          duration: 5000,
          icon: <AlertCircle className="h-5 w-5" />
        });
        
        stopAllIntervals();
        
        try {
          await api.post(`/api/calls/end/${callSessionIdRef.current}`, { 
            endReason: 'insufficient_credits' 
          });
        } catch (apiError) {
          console.error('Error ending call via API:', apiError);
        }
        
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('call-ended', {
            callSessionId: callSessionIdRef.current,
            endReason: 'insufficient_credits',
            duration: timer,
            creditsUsed: creditsUsed
          });
        }
        
        try {
          twilioService.endCall();
          twilioService.cleanup();
        } catch (twilioError) {
          console.error('Error cleaning up Twilio:', twilioError);
        }
        
        setStatus('failed');
        setHasEnded(true);
        setIsEnding(true);
        
        setTimeout(() => {
          navigate('/', { 
            state: { 
              message: 'Your call ended because you have used all your credits. Please add more credits to continue.',
              previousCall: true 
            } 
          });
        }, 3000);
        
        return true;
      }
    }
    
    return false;
  }, [currentCredits, timer, creditsUsed, callData.psychic?.ratePerMin, api, navigate, isEnding, hasEnded, callEndedDueToCredits, stopAllIntervals]);

  // Start real-time credit checking
  const startCreditChecking = useCallback(() => {
    if (creditCheckIntervalRef.current) {
      clearInterval(creditCheckIntervalRef.current);
    }
    
    console.log('💰 Starting real-time credit checking (every 2 seconds)');
    
    creditCheckIntervalRef.current = setInterval(async () => {
      if (!callSessionIdRef.current || status !== 'active' || hasEnded || isEnding) {
        return;
      }
      
      try {
        const balance = await fetchWalletBalance();
        
        if (balance !== null) {
          console.log(`💰 Current credit balance: ${balance}`);
          setCurrentCredits(balance);
          
          // Calculate remaining minutes
          const ratePerMin = ratePerMinRef.current || callData.psychic?.ratePerMin || 1;
          const remainingMinutes = Math.floor(balance / ratePerMin);
          const usedMinutes = Math.ceil(timer / 60);
          
          console.log(`💰 Credit stats: balance=${balance}, rate=${ratePerMin}, remainingMinutes=${remainingMinutes}, usedMinutes=${usedMinutes}`);
          
          // Show warning when credits are low (less than 1 minute left)
          if (balance > 0 && balance < ratePerMin && !lowCreditWarningShown) {
            toast.warning(`Low credits! Only ${balance.toFixed(2)} credits remaining (less than 1 minute).`, {
              duration: 10000,
              action: {
                label: 'Add Credits',
                onClick: () => navigate('/')
              }
            });
            setLowCreditWarningShown(true);
          }
          
          // End call if credits are 0 or less
          if (balance <= 0) {
            console.log('💰⚠️ CREDIT CHECK: Balance is ZERO! Ending call immediately.');
            
            if (!callEndedDueToCredits && !isEnding && !hasEnded) {
              setCallEndedDueToCredits(true);
              
              toast.error('Insufficient credits! Call will end now.', {
                duration: 5000,
                icon: <AlertCircle className="h-5 w-5" />
              });
              
              stopAllIntervals();
              
              try {
                await api.post(`/api/calls/end/${callSessionIdRef.current}`, { 
                  endReason: 'insufficient_credits' 
                });
              } catch (apiError) {
                console.error('Error ending call via API:', apiError);
              }
              
              if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('call-ended', {
                  callSessionId: callSessionIdRef.current,
                  endReason: 'insufficient_credits',
                  duration: timer,
                  creditsUsed: creditsUsed
                });
              }
              
              try {
                twilioService.endCall();
                twilioService.cleanup();
              } catch (twilioError) {
                console.error('Error cleaning up Twilio:', twilioError);
              }
              
              setStatus('failed');
              setHasEnded(true);
              setIsEnding(true);
              
              toast.error('Call ended: Insufficient credits!', {
                duration: 5000,
                action: {
                  label: 'Add Credits',
                  onClick: () => navigate('/')
                }
              });
              
              setTimeout(() => {
                navigate('/', { 
                  state: { 
                    message: 'Your call ended due to insufficient credits. Please add credits to continue.',
                    previousCall: true 
                  } 
                });
              }, 3000);
            }
          } else if (balance > 0 && balance < ratePerMin && !lowCreditWarningShown) {
            toast.warning(`Low credits! Only ${balance.toFixed(2)} credits remaining.`, {
              duration: 5000,
              action: {
                label: 'Add Credits',
                onClick: () => navigate('/')
              }
            });
            setLowCreditWarningShown(true);
          } else if (balance >= ratePerMin && lowCreditWarningShown) {
            setLowCreditWarningShown(false);
            setCallEndedDueToCredits(false);
          }
        }
      } catch (error) {
        console.error('Error in credit checking interval:', error);
      }
    }, 2000);
    
  }, [api, status, timer, creditsUsed, navigate, fetchWalletBalance, hasEnded, isEnding, lowCreditWarningShown, callEndedDueToCredits, stopAllIntervals, callData.psychic?.ratePerMin]);

  // Setup wallet WebSocket for real-time updates
  const setupWalletWebSocket = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    const uid = userId || getUserIdFromToken();
    
    if (!uid || !token) return;
    
    console.log('🔌 Setting up wallet WebSocket for real-time credit updates');
    
    if (walletSocketRef.current) {
      walletSocketRef.current.disconnect();
    }
    
    const walletSocket = io(import.meta.env.VITE_BASE_URL || 'http://localhost:5001', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    
    walletSocketRef.current = walletSocket;
    
    walletSocket.on('connect', () => {
      console.log('✅ Wallet WebSocket connected');
      walletSocket.emit('join', uid);
    });
    
    walletSocket.on('walletUpdate', (data) => {
      console.log('💰 Wallet update received via WebSocket:', data);
      const newBalance = data.credits || data.balance || 0;
      setCurrentCredits(newBalance);
      
      const ratePerMin = ratePerMinRef.current || callData.psychic?.ratePerMin || 1;
      
      if (newBalance <= 0 && status === 'active' && !hasEnded && !isEnding && !callEndedDueToCredits) {
        console.log('💰⚠️ WebSocket: Credits reached ZERO! Ending call.');
        setCallEndedDueToCredits(true);
        stopAllIntervals();
        
        api.post(`/api/calls/end/${callSessionIdRef.current}`, { 
          endReason: 'insufficient_credits' 
        }).catch(err => console.error('Error ending call:', err));
        
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('call-ended', {
            callSessionId: callSessionIdRef.current,
            endReason: 'insufficient_credits',
            duration: timer,
            creditsUsed: creditsUsed
          });
        }
        
        setStatus('failed');
        setHasEnded(true);
        setIsEnding(true);
        
        toast.error('Call ended: Insufficient credits!', {
          duration: 5000,
          action: {
            label: 'Add Credits',
            onClick: () => navigate('/')
          }
        });
        
        setTimeout(() => {
          navigate('/', { 
            state: { 
              message: 'Your call ended due to insufficient credits. Please add credits to continue.',
              previousCall: true 
            } 
          });
        }, 3000);
      } else if (newBalance > 0 && newBalance < ratePerMin && !lowCreditWarningShown && status === 'active') {
        toast.warning(`Low credits! Only ${newBalance.toFixed(2)} credits remaining (less than 1 minute).`, {
          duration: 5000,
          action: {
            label: 'Add Credits',
            onClick: () => navigate('/')
          }
        });
        setLowCreditWarningShown(true);
      } else if (newBalance >= ratePerMin && lowCreditWarningShown) {
        setLowCreditWarningShown(false);
        setCallEndedDueToCredits(false);
      }
    });
    
    walletSocket.on('disconnect', () => {
      console.log('⚠️ Wallet WebSocket disconnected');
    });
    
    return walletSocket;
  }, [userId, getUserIdFromToken, api, status, timer, creditsUsed, navigate, hasEnded, isEnding, lowCreditWarningShown, callEndedDueToCredits, stopAllIntervals, callData.psychic?.ratePerMin]);

  // Handle call end
  const handleCallEnd = useCallback((data) => {
    if (isEnding || hasEnded) {
      console.log('⚠️ Call already ending or ended, skipping duplicate call');
      return;
    }
    
    console.log('🛑 Handling call end with data:', data);
    setIsEnding(true);
    
    stopAllIntervals();
    
    if (walletSocketRef.current) {
      walletSocketRef.current.disconnect();
      walletSocketRef.current = null;
    }
    
    try {
      twilioService.endCall();
      twilioService.cleanup();
    } catch (error) {
      console.error('Error cleaning up Twilio:', error);
    }
    
    removeAudioPermissionHandler();
    
    let endMessage = 'Call ended';
    let endStatus = 'completed';
    let finalCredits = data.creditsUsed || 0;
    let shouldRedirectToWallet = false;
    
    if (data.endReason === 'ended_by_psychic' || data.endedBy === 'psychic') {
      endMessage = 'Psychic ended the call';
    } else if (data.endReason === 'ended_by_user' || data.endedBy === 'user') {
      endMessage = 'You ended the call';
    } else if (data.endReason === 'insufficient_credits') {
      endMessage = 'Call ended - You have used all your credits';
      endStatus = 'failed';
      shouldRedirectToWallet = true;
    } else if (data.endReason === 'user_disconnected' || data.endReason === 'psychic_disconnected') {
      endMessage = 'Call ended - Connection lost';
      endStatus = 'failed';
    } else if (data.endReason === 'expired') {
      endMessage = 'Call request expired';
      endStatus = 'expired';
    } else if (data.endReason === 'cancelled') {
      endMessage = 'Call cancelled';
      endStatus = 'cancelled';
    } else if (data.endReason === 'rejected') {
      endMessage = 'Call rejected';
      endStatus = 'rejected';
    }
    
    setStatus(endStatus);
    setCreditsUsed(finalCredits);
    setHasEnded(true);
    
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }
    
    toast.error(endMessage);
    
    setTimeout(() => {
      if (shouldRedirectToWallet) {
        navigate('/', { 
          state: { 
            message: 'Your call ended because you have used all your credits. Please add more credits to continue.',
            previousCall: true 
          } 
        });
      } else {
        navigate('/');
      }
    }, 3000);
    
  }, [stopAllIntervals, removeAudioPermissionHandler, navigate, isEnding, hasEnded]);

  // Poll timer from server
  const startTimerPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    console.log('⏱️ Starting timer polling from server');
    
    pollIntervalRef.current = setInterval(async () => {
      if (!callSessionIdRef.current || status !== 'active' || hasEnded) {
        return;
      }
      
      try {
        const response = await api.get(`/api/calls/sync-timer/${callSessionIdRef.current}`);
        
        if (response.data.success) {
          const data = response.data.data;
          
          if (data.elapsedSeconds !== undefined) {
            setTimer(prevTimer => {
              if (prevTimer !== data.elapsedSeconds) {
                console.log(`⏱️ Timer updated: ${prevTimer} -> ${data.elapsedSeconds}`);
                return data.elapsedSeconds;
              }
              return prevTimer;
            });
            
            setLastServerSync(Date.now());
            setSyncStatus('synced');
          }
          
          if (data.creditsUsed !== undefined) {
            console.log(`💰 Credits used from server: ${data.creditsUsed}`);
            setCreditsUsed(data.creditsUsed);
          }
          
          if (data.currentCredits !== undefined) {
            console.log(`💰 Current credits from server: ${data.currentCredits}`);
            setCurrentCredits(data.currentCredits);
            
            // Check if credits are zero and end call
            if (data.currentCredits <= 0 && !hasEnded && !isEnding && !callEndedDueToCredits) {
              console.log('💰 CREDITS ZERO from polling! Ending call.');
              setCallEndedDueToCredits(true);
              handleCallEnd({
                callSessionId: callSessionIdRef.current,
                endReason: 'insufficient_credits',
                endedBy: 'system',
                creditsUsed: data.creditsUsed || creditsUsed
              });
            } else if (data.currentCredits < ratePerMinRef.current && data.currentCredits > 0 && !lowCreditWarningShown) {
              toast.warning(`Low credits! Only ${data.currentCredits.toFixed(2)} credits remaining (less than 1 minute).`);
              setLowCreditWarningShown(true);
            }
          }
          
          // Also check based on elapsed time vs credits
          if (ratePerMinRef.current > 0 && currentCredits > 0) {
            const maxMinutes = Math.floor(currentCredits / ratePerMinRef.current);
            const currentMinutes = Math.ceil((data.elapsedSeconds || timer) / 60);
            
            if (currentMinutes >= maxMinutes && currentCredits <= ratePerMinRef.current) {
              console.log(`💰 Time-based credit check: Used ${currentMinutes} min, max ${maxMinutes} min. Ending call.`);
              if (!callEndedDueToCredits && !isEnding && !hasEnded) {
                setCallEndedDueToCredits(true);
                handleCallEnd({
                  callSessionId: callSessionIdRef.current,
                  endReason: 'insufficient_credits',
                  endedBy: 'system',
                  creditsUsed: creditsUsed
                });
              }
            }
          }
          
          if (data.status === 'ended' || data.status === 'completed') {
            console.log('⚠️ Server reports call ended during polling');
            handleCallEnd({
              callSessionId: callSessionIdRef.current,
              endReason: data.endReason || 'call_ended',
              endedBy: data.endedBy || 'unknown',
              creditsUsed: data.creditsUsed || creditsUsed
            });
          }
        }
      } catch (error) {
        console.error('Error polling timer:', error);
        setSyncStatus('error');
        
        if (error.response?.status === 404) {
          handleCallEnd({
            callSessionId: callSessionIdRef.current,
            endReason: 'call_ended',
            creditsUsed
          });
        }
      }
    }, 1000);
    
  }, [api, status, creditsUsed, handleCallEnd, hasEnded, isEnding, lowCreditWarningShown, callEndedDueToCredits, currentCredits, timer]);

  // Verify call status
  const verifyCallStatus = useCallback(async () => {
    if (!callSessionIdRef.current || status === 'completed' || status === 'ended' || status === 'failed' || hasEnded) {
      return;
    }
    
    try {
      const response = await api.get(`/api/calls/status/${callSessionIdRef.current}`);
      
      if (response.data.success) {
        const data = response.data.data;
        
        if (data.status === 'ended' || data.status === 'completed') {
          console.log('⚠️ Backend reports call ended, syncing frontend');
          
          handleCallEnd({
            callSessionId: callSessionIdRef.current,
            endReason: data.endReason || 'call_ended',
            endedBy: data.endedBy || 'unknown',
            creditsUsed: data.creditsUsed || creditsUsed
          });
        }
      }
    } catch (error) {
      console.error('Error verifying call status:', error);
      
      if (error.response?.status === 404) {
        handleCallEnd({
          callSessionId: callSessionIdRef.current,
          endReason: 'call_ended',
          endedBy: 'unknown',
          creditsUsed
        });
      }
    }
  }, [api, creditsUsed, handleCallEnd, status, hasEnded]);

  // Fetch call details
  const fetchCallDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      let response;
      let sessionId = callSessionIdRef.current || callSessionId;
      
      if (sessionId) {
        response = await api.get(`/api/calls/status/${sessionId}`);
        
        if (response.data.success) {
          const data = response.data.data;
          
          setStatus(data.status || 'active');
          setTimer(data.elapsedSeconds || 0);
          setCreditsUsed(data.creditsUsed || 0);
          
          const balance = await fetchWalletBalance();
          if (balance !== null) {
            setCurrentCredits(balance);
            setInitialCredits(balance);
          }
          
          if (data.ratePerMin) {
            ratePerMinRef.current = data.ratePerMin;
          }
          
          if (data.roomName) {
            setRoomName(data.roomName);
          }
          
          if (data.participantTokens?.user) {
            setTwilioToken(data.participantTokens.user);
          }
          
          if (data.psychicId) {
            setCallData(prev => ({
              ...prev,
              psychic: data.psychicId,
              callSessionId: data._id,
              ratePerMin: data.ratePerMin || data.psychicId?.ratePerMin || 1
            }));
            ratePerMinRef.current = data.ratePerMin || data.psychicId?.ratePerMin || 1;
          }
          
          callSessionIdRef.current = data._id;
          
          // Check if call is already ended due to insufficient credits
          if (data.endReason === 'insufficient_credits') {
            handleCallEnd({
              callSessionId: data._id,
              endReason: 'insufficient_credits',
              endedBy: 'system',
              creditsUsed: data.creditsUsed || 0
            });
            return;
          }
          
          // If call is in progress, start timer polling and credit checking
          if (data.status === 'in-progress' || data.status === 'active') {
            setStatus('active');
            startTimerPolling();
            startCreditChecking();
            setupWalletWebSocket();
            
            if (data.participantTokens?.user && data.roomName && !twilioConnectedRef.current) {
              setTimeout(() => {
                connectToTwilioCall(data.participantTokens.user, data.psychicId?._id);
              }, 1000);
            }
          }
        }
      } else {
        response = await api.get('/api/calls/active');
        
        if (response.data.success && response.data.data) {
          const data = response.data.data;
          
          if (data.activeSession) {
            callSessionIdRef.current = data.activeSession._id;
            setStatus(data.activeSession.status || 'active');
            setTimer(data.elapsedSeconds || 0);
            setCreditsUsed(data.creditsUsed || 0);
            
            const balance = await fetchWalletBalance();
            if (balance !== null) {
              setCurrentCredits(balance);
              setInitialCredits(balance);
            }
            
            if (data.activeSession.ratePerMin) {
              ratePerMinRef.current = data.activeSession.ratePerMin;
            }
            
            if (data.activeSession.roomName) {
              setRoomName(data.activeSession.roomName);
            }
            
            if (data.activeSession.participantTokens?.user) {
              setTwilioToken(data.activeSession.participantTokens.user);
            }
            
            setCallData(prev => ({
              ...prev,
              psychic: data.activeSession.psychicId,
              callSessionId: data.activeSession._id,
              roomName: data.activeSession.roomName,
              ratePerMin: data.activeSession.ratePerMin || data.activeSession.psychicId?.ratePerMin || 1
            }));
            ratePerMinRef.current = data.activeSession.ratePerMin || data.activeSession.psychicId?.ratePerMin || 1;
            
            if (data.activeSession.status === 'in-progress' || data.activeSession.status === 'active') {
              setStatus('active');
              startTimerPolling();
              startCreditChecking();
              setupWalletWebSocket();
              
              if (data.activeSession.participantTokens?.user && data.activeSession.roomName && !twilioConnectedRef.current) {
                setTimeout(() => {
                  connectToTwilioCall(data.activeSession.participantTokens.user, data.activeSession.psychicId?._id);
                }, 1000);
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching call details:', error);
      setError(error.response?.data?.message || 'Failed to load call details');
      
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [api, navigate, callSessionId, startTimerPolling, startCreditChecking, setupWalletWebSocket, fetchWalletBalance, handleCallEnd]);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    const uid = userId || getUserIdFromToken();

    if (!uid || !token) {
      console.log('❌ Missing user credentials');
      return null;
    }

    console.log('🔌 Initializing socket connection', { uid, callSessionId: callSessionIdRef.current });

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    const socket = io(`${import.meta.env.VITE_BASE_URL}/audio-calls`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      query: { token, userId: uid, callSessionId: callSessionIdRef.current }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to audio call socket');
      setSocketConnected(true);
      reconnectAttemptsRef.current = 0;
      
      socket.emit('user-register', uid);
      
      if (roomName) {
        socket.emit('join-room', roomName);
        setHasJoinedRoom(true);
      } else if (callData.roomName) {
        socket.emit('join-room', callData.roomName);
        setHasJoinedRoom(true);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from audio call socket:', reason);
      setSocketConnected(false);
      setHasJoinedRoom(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      reconnectAttemptsRef.current++;
      
      if (reconnectAttemptsRef.current > 5) {
        toast.error('Connection issues. Trying to reconnect...');
      }
      
      if (error.message.includes('auth') || error.message.includes('token')) {
        const newToken = localStorage.getItem('accessToken');
        if (newToken && newToken !== token) {
          socket.auth = { token: newToken };
        }
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      setSocketConnected(true);
      
      socket.emit('user-register', uid);
      if (roomName) {
        socket.emit('join-room', roomName);
      }
    });

    socket.on('call-accepted', (data) => {
      console.log('✅ Call accepted by psychic:', data);

      if (!data.token || data.token.includes('dummy_token')) {
        console.error('❌ INVALID TOKEN RECEIVED:', data.token);
        toast.error('Invalid audio connection. Please try again.');
        return;
      }

      setStatus('accepted');
      setTwilioToken(data.token);
      setRoomName(data.roomName);
      setCallData(prev => ({
        ...prev,
        callSessionId: data.callSessionId,
        psychic: data.psychic,
        ratePerMin: data.ratePerMin || prev.ratePerMin || 1
      }));
      ratePerMinRef.current = data.ratePerMin || 1;
      callSessionIdRef.current = data.callSessionId;

      connectToTwilioCall(data.token, data.psychic?._id);
      toast.success(`Call accepted by ${data.psychic?.name}`);
    });

    socket.on('call-rejected', (data) => {
      console.log('❌ Call rejected:', data);
      handleCallEnd({
        callSessionId: callSessionIdRef.current,
        callRequestId: callRequestIdRef.current,
        endReason: 'rejected',
        endedBy: 'psychic',
        creditsUsed: 0
      });
    });

    socket.on('call-started', (data) => {
      console.log('🎉 Call started:', data);
      setStatus('active');
      syncTimerWithServer();
      startTimerPolling();
      startCreditChecking();
      setupWalletWebSocket();
      setIsAudioPlaying(true);
    });

    socket.on('timer-started', (data) => {
      console.log('⏱️ Timer started:', data);
      setStatus('active');
      syncTimerWithServer();
      startTimerPolling();
      startCreditChecking();
      setupWalletWebSocket();
    });

    socket.on('timer-sync', (data) => {
      console.log('⏱️ Timer sync event:', data);
      if (data.elapsedSeconds !== undefined) {
        setTimer(data.elapsedSeconds);
        setLastServerSync(Date.now());
      }
    });

    // Timer sync with credits
    socket.on('timerSync', (data) => {
      console.log('⏱️ Timer sync with credits:', data);
      if (data.callSessionId === callSessionIdRef.current) {
        if (data.elapsedSeconds !== undefined) {
          setTimer(data.elapsedSeconds);
        }
        if (data.creditsUsed !== undefined) {
          console.log(`💰 Credits used from timerSync: ${data.creditsUsed}`);
          setCreditsUsed(data.creditsUsed);
        }
        if (data.creditsRemaining !== undefined) {
          console.log(`💰 Credits remaining from timerSync: ${data.creditsRemaining}`);
          setCurrentCredits(data.creditsRemaining);
          
          // Check if credits are exhausted
          if (data.creditsRemaining <= 0 && !callEndedDueToCredits && !isEnding && !hasEnded) {
            console.log('💰 CREDITS EXHAUSTED from timerSync! Ending call.');
            setCallEndedDueToCredits(true);
            handleCallEnd({
              callSessionId: callSessionIdRef.current,
              endReason: 'insufficient_credits',
              endedBy: 'system',
              creditsUsed: data.creditsUsed || creditsUsed
            });
          }
        }
      }
    });

    socket.on('timer-stopped', (data) => {
      console.log('⏱️ TIMER STOPPED EVENT:', data);
      
      if (data.callSessionId === callSessionIdRef.current) {
        console.log('⏱️ Stopping timer polling by direct command');
        stopAllIntervals();
        
        if (data.finalTime !== undefined) {
          setTimer(data.finalTime);
        }
        
        if (data.status) {
          setStatus(data.status);
        }
      }
    });

    socket.on('credits-updated', (data) => {
      console.log('💰 Credits updated via socket:', data);
      setCreditsUsed(data.creditsUsed || 0);
      setCurrentCredits(data.currentCredits || 0);

      if (data.currentCredits <= 0 && !callEndedDueToCredits && !isEnding && !hasEnded) {
        console.log('💰⚠️ CREDITS ZERO from socket! Ending call.');
        setCallEndedDueToCredits(true);
        handleCallEnd({
          callSessionId: callSessionIdRef.current,
          endReason: 'insufficient_credits',
          endedBy: 'system',
          creditsUsed: data.creditsUsed || creditsUsed
        });
      } else if (data.currentCredits < ratePerMinRef.current && data.currentCredits > 0 && !lowCreditWarningShown) {
        toast.warning(`Low credits! Only ${data.currentCredits.toFixed(2)} credits remaining (less than 1 minute).`);
        setLowCreditWarningShown(true);
      }
    });

    socket.on('call-completed', (data) => {
      console.log('📞 Call completed:', data);
      
      const sessionMatches = data.callSessionId === callSessionIdRef.current || 
                            data.callRequestId === callRequestIdRef.current;
      
      if (sessionMatches) {
        handleCallEnd(data);
      }
    });

    socket.on('call-ended', (data) => {
      console.log('📞 Call ended:', data);
      
      const sessionMatches = data.callSessionId === callSessionIdRef.current || 
                            data.callRequestId === callRequestIdRef.current;
      
      if (sessionMatches) {
        handleCallEnd(data);
      }
    });

    socket.on('room-closed', (data) => {
      console.log('🚪 Room closed:', data);
      
      if (data.roomName === roomName || data.roomName === callData.roomName) {
        handleCallEnd({
          callSessionId: callSessionIdRef.current,
          endReason: 'room_closed',
          creditsUsed
        });
      }
    });

    return socket;
  }, [userId, roomName, callData.roomName, handleCallEnd, creditsUsed, getUserIdFromToken, stopAllIntervals, startTimerPolling, startCreditChecking, setupWalletWebSocket, lowCreditWarningShown, callEndedDueToCredits, isEnding, hasEnded]);

  // Sync timer with server
  const syncTimerWithServer = useCallback(async () => {
    if (!callSessionIdRef.current || status !== 'active' || hasEnded) return;
    
    try {
      setSyncStatus('syncing');
      
      const response = await api.get(`/api/calls/sync-timer/${callSessionIdRef.current}`);
      
      if (response.data.success) {
        const data = response.data.data;
        
        if (data.elapsedSeconds !== undefined) {
          setTimer(data.elapsedSeconds);
          setLastServerSync(Date.now());
          setSyncStatus('synced');
        }
        
        if (data.creditsUsed !== undefined) {
          setCreditsUsed(data.creditsUsed);
        }
        
        if (data.currentCredits !== undefined) {
          setCurrentCredits(data.currentCredits);
          
          if (data.currentCredits <= 0 && !callEndedDueToCredits && !isEnding && !hasEnded) {
            console.log('💰⚠️ CREDITS ZERO from sync! Ending call.');
            setCallEndedDueToCredits(true);
            handleCallEnd({
              callSessionId: callSessionIdRef.current,
              endReason: 'insufficient_credits',
              endedBy: 'system',
              creditsUsed: data.creditsUsed || creditsUsed
            });
          }
        }
      }
    } catch (error) {
      console.error('Error syncing timer:', error);
      setSyncStatus('error');
      
      if (error.response?.status === 404) {
        handleCallEnd({
          callSessionId: callSessionIdRef.current,
          endReason: 'call_ended',
          creditsUsed
        });
      }
    }
  }, [api, status, creditsUsed, handleCallEnd, hasEnded, callEndedDueToCredits, isEnding]);

  // Connect to Twilio call
  const connectToTwilioCall = async (token, psychicId) => {
    if (!token || !psychicId) {
      toast.error('Missing connection details');
      return;
    }
    
    if (twilioConnectedRef.current) {
      console.log('Already connected to Twilio');
      return;
    }
    
    setIsConnecting(true);

    try {
      console.log('🎯 User connecting to audio room...');
      
      const targetRoomName = roomName || callData.roomName;

      if (!targetRoomName) {
        throw new Error('Room name not found');
      }

      await twilioService.initialize();
      await twilioService.joinRoom(token, targetRoomName);
      
      twilioConnectedRef.current = true;

      setupAudioPermissionHandler();

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('call-started', {
          callSessionId: callSessionIdRef.current,
          roomName: targetRoomName
        });
      }

      setIsConnecting(false);
      setStatus('active');
      
      await syncTimerWithServer();
      startTimerPolling();
      startCreditChecking();
      setupWalletWebSocket();

    } catch (error) {
      console.error('❌ Error connecting to Twilio:', error);
      
      let errorMessage = 'Failed to connect to audio call';
      if (error.code === 20101) errorMessage = 'Invalid access token';
      else if (error.code === 53113) errorMessage = 'Room not found';
      else if (error.code === 53405) errorMessage = 'Room is full';
      
      toast.error(errorMessage);
      setIsConnecting(false);
      setStatus('failed');
      twilioConnectedRef.current = false;
    }
  };

  // Set up audio permission handler
  const setupAudioPermissionHandler = () => {
    removeAudioPermissionHandler();

    audioPermissionRef.current = async () => {
      console.log('🎧 Audio permission click handler triggered');
      
      try {
        const audioElements = document.querySelectorAll('audio');
        let playedAny = false;
        
        for (const audio of audioElements) {
          if (audio.paused) {
            try {
              await audio.play();
              playedAny = true;
              console.log('✅ Played audio element');
            } catch (playError) {
              console.log('⚠️ Could not play audio:', playError);
            }
          }
        }
        
        if (playedAny) {
          setIsAudioPlaying(true);
          removeAudioPermissionHandler();
          toast.success('Audio enabled!');
        }
      } catch (error) {
        console.error('Error in audio handler:', error);
      }
    };

    document.addEventListener('click', audioPermissionRef.current);

    setTimeout(() => {
      if (!isAudioPlaying && status === 'active') {
        toast.info('Click anywhere on the page to enable audio');
      }
    }, 2000);
  };

  // Cancel call
  const cancelCall = async () => {
    if (!callData.callRequestId) {
      toast.error('Call request ID not found');
      return;
    }
    
    try {
      await api.post(`/api/calls/cancel/${callData.callRequestId}`, {});

      if (socketRef.current) {
        socketRef.current.emit('cancel-call', {
          callRequestId: callData.callRequestId
        });
      }

      handleCallEnd({
        callSessionId: callSessionIdRef.current,
        callRequestId: callRequestIdRef.current,
        endReason: 'cancelled',
        endedBy: 'user',
        creditsUsed: 0
      });

    } catch (error) {
      console.error('Error cancelling call:', error);
      toast.error('Failed to cancel call');
    }
  };

  // End call
  const endCall = async () => {
    const sessionId = callSessionIdRef.current;
    if (!sessionId) {
      toast.error('Call session ID not found');
      return;
    }

    if (isEnding || hasEnded) {
      console.log('⚠️ Call already ending, skipping endCall');
      return;
    }

    try {
      console.log('🛑 User ending call:', sessionId);
      
      stopAllIntervals();
      
      if (walletSocketRef.current) {
        walletSocketRef.current.disconnect();
        walletSocketRef.current = null;
      }
      
      try {
        twilioService.endCall();
        twilioService.cleanup();
      } catch (twilioError) {
        console.error('Error cleaning up Twilio:', twilioError);
      }
      twilioConnectedRef.current = false;
      
      const finalTimer = timer;
      const ratePerMin = ratePerMinRef.current || callData.psychic?.ratePerMin || 1;
      const creditsUsedValue = Math.ceil(finalTimer / 60) * ratePerMin;
      
      console.log(`📊 Call stats before ending: duration=${finalTimer}s, credits=${creditsUsedValue}`);
      
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('call-ended', {
          callSessionId: sessionId,
          endReason: 'ended_by_user',
          duration: finalTimer,
          creditsUsed: creditsUsedValue
        });
      }
      
      try {
        const apiResponse = await api.post(`/api/calls/end/${sessionId}`, { 
          endReason: 'ended_by_user' 
        });
        
        console.log('✅ Backend call end response:', apiResponse.data);
        
        if (apiResponse.data.success) {
          const backendData = apiResponse.data.data;
          
          handleCallEnd({
            callSessionId: sessionId,
            endReason: 'ended_by_user',
            endedBy: 'user',
            creditsUsed: backendData.creditsUsed || creditsUsedValue,
            duration: backendData.duration || finalTimer
          });
          
          toast.success('Call ended successfully');
        } else {
          throw new Error('Backend returned success: false');
        }
      } catch (apiError) {
        console.error('API end call error:', apiError);
        
        toast.error('Call ended, but there was an error syncing with server');
        
        handleCallEnd({
          callSessionId: sessionId,
          endReason: 'ended_by_user',
          endedBy: 'user',
          creditsUsed: creditsUsedValue,
          localOnly: true
        });
      }
      
    } catch (error) {
      console.error('❌ Error ending call:', error);
      toast.error('Failed to end call');
      
      handleCallEnd({
        callSessionId: sessionId,
        endReason: 'ended_by_user',
        endedBy: 'user',
        creditsUsed: timer / 60 * (ratePerMinRef.current || 1)
      });
    }
  };

  // Toggle mute
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (twilioService.toggleMute) {
      twilioService.toggleMute(newMutedState);
    }
    
    toast.info(newMutedState ? 'Muted' : 'Unmuted');
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format credits
  const formatCredits = (credits) => {
    return credits.toFixed(2);
  };

  // Countdown timer for pending calls
  useEffect(() => {
    if (timeLeft > 0 && (status === 'initiated' || status === 'ringing' || status === 'accepted')) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      
      countdownRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            handleCallEnd({
              callSessionId: callSessionIdRef.current,
              callRequestId: callRequestIdRef.current,
              endReason: 'expired',
              creditsUsed: 0
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [timeLeft, status, handleCallEnd]);

  // Status verification
  useEffect(() => {
    if (callSessionIdRef.current && status === 'active' && !hasEnded) {
      verifyIntervalRef.current = setInterval(verifyCallStatus, 5000);
      
      return () => {
        if (verifyIntervalRef.current) {
          clearInterval(verifyIntervalRef.current);
        }
      };
    }
  }, [status, verifyCallStatus, hasEnded]);

  // Timer effect to check credits based on elapsed time
  useEffect(() => {
    if (status === 'active' && !hasEnded && !isEnding && currentCredits > 0) {
      const checkInterval = setInterval(() => {
        checkAndEndCallIfCreditsExhausted();
      }, 1000);
      
      return () => clearInterval(checkInterval);
    }
  }, [status, currentCredits, timer, hasEnded, isEnding, checkAndEndCallIfCreditsExhausted]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      if (initializedRef.current) return;
      
      console.log('🎯 Component mounted/refreshed with params:', { callSessionId, callRequestId: callData.callRequestId });
      
      const uid = getUserIdFromToken();
      setUserId(uid);
      
      if (!uid) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }
      
      await fetchCallDetails();
      initializeSocket();
      
      initializedRef.current = true;
    };
    
    init();
    
    return () => {
      console.log('🧹 Cleaning up component');
      stopAllIntervals();
      cleanupTwilio();
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
      if (walletSocketRef.current) {
        walletSocketRef.current.disconnect();
      }
      initializedRef.current = false;
      twilioConnectedRef.current = false;
    };
  }, []);

  // Effect to handle room name changes
  useEffect(() => {
    if (socketRef.current && socketConnected && roomName && !hasJoinedRoom && !hasEnded) {
      console.log(`📡 Joining socket room: ${roomName}`);
      socketRef.current.emit('join-room', roomName);
      setHasJoinedRoom(true);
    }
  }, [roomName, socketConnected, hasJoinedRoom, hasEnded]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: colors.deepPurple }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" 
            style={{ backgroundColor: colors.antiqueGold + '20' }}>
            <RefreshCw className="h-10 w-10 animate-spin" style={{ color: colors.antiqueGold }} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Loading Call Details...</h2>
          <p className="text-white/70">Please wait while we connect you to the call</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: colors.deepPurple }}>
        <Card className="p-8 max-w-md w-full bg-white/5 backdrop-blur-sm border-white/10">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Unable to Load Call</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <Button
              onClick={() => navigate('/')}
              className="w-full"
              style={{ backgroundColor: colors.antiqueGold, color: colors.deepPurple }}
            >
              Return to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.deepPurple }}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-white hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </Button>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Audio Call</h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge className={statusColors[status] + ' text-white'}>
                  {status.toUpperCase()}
                </Badge>
                {status === 'active' && (
                  <Badge className="bg-green-500 text-white animate-pulse">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(timer)}
                  </Badge>
                )}
                <div className="flex items-center gap-1 ml-2">
                  <div className={`h-2 w-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`} title={socketConnected ? 'Socket Connected' : 'Socket Disconnected'} />
                  <div className={`h-2 w-2 rounded-full ${
                    syncStatus === 'synced' ? 'bg-green-500' : 
                    syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                  }`} title={syncStatus === 'synced' ? 'Timer Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Sync Error'} />
                </div>
              </div>
            </div>

            <div className="w-12"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column: Psychic Info */}
            <Card className="p-6" style={{
              backgroundColor: colors.darkPurple,
              borderColor: colors.antiqueGold + '40'
            }}>
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <img
                    src={callData.psychic?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(callData.psychic?.name || 'Psychic')}&background=${colors.antiqueGold.replace('#', '')}&color=${colors.deepPurple.replace('#', '')}`}
                    alt={callData.psychic?.name}
                    className="w-full h-full rounded-full object-cover border-4"
                    style={{ borderColor: colors.antiqueGold }}
                  />
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.antiqueGold }}>
                    <User className="h-6 w-6" style={{ color: colors.deepPurple }} />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-2">
                  {callData.psychic?.name || 'Psychic'}
                </h2>
                <p className="text-gray-300 mb-1">{callData.psychic?.specialization || 'Psychic Reader'}</p>

                <div className="flex items-center justify-center gap-1 mb-4">
                  {Array(5).fill(0).map((_, i) => (
                    <div
                      key={i}
                      className="h-4 w-4"
                      style={{
                        color: i < (callData.psychic?.averageRating || 4.5) ? colors.antiqueGold : '#4B5563',
                      }}
                    >
                      ★
                    </div>
                  ))}
                  <span className="text-gray-300 ml-2">
                    {(callData.psychic?.averageRating || 4.5).toFixed(1)}
                  </span>
                </div>

                <div className="space-y-3 mt-6">
                 

                

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Current credits:</span>
                    <span className={`font-bold ${currentCredits <= 0 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                      {formatCredits(currentCredits)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Minutes remaining:</span>
                    <span className={`font-bold ${currentCredits <= (ratePerMinRef.current || 1) ? 'text-red-400' : 'text-white'}`}>
                      {Math.floor(currentCredits / (ratePerMinRef.current || 1))} min
                    </span>
                  </div>

                  {currentCredits <= 0 && status === 'active' && (
                    <div className="mt-4 p-3 rounded bg-red-500/20 border border-red-500 animate-pulse">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <span className="text-red-300 font-bold">⚠️ No credits remaining! Call ending...</span>
                      </div>
                    </div>
                  )}

                  {currentCredits > 0 && currentCredits < (ratePerMinRef.current || 1) && status === 'active' && (
                    <div className="mt-4 p-3 rounded" style={{ backgroundColor: colors.antiqueGold + '20', border: `1px solid ${colors.antiqueGold}` }}>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4" style={{ color: colors.antiqueGold }} />
                        <span className="text-gray-200">⚠️ Less than 1 minute remaining! Add credits to continue.</span>
                      </div>
                    </div>
                  )}

                  {isFreeSession && (
                    <div className="mt-4 p-3 rounded" style={{ backgroundColor: colors.antiqueGold + '20' }}>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4" style={{ color: colors.antiqueGold }} />
                        <span className="text-gray-200">Your first minute is free!</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Center Column: Call Interface */}
            <div className="md:col-span-2 space-y-8">
              {/* Status Card */}
              <Card className="p-6" style={{
                backgroundColor: colors.darkPurple,
                borderColor: colors.antiqueGold + '40'
              }}>
                <div className="text-center space-y-4">
                  {/* Status Icon */}
                  <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <div className={`absolute inset-0 rounded-full ${statusColors[status]} opacity-20 animate-pulse`}></div>
                    <div className="relative z-10">
                      {status === 'active' ? (
                        <div className="w-16 h-16 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: colors.antiqueGold }}>
                          <Volume2 className="h-8 w-8" style={{ color: colors.deepPurple }} />
                        </div>
                      ) : status === 'accepted' || status === 'ringing' ? (
                        <div className="w-16 h-16 rounded-full flex items-center justify-center animate-spin"
                          style={{
                            borderTop: `4px solid ${colors.antiqueGold}`,
                            borderRight: `4px solid transparent`
                          }}>
                          <Phone className="h-8 w-8" style={{ color: colors.antiqueGold }} />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: colors.antiqueGold + '20',
                            border: `2px solid ${colors.antiqueGold}`
                          }}>
                          <Phone className="h-8 w-8" style={{ color: colors.antiqueGold }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Message */}
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {status === 'loading' ? 'Loading...' : 
                       status === 'initiated' ? 'Call initiated. Waiting for psychic...' :
                       status === 'ringing' ? 'Ringing psychic...' :
                       status === 'accepted' ? 'Psychic accepted! Connecting...' :
                       status === 'active' ? 'Call in progress' :
                       status === 'rejected' ? 'Call rejected by psychic' :
                       status === 'cancelled' ? 'Call cancelled' :
                       status === 'completed' ? 'Call completed' :
                       status === 'failed' ? 'Call failed' :
                       status === 'expired' ? 'Call request expired' :
                       'Connecting...'}
                    </h3>

                    {/* Timer Display */}
                    {status === 'active' && (
                      <div className="text-4xl font-bold text-white my-4 font-mono">
                        {formatTime(timer)}
                      </div>
                    )}

                    {/* Countdown Display */}
                    {(status === 'initiated' || status === 'ringing' || status === 'accepted') && timeLeft > 0 && (
                      <div className="my-4">
                        <div className="text-sm text-gray-300 mb-2">
                          Psychic has {timeLeft} seconds to respond
                        </div>
                        <Progress
                          value={(30 - timeLeft) * (100/30)}
                          className="h-2"
                          style={{ backgroundColor: colors.antiqueGold + '40' }}
                        />
                      </div>
                    )}

                    {/* Credits Display */}
                    {status === 'active' && (
                      <div className="text-sm text-gray-300">
                       
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    {status === 'initiated' || status === 'ringing' ? (
                      <Button
                        onClick={cancelCall}
                        className="rounded-full px-8 py-6 text-lg font-semibold"
                        style={{ backgroundColor: '#ef4444', color: 'white' }}
                        disabled={isConnecting || isEnding}
                      >
                        <PhoneOff className="mr-2 h-5 w-5" />
                        Cancel Call
                      </Button>
                    ) : status === 'accepted' || status === 'active' ? (
                      <Button
                        onClick={endCall}
                        className="rounded-full px-8 py-6 text-lg font-semibold"
                        style={{ backgroundColor: '#ef4444', color: 'white' }}
                        disabled={isConnecting || isEnding}
                      >
                        <PhoneOff className="mr-2 h-5 w-5" />
                        End Call
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate('/')}
                        className="rounded-full px-8 py-6 text-lg font-semibold"
                        style={{ backgroundColor: colors.deepPurple, color: colors.softIvory }}
                      >
                        <X className="mr-2 h-5 w-5" />
                        Back to Home
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Control Buttons */}
              {status === 'active' && (
                <Card className="p-6" style={{
                  backgroundColor: colors.darkPurple,
                  borderColor: colors.antiqueGold + '40'
                }}>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      onClick={toggleMute}
                      className="rounded-full p-4"
                      variant={isMuted ? "destructive" : "outline"}
                      style={{
                        borderColor: isMuted ? '#ef4444' : colors.antiqueGold,
                        color: isMuted ? 'white' : colors.antiqueGold
                      }}
                    >
                      {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </Button>

                    <Button
                      onClick={() => setIsVideoOn(!isVideoOn)}
                      className="rounded-full p-4"
                      variant={isVideoOn ? "default" : "outline"}
                      disabled
                      style={{
                        borderColor: colors.antiqueGold,
                        color: colors.antiqueGold,
                        opacity: 0.5
                      }}
                    >
                      {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                    </Button>

                    <Button
                      onClick={() => navigate(`/message/${callData.psychic?._id}`)}
                      className="rounded-full p-4"
                      variant="outline"
                      style={{
                        borderColor: colors.antiqueGold,
                        color: colors.antiqueGold
                      }}
                    >
                      <MessageCircle className="h-6 w-6" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-2 text-center text-xs text-gray-400">
                    <div>{isMuted ? 'Unmute' : 'Mute'}</div>
                    <div>Video {isVideoOn ? 'Off' : 'On'}</div>
                    <div>Switch to Chat</div>
                  </div>

                  {/* Audio permission notice */}
                  {!isAudioPlaying && (
                    <div className="mt-4 p-3 rounded-lg animate-pulse"
                      style={{ backgroundColor: colors.antiqueGold + '20', border: `1px solid ${colors.antiqueGold}` }}>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4" style={{ color: colors.antiqueGold }} />
                        <span className="text-gray-200">Click anywhere to enable audio</span>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioCallPage;