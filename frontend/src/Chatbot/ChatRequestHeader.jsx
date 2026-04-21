import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Zap, 
  Wallet, 
  RefreshCw,
  DollarSign 
} from 'lucide-react';
import ChatRequestModal from './ChatRequestModal';
import PaidTimer from './PaidTimer';
import axios from 'axios';
import { useAuth } from '@/All_Components/screen/AuthContext';
import { useToast } from "@/hooks/use-toast";
import useWallet from '@/hooks/useWallet';

const ChatRequestHeader = ({ psychic, chatSessionId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Use the wallet hook
  const { 
    wallet, 
    loading: walletLoading, 
    fetchWallet, 
    error: walletError,
    calculateAllowedMinutes 
  } = useWallet();

  const userBalance = wallet?.balance || 0;
  const userCredits = wallet?.credits || 0;

  // API instance for other requests
  const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });

 
  // Check for active session on mount
  useEffect(() => {
    if (psychic?._id && user) {
      checkActiveSession();
    }
  }, [psychic, user]);

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    await fetchWallet();
    setIsRefreshing(false);
    
    if (!walletError) {
      toast({
        title: "Solde Actualisé",
        description: `Votre solde est de ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(userBalance)}`,
        variant: "default",
        duration: 2000
      });
    }
  };

  const handleRequestSent = (requestData) => {
    console.log('Request sent:', requestData);
    // Refresh wallet after sending request
    fetchWallet();
    
    // Check for active session in case request was accepted immediately
    setTimeout(() => checkActiveSession(), 2000);
  };

  const handleSessionEnd = (sessionData) => {
    console.log('Session ended:', sessionData);
    setActiveSession(null);
    fetchWallet(); // Refresh wallet
    
    toast({
      title: "Session Terminée",
      description: "La session de chat s'est terminée avec succès",
      variant: "default",
      duration: 3000
    });
  };

  const handleBalanceUpdate = (newBalance) => {
    console.log('Balance update from timer:', newBalance);
    // This will be called from PaidTimer component
    fetchWallet(); // Refresh wallet data
  };

  // Add this function to fetch wallet from chat request API
const fetchChatRequestWallet = async () => {
  try {
    const response = await api.get('/api/chatrequest/wallet/balance');
    
    if (response.data.success) {
      const walletData = response.data.wallet;
      setUserBalance(walletData.balance || 0);
      setUserCredits(walletData.credits || 0);
      console.log('Wallet from chat request API:', walletData);
      return walletData;
    }
  } catch (error) {
    console.error('Error fetching wallet from chat request API:', error);
    // Fall back to main wallet API
    return fetchMainWallet();
  }
};

// Update checkActiveSession to also fetch wallet
const checkActiveSession = async () => {
  try {
    setSessionLoading(true);
    
    // First, check wallet balance
    await fetchChatRequestWallet();
    
    // Then check for active session
    const response = await api.get('/api/chatrequest/active-session');
    
    if (response.data.success && response.data.data) {
      const session = response.data.data;
      // Check if active session is with this psychic
      if (session.psychic?._id === psychic._id) {
        setActiveSession(session);
        
        // If there's an active session, start listening for wallet updates
        setupWalletSocket(session._id);
      } else {
        setActiveSession(null);
      }
    } else {
      setActiveSession(null);
    }
  } catch (error) {
    console.error('Error checking active session:', error);
    setActiveSession(null);
  } finally {
    setSessionLoading(false);
  }
};

// Add WebSocket setup for wallet updates
const setupWalletSocket = (chatRequestId) => {
  if (!socketRef.current) return;

  // Listen for wallet updates
  socketRef.current.on('wallet_update', (data) => {
    console.log('Real-time wallet update:', data);
    if (data.balance !== undefined) {
      setUserBalance(data.balance);
    }
    if (data.credits !== undefined) {
      setUserCredits(data.credits);
    }
  });

  socketRef.current.on('balance_updated', (data) => {
    console.log('Balance updated from timer:', data);
    setUserBalance(data.newBalance);
    
    toast({
      title: "Solde Mis à Jour",
      description: `${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(data.deductedAmount)} déduit pour le chat`,
      variant: "default",
      duration: 3000
    });
  });

  // Join chat request room for updates
  socketRef.current.emit('join_chat_request', { chatRequestId });
};
  // Calculate if user can send request
  const canSendRequest = () => {
    if (!psychic?.ratePerMin) return false;
    const requiredAmount = psychic.ratePerMin;
    const canSend = userBalance >= requiredAmount;
    
    console.log('Can send request check:', {
      balance: userBalance,
      required: requiredAmount,
      canSend: canSend
    });
    
    return canSend;
  };

  // Calculate allowed minutes
  const allowedMinutes = calculateAllowedMinutes(psychic?.ratePerMin || 0);
  const requiredForOneMinute = psychic?.ratePerMin || 0;
  const missingAmount = Math.max(0, requiredForOneMinute - userBalance);

  const onRequestChat = () => {
    setShowRequestModal(true);
  };

  if (!psychic) return null;

  // Show wallet loading or error state
  if (walletLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse" />
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  // Show wallet error state
  if (walletError) {
    return (
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">{psychic.name}</h3>
            <p className="text-sm text-gray-600">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(psychic.ratePerMin)}/min</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-red-600 mb-1">Erreur de Portefeuille</div>
          <Button
            onClick={handleRefreshBalance}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
      {/* Left side: Psychic Info */}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {psychic.name?.[0] || 'P'}
            </div>
            {psychic.isVerified && (
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                <span className="text-xs text-white">✓</span>
              </div>
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-gray-800">{psychic.name}</h2>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Médium
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <CreditCard className="h-3 w-3" />
                <span className="font-medium">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(psychic.ratePerMin)}/min</span>
              </div>
              <div className="text-sm text-gray-500">
                {psychic.bio?.substring(0, 50)}...
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Balance & Actions */}
      <div className="flex flex-col gap-3">
        {/* Wallet Display */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-1">
              <Button
                onClick={handleRefreshBalance}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                Votre Solde
              </div>
            </div>
            <div className="text-xl font-bold text-green-600">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(userBalance)}
            </div>
            <div className="flex items-center justify-end gap-2 text-xs mt-1">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {allowedMinutes} min disponibles
              </Badge>
              {userCredits > 0 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {userCredits} crédits
                </Badge>
              )}
            </div>
          </div>
          
          <div 
            className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleRefreshBalance}
            title="Cliquez pour actualiser le solde"
          >
            <DollarSign className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {activeSession ? (
            // Show timer for active session
            <div className="w-full">
              <PaidTimer
                chatRequestId={activeSession._id}
                psychic={psychic}
                onSessionEnd={handleSessionEnd}
                onBalanceUpdate={handleBalanceUpdate}
              />
            </div>
          ) : (
            // Show request button
            <>
              <Button
                onClick={onRequestChat}
                disabled={!canSendRequest()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Envoyer une Demande de Chat
                {allowedMinutes > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-white text-purple-700">
                    {allowedMinutes} min
                  </Badge>
                )}
              </Button>
              
              {!canSendRequest() && (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => window.location.href = '/wallet'}
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Ajouter {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(missingAmount)}
                  </Button>
                  <p className="text-xs text-red-600 text-center">
                    Besoin de {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(requiredForOneMinute)} pour 1 minute
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ChatRequestModal
        psychic={psychic}
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onRequestSent={handleRequestSent}
        userBalance={userBalance}
        userCredits={userCredits}
      />
    </div>
  );
};

export default ChatRequestHeader;