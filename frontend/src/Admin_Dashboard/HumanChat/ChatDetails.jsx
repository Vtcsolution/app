import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquare,
  Loader2,
  AlertCircle,
  User,
  Clock,
  DollarSign,
  Timer,
  Star,
  RefreshCw
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Dashboard_Navbar from "../Admin_Navbar";
import Doctor_Side_Bar from "../SideBar";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import axios from 'axios';

const ChatDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState(false);
  const [chatData, setChatData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [originalId, setOriginalId] = useState(id);

  useEffect(() => {
    if (id) {
      setOriginalId(id);
      fetchChatDetails();
    }
  }, [id]);

  const fetchChatDetails = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching chat details for ID:', id);
      
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/${id}`,
        { 
          withCredentials: true,
          timeout: 10000
        }
      );
      
      console.log('✅ Chat Details Response:', response.data);

      if (response.data.success) {
        // Check if this is a redirect response (paid timer without direct chat)
        if (response.data.redirect) {
          // This is a ChatRequest ID, we need to redirect to the HumanChatSession ID
          setIsRedirecting(true);
          
          toast({
            title: "Redirecting...",
            description: "Found related chat session for this paid timer",
            variant: "default"
          });
          
          // Extract the session ID from the redirect URL
          const sessionId = response.data.sessionId || response.data.redirect.split('/').pop();
          
          // Navigate to the actual chat session
          setTimeout(() => {
    navigate(`/admin/dashboard/chat-details/${sessionId}`, { replace: true });
  }, 500);
          
          return;
        }
        
        // If we get here, it's a direct HumanChatSession response
        setChatData(response.data.data);
        
        // Access messages correctly
        const chatMessages = response.data.data?.messages?.history || [];
        setMessages(chatMessages);
        
        console.log('📨 Messages loaded:', chatMessages.length);
        
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to fetch chat details",
          variant: "destructive"
        });
        navigate('/admin/dashboard/human-chat');
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load chat details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
      
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
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

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Dashboard_Navbar side={side} setSide={setSide} />
        <div className="flex">
          <Doctor_Side_Bar side={side} setSide={setSide} />
          <main className="flex-1 p-6 ml-0 lg:ml-64 flex flex-col items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Redirecting to Chat Session</h2>
              <p className="text-muted-foreground mb-4">
                Paid timer ID: {originalId?.substring(0, 12)}...
              </p>
              <p className="text-sm text-muted-foreground">
                Finding associated chat session...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Dashboard_Navbar side={side} setSide={setSide} />
        <div className="flex">
          <Doctor_Side_Bar side={side} setSide={setSide} />
          <main className="flex-1 p-6 ml-0 lg:ml-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-muted-foreground">Loading chat details...</span>
          </main>
        </div>
      </div>
    );
  }

  if (!chatData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Dashboard_Navbar side={side} setSide={setSide} />
        <div className="flex">
          <Doctor_Side_Bar side={side} setSide={setSide} />
          <main className="flex-1 p-6 ml-0 lg:ml-64 flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Chat Not Found</h2>
            <p className="text-muted-foreground mb-4">
              No chat session found for ID: {id?.substring(0, 12)}...
            </p>
            <Button onClick={() => navigate('/admin/dashboard/human-chat')}>
              Back to Dashboard
            </Button>
          </main>
        </div>
      </div>
    );
  }

  // Safely extract data with defaults
  const user = chatData.participants?.user || {};
  const psychic = chatData.participants?.psychic || {};
  const session = chatData.session || {};
  const statistics = chatData.statistics || {};
  const payment = chatData.payment || {};
  const messageData = chatData.messages || {};
  const messageHistory = messageData.history || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard_Navbar side={side} setSide={setSide} />
      <div className="flex">
        <Doctor_Side_Bar side={side} setSide={setSide} />
        <main className="flex-1 mt-10 p-6 ml-0 lg:ml-64 transition-all duration-300">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/dashboard/human-chat')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Chat Conversation
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">
                    Session ID: {id?.substring(0, 12)}...
                  </p>
                  {originalId !== id && (
                    <Badge variant="outline" className="text-xs">
                      From paid timer: {originalId?.substring(0, 8)}...
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchChatDetails} 
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">{user.email || 'No email'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Psychic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Psychic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {psychic.image ? (
                      <AvatarImage src={psychic.image} />
                    ) : (
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {psychic.name?.[0]?.toUpperCase() || 'P'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{psychic.name || 'Unknown Psychic'}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-yellow-600" />
                        ${(psychic.ratePerMin || 0).toFixed(2)}/min
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-600" />
                        {(psychic.averageRating || 0).toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Session Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge className={
                      session.status === 'active' 
                        ? "bg-green-500/10 text-green-700 border-green-500/20"
                        : session.status === 'ended'
                        ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                        : session.status === 'waiting'
                        ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                        : "bg-gray-500/10 text-gray-700 border-gray-500/20"
                    }>
                      {session.status || 'unknown'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Duration:</span>
                    <span className="text-sm flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(statistics.duration?.seconds || 0)}
                    </span>
                  </div>
                  {(payment?.totalAmountPaid || 0) > 0 ? (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Amount:</span>
                      <span className="text-sm flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-yellow-600" />
                        ${(payment.totalAmountPaid || 0).toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <Badge variant="outline" className="text-xs">
                        Free Session
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>
                {messageData.total || 0} message{(messageData.total || 0) !== 1 ? 's' : ''} • 
                Last activity: {formatDate(session.lastMessageAt)}
                {messageData.unreadMessages > 0 && ` • ${messageData.unreadMessages} unread`}
                {originalId !== id && (
                  <span className="ml-2">
                    • Linked from paid timer
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto p-4 border rounded-md bg-gray-50">
                {messageHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">No messages found</p>
                    <p className="text-sm mt-1">This chat has no messages yet.</p>
                  </div>
                ) : (
                  messageHistory.map((message, index) => {
                    const isUser = message.sender?.type === 'user';
                    const senderName = message.sender?.name || (isUser ? user.name : psychic.name);
                    
                    return (
                      <div
                        key={message._id || index}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] rounded-lg p-3 ${
                          isUser 
                            ? 'bg-blue-500 text-white rounded-br-none' 
                            : 'bg-white text-gray-900 rounded-bl-none border'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                              isUser ? 'bg-blue-400' : 'bg-gray-200'
                            }`}>
                              <User className={`h-3 w-3 ${isUser ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">
                                  {senderName || (isUser ? 'User' : 'Psychic')}
                                </span>
                                <Badge variant="outline" className="text-xs h-5 px-1">
                                  {isUser ? 'User' : 'Psychic'}
                                </Badge>
                              </div>
                              <span className="text-xs opacity-70">
                                {formatDate(message.createdAt)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm mt-2">{message.content}</p>
                          {message.messageType !== 'text' && (
                            <div className="mt-2 text-xs opacity-70">
                              Type: {message.messageType}
                            </div>
                          )}
                          {!message.isRead && (
                            <div className="mt-1 text-xs opacity-70 italic">
                              Unread
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default ChatDetails;