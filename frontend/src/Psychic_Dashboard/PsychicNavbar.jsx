// components/PsychicNavbar.jsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Bell, Menu, User, Home, ExternalLink, Phone, MessageSquare, Volume2, VolumeX
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import io from 'socket.io-client';
import { usePsychicAuth } from "@/context/PsychicAuthContext";

// Import sound files
import incomingCallSound from '../assets/new_chat_request.mp3';
import newChatSound from '../assets/new_chat_request.mp3'; // Using same sound for chat

const PsychicNavbar = ({ side, setSide }) => {
  const { psychic } = usePsychicAuth();
  const navigate = useNavigate();

  // State for pending requests counts
  const [pendingRequests, setPendingRequests] = useState({
    calls: 0,
    chats: 0
  });

  // State for active notifications and sound
  const [activeNotifications, setActiveNotifications] = useState({
    calls: new Set(),
    chats: new Set()
  });
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [showSoundControl, setShowSoundControl] = useState(false);

  // Refs for audio and socket
  const callAudioRef = useRef(null);      // For incoming_call.mp3
  const chatAudioRef = useRef(null);      // For new_chat_request.mp3
  const callSocketRef = useRef(null);
  const chatSocketRef = useRef(null);
  const notificationToastRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  
  // Ringing intervals refs
  const callRingIntervalRef = useRef(null);
  const chatRingIntervalRef = useRef(null);

  // Color scheme
  const colors = {
    primary: "#2B1B3F",      // Deep purple
    secondary: "#C9A24D",    // Antique gold
    textLight: "#E8D9B0",    // Light gold text
    danger: "#EF4444",       // Red
  };

  const API_BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5001';
  const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://www.spiritueelchatten.nl';

  // Initialize audio for notifications with imported sounds
  useEffect(() => {
    // Call ringtone
    callAudioRef.current = new Audio(incomingCallSound);
    callAudioRef.current.volume = 0.7;
    callAudioRef.current.loop = false; // We'll handle looping manually
    
    // Chat ringtone - using same imported sound
    chatAudioRef.current = new Audio(newChatSound);
    chatAudioRef.current.volume = 0.7;
    chatAudioRef.current.loop = false; // We'll handle looping manually
    
    return () => {
      if (callAudioRef.current) {
        callAudioRef.current.pause();
        callAudioRef.current = null;
      }
      if (chatAudioRef.current) {
        chatAudioRef.current.pause();
        chatAudioRef.current = null;
      }
      if (callRingIntervalRef.current) {
        clearInterval(callRingIntervalRef.current);
        callRingIntervalRef.current = null;
      }
      if (chatRingIntervalRef.current) {
        clearInterval(chatRingIntervalRef.current);
        chatRingIntervalRef.current = null;
      }
    };
  }, []);

  // Function to start continuous ringing for calls
  const startCallRinging = (callId) => {
    if (isSoundMuted) return;
    
    // Add to active notifications
    setActiveNotifications(prev => ({
      ...prev,
      calls: new Set([...prev.calls, callId])
    }));
    
    // Clear any existing call ring interval
    if (callRingIntervalRef.current) {
      clearInterval(callRingIntervalRef.current);
    }
    
    // Start new interval for continuous ringing
    callRingIntervalRef.current = setInterval(() => {
      if (callAudioRef.current && !isSoundMuted && activeNotifications.calls.size > 0) {
        callAudioRef.current.currentTime = 0;
        callAudioRef.current.play().catch(err => {
          console.log('⚠️ Could not play call sound:', err);
        });
      }
    }, 3000); // Ring every 3 seconds
    
    // Play immediately
    if (callAudioRef.current) {
      callAudioRef.current.play().catch(err => {
        console.log('⚠️ Could not play call sound:', err);
      });
    }
  };

  // Function to start continuous ringing for chats
  const startChatRinging = (chatId) => {
    if (isSoundMuted) return;
    
    // Add to active notifications
    setActiveNotifications(prev => ({
      ...prev,
      chats: new Set([...prev.chats, chatId])
    }));
    
    // Clear any existing chat ring interval
    if (chatRingIntervalRef.current) {
      clearInterval(chatRingIntervalRef.current);
    }
    
    // Start new interval for continuous ringing
    chatRingIntervalRef.current = setInterval(() => {
      if (chatAudioRef.current && !isSoundMuted && activeNotifications.chats.size > 0) {
        chatAudioRef.current.currentTime = 0;
        chatAudioRef.current.play().catch(err => {
          console.log('⚠️ Could not play chat sound:', err);
        });
      }
    }, 3000); // Ring every 3 seconds
    
    // Play immediately
    if (chatAudioRef.current) {
      chatAudioRef.current.play().catch(err => {
        console.log('⚠️ Could not play chat sound:', err);
      });
    }
  };

  // Function to stop ringing for a specific call
  const stopCallRinging = (callId) => {
    setActiveNotifications(prev => {
      const newCalls = new Set(prev.calls);
      newCalls.delete(callId);
      
      // If no more active calls, clear the interval
      if (newCalls.size === 0 && callRingIntervalRef.current) {
        clearInterval(callRingIntervalRef.current);
        callRingIntervalRef.current = null;
      }
      
      return { ...prev, calls: newCalls };
    });
  };

  // Function to stop ringing for a specific chat
  const stopChatRinging = (chatId) => {
    setActiveNotifications(prev => {
      const newChats = new Set(prev.chats);
      newChats.delete(chatId);
      
      // If no more active chats, clear the interval
      if (newChats.size === 0 && chatRingIntervalRef.current) {
        clearInterval(chatRingIntervalRef.current);
        chatRingIntervalRef.current = null;
      }
      
      return { ...prev, chats: newChats };
    });
  };

  // Toggle sound mute
  const toggleSound = () => {
    setIsSoundMuted(!isSoundMuted);
    
    if (!isSoundMuted) {
      // Muting - stop all ringing
      if (callRingIntervalRef.current) {
        clearInterval(callRingIntervalRef.current);
        callRingIntervalRef.current = null;
      }
      if (chatRingIntervalRef.current) {
        clearInterval(chatRingIntervalRef.current);
        chatRingIntervalRef.current = null;
      }
      if (callAudioRef.current) {
        callAudioRef.current.pause();
      }
      if (chatAudioRef.current) {
        chatAudioRef.current.pause();
      }
      toast.info('Son coupé');
    } else {
      // Unmuting - restart ringing for active notifications
      toast.info('Son activé');
      if (activeNotifications.calls.size > 0) {
        startCallRinging([...activeNotifications.calls][0]);
      }
      if (activeNotifications.chats.size > 0) {
        startChatRinging([...activeNotifications.chats][0]);
      }
    }
  };

  // Show notification toast
  const showNotification = (type, data) => {
    if (notificationToastRef.current) {
      toast.dismiss(notificationToastRef.current);
    }

    const notificationId = data._id || data.callRequestId || Date.now().toString();
    const userName = type === 'call' 
      ? data.user?.firstName || data.user?.username || data.caller?.name || 'Quelqu\'un'
      : data.user?.firstName || data.user?.username || 'Quelqu\'un';

    if (type === 'call') {
      notificationToastRef.current = toast.custom(
        (t) => (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-2xl p-4 w-80 border-2 border-yellow-400 relative">
            {activeNotifications.calls.has(notificationId) && !isSoundMuted && (
              <div className="absolute top-2 right-2">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">📞 Appel entrant !</h3>
                <p className="text-sm opacity-90">{userName} vous appelle</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  stopCallRinging(notificationId);
                  toast.dismiss(t);
                  navigate('/psychic/dashboard/call-history');
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                size="sm"
              >
                <Phone className="h-4 w-4 mr-2" />
                Voir
              </Button>
              <Button
                onClick={() => {
                  stopCallRinging(notificationId);
                  toast.dismiss(t);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                size="sm"
              >
                Ignorer
              </Button>
            </div>
          </div>
        ),
        { 
          duration: 30000, // Longer duration for continuous ringing
          position: 'top-right',
          onAutoClose: () => {
            stopCallRinging(notificationId);
          }
        }
      );
    } else {
      notificationToastRef.current = toast.custom(
        (t) => (
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg shadow-2xl p-4 w-80 border-2 border-yellow-400 relative">
            {activeNotifications.chats.has(notificationId) && !isSoundMuted && (
              <div className="absolute top-2 right-2">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center animate-bounce">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">💬 Nouvelle demande de chat !</h3>
                <p className="text-sm opacity-90">{userName} souhaite discuter</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  stopChatRinging(notificationId);
                  toast.dismiss(t);
                  navigate('/psychic/dashboard/chats');
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                size="sm"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Voir
              </Button>
              <Button
                onClick={() => {
                  stopChatRinging(notificationId);
                  toast.dismiss(t);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                size="sm"
              >
                Ignorer
              </Button>
            </div>
          </div>
        ),
        { 
          duration: 30000,
          position: 'top-right',
          onAutoClose: () => {
            stopChatRinging(notificationId);
          }
        }
      );
    }
  };

  // Initialize Socket.IO connections
  useEffect(() => {
    if (!psychic?._id) return;

    console.log('🔌 Initializing Socket.IO connections for navbar...');
    const token = localStorage.getItem('psychicToken');

    if (!token) {
      console.error('No token found');
      return;
    }

    // Clear any existing reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    // ===== CALL SOCKET CONNECTION =====
    const connectCallSocket = () => {
      if (callSocketRef.current) {
        callSocketRef.current.disconnect();
      }

      console.log('📞 Connecting to audio-calls namespace...');
      callSocketRef.current = io(`${API_BASE}/audio-calls`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true
      });

      // Call socket event handlers
      callSocketRef.current.on('connect', () => {
        console.log('✅ Navbar connected to audio-calls namespace');
        callSocketRef.current.emit('psychic-register', psychic._id);
      });

      callSocketRef.current.on('connect_error', (error) => {
        console.error('❌ Call socket connection error:', error.message);
      });

      callSocketRef.current.on('disconnect', (reason) => {
        console.log('📞 Call socket disconnected:', reason);
        if (reason === 'io server disconnect' || reason === 'transport close') {
          reconnectTimerRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect call socket...');
            connectCallSocket();
          }, 3000);
        }
      });

      // Registration success
      callSocketRef.current.on('registration-success', (data) => {
        console.log('✅ Navbar psychic registered for calls:', data);
      });

      // NEW INCOMING CALL - with continuous ringing
      callSocketRef.current.on('incoming-call', (callData) => {
        console.log('📞 Navbar: NEW INCOMING CALL RECEIVED:', callData);
        
        const callId = callData._id || callData.callRequestId || Date.now().toString();
        
        // Start continuous ringing
        startCallRinging(callId);
        
        // Update pending calls count
        setPendingRequests(prev => ({ 
          ...prev, 
          calls: prev.calls + 1 
        }));
        
        // Show notification
        showNotification('call', { ...callData, _id: callId });
        
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification('Appel entrant !', {
            body: `${callData.user?.firstName || callData.user?.username || 'Client'} vous appelle`,
            icon: '/favicon.ico'
          });
        }
      });

      // New pending call added
      callSocketRef.current.on('new-pending-call', (callData) => {
        console.log('➕ Navbar: New pending call:', callData);
        
        const callId = callData._id || callData.callRequestId || Date.now().toString();
        
        startCallRinging(callId);
        
        setPendingRequests(prev => ({ 
          ...prev, 
          calls: prev.calls + 1 
        }));
        
        showNotification('call', { ...callData, _id: callId });
      });

      // Pending call removed
      callSocketRef.current.on('pending-call-removed', (data) => {
        console.log('➖ Navbar: Pending call removed:', data);
        
        const callId = data.callRequestId || data._id;
        if (callId) {
          stopCallRinging(callId);
        }
        
        setPendingRequests(prev => ({ 
          ...prev, 
          calls: Math.max(0, prev.calls - 1)
        }));
      });
    };

    // ===== CHAT SOCKET CONNECTION =====
    const connectChatSocket = () => {
      if (chatSocketRef.current) {
        chatSocketRef.current.disconnect();
      }

      console.log('💬 Connecting to main namespace for chats...');
      chatSocketRef.current = io(API_BASE, {
        auth: {
          token: token,
          userId: psychic._id,
          role: 'psychic',
          name: psychic.name
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      });

      chatSocketRef.current.on('connect', () => {
        console.log('✅ Navbar connected to main namespace');
        chatSocketRef.current.emit('join_room', `psychic_${psychic._id}`);
      });

      // NEW CHAT REQUEST - with continuous ringing
      chatSocketRef.current.on('new_chat_request', (data) => {
        console.log('💬 Navbar: New chat request:', data);
        
        const { chatRequest } = data;
        if (!chatRequest) return;
        
        const chatId = chatRequest._id || Date.now().toString();
        
        // Start continuous ringing
        startChatRinging(chatId);
        
        setPendingRequests(prev => ({ 
          ...prev, 
          chats: prev.chats + 1 
        }));
        
        showNotification('chat', { ...chatRequest, _id: chatId });
        
        if (Notification.permission === 'granted') {
          new Notification('Nouvelle demande de chat !', {
            body: `${chatRequest.user?.firstName || chatRequest.user?.username || 'Quelqu\'un'} souhaite discuter`,
            icon: '/favicon.ico'
          });
        }
      });

      // Request accepted by other psychic
      chatSocketRef.current.on('request_accepted_by_other', (data) => {
        console.log('➖ Chat request accepted by other:', data);
        
        const chatId = data.chatRequestId || data._id;
        if (chatId) {
          stopChatRinging(chatId);
        }
        
        setPendingRequests(prev => ({ 
          ...prev, 
          chats: Math.max(0, prev.chats - 1)
        }));
      });
    };

    // Start connections
    connectCallSocket();
    connectChatSocket();

    // Fetch initial counts via HTTP
    const fetchInitialCounts = async () => {
      try {
        // Fetch pending calls
        const callResponse = await axios.get(
          `${API_BASE}/api/calls/pending`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (callResponse.data.success) {
          const calls = callResponse.data.data || [];
          setPendingRequests(prev => ({ ...prev, calls: calls.length }));
          console.log(`📊 Initial pending calls: ${calls.length}`);
        }

        // Fetch pending chats
        const chatResponse = await axios.get(
          `${API_BASE}/api/chatrequest/psychic/pending-requests`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (chatResponse.data.success) {
          const chats = chatResponse.data.data || [];
          setPendingRequests(prev => ({ ...prev, chats: chats.length }));
          console.log(`📊 Initial pending chats: ${chats.length}`);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('Error fetching initial counts:', error);
        }
      }
    };

    fetchInitialCounts();

    // Set up periodic polling as backup (every 30 seconds)
    const pollInterval = setInterval(fetchInitialCounts, 30000);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up navbar sockets');
      if (callSocketRef.current) {
        callSocketRef.current.disconnect();
        callSocketRef.current = null;
      }
      if (chatSocketRef.current) {
        chatSocketRef.current.disconnect();
        chatSocketRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      clearInterval(pollInterval);
      if (notificationToastRef.current) {
        toast.dismiss(notificationToastRef.current);
      }
      if (callRingIntervalRef.current) {
        clearInterval(callRingIntervalRef.current);
        callRingIntervalRef.current = null;
      }
      if (chatRingIntervalRef.current) {
        clearInterval(chatRingIntervalRef.current);
        chatRingIntervalRef.current = null;
      }
    };
  }, [psychic?._id, API_BASE]);

  const handleVisitWebsite = () => {
    window.open(WEBSITE_URL, '_blank');
  };

  const placeholderImage = "/images/placeholder-avatar.jpg";
  const totalPending = pendingRequests.calls + pendingRequests.chats;

  return (
    <div className="h-[70px] border-b fixed top-0 left-0 right-0 z-[100] flex justify-between items-center lg:px-8 md:px-6 px-4"
      style={{ 
        backgroundColor: colors.primary,
        borderColor: colors.secondary + '30',
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary} 100%)`
      }}>
      
      {/* Logo + Menu Button */}
      <div className="logo flex items-center gap-2 md:gap-4">
        <div className='my-2 border p-2 min-[950px]:hidden inline-block rounded-md transition-all duration-200 hover:scale-105 hover:shadow-md'
          style={{ 
            backgroundColor: colors.secondary,
            borderColor: colors.secondary,
            color: colors.primary
          }}>
          <Menu onClick={() => setSide(!side)} className="h-5 w-5" />
        </div>
        
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200"
          style={{ 
            borderColor: colors.secondary,
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary} 100%)`,
          }}
          title="Hecatevoyance"
        >
          <span className="text-sm font-bold uppercase" style={{ color: colors.textLight }}>
            H
          </span>
        </div>
      </div>

      {/* Center Section - Visit Website Button */}
      <div className="flex-1 flex justify-center items-center mx-4 hidden md:flex">
        <Button
          size="sm"
          onClick={handleVisitWebsite}
          className="flex items-center gap-3 px-6 py-2 rounded-full font-bold transition-all duration-300 hover:scale-[1.05] hover:shadow-lg"
          style={{
            backgroundColor: colors.secondary,
            color: colors.primary
          }}
        >
          <Home className="h-4 w-4" />
          Visiter le site principal
          <ExternalLink className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center gap-4 relative">
        {/* Sound Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSound}
          onMouseEnter={() => setShowSoundControl(true)}
          onMouseLeave={() => setShowSoundControl(false)}
          className="relative transition-all duration-200 hover:scale-110"
          title={isSoundMuted ? "Activer le son" : "Couper le son"}
          style={{ color: colors.textLight }}
        >
          {isSoundMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          {showSoundControl && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {isSoundMuted ? 'Activer' : 'Couper'}
            </div>
          )}
        </Button>

        {/* Mobile Visit Website Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleVisitWebsite}
          className="md:hidden transition-all duration-200 hover:scale-110"
          title="Visiter le site"
          style={{ color: colors.textLight }}
        >
          <Home className="h-5 w-5" />
        </Button>

        {/* Notifications Bell with Counts */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full transition-all duration-200 hover:scale-110"
            style={{ color: colors.textLight }}
            onClick={() => {
              if (pendingRequests.calls > 0 && pendingRequests.chats > 0) {
                toast.custom(
                  (t) => (
                    <div className="bg-white rounded-lg shadow-2xl p-4 w-64 border border-gray-200">
                      <h3 className="font-bold text-gray-800 mb-3">Demandes en attente</h3>
                      <div className="space-y-2">
                        <Button
                          onClick={() => {
                            toast.dismiss(t);
                            navigate('/psychic/dashboard/call-history');
                          }}
                          className="w-full justify-start bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Voir les appels ({pendingRequests.calls})
                        </Button>
                        <Button
                          onClick={() => {
                            toast.dismiss(t);
                            navigate('/psychic/dashboard/chats');
                          }}
                          className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Voir les chats ({pendingRequests.chats})
                        </Button>
                      </div>
                    </div>
                  ),
                  { duration: 5000, position: 'top-right' }
                );
              } else if (pendingRequests.calls > 0) {
                navigate('/psychic/dashboard/call-history');
              } else if (pendingRequests.chats > 0) {
                navigate('/psychic/dashboard/chats');
              }
            }}
          >
            <Bell className="h-5 w-5" />
            {totalPending > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold animate-pulse"
                style={{ 
                  backgroundColor: colors.danger,
                  color: 'white'
                }}>
                {totalPending > 9 ? '9+' : totalPending}
              </span>
            )}
          </Button>
        </div>

        {/* Simple Avatar - No Dropdown Menu */}
        <div className="relative">
          <Avatar className="w-12 h-12 border-2 cursor-pointer"
            style={{ borderColor: colors.secondary }}>
            <AvatarImage src={psychic?.image || placeholderImage} alt="avatar médium" />
            <AvatarFallback className="text-lg font-bold"
              style={{ 
                backgroundColor: colors.secondary,
                color: colors.primary
              }}>
              {psychic?.name?.[0] || <User className="w-6 h-6" />}
            </AvatarFallback>
          </Avatar>
          {totalPending > 0 && (
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white animate-pulse"></div>
          )}
        </div>

        {/* Connection status indicators */}
        <div className="absolute top-0 right-0 flex gap-1 -mt-1 -mr-1">
          {callSocketRef.current?.connected ? (
            <div className="h-2 w-2 rounded-full bg-green-500" title="Socket appel connecté"></div>
          ) : (
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Reconnexion socket appel..."></div>
          )}
          {chatSocketRef.current?.connected ? (
            <div className="h-2 w-2 rounded-full bg-blue-500" title="Socket chat connecté"></div>
          ) : (
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" title="Reconnexion socket chat..."></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PsychicNavbar;