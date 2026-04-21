import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  User,
  Star,
  Sparkles,
  DollarSign,
  Zap,
  Shield,
  Timer,
  MessageSquare,
  Crown,
  Gem
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import { useAuth } from '@/All_Components/screen/AuthContext';

// Color scheme matching psychic dashboard
const colors = {
  primary: "#2B1B3F",      // Deep purple
  secondary: "#C9A24D",    // Antique gold
  accent: "#9B7EDE",       // Light purple
  bgLight: "#3A2B4F",      // Lighter purple
  textLight: "#E8D9B0",    // Light gold text
  success: "#10B981",      // Green
  warning: "#F59E0B",      // Yellow
  danger: "#EF4444",       // Red
  background: "#F5F3EB",   // Soft ivory
};

const ChatRequestModal = ({ psychic, isOpen, onClose, onRequestSent, userBalance = 0, userCredits = 0 }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [chatRequest, setChatRequest] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  
  // API instance
  const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });

  // Check for existing pending request
  useEffect(() => {
    if (isOpen && psychic?._id && user) {
      checkExistingRequest();
    }
  }, [isOpen, psychic, user]);

  const checkExistingRequest = async () => {
    try {
      setIsChecking(true);
      const response = await api.get(`/api/chatrequest/pending/${psychic._id}`);
      
      if (response.data.success && response.data.data) {
        setChatRequest(response.data.data);
      } else {
        setChatRequest(null);
      }
    } catch (error) {
      console.error('Error checking existing request:', error);
      setChatRequest(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Calculate allowed minutes
  const calculateAllowedMinutes = () => {
    if (!psychic?.ratePerMin || userCredits === 0) return 0;
    return Math.floor(userCredits / psychic.ratePerMin);
  };

  // Check if user can send request
  const canSendRequest = () => {
    return userCredits >= psychic?.ratePerMin;
  };

  // Send chat request
  const handleSendRequest = async () => {
    if (!canSendRequest()) {
      toast({
        title: "Crédits Insuffisants",
        description: `Vous avez besoin d'au moins ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(psychic.ratePerMin)} de crédits pour demander un chat.`,
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.post('/api/chatrequest/send-request', {
        psychicId: psychic._id
      });
      
      if (response.data.success) {
        setChatRequest(response.data.data);
        toast({
          title: "Demande Envoyée !",
          description: "Votre demande de chat a été envoyée au médium.",
          variant: "default"
        });
        
        if (onRequestSent) {
          onRequestSent(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error sending request:', error);
      const errorMsg = error.response?.data?.message || 'Échec de l\'envoi de la demande de chat';
      toast({
        title: "Erreur",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Accept psychic's acceptance
  const handleAcceptSession = async () => {
    if (!chatRequest) return;
    setIsLoading(true);
    try {
      const response = await api.post('/api/chatrequest/start-session', {
        requestId: chatRequest._id
      });
      if (response.data.success) {
        toast({
          title: "Session Démarrée !",
          description: `Session payante démarrée. Vous avez ${response.data.data.totalMinutes} minutes.`,
          variant: "default"
        });
        onClose();
      }
    } catch (error) {
      console.error('Error starting session:', error);
      const errorMsg = error.response?.data?.message || 'Échec du démarrage de la session';
      toast({
        title: "Erreur",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel request
  const handleCancelRequest = async () => {
    if (!chatRequest) return;
    setIsLoading(true);
    try {
      const response = await api.delete(`/api/chatrequest/requests/${chatRequest._id}`);
      
      if (response.data.success) {
        setChatRequest(null);
        toast({
          title: "Demande Annulée",
          description: "Votre demande de chat a été annulée.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        title: "Erreur",
        description: "Échec de l'annulation de la demande",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!psychic) return null;

  const allowedMinutes = calculateAllowedMinutes();
  const insufficientBalance = !canSendRequest();
  const missingAmount = psychic.ratePerMin - userCredits;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md max-h-[90vh] overflow-y-auto border-none shadow-xl"
        style={{ 
          backgroundColor: colors.background,
          border: `1px solid ${colors.primary}20`,
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
            <Gem className="h-5 w-5" style={{ color: colors.secondary }} />
            Demander une Session de Chat
          </DialogTitle>
          <DialogDescription style={{ color: colors.primary + '80' }}>
            Envoyez une demande de chat à {psychic.name}
          </DialogDescription>
        </DialogHeader>

        {/* Psychic Info */}
        <Card 
          className="border-none shadow-lg"
          style={{ 
            background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2" style={{ borderColor: colors.secondary }}>
                <AvatarImage src={psychic.image} />
                <AvatarFallback 
                  className="font-bold"
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)`,
                    color: colors.textLight
                  }}
                >
                  {psychic.name?.[0] || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg" style={{ color: colors.primary }}>{psychic.name}</h3>
                  <Badge 
                    className="border"
                    style={{
                      backgroundColor: colors.secondary + '10',
                      color: colors.secondary,
                      borderColor: colors.secondary + '30',
                    }}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    {psychic.rating || 4.8}
                  </Badge>
                </div>
                <p className="text-sm line-clamp-2" style={{ color: colors.primary + '80' }}>{psychic.bio}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" style={{ color: colors.secondary }} />
                    <span className="text-sm font-bold" style={{ color: colors.primary }}>
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(psychic.ratePerMin)}/min
                    </span>
                  </div>
                  {psychic.isVerified && (
                    <Badge 
                      className="border"
                      style={{
                        backgroundColor: colors.success + '10',
                        color: colors.success,
                        borderColor: colors.success + '30',
                      }}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Vérifié
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Info */}
        <Card 
          className="border-none shadow-lg"
          style={{ 
            background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2" style={{ color: colors.primary }}>
                <CreditCard className="h-4 w-4" />
                Votre Portefeuille
              </div>
              <Badge 
                className="text-xs border"
                style={{
                  backgroundColor: colors.accent + '10',
                  color: colors.accent,
                  borderColor: colors.accent + '30',
                }}
              >
                Solde en Direct
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-3">
              {/* Credits Display */}
              <div 
                className="p-3 rounded-lg border"
                style={{ 
                  backgroundColor: colors.accent + '05',
                  borderColor: colors.accent + '20',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: colors.primary + '80' }}>Vos Crédits</span>
                  <span className="text-lg font-bold" style={{ color: colors.accent }}>
                    {userCredits.toFixed(2)} crédits
                  </span>
                </div>
                <div className="text-xs mt-1" style={{ color: colors.primary + '60' }}>
                  Solde: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(userBalance)}
                </div>
              </div>
              
              {/* Chat Time */}
              <div 
                className="p-3 rounded-lg border"
                style={{ 
                  backgroundColor: colors.primary + '05',
                  borderColor: colors.primary + '20',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4" style={{ color: colors.primary }} />
                    <span className="text-sm font-medium" style={{ color: colors.primary }}>Temps de Chat Disponible</span>
                  </div>
                  <div className="text-lg font-bold" style={{ color: colors.primary }}>
                    {allowedMinutes} minutes
                  </div>
                </div>
                <div className="text-xs mt-1" style={{ color: colors.primary + '60' }}>
                  Basé sur vos crédits actuels
                </div>
              </div>

              {/* Insufficient Balance Warning */}
              {insufficientBalance && (
                <div 
                  className="p-3 rounded-lg border"
                  style={{ 
                    backgroundColor: colors.danger + '05',
                    borderColor: colors.danger + '20',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" style={{ color: colors.danger }} />
                    <span className="text-sm font-medium" style={{ color: colors.danger }}>Crédits Insuffisants</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: colors.danger }}>
                    Vous avez besoin de {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(missingAmount)} supplémentaires pour 1 minute de chat
                  </p>
                </div>
              )}

              {/* Sufficient Balance Message */}
              {allowedMinutes > 0 && !insufficientBalance && (
                <div 
                  className="p-3 rounded-lg border"
                  style={{ 
                    backgroundColor: colors.success + '05',
                    borderColor: colors.success + '20',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" style={{ color: colors.success }} />
                    <span className="text-sm font-medium" style={{ color: colors.success }}>Prêt à Chatter !</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: colors.success }}>
                    Vous pouvez chatter pendant {allowedMinutes} minute{allowedMinutes !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Request Status */}
        {isChecking ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin mr-2" style={{ color: colors.secondary }} />
            <span className="text-sm" style={{ color: colors.primary + '70' }}>Vérification du statut de la demande...</span>
          </div>
        ) : chatRequest && (
          <Card 
            className="border-none shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: colors.primary }}>
                Statut de la Demande
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div 
                className={`p-3 rounded-lg border ${
                  chatRequest.status === 'pending' ? 
                    `bg-[${colors.warning}05] border-[${colors.warning}20]` :
                  chatRequest.status === 'accepted' ? 
                    `bg-[${colors.success}05] border-[${colors.success}20]` :
                  chatRequest.status === 'rejected' ? 
                    `bg-[${colors.danger}05] border-[${colors.danger}20]` :
                    `bg-[${colors.primary}05] border-[${colors.primary}20]`
                }`}
                style={{
                  backgroundColor: chatRequest.status === 'pending' ? colors.warning + '05' :
                                 chatRequest.status === 'accepted' ? colors.success + '05' :
                                 chatRequest.status === 'rejected' ? colors.danger + '05' :
                                 colors.primary + '05',
                  borderColor: chatRequest.status === 'pending' ? colors.warning + '20' :
                             chatRequest.status === 'accepted' ? colors.success + '20' :
                             chatRequest.status === 'rejected' ? colors.danger + '20' :
                             colors.primary + '20',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {chatRequest.status === 'pending' && <Clock className="h-4 w-4" style={{ color: colors.warning }} />}
                    {chatRequest.status === 'accepted' && <CheckCircle className="h-4 w-4" style={{ color: colors.success }} />}
                    {chatRequest.status === 'rejected' && <XCircle className="h-4 w-4" style={{ color: colors.danger }} />}
                    <span 
                      className="text-sm font-medium capitalize"
                      style={{
                        color: chatRequest.status === 'pending' ? colors.warning :
                               chatRequest.status === 'accepted' ? colors.success :
                               chatRequest.status === 'rejected' ? colors.danger :
                               colors.primary,
                      }}
                    >
                      {chatRequest.status === 'pending' ? 'En attente' :
                       chatRequest.status === 'accepted' ? 'Accepté' :
                       chatRequest.status === 'rejected' ? 'Refusé' :
                       chatRequest.status}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: colors.primary + '60' }}>
                    {new Date(chatRequest.requestedAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                {chatRequest.status === 'accepted' && (
                  <p className="text-xs mt-2" style={{ color: colors.success }}>
                    <CheckCircle className="inline h-3 w-3 mr-1" />
                    Le médium a accepté ! Cliquez sur "Démarrer la Session Payante" pour commencer.
                  </p>
                )}
                
                {chatRequest.status === 'rejected' && (
                  <p className="text-xs mt-2" style={{ color: colors.danger }}>
                    <XCircle className="inline h-3 w-3 mr-1" />
                    Le médium a refusé votre demande.
                  </p>
                )}
                
                {chatRequest.status === 'pending' && (
                  <p className="text-xs mt-2" style={{ color: colors.warning }}>
                    <Clock className="inline h-3 w-3 mr-1" />
                    En attente de la réponse du médium...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {!chatRequest ? (
            <Button
              onClick={handleSendRequest}
              disabled={isLoading || insufficientBalance || isChecking}
              className="w-full hover:scale-[1.02] transition-transform duration-200"
              style={{
                backgroundColor: colors.secondary,
                color: colors.primary,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi de la demande...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Envoyer une Demande de Chat
                </>
              )}
            </Button>
          ) : chatRequest.status === 'pending' ? (
            <div className="flex gap-2">
              <Button
                onClick={handleCancelRequest}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
                style={{
                  borderColor: colors.primary + '20',
                  color: colors.primary,
                }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Annuler la Demande'
                )}
              </Button>
              <Button
                disabled
                className="flex-1"
                style={{
                  backgroundColor: colors.warning + '10',
                  color: colors.warning,
                  borderColor: colors.warning + '20',
                }}
              >
                <Clock className="mr-2 h-4 w-4" />
                En Attente de Réponse
              </Button>
            </div>
          ) : chatRequest.status === 'accepted' ? (
            <div className="space-y-2">
              <Button
                onClick={handleAcceptSession}
                disabled={isLoading || insufficientBalance}
                className="w-full hover:scale-[1.02] transition-transform duration-200"
                style={{
                  backgroundColor: colors.success,
                  color: 'white',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Démarrage de la session...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Démarrer la Session Payante ({allowedMinutes} min disponibles)
                  </>
                )}
              </Button>
              <Button
                onClick={handleCancelRequest}
                disabled={isLoading}
                variant="outline"
                className="w-full"
                style={{
                  borderColor: colors.primary + '20',
                  color: colors.primary,
                }}
              >
                Refuser la Session
              </Button>
            </div>
          ) : chatRequest.status === 'rejected' ? (
            <div className="space-y-2">
              <Button
                onClick={() => setChatRequest(null)}
                className="w-full"
                style={{
                  backgroundColor: colors.accent + '10',
                  color: colors.accent,
                  borderColor: colors.accent + '20',
                }}
              >
                Réessayer
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
                style={{
                  borderColor: colors.primary + '20',
                  color: colors.primary,
                }}
              >
                Fermer
              </Button>
            </div>
          ) : null}
          
          {!chatRequest && insufficientBalance && (
            <Button
              onClick={() => window.location.href = '/wallet'}
              variant="outline"
              className="w-full"
              style={{
                borderColor: colors.secondary,
                color: colors.secondary,
              }}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Ajouter {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(missingAmount)} au Portefeuille
            </Button>
          )}
          
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
            style={{ color: colors.primary + '70' }}
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatRequestModal;