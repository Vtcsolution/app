// PsychicPaidTimer.jsx - SIMPLIFIED VERSION

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  DollarSign, 
  Pause, 
  Play, 
  StopCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import { usePsychicAuth } from "@/context/PsychicAuthContext";
import io from "socket.io-client";

const PsychicPaidTimer = ({ chatRequestId, user, psychic, onSessionEnd }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const socketRef = useRef(null);

  // API instance
  const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('psychicToken')}`
    }
  });

  // Fetch session data on mount
  useEffect(() => {
    if (chatRequestId) {
      fetchSessionData();
    }
  }, [chatRequestId]);

  // Initialize socket for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('psychicToken');
    if (!token || !chatRequestId) return;

    socketRef.current = io(import.meta.env.VITE_BASE_URL || 'http://localhost:5001', {
      auth: {
        token,
        userId: psychic._id,
        role: 'psychic'
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Timer socket connected for:', chatRequestId);
      socketRef.current.emit('join_room', `psychic_${psychic._id}`);
      socketRef.current.emit('join_room', `timer_${chatRequestId}`);
    });

    // CRITICAL: Listen for real-time timer updates
    socketRef.current.on('timer_tick', (data) => {
      console.log('⏰ Real-time timer tick:', data);
      if (data.requestId === chatRequestId) {
        setRemainingSeconds(data.remainingSeconds);
        
        // Update session data
        setSessionData(prev => ({
          ...prev,
          paidSession: {
            ...prev?.paidSession,
            remainingSeconds: data.remainingSeconds
          }
        }));
      }
    });

    // Listen for session started
    socketRef.current.on('session_started', (data) => {
      console.log('🚀 Session started via socket:', data);
      if (data.chatRequest?._id === chatRequestId) {
        fetchSessionData(); // Refresh session data
        toast.success('Session payante démarrée !');
      }
    });

    // Listen for session ended
    socketRef.current.on('session_ended', (data) => {
      if (data.requestId === chatRequestId) {
        setRemainingSeconds(0);
        setIsPaused(false);
        toast({
          title: "Session Terminée",
          description: "La session payante est terminée",
          variant: "default"
        });
        if (onSessionEnd) {
          onSessionEnd(data);
        }
      }
    });

    // Listen for timer paused
    socketRef.current.on('timer_paused', (data) => {
      if (data.requestId === chatRequestId) {
        setIsPaused(true);
        toast({
          title: "Session en Pause",
          description: `Mise en pause par ${data.pausedBy}`,
          variant: "default"
        });
      }
    });

    // Listen for timer resumed
    socketRef.current.on('timer_resumed', (data) => {
      if (data.requestId === chatRequestId) {
        setIsPaused(false);
        toast({
          title: "Session Reprise",
          description: `Reprise par ${data.resumedBy}`,
          variant: "default"
        });
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [chatRequestId, psychic._id]);

  // Fetch session data from backend
  const fetchSessionData = async () => {
    try {
      console.log('📞 Fetching session data for:', chatRequestId);
      const response = await api.get(`/api/chatrequest/session/${chatRequestId}`);
      
      console.log('📊 Session data response:', response.data);
      
      if (response.data.success) {
        const data = response.data.data;
        setSessionData(data);
        
        // Set initial remaining seconds
        const remaining = data.paidSession?.remainingSeconds || 
                         (data.totalMinutesAllowed * 60) || 0;
        setRemainingSeconds(remaining);
        
        // Set pause state
        setIsPaused(data.paidSession?.isPaused || false);
        
        console.log('✅ Session data loaded:', {
          remainingSeconds: remaining,
          isPaused: data.paidSession?.isPaused,
          isActive: data.paidSession?.isActive
        });
      }
    } catch (error) {
      console.error('❌ Error fetching session data:', error.response?.data || error.message);
      toast.error("Échec du chargement des données de session");
    }
  };

  const handlePause = async () => {
    if (!chatRequestId) return;
    
    setIsLoading(true);
    try {
      const response = await api.post('/api/chatrequest/pause-timer-psychic', {
        requestId: chatRequestId
      });

      if (response.data.success) {
        setIsPaused(true);
        toast({
          title: "Session en Pause",
          description: "Le chronomètre a été mis en pause",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error pausing timer:', error);
      toast({
        title: "Erreur",
        description: "Échec de la mise en pause de la session",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    if (!chatRequestId) return;
    
    setIsLoading(true);
    try {
      const response = await api.post('/api/chatrequest/resume-timer-psychic', {
        requestId: chatRequestId
      });

      if (response.data.success) {
        setIsPaused(false);
        toast({
          title: "Session Reprise",
          description: "Le chronomètre a été repris",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error resuming timer:', error);
      toast({
        title: "Erreur",
        description: "Échec de la reprise de la session",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (!chatRequestId) return;
    
    setIsLoading(true);
    try {
      const response = await api.post('/api/chatrequest/stop-timer-psychic', {
        requestId: chatRequestId
      });

      if (response.data.success) {
        toast({
          title: "Session Terminée",
          description: "La session de chat a été terminée",
          variant: "default"
        });
        
        if (onSessionEnd) {
          onSessionEnd(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast({
        title: "Erreur",
        description: "Échec de la fin de session",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!sessionData?.totalMinutesAllowed) return 0;
    const totalSeconds = sessionData.totalMinutesAllowed * 60;
    return ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  };

  if (!sessionData) {
    return (
      <div className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="text-center">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      {/* Session Info Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">Session Payante Active</span>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Zap className="h-3 w-3 mr-1" />
          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(sessionData.ratePerMin || 1)}/min
        </Badge>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-gray-800 mb-1">
          {formatTime(remainingSeconds)}
        </div>
        <div className="text-sm text-gray-500">
          {isPaused ? '⏸️ Session en Pause' : '⏱️ Temps Restant'}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <Progress value={calculateProgress()} className="h-2" />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0 min</span>
          <span>{sessionData.totalMinutesAllowed || 0} min</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isPaused ? (
          <Button
            onClick={handleResume}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Play className="mr-2 h-4 w-4" />
            Reprendre
          </Button>
        ) : (
          <Button
            onClick={handlePause}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </Button>
        )}
        
        <Button
          onClick={handleStop}
          disabled={isLoading}
          variant="outline"
          className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
        >
          <StopCircle className="mr-2 h-4 w-4" />
          Terminer
        </Button>
      </div>

      {/* Debug Info (remove in production) */}
      <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
        <div>ID Session: {chatRequestId?.substring(0, 8)}...</div>
        <div>Temps réel: {remainingSeconds}s restant</div>
        <div>Tarif: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(sessionData.ratePerMin)}/min</div>
      </div>
    </div>
  );
};

export default PsychicPaidTimer;