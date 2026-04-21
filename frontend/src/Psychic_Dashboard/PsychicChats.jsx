import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Search,
  MoreVertical,
  Sparkles,
  Shield,
  RefreshCw,
  Check,
  CheckCheck,
  Clock,
  Smile,
  AlertCircle,
  User,
  DollarSign,
  Play,
  Pause,
  StopCircle,
  Loader2,
  XCircle,
  CheckCircle,
  Calendar,
  Wallet,
  Timer,
  Users,
  Star,
  Zap,
  CreditCard,
  Bell,
  BellOff,
  Phone,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  AlertTriangle,
  Ban,
  ShieldAlert,
  AlertOctagon,
  Eye,
  EyeOff,
  Mail,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePsychicAuth } from "../context/PsychicAuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import PsychicChatRequestModal from './ChatComponents/PsychicChatRequestModal';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

// ========== WARNING ALERT COMPONENT - FIXED ==========
// ========== WARNING ALERT COMPONENT - FIXED ==========
const WarningAlert = ({ warning, onAcknowledge, isOpen, onClose }) => {
  if (!isOpen) return null;

  const getWarningIcon = (type) => {
    switch(type) {
      case 'email': 
        return <Mail className="h-6 w-6" />;
      case 'phone': 
        return <Phone className="h-6 w-6" />;
      case 'link': 
        return <Globe className="h-6 w-6" />;
      default: 
        return <AlertTriangle className="h-6 w-6" />;
    }
  };

  const getWarningColor = (number) => {
    switch(number) {
      case 1: return 'yellow';
      case 2: return 'orange';
      case 3: return 'red';
      default: return 'yellow';
    }
  };

  const color = getWarningColor(warning.warningNumber);
  const IconComponent = getWarningIcon(warning.warningType); // This is now JSX, not a component

  // Define color classes statically to avoid Tailwind dynamic class issues
  const borderColorClass = 
    color === 'yellow' ? 'border-yellow-500' :
    color === 'orange' ? 'border-orange-500' :
    color === 'red' ? 'border-red-500' : 'border-yellow-500';
  
  const textColorClass = 
    color === 'yellow' ? 'text-yellow-600' :
    color === 'orange' ? 'text-orange-600' :
    color === 'red' ? 'text-red-600' : 'text-yellow-600';
  
  const bgColorClass = 
    color === 'yellow' ? 'bg-yellow-100' :
    color === 'orange' ? 'bg-orange-100' :
    color === 'red' ? 'bg-red-100' : 'bg-yellow-100';
  
  const alertBorderClass = 
    color === 'yellow' ? 'border-yellow-300' :
    color === 'orange' ? 'border-orange-300' :
    color === 'red' ? 'border-red-300' : 'border-yellow-300';
  
  const alertBgClass = 
    color === 'yellow' ? 'bg-yellow-50' :
    color === 'orange' ? 'bg-orange-50' :
    color === 'red' ? 'bg-red-50' : 'bg-yellow-50';
  
  const alertTitleClass = 
    color === 'yellow' ? 'text-yellow-800' :
    color === 'orange' ? 'text-orange-800' :
    color === 'red' ? 'text-red-800' : 'text-yellow-800';
  
  const alertDescClass = 
    color === 'yellow' ? 'text-yellow-700' :
    color === 'orange' ? 'text-orange-700' :
    color === 'red' ? 'text-red-700' : 'text-yellow-700';
  
  const buttonBgClass = 
    color === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700' :
    color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
    color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md ${borderColorClass} border-2`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-3 ${textColorClass}`}>
            <div className={`p-2 rounded-full ${bgColorClass}`}>
              {IconComponent} {/* This is now JSX, not a component */}
            </div>
            <span>⚠️ Warning #{warning.warningNumber}</span>
          </DialogTitle>
          <DialogDescription className="pt-4">
            <Alert variant="destructive" className={`${alertBorderClass} ${alertBgClass}`}>
              <AlertTriangle className={`h-4 w-4 ${textColorClass}`} />
              <AlertTitle className={`${alertTitleClass} font-bold`}>
                Do Not Share Personal Contact Information
              </AlertTitle>
              <AlertDescription className={`${alertDescClass} mt-2`}>
                {warning.message}
              </AlertDescription>
            </Alert>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Issued: {new Date(warning.timestamp).toLocaleString()}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ShieldAlert className="h-4 w-4" />
                <span>Violation: {warning.warningType}</span>
              </div>

              {warning.warningNumber === 2 && (
                <div className="p-3 bg-orange-100 border border-orange-300 rounded-lg">
                  <p className="text-sm text-orange-800 font-medium">
                    ⚠️ This is your second warning. One more violation will result in immediate account deactivation.
                  </p>
                </div>
              )}

              {warning.warningNumber === 3 && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    🔴 Your account has been deactivated due to multiple violations.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <Progress 
                value={((warning.warningNumber) / 3) * 100} 
                className={`h-2 ${warning.warningNumber === 3 ? 'bg-red-200' : 'bg-gray-200'}`}
              />
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Warning 1</span>
                <span>Warning 2</span>
                <span>Warning 3</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => {
              onAcknowledge(warning.warningId);
              onClose();
            }}
            className={`w-full ${buttonBgClass} text-white`}
          >
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ========== DEACTIVATION NOTICE COMPONENT ==========
const DeactivationNotice = ({ deactivatedAt, warningCount, onContactSupport }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full border-4 border-red-500 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <Ban className="h-12 w-12 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Deactivated</h2>
          
          <p className="text-gray-600 mb-6">
            Your account has been deactivated due to multiple violations of our terms of service regarding sharing personal contact information.
          </p>

          <div className="w-full bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Deactivated on:</span>
              <span className="font-medium">{new Date(deactivatedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total warnings:</span>
              <span className="font-medium text-red-600">{warningCount}/3</span>
            </div>
          </div>

          <div className="space-y-3 w-full">
            <Button
              onClick={onContactSupport}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Contact Support
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/psychic/login'}
            >
              Return to Login
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            If you believe this was a mistake, please contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

// ========== USER DEACTIVATED NOTICE FOR PSYCHIC ==========
const UserDeactivatedNotice = ({ userName, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full border-4 border-orange-500 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-full bg-orange-100 flex items-center justify-center mb-6">
            <Ban className="h-12 w-12 text-orange-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Deactivated</h2>
          
          <p className="text-gray-600 mb-6">
            {userName} has been deactivated due to multiple violations of our terms of service.
            Your chat session has been ended.
          </p>

          <div className="space-y-3 w-full">
            <Button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Continue to Chats
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== WARNING BADGE COMPONENT ==========
const WarningBadge = ({ count, isActive }) => {
  if (!count || count === 0) return null;

  const getColor = () => {
    if (!isActive) return 'bg-red-500';
    if (count === 1) return 'bg-yellow-500';
    if (count === 2) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="relative">
      <div className={`h-3 w-3 rounded-full ${getColor()} animate-pulse`} />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 text-xs font-bold text-white bg-red-600 rounded-full h-4 w-4 flex items-center justify-center">
          {count}
        </span>
      )}
    </div>
  );
};

// ========== BLOCKED MESSAGE INDICATOR ==========
const BlockedMessageIndicator = ({ message, isOwn }) => {
  return (
    <div className={cn(
      "px-4 py-3 rounded-lg max-w-full",
      isOwn 
        ? "bg-orange-100 border border-orange-300" 
        : "bg-gray-100 border border-gray-300"
    )}>
      <div className="flex items-start gap-2">
        <ShieldAlert className={cn(
          "h-4 w-4 flex-shrink-0 mt-0.5",
          isOwn ? "text-orange-600" : "text-gray-600"
        )} />
        <div className="flex-1">
          <p className={cn(
            "text-sm font-medium",
            isOwn ? "text-orange-800" : "text-gray-800"
          )}>
            {isOwn ? "Your Message Was Blocked" : "Message Blocked"}
          </p>
          <p className={cn(
            "text-xs mt-1",
            isOwn ? "text-orange-600" : "text-gray-600"
          )}>
            {message?.reason || 'Message contained prohibited content'}
          </p>
          {message?.warningNumber && (
            <Badge className={cn(
              "mt-2 text-white text-xs",
              isOwn ? "bg-orange-500" : "bg-gray-500"
            )}>
              Warning #{message.warningNumber}
            </Badge>
          )}
          {isOwn && message?.warningNumber === 3 && (
            <p className="text-xs text-red-600 mt-2 font-bold">
              ⚠️ Your account has been deactivated due to multiple violations.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ========== INCOMING CALL NOTIFICATION ==========
const IncomingCallNotification = ({ activeCall, callStatus, onAccept, onReject }) => {
  if (!activeCall || callStatus !== 'ringing') return null;
  
  const userName = activeCall.caller?.name ||
                   (activeCall.caller?.firstName ?
                     `${activeCall.caller.firstName} ${activeCall.caller.lastName || ''}`.trim() :
                     'User');
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-pulse border-2 border-green-500">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <Avatar className="h-24 w-24 border-4 border-green-100">
              <AvatarImage src={activeCall.caller?.image} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl">
                {userName[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-2 -right-2">
              <div className="relative">
                <div className="animate-ping absolute h-8 w-8 rounded-full bg-green-400 opacity-75"></div>
                <div className="relative h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                  <PhoneIncoming className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Incoming Call</h2>
          <p className="text-lg text-gray-600 mb-1">{userName}</p>
          <p className="text-sm text-gray-500 mb-6">
            {activeCall.callType === 'audio' ? 'Audio Call' : 'Video Call'}
          </p>
          <div className="flex gap-4 w-full">
            <Button
              onClick={onReject}
              variant="outline"
              className="flex-1 h-12 border-red-300 text-red-600 hover:bg-red-50"
            >
              <PhoneOff className="mr-2 h-5 w-5" />
              Decline
            </Button>
            <Button
              onClick={onAccept}
              className="flex-1 h-12 bg-green-600 hover:bg-green-700"
            >
              <Phone className="mr-2 h-5 w-5" />
              Answer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== ACTIVE CALL UI ==========
const ActiveCallUI = ({
  activeCall,
  callStatus,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  isMuted,
  isSpeaker,
  callDuration,
  creditsEarned,
  ratePerMin,
  nextEarningIn
}) => {
  if (!activeCall || callStatus !== 'in-progress') return null;
  
  const userName = activeCall.caller?.name ||
                   (activeCall.caller?.firstName ?
                     `${activeCall.caller.firstName} ${activeCall.caller.lastName || ''}`.trim() :
                     'User');
 
  const formattedDuration = formatCountdown(callDuration);
 
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center z-50">
      <div className="text-center mb-20">
        <div className="mb-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
            {userName[0] || "U"}
          </div>
          <h2 className="text-xl font-bold text-white">{userName}</h2>
          <p className="text-sm text-gray-400">Audio Call</p>
        </div>
       
        <div className="text-5xl font-bold text-white font-mono mb-1">
          {formattedDuration}
        </div>
        <div className="text-sm text-green-400 flex items-center justify-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live • Earning credits</span>
        </div>
       
        <div className="mt-6 bg-black/40 rounded-lg p-4 max-w-xs mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400">Earned</div>
              <div className="text-xl font-bold text-yellow-400">
                +{creditsEarned?.toFixed(2) || "0.00"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Next in</div>
              <div className="text-xl font-bold text-blue-400">
                {nextEarningIn}s
              </div>
            </div>
          </div>
          <div className="text-xs text-center text-gray-500 mt-2">
            +{ratePerMin?.toFixed(2)} credits every minute
          </div>
        </div>
      </div>
     
      <div className="flex items-center gap-6">
        <Button
          onClick={onToggleMute}
          className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20"
          variant="ghost"
          size="icon"
        >
          {isMuted ? (
            <MicOff className="h-5 w-5 text-white" />
          ) : (
            <Mic className="h-5 w-5 text-white" />
          )}
        </Button>
        <Button
          onClick={onEndCall}
          className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700"
          size="icon"
        >
          <PhoneOff className="h-6 w-6 text-white" />
        </Button>
        <Button
          onClick={onToggleSpeaker}
          className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20"
          variant="ghost"
          size="icon"
        >
          {isSpeaker ? (
            <Volume2 className="h-5 w-5 text-white" />
          ) : (
            <VolumeX className="h-5 w-5 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
};

// ========== UTILITY FUNCTIONS ==========
const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return "Just now";
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 168) {
    const days = Math.floor(diffInHours / 24);
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

const formatLastMessageTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (messageDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase().replace(' ', '');
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else if ((now - date) / (1000 * 60 * 60 * 24) < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

const formatMessageTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(':', '.');
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'sending':
      return <Clock className="h-3 w-3 text-gray-400" />;
    case 'sent':
      return <Check className="h-3 w-3 text-gray-500" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-gray-500" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    case 'blocked':
      return <ShieldAlert className="h-3 w-3 text-orange-500" />;
    default:
      return <Clock className="h-3 w-3 text-gray-400" />;
  }
};

const formatCountdown = (seconds) => {
  if (!seconds || seconds <= 0) return "00:00";
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const containsOnlyEmoji = (str) => {
  const trimmedStr = str.trim();
  if (trimmedStr.length === 0) return false;
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?)+$/u;
  return emojiRegex.test(trimmedStr);
};

// ========== MAIN PSYCHIC CHATS COMPONENT ==========
const PsychicChats = () => {
  const { psychic, loading: authLoading, isAuthenticated, logout } = usePsychicAuth();
  const navigate = useNavigate();
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineStatus, setOnlineStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showChatList, setShowChatList] = useState(!isMobileView);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // ========== SOCKET SAFETY STATE ==========
  const [pendingEmits, setPendingEmits] = useState([]);
  const [socketConnectionStatus, setSocketConnectionStatus] = useState('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isSocketReady, setIsSocketReady] = useState(false);

  // ========== WARNING SYSTEM STATE ==========
  const [activeWarnings, setActiveWarnings] = useState([]);
  const [warningCount, setWarningCount] = useState(0);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [deactivatedAt, setDeactivatedAt] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [currentWarning, setCurrentWarning] = useState(null);
  const [blockedMessages, setBlockedMessages] = useState({});
  const [warningHistory, setWarningHistory] = useState([]);
  const [showWarningHistory, setShowWarningHistory] = useState(false);
  
  // ========== USER WARNING STATE ==========
  const [userWarnings, setUserWarnings] = useState([]);
  const [userWarningCount, setUserWarningCount] = useState(0);
  const [isUserDeactivated, setIsUserDeactivated] = useState(false);
  const [showUserDeactivatedNotice, setShowUserDeactivatedNotice] = useState(false);
  const [deactivatedUserName, setDeactivatedUserName] = useState('');

  // ========== CHAT REQUEST & TIMER STATE ==========
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [isRefreshingTimer, setIsRefreshingTimer] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerSyncInterval, setTimerSyncInterval] = useState(null);
 
  // ========== RINGTONE STATE ==========
  const [isRinging, setIsRinging] = useState(false);
  const [hasUnseenRequest, setHasUnseenRequest] = useState(false);
 
  // ========== MODAL STATE ==========
  const [requestToShow, setRequestToShow] = useState(null);
  const [userForRequest, setUserForRequest] = useState(null);
 
  // ========== CALL SYSTEM STATE ==========
  const [activeCall, setActiveCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const [twilioToken, setTwilioToken] = useState(null);
  const [callRoom, setCallRoom] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callQuality, setCallQuality] = useState('excellent');
  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [unseenRequestCount, setUnseenRequestCount] = useState(0);

  // ========== PSYCHIC STATUS STATE ==========
  const [psychicStatus, setPsychicStatus] = useState('offline');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // ========== REFS ==========
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const messageAudioRef = useRef(null);
  const requestAudioRef = useRef(null);
  const callRingtoneRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedSessionRef = useRef(null);
  const syncTimerRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const callDurationRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const isMountedRef = useRef(true);
  const chatRoomsJoined = useRef(new Set());
  const healthCheckIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // ========== REAL-TIME CALL DATA ==========
  const [realTimeCallData, setRealTimeCallData] = useState({
    creditsEarned: 0,
    nextEarningIn: 60,
    ratePerMin: psychic?.ratePerMin || 0,
    earningHistory: []
  });
  const [callSyncInterval, setCallSyncInterval] = useState(null);

  // ========== DEBUG TOKEN ON LOAD ==========
  useEffect(() => {
    console.log('🔍 Checking tokens on page load:');
    console.log('  - psychicToken:', localStorage.getItem('psychicToken') ? 'Present' : 'Missing');
    console.log('  - token:', localStorage.getItem('token') ? 'Present' : 'Missing');
    console.log('  - userToken:', localStorage.getItem('userToken') ? 'Present' : 'Missing');
    
    if (!localStorage.getItem('psychicToken') && isAuthenticated) {
      console.error('❌ Psychic authenticated but no psychicToken found!');
      toast.error('Session error. Please login again.');
      logout();
      navigate('/psychic/login');
    }
  }, [isAuthenticated, logout, navigate]);

  // ========== AXIOS INSTANCE ==========
  const chatApi = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5000',
      timeout: 10000,
    });
   
    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('psychicToken');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
   
    return instance;
  }, []);

  const currentMessages = messages[selectedSession?._id] || [];
  const selectedUser = selectedSession?.user || null;
  const hasPendingRequest = pendingRequests.some(req => req.user?._id === selectedUser?._id);
 
  const activeSessionForUser = useMemo(() => {
    if (!activeSession || !selectedUser) return null;
   
    const activeSessionUserId =
      activeSession.user?._id ||
      activeSession.userId ||
      (typeof activeSession.user === 'string' ? activeSession.user : null);
   
    const selectedUserId = selectedUser._id;
   
    const isMatch = activeSessionUserId === selectedUserId;
   
    return isMatch && activeSession.status === 'active' ? activeSession : null;
  }, [activeSession, selectedUser]);

  // ========== SAFE SOCKET EMIT SYSTEM ==========
  const safeEmit = useCallback((event, data, options = {}) => {
    const { 
      retry = true, 
      maxRetries = 3,
      retryDelay = 2000 
    } = options;

    // Check if socket exists
    if (!socketRef.current) {
      console.log(`❌ Socket not initialized for ${event}`);
      if (retry) {
        const emitItem = { event, data, retryCount: 0, maxRetries, timestamp: Date.now() };
        setPendingEmits(prev => [...prev, emitItem]);
      }
      return false;
    }

    // Check if socket is connected
    if (!socketRef.current.connected) {
      console.log(`⚠️ Socket not connected for ${event}, connected: ${socketRef.current.connected}`);
      
      if (retry) {
        const emitItem = { event, data, retryCount: 0, maxRetries, timestamp: Date.now() };
        setPendingEmits(prev => [...prev, emitItem]);
      }
      return false;
    }

    // Socket is ready - try to emit
    try {
      socketRef.current.emit(event, data);
      console.log(`✅ Emitted ${event} successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to emit ${event}:`, error);
      
      if (retry) {
        const emitItem = { event, data, retryCount: 0, maxRetries, timestamp: Date.now() };
        setPendingEmits(prev => [...prev, emitItem]);
      }
      return false;
    }
  }, []);

  // Process pending emits when socket reconnects
  useEffect(() => {
    if (!socketRef.current) return;

    const handleConnect = () => {
      console.log('✅ Socket reconnected, processing pending emits:', pendingEmits.length);
      setSocketConnectionStatus('connected');
      setIsSocketReady(true);
      setReconnectAttempts(0);
      
      // Clear any reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Process all pending emits
      pendingEmits.forEach(item => {
        setTimeout(() => {
          safeEmit(item.event, item.data, { retry: false });
        }, 100);
      });
      
      setPendingEmits([]);
    };

    const handleDisconnect = (reason) => {
      console.log('🔴 Socket disconnected:', reason);
      setSocketConnectionStatus('disconnected');
      setIsSocketReady(false);
      
      // Try to reconnect if not a manual disconnect
      if (reason !== 'io client disconnect') {
        setReconnectAttempts(prev => prev + 1);
      }
    };

    const handleConnectError = (error) => {
      console.error('❌ Socket connection error:', error);
      setSocketConnectionStatus('error');
      setIsSocketReady(false);
    };

    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('disconnect', handleDisconnect);
    socketRef.current.on('connect_error', handleConnectError);

    // Check initial connection state
    setIsSocketReady(socketRef.current.connected);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('disconnect', handleDisconnect);
        socketRef.current.off('connect_error', handleConnectError);
      }
    };
  }, [pendingEmits, safeEmit]);

  // Retry failed emits periodically
  useEffect(() => {
    if (pendingEmits.length === 0 || !socketRef.current?.connected) return;

    const retryInterval = setInterval(() => {
      setPendingEmits(prev => {
        const now = Date.now();
        const remaining = prev.filter(item => {
          if (now - item.timestamp > 2000 && item.retryCount < item.maxRetries) {
            safeEmit(item.event, item.data, { retry: false });
            return false;
          }
          return true;
        });
        return remaining;
      });
    }, 3000);

    return () => clearInterval(retryInterval);
  }, [pendingEmits, safeEmit]);

  // Auto-reconnect with exponential backoff
  useEffect(() => {
    if (socketConnectionStatus === 'disconnected' && socketRef.current && reconnectAttempts > 0) {
      const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && !socketRef.current.connected) {
          console.log(`🔄 Attempting to reconnect... (attempt ${reconnectAttempts})`);
          socketRef.current.connect();
        }
      }, backoffDelay);
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [socketConnectionStatus, reconnectAttempts]);

  // Socket health check
  useEffect(() => {
    if (!socketRef.current || !psychic) return;
    
    healthCheckIntervalRef.current = setInterval(() => {
      if (socketRef.current && !socketRef.current.connected) {
        console.log('🏥 Socket health check: disconnected, attempting reconnect...');
        socketRef.current.connect();
      } else if (socketRef.current?.connected && psychic) {
        safeEmit('psychic_heartbeat', { psychicId: psychic._id }, { retry: false });
      }
    }, 30000);
    
    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [psychic, safeEmit]);

  // ========== FETCH WARNING STATUS ==========
  const fetchWarningStatus = useCallback(async () => {
    if (!psychic || !isAuthenticated) return;
    
    try {
      const response = await chatApi.get('/api/humanchat/warnings/psychic');
      if (response.data.success) {
        setActiveWarnings(response.data.warnings || []);
        setWarningCount(response.data.summary?.active || 0);
        setIsDeactivated(response.data.summary?.deactivated || false);
        setWarningHistory(response.data.warnings || []);
        
        if (response.data.summary?.deactivated) {
          setDeactivatedAt(response.data.psychic?.deactivatedAt);
          toast.error(
            <div className="flex items-center gap-3">
              <Ban className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-bold text-red-600">Account Deactivated</p>
                <p className="text-sm">Your account has been deactivated due to multiple warnings.</p>
              </div>
            </div>,
            { duration: 10000 }
          );
        }
      }
    } catch (error) {
      console.error('Failed to fetch warning status:', error);
    }
  }, [psychic, isAuthenticated, chatApi]);

  // ========== FETCH USER WARNING STATUS ==========
  const fetchUserWarningStatus = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      const response = await chatApi.get(`/api/humanchat/warnings/user/status/${userId}`);
      if (response.data.success) {
        return {
          isActive: response.data.isActive,
          warningCount: response.data.warningCount,
          deactivatedAt: response.data.deactivatedAt
        };
      }
    } catch (error) {
      console.error('Failed to fetch user warning status:', error);
    }
    return null;
  }, [chatApi]);

  // ========== ACKNOWLEDGE WARNING ==========
  const acknowledgeWarning = useCallback(async (warningId) => {
    safeEmit('acknowledge_warning', { warningId }, { retry: true, maxRetries: 5 });
    
    setActiveWarnings(prev => prev.filter(w => w.id !== warningId));
    toast.success("Warning acknowledged", { duration: 3000 });
  }, [safeEmit]);

  // ========== SOCKET WARNING LISTENERS ==========
  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on('warning_issued', (data) => {
      console.log('⚠️⚠️⚠️ WARNING ISSUED TO PSYCHIC RECEIVED:', data);
      
      setCurrentWarning(data);
      setShowWarningModal(true);
      setWarningCount(prev => {
        const newCount = prev + 1;
        return newCount;
      });
      
      const newWarning = {
        id: data.warningId,
        type: data.warningType,
        number: data.warningNumber,
        message: data.message,
        createdAt: data.timestamp
      };
      
      setActiveWarnings(prev => [newWarning, ...prev]);
      setWarningHistory(prev => [newWarning, ...prev]);
      
      toast.warning(
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-bold">Warning #{data.warningNumber}</p>
            <p className="text-sm">Do not share personal contact information</p>
          </div>
        </div>,
        { duration: 8000 }
      );
      
      if (data.deactivated) {
        setIsDeactivated(true);
        setDeactivatedAt(new Date());
      }
    });

    socketRef.current.on('warning_issued_to_user', (data) => {
      console.log('⚠️ WARNING ISSUED TO USER:', data);
      
      setUserWarningCount(prev => prev + 1);
      
      const userWarning = {
        id: data.warningId,
        type: data.warningType,
        number: data.warningNumber,
        message: data.message,
        createdAt: data.timestamp
      };
      
      setUserWarnings(prev => [userWarning, ...prev]);
      
      toast.info(
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <div>
            <p className="font-bold">User Warning #{data.warningNumber}</p>
            <p className="text-sm">User received warning for sharing contact information.</p>
          </div>
        </div>,
        { duration: 5000 }
      );
      
      if (data.deactivated) {
        setIsUserDeactivated(true);
        setDeactivatedUserName(selectedUser?.username || selectedUser?.firstName || 'User');
        setShowUserDeactivatedNotice(true);
      }
    });

    socketRef.current.on('account_deactivated', (data) => {
      console.log('🔴 ACCOUNT DEACTIVATED:', data);
      setIsDeactivated(true);
      setDeactivatedAt(data.deactivatedAt);
    });

    socketRef.current.on('user_deactivated', (data) => {
      console.log('🔴 USER DEACTIVATED:', data);
      setIsUserDeactivated(true);
      setDeactivatedUserName(data.userName || 'User');
      setShowUserDeactivatedNotice(true);
    });

    socketRef.current.on('message_blocked', (data) => {
      console.log('🚫 MESSAGE BLOCKED:', data);
      
      setBlockedMessages(prev => ({
        ...prev,
        [data.messageId]: {
          reason: data.reason,
          redactedContent: data.redactedContent,
          warningNumber: data.warningNumber,
          isOwn: data.senderModel === 'Psychic'
        }
      }));
      
      toast.warning(
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-orange-500" />
          <div>
            <p className="font-bold">Message Blocked</p>
            <p className="text-sm">{data.reason}</p>
            {data.warningNumber && (
              <p className="text-xs mt-1">Warning #{data.warningNumber}</p>
            )}
          </div>
        </div>,
        { duration: 5000 }
      );
    });

    socketRef.current.on('system_message', (data) => {
      if (data.type === 'warning' && data.content) {
        const systemMessage = {
          _id: `system_${Date.now()}`,
          content: data.content,
          senderModel: 'System',
          messageType: 'system',
          createdAt: new Date().toISOString(),
          isSystem: true
        };
        
        setMessages(prev => {
          const sessionMessages = prev[data.chatSessionId] || [];
          return {
            ...prev,
            [data.chatSessionId]: [...sessionMessages, systemMessage]
          };
        });
      }
    });

    socketRef.current.on('warning_in_chat', (data) => {
      const warningMessage = {
        _id: `warning_${Date.now()}`,
        content: data.content,
        senderModel: 'System',
        messageType: 'system',
        createdAt: new Date().toISOString(),
        isWarning: true,
        warningNumber: data.warningNumber
      };
      
      setMessages(prev => {
        const sessionMessages = prev[data.chatSessionId] || [];
        return {
          ...prev,
          [data.chatSessionId]: [...sessionMessages, warningMessage]
        };
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('warning_issued');
        socketRef.current.off('warning_issued_to_user');
        socketRef.current.off('account_deactivated');
        socketRef.current.off('user_deactivated');
        socketRef.current.off('message_blocked');
        socketRef.current.off('system_message');
        socketRef.current.off('warning_in_chat');
      }
    };
  }, [selectedUser]);

  // ========== CHECK DEACTIVATION ON LOAD ==========
  useEffect(() => {
    if (psychic && isAuthenticated) {
      fetchWarningStatus();
    }
  }, [psychic, isAuthenticated, fetchWarningStatus]);

  // ========== CHECK USER STATUS WHEN SELECTED ==========
  useEffect(() => {
    if (selectedUser?._id) {
      fetchUserWarningStatus(selectedUser._id).then(status => {
        if (status) {
          setIsUserDeactivated(!status.isActive);
          setUserWarningCount(status.warningCount || 0);
          if (!status.isActive) {
            setDeactivatedUserName(selectedUser.username || selectedUser.firstName || 'User');
            setShowUserDeactivatedNotice(true);
          }
        }
      });
    }
  }, [selectedUser, fetchUserWarningStatus]);

  // ========== AUTO UPDATE STATUS ==========
  useEffect(() => {
    if (activeSessionForUser) {
      if (psychicStatus !== 'busy') {
        updateStatusToBusy();
      }
    } else {
      if (psychicStatus === 'busy') {
        updateStatusToOnline();
      }
    }
  }, [activeSessionForUser]);

  // ========== AUDIO INITIALIZATION ==========
  useEffect(() => {
    messageAudioRef.current = new Audio('/message_ring.mp3');
    messageAudioRef.current.volume = 0.5;
   
    requestAudioRef.current = new Audio('/new_chat_request.mp3');
    requestAudioRef.current.volume = 0.7;
    requestAudioRef.current.loop = true;
   
    callRingtoneRef.current = new Audio('/call_ringtone.mp3');
    callRingtoneRef.current.loop = true;
   
    return () => {
      if (messageAudioRef.current) {
        messageAudioRef.current.pause();
        messageAudioRef.current = null;
      }
      if (requestAudioRef.current) {
        requestAudioRef.current.pause();
        requestAudioRef.current = null;
      }
      if (callRingtoneRef.current) {
        callRingtoneRef.current.pause();
        callRingtoneRef.current = null;
      }
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
      }
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current);
      }
    };
  }, []);

  // ========== SYNC PSYCHIC CALL TIMER ==========
  const syncPsychicCallTimer = useCallback(async () => {
    if (!activeCall || callStatus !== 'in-progress') return;
   
    try {
      const response = await chatApi.get(`/api/calls/sync-timer-psychic/${activeCall.callId}`);
     
      if (response.data.success) {
        const callData = response.data.call;
       
        if (callData.elapsedSeconds > 0) {
          setCallDuration(callData.elapsedSeconds);
        }
       
        const minutesElapsed = Math.floor(callData.elapsedSeconds / 60);
        const creditsEarned = minutesElapsed;
       
        const secondsInCurrentMinute = callData.elapsedSeconds % 60;
        const nextEarningIn = 60 - secondsInCurrentMinute;
       
        setRealTimeCallData(prev => ({
          ...prev,
          creditsEarned,
          nextEarningIn,
          ratePerMin: 1
        }));
      }
    } catch (error) {
      console.error('Failed to sync psychic call timer:', error);
    }
  }, [activeCall, callStatus]);

  // ========== CALL SYNC EFFECT ==========
  useEffect(() => {
    if (activeCall && callStatus === 'in-progress') {
      syncPsychicCallTimer();
     
      const interval = setInterval(() => {
        syncPsychicCallTimer();
       
        setRealTimeCallData(prev => ({
          ...prev,
          nextEarningIn: prev.nextEarningIn > 0 ? prev.nextEarningIn - 1 : 60
        }));
       
      }, 1000);
     
      setCallSyncInterval(interval);
     
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (callSyncInterval) {
        clearInterval(callSyncInterval);
        setCallSyncInterval(null);
      }
    }
  }, [activeCall, callStatus, syncPsychicCallTimer]);

  // ========== CREDIT DEDUCTION LISTENER ==========
  useEffect(() => {
    if (!socketRef.current) return;
    
    const handleRealtimeCreditDeduction = (data) => {
      console.log('💰 USER CREDIT DEDUCTION (Psychic sees):', data);
     
      const earnedAmount = 1;
     
      setRealTimeCallData(prev => ({
        ...prev,
        creditsEarned: prev.creditsEarned + earnedAmount,
        earningHistory: [
          ...prev.earningHistory.slice(-4),
          {
            amount: earnedAmount,
            time: new Date(),
            minute: data.minuteNumber
          }
        ]
      }));
     
      toast.success(
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-500 animate-bounce" />
          <span className="font-bold text-green-600">+{earnedAmount} credit earned!</span>
        </div>,
        { duration: 3000 }
      );
    };
    
    socketRef.current.on('realtime_credit_deduction', handleRealtimeCreditDeduction);
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off('realtime_credit_deduction', handleRealtimeCreditDeduction);
      }
    };
  }, []);

  // ========== FETCH PSYCHIC STATUS ==========
  useEffect(() => {
    const fetchPsychicStatus = async () => {
      try {
        const token = localStorage.getItem('psychicToken');
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/human-psychics/my-status`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          setPsychicStatus(response.data.status || 'offline');
        }
      } catch (error) {
        console.error('Failed to fetch psychic status:', error);
      }
    };

    if (psychic && isAuthenticated) {
      fetchPsychicStatus();
    }
  }, [psychic, isAuthenticated]);

  // ========== UPDATE STATUS FUNCTION ==========
  const updateStatus = async (newStatus) => {
    console.log(`🚀 Updating status to: ${newStatus}`);
    
    if (isUpdatingStatus || psychicStatus === newStatus) {
      console.log(`⏸️ Already updating or already ${newStatus}, skipping...`);
      return;
    }
    
    setIsUpdatingStatus(true);
    try {
      const token = localStorage.getItem('psychicToken');
      
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/human-psychics/status`,
        {
          status: newStatus
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ API Response:', response.data);
      
      if (response.data.success) {
        console.log(`🎉 Status updated to ${newStatus} successfully`);
        setPsychicStatus(newStatus);
        toast.success(`Statut défini sur${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
        
        localStorage.setItem('lastStatusUpdate', JSON.stringify({
          time: new Date().toISOString(),
          status: newStatus,
          response: response.data
        }));
      } else {
        console.error('❌ API returned success:false', response.data);
        toast.error('Failed to update status: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Failed to update status:', error);
      toast.error('Failed to update status: ' + (error.response?.data?.message || error.message));
    } finally {
      console.log('🔄 Setting isUpdatingStatus to false');
      setIsUpdatingStatus(false);
    }
  };

  const updateStatusToBusy = () => updateStatus('busy');
  const updateStatusToOnline = () => updateStatus('online');
  const handleSetOnline = () => updateStatus('online');
  const handleSetBusy = () => updateStatus('busy');

  // ========== STATUS SOCKET LISTENER ==========
  useEffect(() => {
    if (!socketRef.current) return;

    const handleStatusChange = (data) => {
      if (data.psychicId === psychic?._id) {
        console.log('📡 Socket status update received:', data.status);
        setPsychicStatus(data.status);
      }
    };

    socketRef.current.on('psychic_status_changed', handleStatusChange);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('psychic_status_changed', handleStatusChange);
      }
    };
  }, [socketRef.current, psychic]);

  // ========== AUTO ONLINE ON LOAD ==========
  useEffect(() => {
    const setOnlineOnLoad = async () => {
      if (psychicStatus === 'offline' && psychic && isAuthenticated && !isUpdatingStatus && !isDeactivated) {
        console.log('🔄 Page loaded, setting psychic to online');
        setTimeout(() => {
          updateStatus('online');
        }, 1000);
      }
    };

    setOnlineOnLoad();
  }, [psychic, isAuthenticated, isDeactivated]);

  // ========== GET TWILIO TOKEN ==========
  const getTwilioToken = async () => {
    try {
      const response = await chatApi.get('/api/calls/token');
      if (response.data.success) {
        setTwilioToken(response.data.token);
        console.log('✅ Twilio token received for psychic');
        return response.data.token;
      }
    } catch (error) {
      console.error('Failed to get Twilio token for psychic:', error);
    }
    return null;
  };

  // ========== CALL DURATION FUNCTIONS ==========
  const startCallDuration = () => {
    clearCallDuration();
    setCallDuration(0);
   
    callDurationRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const clearCallDuration = () => {
    if (callDurationRef.current) {
      clearInterval(callDurationRef.current);
      callDurationRef.current = null;
    }
  };

  // ========== ACCEPT CALL ==========
  const acceptCall = async () => {
    if (!activeCall) return;
    console.log('📞 Psychic accepting call:', activeCall.callId);
    
    try {
      setCallStatus('in-progress');
     
      const response = await chatApi.post('/api/calls/accept-psychic', {
        callId: activeCall.callId
      });
      
      console.log('✅ Accept call response:', response.data);
      
      if (response.data.success) {
        setActiveCall(prev => ({
          ...prev,
          ...response.data.call,
          answeredAt: response.data.call.answeredAt
        }));
        
        startCallDuration();
        
        safeEmit('accept_call', {
          callId: activeCall.callId,
          chatSessionId: activeCall.chatSessionId,
          psychicId: psychic._id,
          psychicName: psychic.name,
          timestamp: new Date().toISOString()
        }, { retry: true });
        
        safeEmit('call_accepted', {
          callId: activeCall.callId,
          acceptedBy: psychic._id,
          acceptorModel: 'Psychic',
          acceptorName: psychic.name
        }, { retry: true });
        
        stopCallRingtone();
       
        toast.success('Call connected! Timer started.');
      }
    } catch (error) {
      console.error('❌ Failed to accept call:', error);
      setCallStatus('ringing');
     
      const errorMessage = error.response?.data?.message ||
                          error.message ||
                          'Failed to accept call';
      toast.error(`Failed to accept call: ${errorMessage}`);
    }
  };

  // ========== REJECT CALL ==========
  const rejectCall = async () => {
    if (!activeCall) return;
    console.log('❌ Psychic rejecting call:', activeCall.callId);
    
    try {
      const response = await chatApi.post('/api/calls/end-psychic', {
        callId: activeCall.callId,
        reason: 'rejected_by_psychic'
      });
      
      if (response.data.success) {
        safeEmit('call_rejected', {
          callId: activeCall.callId,
          rejectedBy: psychic._id,
          reason: 'rejected_by_psychic',
          timestamp: new Date().toISOString()
        }, { retry: true });
        
        setCallStatus('ended');
        setActiveCall(null);
        clearCallDuration();
        stopCallRingtone();
       
        toast.success('Call rejected');
      }
    } catch (error) {
      console.error('Failed to reject call:', error);
      setCallStatus('ended');
      setActiveCall(null);
      clearCallDuration();
      stopCallRingtone();
      toast.success('Call rejected locally');
    }
  };

  // ========== END CALL ==========
  const endCall = async (reason = 'ended_by_psychic') => {
    console.log('🔴 END CALL TRIGGERED', {
      callId: activeCall?.callId,
      callStatus: callStatus
    });
    
    if (!activeCall?.callId) {
      console.error('❌ No activeCall or callId found');
      toast.error('No active call found');
      return;
    }
    
    try {
      clearCallDuration();
      stopCallRingtone();
      cleanupWebRTC();
     
      const cleanCallData = {
        callId: activeCall.callId,
        reason: reason,
        duration: callDuration || 0,
        callerId: extractPrimitiveValue(activeCall.caller, 'id') ||
                  extractPrimitiveValue(activeCall.caller, '_id') ||
                  'unknown',
        ...(activeCall.callType && { callType: activeCall.callType }),
        ...(activeCall.chatSessionId && { chatSessionId: activeCall.chatSessionId })
      };
     
      console.log('📤 Sending clean call data:', cleanCallData);
     
      let response;
      try {
        response = await chatApi.post('/api/calls/end-psychic', cleanCallData);
      } catch (error1) {
        console.error('Psychic endpoint failed, trying fallback:', error1);
        response = await chatApi.post('/api/calls/end', cleanCallData);
      }
      
      if (response?.data?.success) {
        const socketData = {
          callId: cleanCallData.callId,
          endedBy: psychic?._id,
          endedByName: psychic?.name || 'Psychic',
          duration: cleanCallData.duration,
          reason: cleanCallData.reason,
          timestamp: new Date().toISOString()
        };
       
        safeEmit('call_ended', socketData, { retry: true });
        safeEmit('end_call', {
          callId: cleanCallData.callId,
          reason: cleanCallData.reason
        }, { retry: true });
        
        setCallStatus('ended');
        setActiveCall(null);
        setCallRoom(null);
       
        setRealTimeCallData({
          creditsEarned: 0,
          nextEarningIn: 60,
          ratePerMin: psychic?.ratePerMin || 0,
          earningHistory: []
        });
        
        if (callSyncInterval) {
          clearInterval(callSyncInterval);
          setCallSyncInterval(null);
        }
        
        toast.dismiss();
        const earnings = response.data.earnings?.psychicEarned ||
                        response.data.call?.creditsUsed ||
                        0;
       
        if (earnings > 0) {
          toast.success(`Call ended. You earned: +${earnings.toFixed(2)} credits`, {
            duration: 5000
          });
        } else {
          toast.success(`Call ended. Duration: ${formatCountdown(callDuration)}`);
        }
       
      } else {
        throw new Error(response?.data?.message || 'Failed to end call');
      }
     
    } catch (error) {
      console.error('❌ END CALL ERROR:', error);
      toast.dismiss();
     
      let errorMessage = 'Failed to end call';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && !error.message.includes('circular')) {
        errorMessage = error.message;
      }
     
      toast.error(errorMessage);
     
      setCallStatus('ended');
      setActiveCall(null);
      clearCallDuration();
      stopCallRingtone();
      cleanupWebRTC();
    }
  };

  // ========== HELPER FUNCTIONS ==========
  const extractPrimitiveValue = (obj, key) => {
    if (!obj) return null;
    if (typeof obj !== 'object') return obj;
    if (obj[key] !== undefined) {
      const value = obj[key];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
      }
    }
    return null;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleSpeaker = () => {
    setIsSpeaker(!isSpeaker);
  };

  const cleanupWebRTC = () => {
    console.log('🧹 Cleaning up WebRTC...');
   
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
   
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      localStreamRef.current = null;
    }
   
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      remoteStreamRef.current = null;
    }
   
    const audioElements = document.querySelectorAll('audio');
    const videoElements = document.querySelectorAll('video');
   
    audioElements.forEach(el => {
      el.pause();
      el.srcObject = null;
    });
   
    videoElements.forEach(el => {
      el.pause();
      el.srcObject = null;
    });
  };

  // ========== START WEBRTC CALL ==========
  const startWebRTCCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: activeCall?.callType === 'video'
      });
     
      localStreamRef.current = stream;
     
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;
     
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
     
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
      };
     
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          safeEmit('ice_candidate', {
            callId: activeCall.callId,
            candidate: event.candidate,
            from: psychic._id
          }, { retry: true });
        }
      };
     
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
     
      safeEmit('webrtc_offer', {
        callId: activeCall.callId,
        offer,
        from: psychic._id
      }, { retry: true });
    } catch (error) {
      console.error('WebRTC error:', error);
      toast.error('Failed to start media stream');
      endCall('media_error');
    }
  };

  // ========== HANDLE WEBRTC OFFER ==========
  const handleWebRTCOffer = async (data) => {
    const { callId, offer, from } = data;
   
    if (callId !== activeCall?.callId) return;
    
    try {
      const peerConnection = peerConnectionRef.current;
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
     
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
     
      safeEmit('webrtc_answer', {
        callId,
        answer,
        from: psychic._id
      }, { retry: true });
    } catch (error) {
      console.error('WebRTC offer error:', error);
    }
  };

  // ========== HANDLE WEBRTC ANSWER ==========
  const handleWebRTCAnswer = async (data) => {
    const { callId, answer, from } = data;
   
    if (callId !== activeCall?.callId) return;
    
    try {
      const peerConnection = peerConnectionRef.current;
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('WebRTC answer error:', error);
    }
  };

  // ========== HANDLE ICE CANDIDATE ==========
  const handleICECandidate = async (data) => {
    const { callId, candidate, from } = data;
   
    if (callId !== activeCall?.callId) return;
    
    try {
      const peerConnection = peerConnectionRef.current;
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('ICE candidate error:', error);
    }
  };

  // ========== RINGTONE FUNCTIONS ==========
  const playCallRingtone = () => {
    if (callRingtoneRef.current && callStatus === 'ringing') {
      callRingtoneRef.current.play().catch(err => {
        console.log('Call ringtone play error:', err);
      });
    }
  };

  const stopCallRingtone = () => {
    if (callRingtoneRef.current) {
      callRingtoneRef.current.pause();
      callRingtoneRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (callStatus === 'ringing') {
      playCallRingtone();
    } else {
      stopCallRingtone();
    }
  }, [callStatus]);

  // ========== REQUEST RINGTONE FUNCTIONS ==========
  const startRinging = useCallback(() => {
    if (!requestAudioRef.current || isRinging) return;
   
    try {
      const playPromise = requestAudioRef.current.play();
     
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsRinging(true);
            console.log('🔔 Ringtone started');
           
            requestAudioRef.current.loop = true;
           
            ringIntervalRef.current = setInterval(() => {
              if (requestAudioRef.current && isRinging && requestAudioRef.current.paused) {
                console.log('🔔 Restarting ringtone');
                requestAudioRef.current.currentTime = 0;
                requestAudioRef.current.play().catch(e => console.error('Ringtone restart failed:', e));
              }
            }, 3000);
          })
          .catch(error => {
            console.error('Failed to start ringtone:', error);
            setIsRinging(true);
            setHasUnseenRequest(true);
          });
      }
    } catch (error) {
      console.error('Error starting ringtone:', error);
      setIsRinging(true);
      setHasUnseenRequest(true);
    }
  }, [isRinging]);

  const stopRinging = useCallback(() => {
    console.log('🔇 Stopping ringtone');
   
    setIsRinging(false);
    setHasUnseenRequest(false);
   
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
   
    if (requestAudioRef.current) {
      requestAudioRef.current.pause();
      requestAudioRef.current.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    if (pendingRequests.length > 0 && !showRequestModal) {
      if (!isRinging) {
        console.log('🔔 Starting ringtone: pending requests exist and modal not open');
        startRinging();
      }
    } else {
      if (isRinging) {
        console.log('🔇 Stopping ringtone: no requests or modal is open');
        stopRinging();
      }
    }
  }, [pendingRequests, showRequestModal, isRinging, startRinging, stopRinging]);

  useEffect(() => {
    if (showRequestModal && isRinging) {
      console.log('🔇 Modal opened, stopping ringtone');
      stopRinging();
    }
  }, [showRequestModal, isRinging, stopRinging]);

  // ========== BACKEND TIMER SYNC ==========
  const syncTimerWithBackend = useCallback(async (force = false) => {
    if (!activeSession?._id || !isMountedRef.current) return;
   
    try {
      console.log('🔄 Psychic syncing timer with backend for session:', activeSession._id);
     
      const response = await chatApi.get(`/api/chatrequest/timer/${activeSession._id}`);
     
      if (response.data.success && response.data.data) {
        const timerData = response.data.data;
        console.log('⏰ Backend timer data for psychic:', timerData);
       
        setCountdownSeconds(timerData.remainingSeconds);
        setTimerPaused(timerData.isPaused || false);
       
        setActiveSession(prev => ({
          ...prev,
          status: timerData.status,
          paidSession: {
            ...prev?.paidSession,
            remainingSeconds: timerData.remainingSeconds,
            isPaused: timerData.isPaused || false,
            lastSyncTime: new Date()
          }
        }));
       
        if (timerData.remainingSeconds <= 0 || timerData.status === 'completed') {
          console.log('⏰ Session ended on backend, cleaning up');
          setActiveSession(null);
          setCountdownSeconds(0);
          setTimerPaused(false);
         
          if (syncTimerRef.current) {
            clearInterval(syncTimerRef.current);
            syncTimerRef.current = null;
          }
         
          toast.info("Session has ended", { duration: 3000 });
        }
       
        return timerData;
      }
    } catch (error) {
      console.error('Failed to sync timer with backend:', error);
    }
  }, [activeSession, chatApi]);

  useEffect(() => {
    if (activeSession?.status === 'active') {
      syncTimerWithBackend(true);
     
      syncTimerRef.current = setInterval(() => {
        syncTimerWithBackend();
      }, 5000);
     
      return () => {
        if (syncTimerRef.current) {
          clearInterval(syncTimerRef.current);
          syncTimerRef.current = null;
        }
      };
    } else {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    }
  }, [activeSession, syncTimerWithBackend]);

  // ========== COMPONENT LIFECYCLE ==========
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
      }
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current);
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      chatRoomsJoined.current.clear();
      clearTimeout(typingTimeoutRef.current);
      cleanupWebRTC();
    };
  }, []);

  useEffect(() => {
    selectedSessionRef.current = selectedSession;
  }, [selectedSession]);

  // ========== MOBILE VIEW ==========
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      setShowChatList(!mobile || !selectedSession);
    };
  
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [selectedSession]);

  // ========== AUTH CHECK ==========
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/psychic/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // ========== ACTIVE SESSION CHECK ==========
  const checkActiveSession = useCallback(async (force = false) => {
    if (!psychic || !isAuthenticated || !isMountedRef.current) return;
   
    try {
      console.log('🔄 Checking active session for psychic...');
     
      if (force || !activeSession) {
        setIsRefreshingTimer(true);
      }
     
      const response = await chatApi.get('/api/chatrequest/active-session-psychic');
     
      if (response.data.success && isMountedRef.current) {
        const sessionData = response.data.data;
       
        if (sessionData && sessionData.status === 'active') {
          console.log('✅ Found active session:', sessionData);
         
          const enhancedSessionData = {
            ...sessionData,
            user: sessionData.user || { _id: sessionData.userId }
          };
         
          setActiveSession(enhancedSessionData);
          setTimerPaused(sessionData.paidSession?.isPaused || false);
         
          const timerResponse = await chatApi.get(`/api/chatrequest/timer/${sessionData._id}`);
          if (timerResponse.data.success) {
            const timerData = timerResponse.data.data;
            console.log('⏰ Initial timer sync from backend:', timerData.remainingSeconds);
            setCountdownSeconds(timerData.remainingSeconds);
          }
         
          if (enhancedSessionData.user?._id) {
            setPendingRequests(prev =>
              prev.filter(req => req.user?._id !== enhancedSessionData.user._id)
            );
          }
        } else {
          console.log('❌ No active session found');
          setActiveSession(null);
          setCountdownSeconds(0);
          setTimerPaused(false);
         
          if (syncTimerRef.current) {
            clearInterval(syncTimerRef.current);
            syncTimerRef.current = null;
          }
        }
      } else if (isMountedRef.current) {
        setActiveSession(null);
        setCountdownSeconds(0);
        setTimerPaused(false);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
      if (force && isMountedRef.current) {
        setActiveSession(null);
        setCountdownSeconds(0);
        setTimerPaused(false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshingTimer(false);
      }
    }
  }, [psychic, isAuthenticated, activeSession, chatApi]);

  // ========== CHECK NEW CHAT REQUESTS ==========
  const checkNewChatRequests = useCallback(async () => {
    if (!psychic || !isAuthenticated) return;

    try {
      const response = await chatApi.get('/api/chatrequest/psychic/pending-requests');
     
      if (response.data.success && isMountedRef.current) {
        const requests = response.data.data || [];
        
        const formattedRequests = requests.map(request => {
          const user = request.user || {};
          const username = user.username || 'user';
          const displayName = username 
            ? `@${username}`
            : `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
          
          return {
            ...request,
            user: {
              ...user,
              displayName,
              username
            }
          };
        });
        
        console.log('🔔 New requests with usernames:', formattedRequests);
       
        setPendingRequests(formattedRequests);
       
        setHasNewRequest(formattedRequests.length > 0);
        setUnseenRequestCount(formattedRequests.length);
       
        if (formattedRequests.length > 0 && !isRinging && !showRequestModal) {
          console.log('🔔 Starting ringtone for', formattedRequests.length, 'new requests');
          startRinging();
        } else if (formattedRequests.length === 0 && isRinging) {
          stopRinging();
        }
      }
    } catch (error) {
      console.error('Error checking new requests:', error);
    }
  }, [psychic, isAuthenticated, isRinging, showRequestModal, startRinging, stopRinging, chatApi]);

  // ========== FETCH PENDING REQUESTS ==========
  const fetchPendingRequests = async () => {
    if (!psychic || !isAuthenticated) return;

    try {
      const response = await chatApi.get('/api/chatrequest/psychic/pending-requests');

      if (response.data.success && isMountedRef.current) {
        const allRequests = response.data.data || [];
        
        const formattedRequests = allRequests.map(request => {
          const user = request.user || {};
          const username = user.username || 'user';
          const displayName = username 
            ? `@${username}`
            : `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
          
          return {
            ...request,
            user: {
              ...user,
              displayName,
              username
            }
          };
        });
        
        if (selectedSession?.user?._id) {
          const userRequests = formattedRequests.filter(req => 
            req.user?._id === selectedSession.user._id
          );
          setPendingRequests(userRequests);
        } else {
          setPendingRequests(formattedRequests);
        }
        
        console.log('📋 Pending requests with usernames:', formattedRequests);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setPendingRequests([]);
    }
  };

  // ========== FETCH CHATS ==========
  const fetchChats = useCallback(async () => {
    if (!psychic || !isAuthenticated) return;
    setRefreshing(true);
    setError(null);
    try {
      const { data } = await chatApi.get('/api/psychic/sessions');
    
      if (data.success && isMountedRef.current) {
        const formattedSessions = (data.chatSessions || []).map(session => {
          const user = session.user || {};
          const username = user.username || 'user';
          const displayName = username 
            ? `@${username}`
            : `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
          
          return {
            ...session,
            user: {
              ...user,
              displayName,
              username
            }
          };
        });
        
        console.log("📋 Fetched chat sessions with usernames:", formattedSessions.length);
        setChatSessions(formattedSessions);
      
        if (socketRef.current?.connected && formattedSessions?.length > 0) {
          const sessionIds = formattedSessions.map(s => s._id) || [];
        
          const roomsToJoin = sessionIds.filter(id => !chatRoomsJoined.current.has(id));
        
          if (roomsToJoin.length > 0) {
            console.log(`Joining ${roomsToJoin.length} new chat rooms`);
            roomsToJoin.forEach(chatId => {
              socketRef.current.emit("join_room", `chat_${chatId}`);
              chatRoomsJoined.current.add(chatId);
            });
          }
        }
      } else {
        throw new Error(data.message || "Failed to load chats");
      }
    } catch (err) {
      console.error("Fetch chats error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to load chats";
      setError(errorMsg);
    
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        logout();
        navigate("/psychic/login");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [psychic, isAuthenticated, navigate, logout, chatApi]);

  // ========== INITIAL FETCH ==========
  useEffect(() => {
    if (psychic && isAuthenticated && isMountedRef.current) {
      fetchChats();
      fetchPendingRequests();
      checkNewChatRequests();
      checkActiveSession();
      getTwilioToken();
      fetchWarningStatus();
    }
  }, [psychic, isAuthenticated]);

  useEffect(() => {
    if (selectedSession && psychic && isAuthenticated) {
      checkActiveSession();
      fetchPendingRequests();
    }
  }, [selectedSession, psychic, isAuthenticated]);

  // ========== SOCKET.IO CONNECTION ==========
  // ========== SOCKET.IO CONNECTION ==========
useEffect(() => {
  if (!psychic || !isAuthenticated || !isMountedRef.current) return;
 
  const token = localStorage.getItem("psychicToken");
  if (!token) {
    toast.error("No authentication token found");
    logout();
    navigate("/psychic/login");
    return;
  }
  
  try {
    console.log("Initializing socket connection for psychic...");
   
    socketRef.current = io(import.meta.env.VITE_BASE_URL || 'http://localhost:5000', {
      auth: {
        token: token,
        userId: psychic._id,
        role: 'psychic',
        name: psychic.name
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
      timeout: 20000,
      forceNew: true,
      autoConnect: true,
      withCredentials: true
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected as psychic:", psychic.name);
      
      // Only emit after connection is confirmed and socket exists
      if (socketRef.current && socketRef.current.connected) {
        // Join personal room
        socketRef.current.emit("join_room", `psychic_${psychic._id}`);
        
        // Join timer room
        socketRef.current.emit("join_psychic_timer", { psychicId: psychic._id });
        
        // Join existing chat sessions
        if (chatSessions.length > 0) {
          console.log(`Joining ${chatSessions.length} chat rooms`);
          chatSessions.forEach(session => {
            if (session?._id && !chatRoomsJoined.current.has(session._id)) {
              socketRef.current.emit("join_room", `chat_${session._id}`);
              chatRoomsJoined.current.add(session._id);
            }
          });
        }
        
        // Send heartbeat to update status
        socketRef.current.emit('psychic_heartbeat', { psychicId: psychic._id });
      }
    });

    // ===== CALL SOCKET EVENTS =====
    socketRef.current.on("incoming_call", (data) => {
      console.log('📞 Incoming call received by psychic:', data);
     
      const enhancedCallData = {
        ...data,
        caller: {
          ...data.caller,
          name: data.caller?.name ||
                data.callerInfo?.name ||
                `${data.caller?.firstName || ''} ${data.caller?.lastName || ''}`.trim() ||
                'User',
          image: data.caller?.image || data.callerInfo?.image
        }
      };
     
      setActiveCall(enhancedCallData);
      setCallStatus('ringing');
     
      toast.info(`Incoming call from ${enhancedCallData.caller.name}`, {
        duration: 10000,
        action: {
          label: 'Answer',
          onClick: acceptCall
        }
      });
    });

    socketRef.current.on("call_accepted", (data) => {
      console.log('✅ Call accepted by user:', data);
      setCallStatus('in-progress');
      toast.success('Call connected!');
    });
   
    socketRef.current.on("call_rejected", (data) => {
      console.log('❌ Call rejected:', data);
      setCallStatus('ended');
      setActiveCall(null);
      clearCallDuration();
      toast.error(`Call rejected: ${data.reason}`);
    });
   
    socketRef.current.on("call_ended", (data) => {
      console.log('📞 Call ended:', data);
      setCallStatus('ended');
      setActiveCall(null);
      clearCallDuration();
      toast.info(`Call ended. Duration: ${formatCountdown(data.duration)}`);
    });
   
    socketRef.current.on("start_call", (data) => {
      console.log('🚀 Starting WebRTC call:', data);
      if (data.callId === activeCall?.callId) {
        startWebRTCCall();
      }
    });
   
    socketRef.current.on("webrtc_offer", handleWebRTCOffer);
    socketRef.current.on("webrtc_answer", handleWebRTCAnswer);
    socketRef.current.on("ice_candidate", handleICECandidate);

    // ===== TIMER EVENTS =====
    socketRef.current.on("timer_tick", (data) => {
      console.log('⏰ TIMER TICK FROM BACKEND (psychic):', data);
     
      setCountdownSeconds(data.remainingSeconds);
     
      if (activeSession?._id === data.requestId) {
        setActiveSession(prev => ({
          ...prev,
          paidSession: {
            ...prev?.paidSession,
            remainingSeconds: data.remainingSeconds,
            currentBalance: data.currentBalance,
            lastUpdate: new Date()
          }
        }));
      }
    });

    socketRef.current.on("session_started", (data) => {
      console.log('🚀 Session started via socket (psychic side):', data);
     
      const psychicId = data.paidTimer?.psychic ||
                        data.chatRequest?.psychic?._id ||
                        data.psychic?._id ||
                        data.psychicId;
     
      if (psychicId === psychic._id) {
        console.log('✅ Matching psychic, updating UI');
       
        setTimeout(() => {
          syncTimerWithBackend(true);
        }, 1000);
      }
    });

    socketRef.current.on("timer_update", (data) => {
      console.log('🔄 TIMER UPDATE (psychic):', data);
     
      const selectedUserId = selectedSessionRef.current?.user?._id;
     
      if (activeSession?._id === data.requestId || selectedUserId === data.userId) {
        setCountdownSeconds(data.remainingSeconds);
        setTimerPaused(data.isPaused || false);
       
        setActiveSession(prev => ({
          ...prev,
          remainingSeconds: data.remainingSeconds,
          status: data.status,
          paidSession: {
            ...prev?.paidSession,
            remainingSeconds: data.remainingSeconds,
            isPaused: data.isPaused || false
          }
        }));
      }
    });

    socketRef.current.on("timer_paused", (data) => {
      console.log('⏸️ Timer paused (psychic):', data);
     
      if (activeSession?._id === data.requestId) {
        setTimerPaused(true);
        setActiveSession(prev => ({
          ...prev,
          paidSession: {
            ...prev?.paidSession,
            isPaused: true
          }
        }));
      }
    });

    socketRef.current.on("timer_resumed", (data) => {
      console.log('▶️ Timer resumed (psychic):', data);
     
      if (activeSession?._id === data.requestId) {
        setTimerPaused(false);
        setActiveSession(prev => ({
          ...prev,
          paidSession: {
            ...prev?.paidSession,
            isPaused: false
          }
        }));
      }
    });

    socketRef.current.on("session_ended", (data) => {
      console.log('🏁 Session ended (psychic):', data);
   
      if (activeSession?._id === data.requestId) {
        setActiveSession(null);
        setCountdownSeconds(0);
        setTimerPaused(false);
       
        if (syncTimerRef.current) {
          clearInterval(syncTimerRef.current);
          syncTimerRef.current = null;
        }
       
        checkActiveSession(true);
        toast.success("Session ended successfully", {
          duration: 3000
        });
      }
    });

    socketRef.current.on("timer_updated", (data) => {
      console.log('🔄 Timer updated via socket:', data);
     
      if (activeSession?._id === data.requestId) {
        setCountdownSeconds(data.remainingSeconds);
        setActiveSession(prev => ({
          ...prev,
          remainingSeconds: data.remainingSeconds,
          paidSession: {
            ...prev?.paidSession,
            remainingSeconds: data.remainingSeconds,
            isPaused: data.isPaused || false
          }
        }));
       
        setTimerPaused(data.isPaused || false);
      }
    });

    // ===== CHAT REQUEST EVENTS =====
    socketRef.current.on("new_chat_request", (data) => {
      console.log("🎯 NEW CHAT REQUEST via socket:", data);

      const { chatRequest } = data;
      if (!chatRequest) return;

      const user = chatRequest.user || {};
      const username = user.username || 'user';
      const displayName = username 
        ? `@${username}`
        : `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
      
      const formattedRequest = {
        ...chatRequest,
        user: {
          ...user,
          displayName,
          username
        }
      };

      setPendingRequests(prev => {
        if (prev.some(req => req._id === formattedRequest._id)) {
          return prev;
        }
        return [...prev, formattedRequest];
      });

      setHasNewRequest(true);
      setUnseenRequestCount(prev => prev + 1);

      if (!isRinging && !showRequestModal) {
        console.log('🔔 Starting ringtone for new request');
        startRinging();
      }

      setChatSessions(prev => {
        const sessionIndex = prev.findIndex(
          s => s.user?._id === formattedRequest.user?._id
        );
       
        if (sessionIndex !== -1) {
          const updatedSessions = [...prev];
          updatedSessions[sessionIndex] = {
            ...updatedSessions[sessionIndex],
            hasPendingRequest: true,
            status: 'pending',
            updatedAt: new Date()
          };
          const [session] = updatedSessions.splice(sessionIndex, 1);
          updatedSessions.unshift(session);
          return updatedSessions;
        } else {
          const newSession = {
            _id: `pending_${formattedRequest._id}`,
            user: formattedRequest.user,
            psychic: psychic._id,
            status: 'pending',
            hasPendingRequest: true,
            lastMessage: null,
            lastMessageAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          return [newSession, ...prev];
        }
      });

      toast.success(`New chat request from ${displayName}`, {
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => {
            setRequestToShow(formattedRequest);
            setUserForRequest(formattedRequest.user);
            setShowRequestModal(true);
            stopRinging();
          }
        }
      });
    });

    // ===== NEW MESSAGE HANDLER =====
    socketRef.current.on("new_message", (data) => {
      console.log("📨 INCOMING MESSAGE:", data);
      
      const { message, chatSessionId, senderId, senderRole } = data;
      
      if (!message || !chatSessionId) {
        console.log("❌ Invalid message data received");
        return;
      }

      // Check if message is blocked
      if (message.isBlocked) {
        console.log('🚫 Blocked message detected:', message);
        
        setBlockedMessages(prev => ({
          ...prev,
          [message._id]: {
            reason: message.blockReason || 'Message contained prohibited content',
            redactedContent: message.redactedContent,
            warningNumber: message.warningNumber,
            isOwn: senderRole === 'psychic'
          }
        }));
        
        if (chatSessionId === selectedSessionRef.current?._id) {
          setMessages(prev => {
            const currentMsgs = prev[chatSessionId] || [];
            if (!currentMsgs.some(m => m._id === message._id)) {
              return {
                ...prev,
                [chatSessionId]: [...currentMsgs, { ...message, isBlocked: true }]
              };
            }
            return prev;
          });
        }
        
        toast.warning(
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-orange-500" />
            <div>
              <p className="font-bold">
                {senderRole === 'psychic' ? 'Your Message Was Blocked' : 'Message Blocked'}
              </p>
              <p className="text-sm">{message.blockReason || 'Message contained prohibited content'}</p>
              {message.warningNumber && (
                <p className="text-xs mt-1">Warning #{message.warningNumber}</p>
              )}
            </div>
          </div>,
          { duration: 5000 }
        );
        
        if (senderRole !== 'psychic') {
          try {
            if (messageAudioRef.current) {
              messageAudioRef.current.currentTime = 0;
              messageAudioRef.current.play().catch(() => {});
            }
          } catch (err) {
            console.log("Message audio play failed:", err);
          }
        }
        
        if (senderRole === 'psychic' && message.warningLedToDeactivation) {
          setIsDeactivated(true);
          setDeactivatedAt(new Date());
          toast.error(
            <div className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-bold">Account Deactivated</p>
                <p className="text-sm">Your account has been deactivated due to multiple warnings.</p>
              </div>
            </div>,
            { duration: 0 }
          );
        }
      } else {
        // Normal message
        if (senderRole === 'user' && messageAudioRef.current) {
          try {
            messageAudioRef.current.currentTime = 0;
            messageAudioRef.current.play().catch(() => {});
          } catch (err) {
            console.log("Message audio play failed:", err);
          }
        }

        if (chatSessionId === selectedSessionRef.current?._id) {
          setMessages(prev => {
            const currentMsgs = prev[chatSessionId] || [];
            if (!currentMsgs.some(m => m._id === message._id)) {
              return {
                ...prev,
                [chatSessionId]: [...currentMsgs, message]
              };
            }
            return prev;
          });
        }
      }

      // Update chat sessions
      setChatSessions(prev => {
        const sessionIndex = prev.findIndex(s => s._id === chatSessionId);
        if (sessionIndex === -1) {
          return prev;
        }
        
        const updatedSessions = [...prev];
        const isCurrentSession = selectedSessionRef.current?._id === chatSessionId;
        
        updatedSessions[sessionIndex] = {
          ...updatedSessions[sessionIndex],
          lastMessage: message,
          lastMessageAt: new Date(),
          unreadCounts: {
            ...updatedSessions[sessionIndex].unreadCounts,
            psychic: isCurrentSession ? 0 : (updatedSessions[sessionIndex].unreadCounts?.psychic || 0) + 1
          }
        };
        
        const [session] = updatedSessions.splice(sessionIndex, 1);
        updatedSessions.unshift(session);
        
        return updatedSessions;
      });

      // Mark as read if current session (for user messages only)
      if (selectedSessionRef.current?._id === chatSessionId && senderRole === 'user') {
        // Use safeEmit instead of direct socket emit
        safeEmit("message_read", {
          messageId: message._id,
          chatSessionId
        }, { 
          retry: true, 
          maxRetries: 5
        });
      } else if (senderRole === 'user' && chatSessionId !== selectedSessionRef.current?._id) {
        const userName = message.sender?.username || 
                        message.sender?.firstName || 
                        message.sender?.name || 
                        'User';
        
        toast.info(`New message from ${userName}`, {
          duration: 3000,
          action: {
            label: 'View',
            onClick: () => {
              const session = chatSessions.find(s => s._id === chatSessionId);
              if (session) {
                handleSelectSession(session);
                if (isMobileView) setShowChatList(false);
              }
            }
          }
        });
      }
    });

    socketRef.current.on("typing_indicator", (data) => {
      const { chatSessionId, userId, isTyping: typing } = data;
     
      if (selectedSessionRef.current?._id === chatSessionId && userId !== psychic._id) {
        setIsTyping(typing);
       
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
       
        if (typing) {
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
      }
    });

    socketRef.current.on("online_status_response", (data) => {
      setOnlineStatus(data);
    });

    socketRef.current.on("user_status_change", (data) => {
      const { userId, status } = data;
     
      setOnlineStatus(prev => ({
        ...prev,
        [userId]: status === 'online'
      }));
    });

    // ===== WARNING SYSTEM SOCKET EVENTS =====
    socketRef.current.on('warning_issued', (data) => {
      console.log('⚠️⚠️⚠️ WARNING ISSUED TO PSYCHIC RECEIVED:', data);
      
      setCurrentWarning(data);
      setShowWarningModal(true);
      setWarningCount(prev => {
        const newCount = prev + 1;
        return newCount;
      });
      
      const newWarning = {
        id: data.warningId,
        type: data.warningType,
        number: data.warningNumber,
        message: data.message,
        createdAt: data.timestamp
      };
      
      setActiveWarnings(prev => [newWarning, ...prev]);
      setWarningHistory(prev => [newWarning, ...prev]);
      
      toast.warning(
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-bold">Warning #{data.warningNumber}</p>
            <p className="text-sm">Do not share personal contact information</p>
          </div>
        </div>,
        { duration: 8000 }
      );
      
      if (data.deactivated) {
        setIsDeactivated(true);
        setDeactivatedAt(new Date());
      }
    });

    socketRef.current.on('warning_issued_to_user', (data) => {
      console.log('⚠️ WARNING ISSUED TO USER:', data);
      
      setUserWarningCount(prev => prev + 1);
      
      const userWarning = {
        id: data.warningId,
        type: data.warningType,
        number: data.warningNumber,
        message: data.message,
        createdAt: data.timestamp
      };
      
      setUserWarnings(prev => [userWarning, ...prev]);
      
      toast.info(
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <div>
            <p className="font-bold">User Warning #{data.warningNumber}</p>
            <p className="text-sm">User received warning for sharing contact information.</p>
          </div>
        </div>,
        { duration: 5000 }
      );
      
      if (data.deactivated) {
        setIsUserDeactivated(true);
        setDeactivatedUserName(selectedUser?.username || selectedUser?.firstName || 'User');
        setShowUserDeactivatedNotice(true);
      }
    });

    socketRef.current.on('account_deactivated', (data) => {
      console.log('🔴 ACCOUNT DEACTIVATED:', data);
      setIsDeactivated(true);
      setDeactivatedAt(data.deactivatedAt);
    });

    socketRef.current.on('user_deactivated', (data) => {
      console.log('🔴 USER DEACTIVATED:', data);
      setIsUserDeactivated(true);
      setDeactivatedUserName(data.userName || 'User');
      setShowUserDeactivatedNotice(true);
    });

    socketRef.current.on('message_blocked', (data) => {
      console.log('🚫 MESSAGE BLOCKED:', data);
      
      setBlockedMessages(prev => ({
        ...prev,
        [data.messageId]: {
          reason: data.reason,
          redactedContent: data.redactedContent,
          warningNumber: data.warningNumber,
          isOwn: data.senderModel === 'Psychic'
        }
      }));
      
      toast.warning(
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-orange-500" />
          <div>
            <p className="font-bold">Message Blocked</p>
            <p className="text-sm">{data.reason}</p>
            {data.warningNumber && (
              <p className="text-xs mt-1">Warning #{data.warningNumber}</p>
            )}
          </div>
        </div>,
        { duration: 5000 }
      );
    });

    socketRef.current.on('system_message', (data) => {
      if (data.type === 'warning' && data.content) {
        const systemMessage = {
          _id: `system_${Date.now()}`,
          content: data.content,
          senderModel: 'System',
          messageType: 'system',
          createdAt: new Date().toISOString(),
          isSystem: true
        };
        
        setMessages(prev => {
          const sessionMessages = prev[data.chatSessionId] || [];
          return {
            ...prev,
            [data.chatSessionId]: [...sessionMessages, systemMessage]
          };
        });
      }
    });

    socketRef.current.on('warning_in_chat', (data) => {
      const warningMessage = {
        _id: `warning_${Date.now()}`,
        content: data.content,
        senderModel: 'System',
        messageType: 'system',
        createdAt: new Date().toISOString(),
        isWarning: true,
        warningNumber: data.warningNumber
      };
      
      setMessages(prev => {
        const sessionMessages = prev[data.chatSessionId] || [];
        return {
          ...prev,
          [data.chatSessionId]: [...sessionMessages, warningMessage]
        };
      });
    });

    // Connect the socket
    socketRef.current.connect();

  } catch (error) {
    console.error("Failed to initialize socket:", error);
    toast.error("Failed to connect to chat server");
  }

  return () => {
    if (socketRef.current && !isMountedRef.current) {
      console.log("Cleaning up socket connection");
      socketRef.current.removeAllListeners(); // Remove all listeners first
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };
}, [psychic, isAuthenticated, navigate, logout, chatSessions, syncTimerWithBackend, activeSession, activeCall, isRinging, showRequestModal, startRinging, stopRinging, fetchChats, safeEmit]);
  // ========== TIMER DEBUG ==========
  useEffect(() => {
    console.log('🔍 PSYCHIC TIMER DEBUG - State values:', {
      hasActiveSession: !!activeSession,
      activeSessionStatus: activeSession?.status,
      countdownSeconds: countdownSeconds,
      backendCountdown: activeSession?.paidSession?.remainingSeconds,
      timerPaused: timerPaused,
      syncIntervalActive: !!syncTimerRef.current
    });
  }, [activeSession, countdownSeconds, timerPaused]);

  // ========== FORCE TIMER REFRESH ==========
  const forceTimerRefresh = useCallback(async () => {
    if (!selectedSession || !psychic) return;
   
    try {
      console.log('🔄 Force refreshing timer for psychic');
      setIsRefreshingTimer(true);
     
      const response = await chatApi.get('/api/chatrequest/active-session-psychic');
     
      if (response.data.success && response.data.data) {
        const sessionData = response.data.data;
       
        const sessionUserId = sessionData.user?._id || sessionData.userId;
        const selectedUserId = selectedSession?.user?._id;
       
        if (sessionUserId === selectedUserId && sessionData.status === 'active') {
          console.log('✅ Found matching active session, updating timer');
         
          setActiveSession(sessionData);
         
          const timerResponse = await chatApi.get(`/api/chatrequest/timer/${sessionData._id}`);
          if (timerResponse.data.success) {
            const timerData = timerResponse.data.data;
            setCountdownSeconds(timerData.remainingSeconds);
            setTimerPaused(timerData.isPaused || false);
          }
         
          toast.success('Timer refreshed', {
            duration: 2000
          });
        }
      }
    } catch (error) {
      console.error('Error force refreshing timer:', error);
    } finally {
      setIsRefreshingTimer(false);
    }
  }, [selectedSession, psychic, chatApi]);

  // ========== FETCH MESSAGES ==========
  const fetchMessages = useCallback(async (sessionId) => {
    if (!sessionId || !psychic || !isAuthenticated) return;

    try {
      const { data } = await chatApi.get(`/api/psychic/messages/${sessionId}`);
    
      if (data.success && isMountedRef.current) {
        const formattedMessages = (data.messages || []).map(message => {
          const isPsychic = message.senderModel === 'Psychic';
          
          let displayName = '';
          let username = '';
          
          if (isPsychic) {
            displayName = psychic.name || 'You';
            username = psychic.username || psychic.name?.toLowerCase()?.replace(/\s+/g, '') || 'psychic';
          } else {
            if (message.sender?.username) {
              displayName = `@${message.sender.username}`;
              username = message.sender.username;
            } else if (message.sender?.firstName || message.sender?.lastName) {
              displayName = `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim();
              username = message.sender.username || 'user';
            } else {
              displayName = 'User';
              username = 'user';
            }
          }
          
          return {
            ...message,
            displayName,
            username,
            isBlocked: message.isBlocked || false
          };
        });
        
        const sortedMessages = formattedMessages.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
       
        setMessages(prev => ({
          ...prev,
          [sessionId]: sortedMessages
        }));
      
        await chatApi.put(`/api/psychic/messages/${sessionId}/read`);
      
        setChatSessions(prev =>
          prev.map(session =>
            session._id === sessionId
              ? { ...session, unreadCounts: { ...session.unreadCounts, psychic: 0 } }
              : session
          )
        );
      
        if (socketRef.current?.connected && !chatRoomsJoined.current.has(sessionId)) {
          socketRef.current.emit("join_room", `chat_${sessionId}`);
          chatRoomsJoined.current.add(sessionId);
        }
      }
    } catch (err) {
      console.error("Failed to load messages", err);
      toast.error("Failed to load messages");
    }
  }, [psychic, isAuthenticated, chatApi]);

  useEffect(() => {
    if (selectedSession && isMountedRef.current) {
      fetchMessages(selectedSession._id);
    }
  }, [selectedSession, fetchMessages]);

  useEffect(() => {
    if (messagesEndRef.current && scrollAreaRef.current && isMountedRef.current) {
      setTimeout(() => {
        const scrollArea = scrollAreaRef.current;
        if (scrollArea) {
          const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
          }
        }
      }, 100);
    }
  }, [messages[selectedSession?._id], isTyping]);

  // ========== MESSAGE FUNCTIONS ==========
  const handleSelectSession = (session) => {
    setSelectedSession(session);
    setIsTyping(false);
    setTypingUser(null);
   
    clearTimeout(typingTimeoutRef.current);
   
    if (isMobileView) {
      setShowChatList(false);
    }
  };

  const handleBackToChatList = () => {
    if (isMobileView) {
      setShowChatList(true);
      setSelectedSession(null);
      setIsTyping(false);
      setTypingUser(null);
    }
  };

  // ====== HANDLE SEND FUNCTION ======
  const handleSend = async () => {
    if (isDeactivated) {
      toast.error("Your account is deactivated. You cannot send messages.");
      return;
    }

    if (!activeSessionForUser) {
      toast.error("Paid session is required to send messages");
      return;
    }
   
    if (timerPaused) {
      toast.error("Cannot send messages while session is paused");
      return;
    }
   
    const messageContent = input.trim();
    if (!messageContent || !selectedSession || !psychic) {
      return;
    }

    const tempMessageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage = {
      _id: tempMessageId,
      tempId: tempMessageId,
      content: messageContent,
      chatSession: selectedSession._id,
      sender: {
        _id: psychic._id,
        name: psychic.name,
        image: psychic.image
      },
      senderModel: 'Psychic',
      messageType: 'text',
      status: 'sending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setMessages(prev => ({
      ...prev,
      [selectedSession._id]: [...(prev[selectedSession._id] || []), tempMessage]
    }));

    setChatSessions(prev =>
      prev.map(session =>
        session._id === selectedSession._id
          ? {
              ...session,
              lastMessage: tempMessage,
              lastMessageAt: new Date(),
            }
          : session
      )
    );

    setInput("");

    safeEmit("typing", {
      chatSessionId: selectedSession._id,
      isTyping: false
    }, { retry: false });

    try {
      const { data } = await chatApi.post('/api/psychic/messages', {
        chatSessionId: selectedSession._id,
        content: messageContent,
        messageType: "text",
      });
      
      console.log("📤 Send message response:", data);
      
      if (data.success && data.message) {
        const newMessage = data.message;
       
        if (data.blocked) {
          console.log("🚫 Message was blocked:", data);
          
          setBlockedMessages(prev => ({
            ...prev,
            [newMessage._id]: {
              reason: data.blockReason,
              redactedContent: data.redactedContent,
              warningNumber: data.warningNumber,
              isOwn: true
            }
          }));
          
          toast.warning(
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-bold">Your Message Was Blocked</p>
                <p className="text-sm">{data.blockReason}</p>
                {data.warning && (
                  <p className="text-xs mt-1">Warning #{data.warning.warningNumber}</p>
                )}
              </div>
            </div>,
            { duration: 5000 }
          );
        }

        if (data.warning?.issued) {
          console.log("⚠️ Warning issued to psychic:", data.warning);
          
          setWarningCount(prev => {
            const newCount = prev + 1;
            console.log(`⚠️ Warning count updated from ${prev} to ${newCount}`);
            return newCount;
          });
          
          setCurrentWarning({
            warningId: data.warning.id,
            warningNumber: data.warning.warningNumber,
            warningType: data.warning.type,
            message: data.warning.message,
            timestamp: new Date(),
            deactivated: data.warning.deactivated
          });
          setShowWarningModal(true);
          
          const newWarning = {
            id: data.warning.id,
            type: data.warning.type,
            number: data.warning.warningNumber,
            message: data.warning.message,
            createdAt: new Date()
          };
          setWarningHistory(prev => [newWarning, ...prev]);
          setActiveWarnings(prev => [newWarning, ...prev]);
          
          toast.warning(
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-bold">Warning #{data.warning.warningNumber}</p>
                <p className="text-sm">Do not share personal contact information</p>
              </div>
            </div>,
            { duration: 8000 }
          );
          
          if (data.warning.deactivated) {
            setIsDeactivated(true);
            setDeactivatedAt(new Date());
            toast.error(
              <div className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-bold">Account Deactivated</p>
                  <p className="text-sm">Your account has been deactivated due to multiple warnings.</p>
                </div>
              </div>,
              { duration: 0 }
            );
          }
        }
       
        setMessages(prev => {
          const sessionMessages = prev[selectedSession._id] || [];
          const updatedMessages = sessionMessages.map(msg =>
            msg.tempId === tempMessageId ? { 
              ...newMessage, 
              isBlocked: data.blocked || false,
              warningIssued: data.warning?.issued || false,
              warningNumber: data.warning?.warningNumber
            } : msg
          );
         
          return {
            ...prev,
            [selectedSession._id]: updatedMessages
          };
        });

        setChatSessions(prev =>
          prev.map(session =>
            session._id === selectedSession._id
              ? {
                  ...session,
                  lastMessage: newMessage,
                  lastMessageAt: new Date(),
                }
              : session
          )
        );

        safeEmit("send_message", {
          chatSessionId: selectedSession._id,
          message: newMessage,
          senderId: psychic._id,
          senderRole: 'psychic'
        }, { retry: true });
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (err) {
      console.error("Failed to send message", err);
      
      setMessages(prev => {
        const sessionMessages = prev[selectedSession._id] || [];
        const updatedMessages = sessionMessages.map(msg =>
          msg.tempId === tempMessageId
            ? { ...msg, status: 'failed', error: err.message }
            : msg
        );
       
        return {
          ...prev,
          [selectedSession._id]: updatedMessages
        };
      });
      
      const errorMsg = err.response?.data?.message || err.message || "Failed to send message";
      toast.error(errorMsg);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
   
    if (selectedSession) {
      clearTimeout(typingTimeoutRef.current);
     
      safeEmit("typing", {
        chatSessionId: selectedSession._id,
        isTyping: value.length > 0
      }, { retry: false });
     
      typingTimeoutRef.current = setTimeout(() => {
        safeEmit("typing", {
          chatSessionId: selectedSession._id,
          isTyping: false
        }, { retry: false });
      }, 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRefresh = () => {
    fetchChats();
    if (selectedSession) {
      fetchMessages(selectedSession._id);
      checkActiveSession(true);
    }
    fetchWarningStatus();
  };

  const handleRetryMessage = async (message) => {
    if (!selectedSession) return;
   
    try {
      const { data } = await chatApi.post('/api/psychic/messages', {
        chatSessionId: selectedSession._id,
        content: message.content,
        messageType: "text",
      });
      
      if (data.success && data.message) {
        const newMessage = data.message;
       
        setMessages(prev => {
          const sessionMessages = prev[selectedSession._id] || [];
          const updatedMessages = sessionMessages.map(msg =>
            msg._id === message._id ? newMessage : msg
          );
         
          return {
            ...prev,
            [selectedSession._id]: updatedMessages
          };
        });
        
        safeEmit("send_message", {
          chatSessionId: selectedSession._id,
          message: newMessage,
          senderId: psychic._id,
          senderRole: 'psychic'
        }, { retry: true });
      }
    } catch (err) {
      console.error("Failed to resend message", err);
      toast.error("Failed to resend message");
    }
  };

  // ========== TIMER CONTROL FUNCTIONS ==========
  const handleSessionEnd = async () => {
    if (!activeSession) return;
    
    try {
      const response = await chatApi.post('/api/chatrequest/stop-timer-psychic', {
        requestId: activeSession._id
      });
   
      if (response.data.success) {
        setActiveSession(null);
        setCountdownSeconds(0);
        setTimerPaused(false);
       
        if (syncTimerRef.current) {
          clearInterval(syncTimerRef.current);
          syncTimerRef.current = null;
        }
       
        checkActiveSession(true);
        toast.success("Session ended successfully");
      } else {
        throw new Error(response.data.message || "Failed to end session");
      }
    } catch (error) {
      console.error('Error ending session:', error);
     
      const errorMessage = error.response?.data?.message ||
                          error.message ||
                          "Failed to end session";
     
      toast.error(errorMessage);
     
      setActiveSession(null);
      setCountdownSeconds(0);
      setTimerPaused(false);
     
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    }
  };

  const handlePauseTimer = async () => {
    if (!activeSession) return;
   
    try {
      const response = await chatApi.post('/api/chatrequest/pause-timer-psychic', {
        requestId: activeSession._id
      });
    
      if (response.data.success) {
        setTimerPaused(true);
        setActiveSession(prev => ({
          ...prev,
          paidSession: {
            ...prev?.paidSession,
            isPaused: true
          }
        }));
       
        toast.success('Session paused');
      }
    } catch (error) {
      console.error('Error pausing timer:', error);
      toast.error('Failed to pause session');
    }
  };

  const handleResumeTimer = async () => {
    if (!activeSession) return;
   
    try {
      const response = await chatApi.post('/api/chatrequest/resume-timer-psychic', {
        requestId: activeSession._id
      });
    
      if (response.data.success) {
        setTimerPaused(false);
        setActiveSession(prev => ({
          ...prev,
          paidSession: {
            ...prev?.paidSession,
            isPaused: false
          }
        }));
       
        toast.success('Session resumed');
      }
    } catch (error) {
      console.error('Error resuming timer:', error);
      toast.error('Failed to resume session');
    }
  };

  // ========== REQUEST HANDLING FUNCTIONS ==========
  const handleViewRequest = () => {
    console.log('🔔 View Request clicked');
    console.log('Pending requests:', pendingRequests);
    console.log('Selected user:', selectedUser);
    console.log('Has pending request:', hasPendingRequest);
   
    if (isRinging) {
      stopRinging();
    }
   
    if (hasPendingRequest && selectedUser) {
      const requestForCurrentUser = pendingRequests.find(
        req => req.user?._id === selectedUser._id
      );
     
      if (requestForCurrentUser) {
        console.log('Found request for current user:', requestForCurrentUser);
        setRequestToShow(requestForCurrentUser);
        setUserForRequest(selectedUser);
        setShowRequestModal(true);
        return;
      }
    }
   
    if (pendingRequests.length > 0) {
      const firstRequest = pendingRequests[0];
      console.log('Showing first pending request:', firstRequest);
      setRequestToShow(firstRequest);
      setUserForRequest(firstRequest.user);
     
      const matchingSession = chatSessions.find(
        s => s.user?._id === firstRequest.user?._id
      );
      if (matchingSession && !selectedSession) {
        handleSelectSession(matchingSession);
      }
     
      setShowRequestModal(true);
    } else {
      toast.error("No pending requests found");
    }
  };

  const handleRequestAccepted = (requestData) => {
    console.log('Request accepted:', requestData);
   
    setHasNewRequest(false);
    setUnseenRequestCount(0);
   
    stopRinging();
   
    const enhancedRequestData = {
      ...requestData,
      status: 'active',
      user: requestData.user || { _id: requestData.userId }
    };
   
    setActiveSession(enhancedRequestData);
    setPendingRequests(prev =>
      prev.filter(req => req._id !== requestData._id)
    );
    setShowRequestModal(false);
    setRequestToShow(null);
    setUserForRequest(null);
   
    setTimeout(() => {
      syncTimerWithBackend(true);
    }, 1000);
   
    safeEmit('request_accepted', {
      requestId: requestData._id,
      userId: requestData.user?._id,
      psychicId: psychic._id
    }, { retry: true });
  };

  const handleRequestRejected = (requestId) => {
    setUnseenRequestCount(prev => Math.max(0, prev - 1));
    if (unseenRequestCount - 1 <= 0) {
      setHasNewRequest(false);
      stopRinging();
    }
   
    setPendingRequests(prev => prev.filter(req => req._id !== requestId));
    setShowRequestModal(false);
    setRequestToShow(null);
    setUserForRequest(null);
   
    safeEmit('request_rejected', {
      requestId,
      userId: requestToShow?.user?._id,
      psychicId: psychic._id
    }, { retry: true });
  };

  const handleStopRingingClick = () => {
    stopRinging();
    setPendingRequests([]);
  };

  // ========== FILTER SESSIONS ==========
  const filteredSessions = chatSessions.filter((session) => {
    const userName = `${session.user?.firstName || ''} ${session.user?.lastName || ''}`.toLowerCase();
    const username = session.user?.username?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
  
    return userName.includes(query) || username.includes(query);
  });

  // ========== EMOJI HANDLER ==========
  const handleEmojiSelect = (emoji) => {
    setInput(prev => prev + emoji.native + " ");
    setShowEmojiPicker(false);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  // ========== LOADING STATE ==========
  if (authLoading || (loading && !refreshing)) {
    return (
      <div className="fixed inset-0 bg-[#f0f2f5] flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <div className="h-screen bg-[#f0f2f5] overflow-hidden">
      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-0 right-0 bg-black text-white text-xs p-2 z-50 opacity-70">
          Socket: {socketConnectionStatus === 'connected' ? '✅' : '❌'} | 
          Status: {socketConnectionStatus} |
          Pending: {pendingEmits.length} |
          Attempts: {reconnectAttempts}
        </div>
      )}

      {/* Warning Modal for Psychic */}
      {currentWarning && (
        <WarningAlert
          warning={currentWarning}
          onAcknowledge={acknowledgeWarning}
          isOpen={showWarningModal}
          onClose={() => setShowWarningModal(false)}
        />
      )}

      {/* Psychic Deactivation Notice */}
      {isDeactivated && (
        <DeactivationNotice
          deactivatedAt={deactivatedAt}
          warningCount={warningCount}
          onContactSupport={() => window.location.href = '/support'}
        />
      )}

      {/* User Deactivation Notice */}
      {showUserDeactivatedNotice && (
        <UserDeactivatedNotice
          userName={deactivatedUserName}
          onClose={() => setShowUserDeactivatedNotice(false)}
        />
      )}

      {/* Incoming Call Notification */}
      <IncomingCallNotification
        activeCall={activeCall}
        callStatus={callStatus}
        onAccept={acceptCall}
        onReject={rejectCall}
      />
     
      <ActiveCallUI
        activeCall={activeCall}
        callStatus={callStatus}
        onEndCall={endCall}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
        isMuted={isMuted}
        isSpeaker={isSpeaker}
        callDuration={callDuration}
        creditsEarned={realTimeCallData.creditsEarned}
        ratePerMin={realTimeCallData.ratePerMin}
        nextEarningIn={realTimeCallData.nextEarningIn}
      />

      <div className="flex h-full">
        {/* Chat List Sidebar */}
        <div className={cn(
          "flex flex-col w-full md:w-96 bg-white border-r border-[#e9edef] transition-all duration-300 ease-in-out h-full",
          showChatList ? "flex" : "hidden md:flex"
        )}>
          {/* Header */}
          <div className="p-4 bg-[#f0f2f5]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarImage src={psychic?.image} />
                  <AvatarFallback className="bg-[#2A4A9C] text-white">
                    {psychic?.name?.[0] || "P"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-semibold text-gray-800">{psychic?.name}</h1>
                    {warningCount > 0 && !isDeactivated && (
                      <WarningBadge count={warningCount} isActive={true} />
                    )}
                    {isDeactivated && (
                      <Badge className="bg-red-600 text-white text-xs">
                        <Ban className="h-3 w-3 mr-1" />
                        Deactivated
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Médium</p>
                </div>

                <div className="flex items-center gap-2 ml-2">
                  <div className="flex items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${
                      isDeactivated ? 'bg-red-500' :
                      psychicStatus === 'busy' ? 'bg-orange-500' : 
                      psychicStatus === 'online' ? 'bg-green-500' : 
                      'bg-gray-400'
                    }`} />
                    <span className="text-xs font-medium capitalize">
                      {isDeactivated ? 'Deactivated' : psychicStatus}
                    </span>
                  </div>

                  {!isDeactivated && (
                    <>
                      <Button
                        onClick={handleSetOnline}
                        disabled={isUpdatingStatus || psychicStatus === 'online'}
                        variant={psychicStatus === 'online' ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-2 text-xs border-green-300 text-green-600 hover:bg-green-50 data-[state=on]:bg-green-600 data-[state=on]:text-white"
                      >
                        {isUpdatingStatus && psychicStatus !== 'online' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : psychicStatus === 'online' ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-white mr-1" />
                            Online ✓
                          </>
                        ) : (
                          "Go Online"
                        )}
                      </Button>

                      <Button
                        onClick={handleSetBusy}
                        disabled={isUpdatingStatus || psychicStatus === 'busy'}
                        variant={psychicStatus === 'busy' ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-2 text-xs border-orange-300 text-orange-600 hover:bg-orange-50 data-[state=on]:bg-orange-600 data-[state=on]:text-white"
                      >
                        {isUpdatingStatus && psychicStatus !== 'busy' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : psychicStatus === 'busy' ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-white mr-1" />
                            Busy ✓
                          </>
                        ) : (
                          "Set Busy"
                        )}
                      </Button>
                    </>
                  )}

                  {activeSessionForUser && psychicStatus === 'busy' && !isDeactivated && (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                      Live Session
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {warningHistory.length > 0 && !isDeactivated && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowWarningHistory(!showWarningHistory)}
                    className="h-10 w-10 text-amber-600 hover:text-amber-700 relative"
                    title="View warnings"
                  >
                    <AlertTriangle className="h-5 w-5" />
                    {warningCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {warningCount}
                      </span>
                    )}
                  </Button>
                )}

                {userWarningCount > 0 && selectedUser && !isUserDeactivated && (
                  <div className="relative mr-1">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {userWarningCount}
                    </span>
                  </div>
                )}

                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      checkNewChatRequests();
                     
                      if (isRinging) {
                        stopRinging();
                      }
                     
                      if (pendingRequests.length > 0) {
                        setRequestToShow(pendingRequests[0]);
                        setUserForRequest(pendingRequests[0].user);
                        setShowRequestModal(true);
                      } else {
                        toast.info("No new chat requests");
                      }
                    }}
                    className={cn(
                      "h-10 w-10 transition-all duration-300",
                      hasNewRequest
                        ? "text-amber-600 hover:text-amber-700 ring-2 ring-amber-500 ring-offset-2"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                    title={hasNewRequest ? `${unseenRequestCount} new request(s)` : "Check requests"}
                    disabled={isDeactivated}
                  >
                    <Bell className="h-5 w-5" />
                  </Button>
                 
                  {hasNewRequest && (
                    <div className="absolute -top-1 -right-1">
                      <span className="relative flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                          {unseenRequestCount > 9 ? '9+' : unseenRequestCount}
                        </span>
                      </span>
                    </div>
                  )}
                 
                  {isRinging && (
                    <div className="absolute -top-1 -left-1">
                      <div className="h-6 w-6 rounded-full bg-green-500 border-2 border-white animate-ping"></div>
                    </div>
                  )}
                </div>
               
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing || isDeactivated}
                  className="h-10 w-10 text-gray-500 hover:text-gray-700"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-gray-500 hover:text-gray-700"
                  disabled={isDeactivated}
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>
          
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-white border-gray-300 focus:border-[#00a884] rounded-lg text-sm"
                disabled={isDeactivated}
              />
            </div>
          </div>

          {/* Request Notification Panel */}
          {hasNewRequest && pendingRequests.length > 0 && !isDeactivated && (
            <div className="mx-3 mb-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center animate-bounce">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-800">
                      New Chat Request{unseenRequestCount > 1 ? 's' : ''}!
                    </h3>
                    <p className="text-sm text-amber-600">
                      {unseenRequestCount} user{unseenRequestCount > 1 ? 's are' : ' is'} waiting to chat with you
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setRequestToShow(pendingRequests[0]);
                    setUserForRequest(pendingRequests[0].user);
                    setShowRequestModal(true);
                    if (isRinging) {
                      stopRinging();
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700"
                  size="sm"
                >
                  View Now
                </Button>
              </div>
            </div>
          )}

          {/* Warning History Panel */}
          {showWarningHistory && warningHistory.length > 0 && (
            <div className="mx-3 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Warning History
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWarningHistory(false)}
                  className="h-6 w-6 p-0"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {warningHistory.slice(0, 3).map((warning, idx) => (
                  <div key={idx} className="text-xs p-2 bg-white rounded border border-red-100">
                    <div className="flex justify-between">
                      <span className="font-medium text-red-700">
                        Warning #{warning.number}
                      </span>
                      <span className="text-gray-500">
                        {new Date(warning.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">Type: {warning.type}</p>
                  </div>
                ))}
                {warningHistory.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{warningHistory.length - 3} more warnings
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Chat List */}
          <ScrollArea className="flex-1 bg-white">
            <div className="p-1">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 rounded-full bg-[#f5f6f6] flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No chats yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {searchQuery ? "No users match your search" : "Users will appear here when they message you"}
                  </p>
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const hasActiveRequest = activeSession?.user?._id === session.user?._id &&
                                          activeSession?.status === 'active';
                  const hasPendingRequestForSession = pendingRequests.some(req => req.user?._id === session.user?._id);
                  const isUserDeactivatedInSession = session.user?.isActive === false;
                 
                  return (
                    <div
                      key={session._id}
                      onClick={() => !isDeactivated && handleSelectSession(session)}
                      className={cn(
                        "flex items-center p-3 hover:bg-[#f5f6f6] cursor-pointer border-b border-[#f0f2f5]",
                        selectedSession?._id === session._id && "bg-[#f0f2f5]",
                        hasActiveRequest && "border-l-4 border-l-[#00a884]",
                        hasPendingRequestForSession && "border-l-4 border-l-[#ffcc00]",
                        (isDeactivated || isUserDeactivatedInSession) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={session.user?.image} />
                          <AvatarFallback className="bg-[#2A4A9C] text-white font-medium">
                            {session.user?.firstName?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {onlineStatus[session.user?._id] && !isDeactivated && !isUserDeactivatedInSession && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                        )}
                        {hasActiveRequest && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-white font-bold">$</span>
                          </div>
                        )}
                        {hasPendingRequestForSession && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center animate-pulse">
                            <Bell className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {isUserDeactivatedInSession && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                            <Ban className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    
                      <div className="flex-1 min-w-0 ml-3">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-semibold text-gray-800 text-sm truncate">
                            {session.user?.username} 
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatLastMessageTime(session.lastMessageAt)}
                          </span>
                        </div>
                      
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <p className="text-sm text-gray-600 truncate max-w-[180px]">
                              {hasActiveRequest ? (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Clock className="h-3 w-3" />
                                  Paid session: {formatCountdown(countdownSeconds)}
                                </span>
                              ) : hasPendingRequestForSession ? (
                                <span className="flex items-center gap-1 text-yellow-600 animate-pulse">
                                  <Bell className="h-3 w-3" />
                                  Incoming request!
                                </span>
                              ) : isUserDeactivatedInSession ? (
                                <span className="flex items-center gap-1 text-red-600">
                                  <Ban className="h-3 w-3" />
                                  User deactivated
                                </span>
                              ) : session.lastMessage?.content || "No messages yet"}
                            </p>
                            {session.unreadCounts?.psychic > 0 && (
                              <span className="ml-1">•</span>
                            )}
                          </div>
                          {session.unreadCounts?.psychic > 0 && (
                            <span className="bg-[#00a884] text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                              {session.unreadCounts.psychic}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      
        {/* Main Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-[#efeae2] bg-chat-pattern transition-all duration-300 ease-in-out h-full",
          !showChatList ? "flex" : "hidden md:flex"
        )}>
          {selectedSession ? (
            <div className="flex flex-col h-full">
              {/* Unified Chat Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <div className="px-4 py-3">
                  {/* Top Row: Chat Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {isMobileView && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleBackToChatList}
                          className="md:hidden text-gray-600 hover:text-gray-900"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </Button>
                      )}
                     
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                          {selectedUser?.firstName?.[0] || 'U'}
                        </div>
                        {hasPendingRequest && !activeSessionForUser && (
                          <div className="absolute -top-1 -right-1">
                            <Badge className="bg-amber-500 text-white animate-pulse px-2 py-0.5 text-xs">
                              <Bell className="h-2 w-2 mr-1" />
                              Request
                            </Badge>
                          </div>
                        )}
                        {hasPendingRequest && !activeSessionForUser && (isRinging || hasUnseenRequest) && (
                          <div className="absolute -bottom-1 -right-1">
                            <div className="h-5 w-5 rounded-full bg-red-500 border-2 border-white animate-ping"></div>
                          </div>
                        )}
                        {isUserDeactivated && (
                          <div className="absolute -bottom-1 -right-1">
                            <Badge className="bg-red-600 text-white text-xs">
                              <Ban className="h-3 w-3 mr-1" />
                              Deactivated
                            </Badge>
                          </div>
                        )}
                      </div>
                     
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <h2 className="font-bold text-lg text-gray-800">
                              {selectedUser?.username 
                                ? `${selectedUser.username}`
                                : `${selectedUser?.firstName} ${selectedUser?.lastName}`.trim()
                              }
                            </h2>
                            {userWarningCount > 0 && !isUserDeactivated && (
                              <Badge className="bg-orange-500 text-white text-xs mt-1">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                User Warning {userWarningCount}/3
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <CreditCard className="h-3 w-3" />
                            <span className="font-medium">Credit {psychic?.ratePerMin || 1}/min</span>
                          </div>
                          {!isDeactivated && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={forceTimerRefresh}
                              disabled={isRefreshingTimer}
                              className="h-6 px-2"
                              title="Refresh timer"
                            >
                              <RefreshCw className={`h-3 w-3 ${isRefreshingTimer ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                   
                    <div className="flex items-center gap-2">
                      {hasPendingRequest && !activeSessionForUser && (isRinging || hasUnseenRequest) && !isDeactivated && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleStopRingingClick}
                          className="border-red-300 text-red-600 hover:bg-red-50 animate-pulse"
                        >
                          <BellOff className="h-4 w-4 mr-2" />
                          Stop Ringing
                        </Button>
                      )}
                     
                      {activeSessionForUser && !isUserDeactivated && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-gray-500 hover:text-gray-700"
                          disabled={!activeSessionForUser || isDeactivated || isUserDeactivated}
                          title={activeSessionForUser ? "Audio Call" : "Start session to enable calls"}
                          onClick={() => {
                            toast.info("Users can initiate calls from their side when session is active");
                          }}
                        >
                          <Phone className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                 
                  {/* Bottom Row: Timer Controls */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                      {/* Status Panel */}
                      <div className="p-4 border-r border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`
                            h-3 w-3 rounded-full flex-shrink-0
                            ${isDeactivated ? 'bg-red-500' :
                              isUserDeactivated ? 'bg-red-500' :
                              activeSession?.status === 'active' && activeSessionForUser ? 'bg-green-500 animate-pulse' :
                              pendingRequests.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'}
                          `}></div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {isDeactivated ? 'Account Deactivated' :
                               isUserDeactivated ? 'User Deactivated' :
                               activeSession?.status === 'active' && activeSessionForUser ? 'Active Session' :
                               pendingRequests.length > 0 ? `Request Pending (${pendingRequests.length})` : 'Ready'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {isDeactivated ? 'Contact support for assistance' :
                               isUserDeactivated ? 'This user has been deactivated' :
                               activeSession?.status === 'active' && activeSessionForUser ?
                                `With ${selectedUser?.firstName}` :
                               pendingRequests.length > 0 ?
                                `${pendingRequests.length} new chat request(s)!` :
                                'Awaiting request'}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Timer Panel */}
                      {activeSession?.status === 'active' && activeSessionForUser && (
                        <div className="p-4 border-r border-gray-100 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Time Remaining</div>
                              <div className="text-2xl font-bold text-gray-800 font-mono">
                                {formatCountdown(countdownSeconds)}
                              </div>
                            </div>
                            <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                              LIVE
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Action Panel */}
                      <div className="p-4">
                        {isDeactivated ? (
                          <Button
                            disabled
                            className="w-full bg-red-100 text-red-600 cursor-not-allowed"
                            size="sm"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Account Deactivated
                          </Button>
                        ) : isUserDeactivated ? (
                          <Button
                            disabled
                            className="w-full bg-red-100 text-red-600 cursor-not-allowed"
                            size="sm"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            User Deactivated
                          </Button>
                        ) : activeSession?.status === 'active' && activeSessionForUser ? (
                          <Button
                            onClick={async () => {
                              if (!window.confirm("Are you sure you want to end this paid session?")) {
                                return;
                              }
                              try {
                                await handleSessionEnd();
                              } catch (error) {
                                console.error('Error ending session:', error);
                                toast.error("Failed to end session");
                              }
                            }}
                            variant="outline"
                            className="w-full border-red-300 text-red-600 hover:bg-red-50"
                            size="sm"
                            disabled={!activeSessionForUser}
                          >
                            <StopCircle className="mr-2 h-4 w-4" />
                            End Session
                          </Button>
                        ) : pendingRequests.length > 0 ? (
                          <Button
                            onClick={() => {
                              handleViewRequest();
                              if (isRinging) {
                                stopRinging();
                              }
                            }}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 animate-pulse"
                            size="sm"
                          >
                            <Bell className="mr-2 h-4 w-4" />
                            View Request ({pendingRequests.length})
                          </Button>
                        ) : (
                          <div className="text-center py-2">
                            <div className="text-sm text text-gray-500">Ready to chat</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Messages Area */}
              <ScrollArea
                ref={scrollAreaRef}
                className="flex-1 overflow-y-auto"
              >
                <div className="p-4">
                  <div className="space-y-2 max-w-3xl mx-auto">
                    {currentMessages.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="mx-auto h-16 w-16 rounded-full bg-white/80 flex items-center justify-center mb-4 shadow-sm">
                          <Sparkles className="h-8 w-8 text-[#00a884]" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          {isDeactivated ? "Account Deactivated" :
                           isUserDeactivated ? "User Deactivated" :
                           activeSessionForUser ? "Paid Session Active!" :
                           pendingRequests.length > 0 ? "Request Pending..." :
                           "Start a conversation"}
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                          {isDeactivated ? "Your account has been deactivated. Please contact support for assistance." :
                           isUserDeactivated ? "This user has been deactivated. The chat session has ended." :
                           activeSessionForUser
                            ? `Paid session is active. Timer: ${formatCountdown(countdownSeconds)}`
                            : pendingRequests.length > 0
                            ? `Waiting for you to accept the chat request...`
                            : `Send your first message to ${selectedUser?.firstName}`
                          }
                        </p>
                        {pendingRequests.length > 0 && (isRinging || hasUnseenRequest) && !isDeactivated && !isUserDeactivated && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg animate-pulse">
                            <div className="flex items-center justify-center gap-2">
                              <Bell className="h-5 w-5 text-red-600 animate-bounce" />
                              <span className="text-sm font-medium text-red-600">
                                INCOMING CHAT REQUEST - ANSWER NOW!
                              </span>
                              <Bell className="h-5 w-5 text-red-600 animate-bounce" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="text-center my-4">
                          <span className="bg-[#e1f5d5] text-gray-600 text-xs px-3 py-1 rounded-full">
                            Today
                          </span>
                        </div>
                        {currentMessages.map((msg, index) => {
                          const isPsychic = msg.senderModel === 'Psychic';
                          const isSystem = msg.senderModel === 'System';
                          const isWarning = msg.isWarning;
                          
                          const isBlocked = blockedMessages[msg._id] || msg.isBlocked === true;
                          
                          const showTime = index === currentMessages.length - 1 ||
                                         currentMessages[index + 1]?.senderModel !== msg.senderModel;
                          
                          const displayName = msg.displayName || 
                                             (isPsychic 
                                               ? psychic?.name || 'You'
                                               : (msg.sender?.username 
                                                  ? `${msg.sender.username}` 
                                                  : `${msg.sender?.firstName || ''} ${msg.sender?.lastName || ''}`.trim() || 'User'));
                          
                          if (isSystem || isWarning) {
                            return (
                              <div key={msg._id || msg.tempId} className="flex justify-center">
                                <div className={cn(
                                  "px-4 py-2 rounded-lg max-w-[80%] text-center",
                                  isWarning ? "bg-red-100 border border-red-300" : "bg-gray-100 border border-gray-300"
                                )}>
                                  <div className="flex items-center justify-center gap-2">
                                    {isWarning && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                    <p className="text-sm text-gray-700">{msg.content}</p>
                                    {isWarning && msg.warningNumber && (
                                      <Badge className="bg-red-500 text-white text-xs ml-2">
                                        Warning #{msg.warningNumber}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          
                          if (isBlocked) {
                            const blockedInfo = blockedMessages[msg._id] || {
                              reason: msg.blockReason || 'Message contained prohibited content',
                              warningNumber: msg.warningNumber,
                              isOwn: isPsychic
                            };
                            
                            return (
                              <div
                                key={msg._id || msg.tempId}
                                className={cn(
                                  "flex",
                                  isPsychic ? "justify-end" : "justify-start"
                                )}
                              >
                                <div className="max-w-[65%]">
                                  {!isPsychic && (
                                    <div className="flex items-center gap-1 mb-1 ml-1">
                                      <span className="text-xs font-medium text-gray-700">
                                        {msg.sender?.username || displayName}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <BlockedMessageIndicator 
                                    message={blockedInfo}
                                    isOwn={isPsychic}
                                  />
                                  
                                  {showTime && (
                                    <div className={cn(
                                      "flex items-center gap-1 mt-1 text-xs",
                                      isPsychic ? "justify-end" : "justify-start"
                                    )}>
                                      <span className="text-gray-500">
                                        {formatMessageTime(msg.createdAt)}
                                      </span>
                                      {isPsychic && (
                                        <span className="ml-1">
                                          {getStatusIcon('blocked')}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div
                              key={msg._id || msg.tempId}
                              className={cn(
                                "flex",
                                isPsychic ? "justify-end" : "justify-start"
                              )}
                            >
                              <div className="max-w-[65%]">
                                {!isPsychic && (
                                  <div className="flex items-center gap-1 mb-1 ml-1">
                                    <span className="text-xs font-medium text-gray-700">
                                      {msg.sender?.username ? `${msg.sender.username}` : displayName}
                                    </span>
                                    
                                    {msg.sender?.username && (msg.sender?.firstName || msg.sender?.lastName) && (
                                      <>
                                        <span className="text-xs text-gray-500">•</span>
                                        <span className="text-xs text-gray-500">
                                          {`${msg.sender.firstName || ''} ${msg.sender.lastName || ''}`.trim()}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                )}
                                
                                <div
                                  className={cn(
                                    "px-3 py-2 rounded-lg relative",
                                    isPsychic
                                      ? "bg-[#d9fdd3] rounded-br-none"
                                      : "bg-white rounded-bl-none shadow-sm",
                                    msg.status === 'failed' && "border border-red-300"
                                  )}
                                >
                                  <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                    {msg.content}
                                  </p>
                                 
                                  <div className={cn(
                                    "flex items-center gap-1 mt-1 text-xs",
                                    isPsychic ? "justify-end" : "justify-start"
                                  )}>
                                    <span className="text-gray-500">
                                      {formatMessageTime(msg.createdAt)}
                                    </span>
                                    {isPsychic && (
                                      <>
                                        <span className="ml-1">
                                          {getStatusIcon(msg.status)}
                                        </span>
                                        {msg.status === 'failed' && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 px-1 text-red-500 hover:text-red-600"
                                            onClick={() => handleRetryMessage(msg)}
                                            disabled={isDeactivated}
                                          >
                                            Retry
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                       
                        {isTyping && !isDeactivated && !isUserDeactivated && (
                          <div className="flex justify-start">
                            <div className="bg-white px-3 py-2 rounded-lg rounded-bl-none shadow-sm max-w-[120px]">
                              <div className="flex items-center space-x-2">
                                <div className="flex space-x-1">
                                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                </div>
                                <span className="text-xs text-gray-500">{selectedUser?.firstName} is typing...</span>
                              </div>
                            </div>
                          </div>
                        )}
                       
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                </div>
              </ScrollArea>
              
              {/* Message Input Area */}
              <div className="bg-[#f0f2f5] p-3 relative">
                <div className="flex items-center gap-2">
                  {/* Emoji Picker Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-gray-500 hover:text-gray-700 relative"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    type="button"
                    disabled={!activeSessionForUser || timerPaused || isDeactivated || isUserDeactivated}
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                  
                  {/* Emoji Picker Modal */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-16 left-0 z-50">
                      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                        <Picker
                          data={data}
                          onEmojiSelect={handleEmojiSelect}
                          theme="light"
                          previewPosition="none"
                          skinTonePosition="none"
                          navPosition="bottom"
                          perLine={8}
                          maxFrequentRows={1}
                          emojiButtonSize={32}
                          emojiSize={20}
                        />
                      </div>
                    </div>
                  )}
                 
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      placeholder={
                        isDeactivated ? "Account deactivated - cannot send messages" :
                        isUserDeactivated ? "User deactivated - cannot send messages" :
                        activeSessionForUser 
                          ? "Type a message (Paid session active)" 
                          : "Type a message (Paid session required)"
                      }
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        
                        if (activeSessionForUser && e.target.value.length > 0 && psychicStatus !== 'busy' && !isDeactivated && !isUserDeactivated) {
                          updateStatusToBusy();
                        }
                      }}
                      onFocus={() => {
                        if (activeSessionForUser && psychicStatus !== 'busy' && !isDeactivated && !isUserDeactivated) {
                          updateStatusToBusy();
                        }
                      }}
                      onBlur={() => {
                        if (!activeSessionForUser && psychicStatus === 'busy' && !isDeactivated) {
                          updateStatusToOnline();
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      className="h-12 pl-4 pr-12 bg-white border-none rounded-full focus-visible:ring-0"
                      disabled={!activeSessionForUser || isDeactivated || isUserDeactivated}
                    />
                    
                    {isDeactivated && (
                      <div className="absolute inset-0 bg-gray-100/80 rounded-full flex items-center justify-center">
                        <span className="text-sm text-gray-500 flex items-center gap-2">
                          <Ban className="h-3 w-3" />
                          Account désactivé - contact support
                        </span>
                      </div>
                    )}
                    
                    {!isDeactivated && isUserDeactivated && (
                      <div className="absolute inset-0 bg-gray-100/80 rounded-full flex items-center justify-center">
                        <span className="text-sm text-gray-500 flex items-center gap-2">
                          <Ban className="h-3 w-3" />
                          User deactivated - cannot send messages
                        </span>
                      </div>
                    )}
                    
                    {!isDeactivated && !isUserDeactivated && !activeSessionForUser && (
                      <div className="absolute inset-0 bg-gray-100/80 rounded-full flex items-center justify-center">
                        <span className="text-sm text-gray-500 flex items-center gap-2">
                          <DollarSign className="h-3 w-3" />
                          Paid session required to send messages
                        </span>
                      </div>
                    )}
                    
                    {!isDeactivated && !isUserDeactivated && activeSessionForUser && timerPaused && (
                      <div className="absolute inset-0 bg-gray-100/80 rounded-full flex items-center justify-center">
                        <span className="text-sm text-gray-500 flex items-center gap-2">
                          <Pause className="h-3 w-3" />
                          Session is paused - resume to send messages
                        </span>
                      </div>
                    )}
                    
                    {containsOnlyEmoji(input) && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-lg">🎯</span>
                      </div>
                    )}
                  </div>
                 
                  {/* Send Button */}
                  {activeSessionForUser && !timerPaused && input.trim() && !isDeactivated && !isUserDeactivated && (
                    <Button
                      onClick={handleSend}
                      size="icon"
                      className="h-12 w-12 rounded-full bg-[#2A4A9C] hover:bg-[#2A4A9C]/90"
                    >
                      <Send className="h-5 w-5 text-white" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#efeae2] bg-chat-pattern">
              <div className="max-w-md text-center px-4">
                <div className="mx-auto h-24 w-24 rounded-full bg-white/80 flex items-center justify-center mb-6 shadow-lg">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#00a884]/20 to-[#5ba4f3]/10 flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-[#00a884]" />
                  </div>
                </div>
                <h1 className="text-3xl font-light text-gray-700 mb-2">
                  Psychic Chat
                </h1>
                <p className="text-gray-500 mb-8 text-base">
                  {isDeactivated ? (
                    "Your account has been deactivated. Please contact support."
                  ) : chatSessions.length === 0 ? (
                    "Send and receive messages with your clients"
                  ) : (
                    "Select a chat to start messaging"
                  )}
                </p>
                {isDeactivated && (
                  <Button
                    onClick={() => window.location.href = '/support'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Contact Support
                  </Button>
                )}
                {!isDeactivated && chatSessions.length === 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Shield className="h-4 w-4" />
                    <span>End-to-end encrypted</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Chat Request Modal */}
      {requestToShow && (
        <PsychicChatRequestModal
          request={requestToShow}
          user={userForRequest}
          psychic={psychic}
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setRequestToShow(null);
            setUserForRequest(null);
          }}
          onAccepted={handleRequestAccepted}
          onRejected={handleRequestRejected}
        />
      )}
      
      <style jsx>{`
        .bg-chat-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23e1e1e1' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  );
};

export default PsychicChats;