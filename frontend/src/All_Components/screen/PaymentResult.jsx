import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, CreditCard, Award, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from './AuthContext';

export default function PaymentResult() {
  const [status, setStatus] = useState('loading');
  const [paymentData, setPaymentData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const checkPaymentStatus = async (paymentId = null, currentRetryCount = 0) => {
      try {
        let paymentIdToCheck = paymentId || 
                              searchParams.get('payment_id') || 
                              searchParams.get('payment_intent') || 
                              searchParams.get('session_id') ||
                              searchParams.get('id');
        
        if (!paymentIdToCheck) {
          paymentIdToCheck = localStorage.getItem('lastPaymentId');
        }

        console.log('PaymentResult: Checking payment status', { 
          paymentId: paymentIdToCheck,
          retryCount: currentRetryCount
        });

        if (!paymentIdToCheck) {
          throw new Error('Payment reference not found');
        }

        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/payments/status/${paymentIdToCheck}`,
          { 
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );

        console.log('PaymentResult: Status response', response.data);

        setPaymentData(response.data);
        
        if (response.data.status === 'paid') {
          setStatus('success');
          
          if (localStorage.getItem('lastPaymentId') === paymentIdToCheck) {
            localStorage.removeItem('lastPaymentId');
          }
          
          await refreshUserWallet();
          
          // Track Purchase event for TikTok Pixel with EURO currency
          if (window.ttq) {
            window.ttq.track('Purchase', {
              content_id: paymentIdToCheck,
              value: response.data.amount || 0.00,
              currency: 'EUR',
              credits_added: response.data.credits || response.data.creditsAdded,
            });
          }
          
          toast.success('Paiement réussi ! Crédits ajoutés à votre compte.');
          
        } else if (response.data.status === 'pending' || response.data.status === 'processing') {
          if (currentRetryCount < maxRetries) {
            setTimeout(() => {
              checkPaymentStatus(paymentIdToCheck, currentRetryCount + 1);
            }, 2000);
          } else {
            setStatus('pending');
            toast.info('Paiement en cours de traitement. Vous pouvez vérifier plus tard.');
          }
        } else {
          setStatus('failed');
          toast.error('Le paiement a échoué ou a été annulé');
        }
      } catch (error) {
        console.error('Payment verification failed:', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        if (currentRetryCount < maxRetries) {
          setTimeout(() => {
            checkPaymentStatus(null, currentRetryCount + 1);
          }, 2000);
        } else {
          setStatus('failed');
          setPaymentData({
            error: error.response?.data?.error || 
                   error.response?.data?.message || 
                   error.message || 
                   'Échec de la vérification du paiement'
          });
          toast.error('Échec de la vérification du paiement');
        }
      }
    };

    checkPaymentStatus(null, 0);
    
    return () => {
      const timeouts = [];
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = (...args) => {
        const timeoutId = originalSetTimeout(...args);
        timeouts.push(timeoutId);
        return timeoutId;
      };
      
      timeouts.forEach(timeoutId => clearTimeout(timeoutId));
      window.setTimeout = originalSetTimeout;
    };
  }, [searchParams]);

  const refreshUserWallet = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/wallet/balance`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      
      if (response.data.credits) {
        console.log('Wallet refreshed:', response.data.credits);
        window.dispatchEvent(new CustomEvent('walletUpdated', { 
          detail: { credits: response.data.credits } 
        }));
      }
    } catch (error) {
      console.error('Error refreshing wallet:', error);
    }
  };

  const handleRetry = () => {
    setStatus('loading');
    setRetryCount(0);
    setPaymentData(null);
    
    const paymentId = searchParams.get('payment_id') || 
                     searchParams.get('payment_intent') || 
                     searchParams.get('session_id') ||
                     searchParams.get('id') ||
                     localStorage.getItem('lastPaymentId') ||
                     localStorage.getItem('paymentId');
    
    if (paymentId) {
      checkPaymentStatus(paymentId, 0);
    } else {
      toast.error('Aucune référence de paiement trouvée');
      setStatus('failed');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-purple-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-purple-300" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold">Traitement du paiement...</p>
          <p className="text-gray-500">Veuillez patienter pendant que nous confirmons votre paiement</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-400">
              Tentative {retryCount + 1} sur {maxRetries + 1}
            </p>
          )}
        </div>
        
        {retryCount >= 3 && (
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="max-w-md w-full space-y-6">
        {status === 'success' ? (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-32 bg-green-100 rounded-full animate-ping opacity-20"></div>
              </div>
              <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto relative" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">Paiement Réussi !</h1>
              <p className="text-gray-600">
                Merci pour votre achat. Les crédits ont été ajoutés à votre compte.
              </p>
            </div>
            
            {paymentData && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Montant payé :</span>
                  <span className="text-xl font-bold text-green-600">
                    €{paymentData.amount?.toFixed(2)} EUR
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Crédits ajoutés :</span>
                  <span className="text-xl font-bold text-purple-600 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    {paymentData.credits || paymentData.creditsAdded} crédits
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Méthode de paiement :</span>
                  <span className="font-medium capitalize bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm">
                    {paymentData.paymentMethod?.replace('_', ' ') || 'Carte'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">ID Transaction :</span>
                  <span className="font-mono text-xs text-gray-500 truncate max-w-[150px]">
                    {paymentData.tran_id || paymentData.stripePaymentId || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Date :</span>
                  <span className="font-medium">
                    {new Date(paymentData.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            )}
            
            <div className="space-y-4 pt-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 rounded-lg shadow-md transition-all"
              >
                Aller au Tableau de Bord
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="w-full border border-purple-500 text-purple-600 hover:bg-purple-50 font-medium py-3 rounded-lg transition-all"
              >
                Commencer une Consultation
              </button>
            </div>
          </div>
        ) : status === 'pending' ? (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-32 bg-yellow-100 rounded-full animate-ping opacity-20"></div>
              </div>
              <Loader2 className="h-24 w-24 text-yellow-500 mx-auto relative animate-spin" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">Paiement en Cours</h1>
              <p className="text-gray-600">
                Votre paiement est en cours de traitement. Cela peut prendre quelques minutes.
              </p>
              <p className="text-sm text-gray-500">
                Vous pouvez quitter cette page. Les crédits seront ajoutés automatiquement.
              </p>
            </div>
            
            <div className="space-y-4 pt-4">
              <button
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-medium py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Vérifier à nouveau
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg transition-all"
              >
                Aller au Tableau de Bord
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-32 bg-red-100 rounded-full animate-ping opacity-20"></div>
              </div>
              <XCircle className="h-24 w-24 text-red-500 mx-auto relative" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">Paiement Échoué</h1>
              <p className="text-gray-600">
                {paymentData?.error || 'Une erreur est survenue lors du paiement.'}
              </p>
              <p className="text-sm text-gray-500">
                Si vous avez été débité sans recevoir de crédits, veuillez contacter le support.
              </p>
            </div>
            
            {paymentData?.tran_id && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Référence :</span>{' '}
                  <span className="font-mono text-xs">{paymentData.tran_id}</span>
                </p>
              </div>
            )}
            
            <div className="space-y-4 pt-4">
              <button
                onClick={() => navigate('/payment')}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </button>
              <button
                onClick={() => navigate('/support')}
                className="w-full border border-yellow-500 text-yellow-600 hover:bg-yellow-50 font-medium py-3 rounded-lg transition-all"
              >
                Contacter le Support
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg transition-all"
              >
                Retour à l'Accueil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}