// components/WarningComponents.jsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Ban,
  ShieldAlert,
  Mail,
  Phone,
  Globe,
  Clock,
  XCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  User,
  Users,
  CreditCard,
  Zap,
  DollarSign,
  Sparkles,
  Shield,
  MoreVertical,
  Search,
  ArrowLeft,
  Send,
  Smile,
  Check,
  CheckCheck,
  Loader2,
  RefreshCw,
  Pause,
  Play,
  StopCircle,
  Phone as PhoneIcon,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from "lucide-react";
import { cn } from "@/lib/utils";

// ========== USER WARNING ALERT ==========
export const UserWarningAlert = ({ warning, isOpen, onClose }) => {
  if (!isOpen) return null;

  const getWarningIcon = (type) => {
    switch(type) {
      case 'email': return <Mail className="h-6 w-6" />;
      case 'phone': return <Phone className="h-6 w-6" />;
      case 'link': return <Globe className="h-6 w-6" />;
      default: return <AlertTriangle className="h-6 w-6" />;
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
  const Icon = getWarningIcon(warning.warningType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md border-${color}-500 border-2`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-3 text-${color}-600`}>
            <div className={`p-2 rounded-full bg-${color}-100`}>
              <Icon className={`h-6 w-6 text-${color}-600`} />
            </div>
            <span>⚠️ Avertissement Médium #{warning.warningNumber}</span>
          </DialogTitle>
          <DialogDescription className="pt-4">
            <Alert variant="destructive" className={`border-${color}-300 bg-${color}-50`}>
              <AlertTriangle className={`h-4 w-4 text-${color}-600`} />
              <AlertTitle className={`text-${color}-800 font-bold`}>
                Le médium a enfreint les Conditions d'Utilisation
              </AlertTitle>
              <AlertDescription className={`text-${color}-700 mt-2`}>
                Le médium a tenté de partager des coordonnées personnelles, ce qui est interdit par nos conditions d'utilisation.
              </AlertDescription>
            </Alert>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Avertissement émis : {new Date(warning.timestamp).toLocaleString('fr-FR')}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ShieldAlert className="h-4 w-4" />
                <span>Violation : {warning.warningType === 'email' ? 'Email' : 
                                  warning.warningType === 'phone' ? 'Téléphone' : 
                                  warning.warningType === 'link' ? 'Lien' : 
                                  warning.warningType}</span>
              </div>

              {warning.warningNumber === 3 && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    🔴 Ce médium a été désactivé en raison de multiples violations.
                  </p>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={onClose}
            className={`w-full bg-${color}-600 hover:bg-${color}-700 text-white`}
          >
            J'ai compris
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ========== PSYCHIC WARNING ALERT ==========
export const PsychicWarningAlert = ({ warning, onAcknowledge, isOpen, onClose }) => {
  if (!isOpen) return null;

  const getWarningIcon = (type) => {
    switch(type) {
      case 'email': return <Mail className="h-6 w-6" />;
      case 'phone': return <Phone className="h-6 w-6" />;
      case 'link': return <Globe className="h-6 w-6" />;
      default: return <AlertTriangle className="h-6 w-6" />;
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
  const Icon = getWarningIcon(warning.warningType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md border-${color}-500 border-2`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-3 text-${color}-600`}>
            <div className={`p-2 rounded-full bg-${color}-100`}>
              <Icon className={`h-6 w-6 text-${color}-600`} />
            </div>
            <span>⚠️ Avertissement #{warning.warningNumber}</span>
          </DialogTitle>
          <DialogDescription className="pt-4">
            <Alert variant="destructive" className={`border-${color}-300 bg-${color}-50`}>
              <AlertTriangle className={`h-4 w-4 text-${color}-600`} />
              <AlertTitle className={`text-${color}-800 font-bold`}>
                Ne Partagez Pas d'Informations Personnelles
              </AlertTitle>
              <AlertDescription className={`text-${color}-700 mt-2`}>
                {warning.message}
              </AlertDescription>
            </Alert>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Émis : {new Date(warning.timestamp).toLocaleString('fr-FR')}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ShieldAlert className="h-4 w-4" />
                <span>Violation : {warning.warningType === 'email' ? 'Email' : 
                                  warning.warningType === 'phone' ? 'Téléphone' : 
                                  warning.warningType === 'link' ? 'Lien' : 
                                  warning.warningType}</span>
              </div>

              {warning.warningNumber === 2 && (
                <div className="p-3 bg-orange-100 border border-orange-300 rounded-lg">
                  <p className="text-sm text-orange-800 font-medium">
                    ⚠️ C'est votre deuxième avertissement. Une violation supplémentaire entraînera la désactivation immédiate de votre compte.
                  </p>
                </div>
              )}

              {warning.warningNumber === 3 && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    🔴 Votre compte a été désactivé en raison de violations multiples.
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
                <span>Avertissement 1</span>
                <span>Avertissement 2</span>
                <span>Avertissement 3</span>
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
            className={`w-full bg-${color}-600 hover:bg-${color}-700 text-white`}
          >
            J'ai compris
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ========== PSYCHIC DEACTIVATED NOTICE ==========
export const PsychicDeactivatedNotice = ({ psychicName, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full border-4 border-red-500 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <Ban className="h-12 w-12 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Médium Désactivé</h2>
          
          <p className="text-gray-600 mb-6">
            {psychicName} a été désactivé en raison de multiples violations de nos conditions d'utilisation.
            Votre session de chat a été terminée et vous ne serez pas facturé pour cette session.
          </p>

          <div className="space-y-3 w-full">
            <Button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Retour aux Chats
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/psychics'}
            >
              Parcourir d'Autres Médiums
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Si vous avez des préoccupations, veuillez contacter notre équipe de support.
          </p>
        </div>
      </div>
    </div>
  );
};

// ========== USER DEACTIVATED NOTICE ==========
export const UserDeactivatedNotice = ({ userName, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full border-4 border-orange-500 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-full bg-orange-100 flex items-center justify-center mb-6">
            <Ban className="h-12 w-12 text-orange-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Utilisateur Désactivé</h2>
          
          <p className="text-gray-600 mb-6">
            {userName} a été désactivé en raison de multiples violations de nos conditions d'utilisation.
            Votre session de chat a été terminée.
          </p>

          <div className="space-y-3 w-full">
            <Button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Continuer vers les Chats
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== ACCOUNT DEACTIVATION NOTICE ==========
export const AccountDeactivationNotice = ({ deactivatedAt, warningCount, onContactSupport }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full border-4 border-red-500 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <Ban className="h-12 w-12 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Compte Désactivé</h2>
          
          <p className="text-gray-600 mb-6">
            Votre compte a été désactivé en raison de multiples violations de nos conditions d'utilisation concernant le partage d'informations personnelles.
          </p>

          <div className="w-full bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Désactivé le :</span>
              <span className="font-medium">{new Date(deactivatedAt).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total des avertissements :</span>
              <span className="font-medium text-red-600">{warningCount}/3</span>
            </div>
          </div>

          <div className="space-y-3 w-full">
            <Button
              onClick={onContactSupport}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Contacter le Support
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/login'}
            >
              Retour à la Connexion
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter notre équipe de support pour obtenir de l'aide.
          </p>
        </div>
      </div>
    </div>
  );
};

// ========== BLOCKED MESSAGE INDICATOR - FIXED VERSION ==========
export const BlockedMessageIndicator = ({ message, isOwn }) => {
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
            {isOwn ? "Votre Message a Été Bloqué" : "Message Bloqué"}
          </p>
          <p className={cn(
            "text-xs mt-1",
            isOwn ? "text-orange-600" : "text-gray-600"
          )}>
            {message?.reason || 'Le message contenait du contenu interdit'}
          </p>
          {message?.warningNumber && (
            <Badge className={cn(
              "mt-2 text-white text-xs",
              isOwn ? "bg-orange-500" : "bg-gray-500"
            )}>
              Avertissement #{message.warningNumber}
            </Badge>
          )}
          {isOwn && message?.warningNumber === 3 && (
            <p className="text-xs text-red-600 mt-2 font-bold">
              ⚠️ Votre compte a été désactivé en raison de violations multiples.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ========== WARNING BADGE ==========
export const WarningBadge = ({ count, isActive }) => {
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

// ========== SYSTEM MESSAGE ==========
export const SystemMessage = ({ content, type = 'info', warningNumber }) => {
  const getTypeStyles = () => {
    switch(type) {
      case 'warning':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'success':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'info':
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  const getTypeMessage = () => {
    switch(type) {
      case 'warning':
        return '⚠️ Avertissement';
      case 'success':
        return '✓ Succès';
      default:
        return 'ℹ️ Information';
    }
  };

  return (
    <div className="flex justify-center my-2">
      <div className={cn(
        "px-4 py-2 rounded-lg max-w-[80%] text-center border",
        getTypeStyles()
      )}>
        <div className="flex items-center justify-center gap-2">
          {type === 'warning' && <AlertTriangle className="h-4 w-4" />}
          <p className="text-sm">{content}</p>
          {warningNumber && (
            <Badge className="bg-red-500 text-white text-xs">
              Avertissement #{warningNumber}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};