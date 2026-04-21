"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Phone, 
  Clock, 
  Calendar, 
  Search, 
  Star, 
  Headphones,
  Download,
  Loader2,
  AlertCircle
} from "lucide-react";
import Navigation from "./Navigator";
import { useAuth } from "./screen/AuthContext";
import axios from "axios";

const ChatSessions = () => {
  // Color scheme
  const colors = {
    deepPurple: "#2B1B3F",
    antiqueGold: "#C9A24D",
    softIvory: "#F5F3EB",
    lightGold: "#E8D9B0",
    darkPurple: "#1A1129",
    mediumPurple: "#3D2B56",
  };

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sessionType, setSessionType] = useState("all");
  const [playingAudio, setPlayingAudio] = useState(null);

  // Fetch session data when component mounts
  useEffect(() => {
    if (user?._id) {
      fetchUserSessions();
    }
  }, [user]);


const fetchUserSessions = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('token');
    
    // Change this line to use /summary instead of /${user._id}
    const response = await axios.get(
      `${import.meta.env.VITE_BASE_URL}/api/usersession/summary`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      setSessionData(response.data.data);
    }
  } catch (err) {
    console.error('Error fetching sessions:', err);
    setError(err.response?.data?.message || 'Échec du chargement des sessions');
  } finally {
    setLoading(false);
  }
};

  // Combine calls and chats for display
  const getAllSessions = () => {
    if (!sessionData) return [];

    const sessions = [];

    // Add call sessions
    sessionData.calls?.sessions?.forEach(call => {
      sessions.push({
        id: call._id,
        type: 'call',
        psychicId: call.psychicId?._id,
        psychicName: call.psychicId?.displayName || call.psychicId?.name || 'Inconnu',
        psychicImage: call.psychicId?.profileImage,
        specialty: call.psychicId?.specialty || 'Médium',
        lastMessage: `Appel ${call.status === 'in-progress' ? 'en cours' : 'terminé'}`,
        lastMessageTime: new Date(call.updatedAt).toLocaleTimeString(),
        unreadCount: 0,
        totalMessages: 0,
        duration: call.startTime && call.endTime ? 
          formatDuration(Math.floor((new Date(call.endTime) - new Date(call.startTime)) / 1000)) : 
          call.status === 'in-progress' ? 'En cours' : 'Pas de durée',
        date: call.startTime || call.createdAt,
        sessionType: 'audio',
        status: call.status === 'in-progress' ? 'active' : 
                call.status === 'ended' ? 'completed' : call.status,
        creditsUsed: call.totalCreditsUsed || 0,
        rating: 0, // You might want to add rating to your schema
        recordingUrl: call.recordingUrl
      });
    });

    // Add chat sessions
    sessionData.chats?.sessions?.forEach(chat => {
      sessions.push({
        id: chat._id,
        type: 'chat',
        psychicId: chat.psychicId?._id,
        psychicName: chat.psychicId?.displayName || chat.psychicId?.name || 'Inconnu',
        psychicImage: chat.psychicId?.profileImage,
        specialty: chat.psychicId?.specialty || 'Médium',
        lastMessage: chat.recentMessages?.[0]?.content || 'Aucun message pour le moment',
        lastMessageTime: new Date(chat.updatedAt).toLocaleTimeString(),
        unreadCount: chat.messageStats?.unread || 0,
        totalMessages: chat.messageStats?.total || 0,
        duration: 'Session de chat',
        date: chat.updatedAt || chat.createdAt,
        sessionType: 'chat',
        status: chat.status || 'completed',
        creditsUsed: 0, // Chats might not use credits
        rating: 0,
        recentMessages: chat.recentMessages
      });
    });

    // Sort by date (most recent first)
    return sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds < 0) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 && hours === 0) parts.push(`${remainingSeconds}s`);
    
    return parts.join(' ') || '0m';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSessionTypeIcon = (type) => {
    switch (type) {
      case 'audio': return <Headphones className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getSessionTypeColor = (type) => {
    switch (type) {
      case 'audio':
      case 'call':
        return '#10B981';
      default: return colors.antiqueGold;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'in-progress':
        return '#10B981';
      case 'completed':
      case 'ended':
        return colors.antiqueGold;
      case 'initiated':
      case 'ringing':
        return '#F59E0B';
      case 'failed':
      case 'rejected':
        return '#EF4444';
      default:
        return colors.antiqueGold;
    }
  };

  const filteredSessions = getAllSessions().filter(session => {
    const matchesSearch = session.psychicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || 
                         (filter === "active" && ['active', 'in-progress', 'initiated', 'ringing'].includes(session.status)) ||
                         (filter === "completed" && ['completed', 'ended'].includes(session.status));
    const matchesType = sessionType === "all" || session.sessionType === sessionType;
    return matchesSearch && matchesFilter && matchesType;
  });

  if (loading) {
    return (
      <div className="px-2 sm:px-4" style={{ backgroundColor: colors.softIvory }}>
        <div className="max-w-7xl mx-auto pb-10">
          <Navigation />
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.antiqueGold }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-2 sm:px-4" style={{ backgroundColor: colors.softIvory }}>
        <div className="max-w-7xl mx-auto pb-10">
          <Navigation />
          <Card className="shadow-sm text-center py-12" style={{ backgroundColor: colors.lightGold + "20" }}>
            <CardContent>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ backgroundColor: colors.lightGold }}>
                <AlertCircle className="h-8 w-8" style={{ color: colors.antiqueGold }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.deepPurple }}>
                Erreur de Chargement
              </h3>
              <p className="mb-4" style={{ color: colors.deepPurple + "CC" }}>
                {error}
              </p>
              <Button
                onClick={fetchUserSessions}
                style={{ 
                  backgroundColor: colors.antiqueGold,
                  color: colors.deepPurple
                }}
              >
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4" style={{ backgroundColor: colors.softIvory }}>
      <div className="max-w-7xl mx-auto pb-10">
        <Navigation />
        
        <div className="mt-4">
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.deepPurple }}>
            Historique des Sessions
          </h1>
          <p className="text-lg" style={{ color: colors.deepPurple + "CC" }}>
            Gérez vos sessions de chat et d'appel avec les médiums
          </p>
        </div>

        {/* Stats */}
        {sessionData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-sm" style={{ backgroundColor: colors.lightGold + "40" }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: colors.deepPurple + "CC" }}>Sessions Totales</p>
                    <p className="text-2xl font-bold" style={{ color: colors.deepPurple }}>
                      {sessionData.summary.totalCalls + sessionData.summary.totalChats}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.antiqueGold + "20" }}>
                    <MessageCircle className="h-6 w-6" style={{ color: colors.antiqueGold }} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm" style={{ backgroundColor: colors.lightGold + "40" }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: colors.deepPurple + "CC" }}>Médiums</p>
                    <p className="text-2xl font-bold" style={{ color: colors.deepPurple }}>
                      {sessionData.summary.totalPsychicsInteracted}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.antiqueGold + "20" }}>
                    <Star className="h-6 w-6" style={{ color: colors.antiqueGold }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" style={{ backgroundColor: colors.lightGold + "40" }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: colors.deepPurple + "CC" }}>Durée des Appels</p>
                    <p className="text-2xl font-bold" style={{ color: colors.deepPurple }}>
                      {sessionData.summary.totalCallDuration}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.antiqueGold + "20" }}>
                    <Phone className="h-6 w-6" style={{ color: colors.antiqueGold }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" style={{ backgroundColor: colors.lightGold + "40" }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: colors.deepPurple + "CC" }}>Messages</p>
                    <p className="text-2xl font-bold" style={{ color: colors.deepPurple }}>
                      {sessionData.summary.totalMessages}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.antiqueGold + "20" }}>
                    <MessageCircle className="h-6 w-6" style={{ color: colors.antiqueGold }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Session Type Tabs */}
        <Tabs defaultValue="all" className="mb-6" onValueChange={setSessionType}>
          <TabsList className="grid w-full md:w-auto grid-cols-3 mb-4" 
            style={{ backgroundColor: colors.lightGold + "40" }}>
            <TabsTrigger value="all">Toutes les Sessions</TabsTrigger>
            <TabsTrigger value="chat">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="audio">
              <Phone className="h-4 w-4 mr-2" />
              Appels
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Filter */}
        <Card className="shadow-sm mb-6" style={{ backgroundColor: colors.lightGold + "20" }}>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                  style={{ color: colors.deepPurple + "60" }} />
                <Input
                  placeholder="Rechercher des médiums..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  style={{ 
                    backgroundColor: colors.softIvory,
                    borderColor: colors.antiqueGold + "40",
                    color: colors.deepPurple
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                  size="sm"
                  style={filter === "all" ? {
                    backgroundColor: colors.antiqueGold,
                    color: colors.deepPurple
                  } : {
                    borderColor: colors.antiqueGold + "40",
                    color: colors.deepPurple
                  }}
                >
                  Toutes
                </Button>
                <Button
                  variant={filter === "active" ? "default" : "outline"}
                  onClick={() => setFilter("active")}
                  size="sm"
                  style={filter === "active" ? {
                    backgroundColor: colors.antiqueGold,
                    color: colors.deepPurple
                  } : {
                    borderColor: colors.antiqueGold + "40",
                    color: colors.deepPurple
                  }}
                >
                  Actives
                </Button>
                <Button
                  variant={filter === "completed" ? "default" : "outline"}
                  onClick={() => setFilter("completed")}
                  size="sm"
                  style={filter === "completed" ? {
                    backgroundColor: colors.antiqueGold,
                    color: colors.deepPurple
                  } : {
                    borderColor: colors.antiqueGold + "40",
                    color: colors.deepPurple
                  }}
                >
                  Terminées
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <Card key={`${session.type}-${session.id}`} className="shadow-sm hover:shadow-md transition-shadow duration-300"
              style={{ backgroundColor: colors.lightGold + "20" }}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Psychic Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-14 w-14 border-2" style={{ borderColor: colors.antiqueGold }}>
                      <AvatarImage src={session.psychicImage} alt={session.psychicName} />
                      <AvatarFallback className="text-base font-semibold"
                        style={{ backgroundColor: colors.deepPurple, color: colors.softIvory }}>
                        {session.psychicName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold truncate text-lg" style={{ color: colors.deepPurple }}>
                          {session.psychicName}
                        </h3>
                        <Badge variant="outline" className="text-xs"
                          style={{ 
                            borderColor: getSessionTypeColor(session.sessionType),
                            backgroundColor: getSessionTypeColor(session.sessionType) + "20",
                            color: colors.deepPurple 
                          }}>
                          <span className="flex items-center gap-1">
                            {getSessionTypeIcon(session.sessionType)}
                            {session.sessionType === 'audio' ? 'Appel' : 'Chat'}
                          </span>
                        </Badge>
                        {session.status === 'active' && (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            En Direct
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs"
                          style={{ 
                            backgroundColor: colors.antiqueGold + "20",
                            color: colors.deepPurple 
                          }}>
                          {session.specialty}
                        </Badge>
                        <Badge
                          style={{ 
                            backgroundColor: getStatusColor(session.status) + "20",
                            color: getStatusColor(session.status),
                            border: 'none'
                          }}
                        >
                          {session.status === 'active' ? 'Actif' :
                           session.status === 'in-progress' ? 'En cours' :
                           session.status === 'completed' ? 'Terminé' :
                           session.status === 'ended' ? 'Terminé' :
                           session.status}
                        </Badge>
                      </div>
                      {session.lastMessage && (
                        <p className="text-sm truncate mt-1" style={{ color: colors.deepPurple + "CC" }}>
                          {session.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1" style={{ color: colors.deepPurple + "CC" }}>
                        <Clock className="h-3 w-3" />
                        <span>Durée</span>
                      </div>
                      <div className="font-semibold" style={{ color: colors.deepPurple }}>
                        {session.duration}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1" style={{ color: colors.deepPurple + "CC" }}>
                        <Calendar className="h-3 w-3" />
                        <span>Date</span>
                      </div>
                      <div className="font-semibold" style={{ color: colors.deepPurple }}>
                        {formatDate(session.date)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: colors.deepPurple + "CC" }}>
                        {session.type === 'call' ? 'Crédits' : 'Messages'}
                      </div>
                      <div className="font-semibold" style={{ color: colors.deepPurple }}>
                        {session.type === 'call' ? `${session.creditsUsed.toFixed(2)}` : session.totalMessages}
                      </div>
                    </div>
                    <div>
                      {session.unreadCount > 0 && (
                        <>
                          <div style={{ color: colors.deepPurple + "CC" }}>Non lus</div>
                          <div className="font-semibold" style={{ color: '#EF4444' }}>
                            {session.unreadCount} nouveau{session.unreadCount > 1 ? 'x' : ''}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {session.status === 'active' && session.type === 'chat' && (
                    <Button
                      className="whitespace-nowrap"
                      style={{ 
                        backgroundColor: colors.antiqueGold,
                        color: colors.deepPurple
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Continuer le Chat
                    </Button>
                  )}
                  
                  {session.recordingUrl && (
                    <Button
                      variant="outline"
                      className="whitespace-nowrap"
                      style={{ 
                        borderColor: colors.antiqueGold,
                        color: colors.deepPurple
                      }}
                      onClick={() => window.open(session.recordingUrl, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Enregistrement
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredSessions.length === 0 && (
          <Card className="shadow-sm text-center py-12" style={{ backgroundColor: colors.lightGold + "20" }}>
            <CardContent>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ backgroundColor: colors.lightGold }}>
                <MessageCircle className="h-8 w-8" style={{ color: colors.antiqueGold }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.deepPurple }}>
                Aucune Session Trouvée
              </h3>
              <p className="mb-4" style={{ color: colors.deepPurple + "CC" }}>
                {searchTerm 
                  ? 'Aucune session ne correspond à votre recherche. Essayez différents mots-clés.'
                  : 'Commencez un chat ou un appel avec un médium pour débuter votre voyage.'}
              </p>
              <Button
                style={{ 
                  backgroundColor: colors.antiqueGold,
                  color: colors.deepPurple
                }}
              >
                Parcourir les Médiums
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChatSessions;