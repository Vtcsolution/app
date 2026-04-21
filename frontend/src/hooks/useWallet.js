import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/All_Components/screen/AuthContext';

const useWallet = () => {
  const [wallet, setWallet] = useState({
    balance: 0,
    credits: 0,
    lock: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // API instance
  const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });

  // Fetch wallet data - FIXED VERSION
  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching wallet...');
      
      // Try both endpoints
      let response;
      try {
        // Try /api/wallet/balance first
        response = await api.get('/api/wallet/balance');
      } catch (err) {
        if (err.response?.status === 404) {
          // If 404, try /api/wallet
          console.log('/api/wallet/balance not found, trying /api/wallet');
          response = await api.get('/api/wallet');
        } else {
          throw err;
        }
      }
      
      console.log('Wallet response:', response.data);
      
      if (response.data.success) {
        // Handle different response structures
        let walletData;
        
        if (response.data.wallet) {
          // Structure: { success: true, wallet: { balance, credits, lock } }
          walletData = response.data.wallet;
        } else if (response.data.credits !== undefined) {
          // Structure: { success: true, credits: number }
          walletData = {
            balance: response.data.credits,
            credits: response.data.credits,
            lock: false
          };
        } else if (response.data.balance !== undefined) {
          // Structure: { success: true, balance: number }
          walletData = {
            balance: response.data.balance,
            credits: response.data.balance,
            lock: false
          };
        } else {
          // Default structure
          walletData = {
            balance: 0,
            credits: 0,
            lock: false
          };
        }
        
        console.log('Setting wallet data:', walletData);
        setWallet(walletData);
        return walletData;
      } else {
        throw new Error(response.data.error || 'Failed to fetch wallet');
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load wallet balance. Please try again.",
        variant: "destructive",
        duration: 3000
      });
      
      // Set default wallet on error
      setWallet({
        balance: 0,
        credits: 0,
        lock: false
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, toast]);

  // Check if user can afford a service
  const canAfford = useCallback((amount) => {
    const canAfford = wallet.balance >= amount;
    console.log('Can afford check:', {
      balance: wallet.balance,
      required: amount,
      result: canAfford
    });
    return canAfford;
  }, [wallet.balance]);

  // Calculate allowed minutes for a psychic
  const calculateAllowedMinutes = useCallback((ratePerMin) => {
    if (!ratePerMin || wallet.balance === 0) return 0;
    const minutes = Math.floor(wallet.balance / ratePerMin);
    console.log('Calculating minutes:', {
      balance: wallet.balance,
      rate: ratePerMin,
      minutes: minutes
    });
    return minutes;
  }, [wallet.balance]);

  // Initialize wallet fetch when user is available
  useEffect(() => {
    if (user && user._id) {
      console.log('User detected, fetching wallet...');
      fetchWallet();
    } else {
      console.log('No user detected, skipping wallet fetch');
      setLoading(false);
    }
  }, [user, fetchWallet]);

  return {
    wallet,
    loading,
    error,
    fetchWallet,
    canAfford,
    calculateAllowedMinutes
  };
};

export default useWallet;