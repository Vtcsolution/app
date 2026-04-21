import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Users,
  Calendar,
  Wallet
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import { usePsychicAuth } from "@/context/PsychicAuthContext";

// Color scheme matching your app
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

const PsychicChatRequestModal = ({ request, user, psychic, isOpen, onClose, onAccepted, onRejected }) => {
  const { psychic: currentPsychic } = usePsychicAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState(null); // 'accept' or 'reject'

  // API instance
  const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('psychicToken')}`
    }
  });

  const handleAccept = async () => {
    if (!request || !currentPsychic) return;
    
    setIsLoading(true);
    setAction('accept');
    
    try {
      // Send acceptance to backend
      const response = await api.post('/api/chatrequest/accept-request', {
        requestId: request._id,
        psychicId: currentPsychic._id
      });
      
      if (response.data.success) {
        console.log('✅ Request accepted, response:', response.data);
        
        // IMPORTANT: Return ALL data from response, not just request
        const responseData = response.data.data;
        
        // Create optimistic session data for immediate UI update
        const optimisticSessionData = {
          ...request,
          ...responseData,
          status: 'active',
          user: user || { _id: request.userId },
          psychic: currentPsychic,
          paidSession: {
            remainingSeconds: (request.totalMinutesAllowed || 0) * 60,
            isPaused: false
          }
        };
        
        // Show success toast
        toast({
          title: "Demande Acceptée !",
          description: "Session payante démarrée ! Le chronomètre est en marche.",
          variant: "default"
        });
        
        // Call onAccepted with BOTH the original request AND response data
        if (onAccepted) {
          onAccepted(optimisticSessionData);
        }
        
        // Close modal
        onClose();
      } else {
        throw new Error(response.data.message || 'Échec de l\'acceptation de la demande');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Échec de l\'acceptation de la demande';
      toast({
        title: "Erreur",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const handleReject = async () => {
    if (!request || !currentPsychic) return;
    
    setIsLoading(true);
    setAction('reject');
    
    try {
      const response = await api.post('/api/chatrequest/reject-request', {
        requestId: request._id,
        psychicId: currentPsychic._id
      });
      
      if (response.data.success) {
        toast({
          title: "Demande Refusée",
          description: "Demande de chat refusée",
          variant: "default"
        });
        
        if (onRejected) {
          onRejected(request._id);
        }
        
        onClose();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      const errorMsg = error.response?.data?.message || 'Échec du refus de la demande';
      toast({
        title: "Erreur",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  // Handle close with cleanup
  const handleClose = () => {
    setIsLoading(false);
    setAction(null);
    onClose();
  };

  if (!request || !user || !currentPsychic) return null;

  const calculateEarnings = () => {
    const ratePerMin = request.ratePerMin || psychic?.ratePerMin || 1;
    const allowedMinutes = request.totalMinutesAllowed || 0;
    return (ratePerMin * allowedMinutes).toFixed(2);
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.background }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
            <Sparkles className="h-5 w-5" style={{ color: colors.secondary }} />
            Nouvelle Demande de Chat
          </DialogTitle>
          <DialogDescription style={{ color: colors.primary + '80' }}>
            Examinez et répondez à la demande de chat de {user.firstName}
          </DialogDescription>
        </DialogHeader>

        {/* User Info */}
        <Card className="border-0 shadow-none" style={{ backgroundColor: 'transparent' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.image} />
                <AvatarFallback style={{ 
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                  color: 'white'
                }}>
                  {user.firstName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg" style={{ color: colors.primary }}>
                    {user.username} {user.lastName}
                  </h3>
                  <Badge variant="outline" style={{ 
                    backgroundColor: colors.secondary + '10',
                    color: colors.secondary,
                    borderColor: colors.secondary + '30'
                  }}>
                    <User className="h-3 w-3 mr-1" />
                    Client
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Details */}
        <Card className="border-0 shadow-none" style={{ backgroundColor: 'transparent' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: colors.primary }}>
              Détails de la Demande
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border" style={{ 
                backgroundColor: colors.accent + '10',
                borderColor: colors.accent + '30'
              }}>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4" style={{ color: colors.accent }} />
                  <span className="text-sm font-medium" style={{ color: colors.accent }}>Tarif</span>
                </div>
                <div className="text-xl font-bold" style={{ color: colors.accent }}>
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(request.ratePerMin || psychic?.ratePerMin || 1)}/min
                </div>
              </div>
              
              <div className="p-3 rounded-lg border" style={{ 
                backgroundColor: colors.success + '10',
                borderColor: colors.success + '30'
              }}>
                <div className="flex items-center gap-2 mb-1">
                  <Timer className="h-4 w-4" style={{ color: colors.success }} />
                  <span className="text-sm font-medium" style={{ color: colors.success }}>Temps Disponible</span>
                </div>
                <div className="text-xl font-bold" style={{ color: colors.success }}>
                  {Number(request.totalMinutesAllowed || 0).toFixed(2)} min
                </div>
              </div>
            </div>
           
            <div className="p-3 rounded-lg border" style={{ 
              backgroundColor: colors.primary + '10',
              borderColor: colors.primary + '30'
            }}>
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4" style={{ color: colors.primary }} />
                <span className="text-sm font-medium" style={{ color: colors.primary }}>Solde Client</span>
              </div>
              <div className="text-lg font-bold" style={{ color: colors.primary }}>
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(request.initialBalance || 0)}
              </div>
              <div className="text-xs mt-1" style={{ color: colors.primary + '70' }}>
                Disponible pour cette session
              </div>
            </div>
            
            <div className="p-3 rounded-lg border" style={{ 
              backgroundColor: colors.secondary + '10',
              borderColor: colors.secondary + '30'
            }}>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4" style={{ color: colors.secondary }} />
                <span className="text-sm font-medium" style={{ color: colors.secondary }}>Gains Potentiels</span>
              </div>
              <div className="text-xl font-bold" style={{ color: colors.secondary }}>
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(calculateEarnings())}
              </div>
              <div className="text-xs mt-1" style={{ color: colors.secondary + '70' }}>
                Si la session dure toute la durée
              </div>
            </div>
            
            <div className="p-3 rounded-lg border" style={{ 
              backgroundColor: colors.primary + '05',
              borderColor: colors.primary + '20'
            }}>
              <div className="text-xs" style={{ color: colors.primary + '70' }}>Demandé le</div>
              <div className="text-sm font-medium" style={{ color: colors.primary }}>
                {formatTime(request.requestedAt || request.createdAt)}
              </div>
            </div>
            
            {/* Session Info Note */}
            <div className="p-3 rounded-lg border" style={{ 
              background: `linear-gradient(135deg, ${colors.primary}10 0%, ${colors.secondary}10 100%)`,
              borderColor: colors.secondary + '30'
            }}>
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5" style={{ color: colors.secondary }} />
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: colors.secondary }}>
                    Informations sur la Session
                  </div>
                  <p className="text-xs" style={{ color: colors.primary + '80' }}>
                    L'acceptation démarrera immédiatement une session payante. Le chronomètre commencera à compter à rebours à partir de {(request.totalMinutesAllowed || 0).toFixed(2)} minutes.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            className="w-full text-white"
            style={{ 
              background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)`,
            }}
          >
            {isLoading && action === 'accept' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Acceptation...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Accepter & Démarrer la Session
              </>
            )}
          </Button>
         
          <Button
            onClick={handleReject}
            disabled={isLoading}
            variant="outline"
            className="w-full"
            style={{ 
              borderColor: colors.danger + '50',
              color: colors.danger
            }}
          >
            {isLoading && action === 'reject' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refus...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Refuser la Demande
              </>
            )}
          </Button>
          
          <Button
            onClick={handleClose}
            variant="ghost"
            className="w-full"
            style={{ color: colors.primary }}
            disabled={isLoading}
          >
            Fermer
          </Button>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" style={{ color: colors.primary }} />
              <p className="text-sm font-medium" style={{ color: colors.primary }}>
                {action === 'accept' ? 'Démarrage de la session payante...' : 'Traitement de la demande...'}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PsychicChatRequestModal;