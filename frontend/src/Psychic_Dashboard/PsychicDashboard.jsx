import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { usePsychicAuth } from "../context/PsychicAuthContext";
import axios from "axios";
import {
  FaUsers,
  FaClock,
  FaDollarSign,
  FaChartLine,
  FaUserFriends,
  FaCommentDots,
  FaStar,
  FaChartBar,
  FaSpinner,
  FaChartPie,
  FaMoneyBillWave,
  FaUserTie,
  FaHistory,
  FaArrowUp,
  FaArrowDown,
  FaEquals,
  FaWallet,
  FaUserCheck,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaCrown,
  FaPhone,
  FaComment,
  FaCreditCard,
  FaCheckCircle,
  FaTimesCircle,
  FaReceipt
} from "react-icons/fa";

// Color scheme
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
  chat: "#3B82F6",         // Blue for chat
  call: "#8B5CF6"          // Purple for call
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, loading, change = null, subtitle = null }) => (
  <div 
    className={`bg-white rounded-xl shadow-md p-6 border ${loading ? 'animate-pulse' : ''}`}
    style={{ 
      borderColor: colors.primary + '10',
      background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`
    }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium" style={{ color: colors.primary + '80' }}>{title}</p>
        <h3 className="text-3xl font-bold mt-2" style={{ color: colors.primary }}>
          {loading ? "..." : value}
        </h3>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: colors.primary + '60' }}>{subtitle}</p>
        )}
        {change !== null && !loading && (
          <div className={`flex items-center mt-2 text-sm font-medium ${
            change > 0 ? 'text-green-600' : 
            change < 0 ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            {change > 0 ? <FaArrowUp className="mr-1" /> : 
             change < 0 ? <FaArrowDown className="mr-1" /> : 
             <FaEquals className="mr-1" />}
            <span>{Math.abs(change)}%</span>
            <span className="ml-1" style={{ color: colors.primary + '70' }}>par rapport à la période précédente</span>
          </div>
        )}
      </div>
      <div className="p-3 rounded-full" style={{ 
        backgroundColor: color + '10',
        color: color
      }}>
        <Icon className="text-2xl" style={{ color: color }} />
      </div>
    </div>
  </div>
);

// Payment Card Component
const PaymentCard = ({ payment }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate your earnings (25% of total)
  const yourEarnings = payment.amount || 0;

  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-all duration-300"
      style={{ borderColor: colors.primary + '20' }}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full" style={{ backgroundColor: colors.success + '20' }}>
            <FaCheckCircle className="text-lg" style={{ color: colors.success }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold" style={{ color: colors.primary }}>Paiement Reçu</p>
              <span className="text-xs px-2 py-1 rounded-full" style={{ 
                backgroundColor: colors.success + '10',
                color: colors.success
              }}>
                {payment.paymentMethod?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm" style={{ color: colors.primary + '70' }}>
              Réf: {payment.paymentId}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold" style={{ color: colors.success }}>
            +{formatCurrency(payment.amount)}
          </p>
          <p className="text-xs" style={{ color: colors.primary + '60' }}>
            {formatDate(payment.paymentDate)}
          </p>
        </div>
      </div>
      
      {/* Payment Stats - Using your model structure */}
      <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t text-sm"
        style={{ borderColor: colors.primary + '10' }}>
        <div>
          <p className="text-xs" style={{ color: colors.primary + '60' }}>Vos Gains</p>
          <p className="font-bold" style={{ color: colors.success }}>
            {formatCurrency(payment.amount)}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: colors.primary + '60' }}>Gains Totaux</p>
          <p className="font-bold" style={{ color: colors.primary }}>
            {formatCurrency(payment.totalEarnings || 0)}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: colors.primary + '60' }}>Commission Plateforme</p>
          <p className="font-bold" style={{ color: colors.warning }}>
            {formatCurrency(payment.platformCommission || 0)}
          </p>
        </div>
      </div>
      
      {/* Before/After Stats */}
      {payment.beforePaymentStats && payment.afterPaymentStats && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.primary + '10' }}>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-medium mb-1" style={{ color: colors.primary + '70' }}>Avant Paiement</p>
              <p>Payé: {formatCurrency(payment.beforePaymentStats.paidAmount || 0)}</p>
              <p>En attente: {formatCurrency(payment.beforePaymentStats.pendingAmount || 0)}</p>
            </div>
            <div>
              <p className="font-medium mb-1" style={{ color: colors.primary + '70' }}>Après Paiement</p>
              <p>Payé: {formatCurrency(payment.afterPaymentStats.paidAmount || 0)}</p>
              <p>En attente: {formatCurrency(payment.afterPaymentStats.pendingAmount || 0)}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Sessions in this payment */}
      {payment.earningsBreakdown?.sessionsBreakdown?.length > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.primary + '10' }}>
          <p className="text-xs font-medium mb-2" style={{ color: colors.primary + '70' }}>
            Sessions incluses:
          </p>
          <div className="space-y-2">
            {payment.earningsBreakdown.sessionsBreakdown.map((session, idx) => {
              const sessionColor = session.sessionType === 'ActiveCallSession' ? colors.call : colors.chat;
              return (
                <div key={idx} className="flex justify-between items-center text-xs pl-2 border-l-2"
                  style={{ borderColor: sessionColor }}>
                  <span style={{ color: colors.primary }}>
                    {session.sessionType === 'ActiveCallSession' ? '📞 Appel' : '💬 Chat'} • 
                    {new Date(session.date).toLocaleDateString('fr-FR')} • {session.duration} min
                  </span>
                  <span className="font-bold" style={{ color: colors.success }}>
                    {formatCurrency(session.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Debug Panel Component
const DebugPanel = ({ apiResponse, loading }) => {
  const [showDebug, setShowDebug] = useState(false);

  if (!apiResponse || loading) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="mb-2 px-3 py-1 text-sm rounded hover:opacity-90 flex items-center transition-all duration-200"
        style={{
          backgroundColor: colors.secondary,
          color: colors.primary
        }}
      >
        <FaExclamationTriangle className="mr-2" />
        {showDebug ? 'Masquer Infos Débogage' : 'Afficher Infos Débogage'}
      </button>
      
      {showDebug && (
        <div className="p-4 rounded-lg text-sm font-mono overflow-auto max-h-96"
          style={{ 
            backgroundColor: colors.primary + '10',
            borderColor: colors.secondary + '50',
            borderWidth: '1px',
            color: colors.primary + '90'
          }}>
          <h4 className="font-bold mb-2" style={{ color: colors.secondary }}>Réponse API:</h4>
          <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// Format currency helper
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export default function PsychicDashboard() {
  const { psychic } = usePsychicAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State variables
  const [dashboardData, setDashboardData] = useState({
    today: { 
      totalPaid: 0, 
      psychicEarnings: 0, 
      platformEarnings: 0,
      chatEarnings: 0, 
      callEarnings: 0, 
      sessions: 0, 
      chatSessions: 0, 
      callSessions: 0 
    },
    week: { 
      totalPaid: 0, 
      psychicEarnings: 0, 
      platformEarnings: 0,
      chatEarnings: 0, 
      callEarnings: 0, 
      sessions: 0, 
      chatSessions: 0, 
      callSessions: 0 
    },
    month: { 
      totalPaid: 0, 
      psychicEarnings: 0, 
      platformEarnings: 0,
      chatEarnings: 0, 
      callEarnings: 0, 
      sessions: 0, 
      chatSessions: 0, 
      callSessions: 0 
    },
    allTime: { 
      totalPaid: 0, 
      psychicEarnings: 0, 
      platformEarnings: 0,
      chatEarnings: 0, 
      callEarnings: 0, 
      sessions: 0, 
      chatSessions: 0, 
      callSessions: 0, 
      totalUsers: 0 
    },
    userBreakdown: [],
    recentSessions: [],
    paymentHistory: [], // New: Store payment history
    paymentSummary: {   // New: Payment summary
      totalEarnings: 0,
      totalPaid: 0,
      pendingAmount: 0,
      totalPayments: 0
    },
    splitRatio: { psychic: 0.25, platform: 0.75 }
  });
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const isDashboardHome = location.pathname === '/psychic/dashboard';

  // Create API instance
  const api = useRef(
    axios.create({
      baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  );

  // Add request interceptor
  useEffect(() => {
    const requestInterceptor = api.current.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('psychicToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.current.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('psychicToken');
    if (!token) {
      setError('Veuillez vous connecter pour accéder au tableau de bord');
      setLoading(false);
      navigate('/psychic/login');
      return;
    }
  }, [navigate]);

  // Fetch payment history
  const fetchPaymentHistory = async () => {
    try {
      const psychicId = psychic?._id || localStorage.getItem('psychicId');
      if (!psychicId) return null;

      const response = await api.current.get('/api/psychic/payments/history');
      
      if (response.data && response.data.success) {
        console.log('✅ Payment history fetched:', response.data.data);
        return response.data.data.payments || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      return [];
    }
  };

  // Also add a function to fetch payment summary
  const fetchPaymentSummary = async () => {
    try {
      const response = await api.current.get('/api/psychic/payments/summary');
      
      if (response.data && response.data.success) {
        console.log('✅ Payment summary fetched:', response.data.data);
        return response.data.data.summary;
      }
      return null;
    } catch (error) {
      console.error('Error fetching payment summary:', error);
      return null;
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      // Fetch earnings data
      const earningsResponse = await api.current.get('/api/chatrequest/psychic/earnings');
      
      // Fetch payment history and summary from psychic endpoints
      const [paymentHistory, paymentSummary] = await Promise.all([
        fetchPaymentHistory(),
        fetchPaymentSummary()
      ]);
      
      if (earningsResponse.data && earningsResponse.data.success) {
        setApiResponse(earningsResponse.data);
        const processedData = processApiResponse(earningsResponse.data, paymentHistory, paymentSummary);
        setDashboardData(processedData);
        return { success: true };
      } else {
        throw new Error('Format de réponse invalide');
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      
      // Use mock data as fallback
      const mockData = createMockData();
      setDashboardData(mockData);
      
      let errorMessage = 'Utilisation des données de démonstration - ' + (err.message || 'Échec du chargement des données');
      if (err.response?.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        localStorage.removeItem('psychicToken');
        localStorage.removeItem('psychicData');
        setTimeout(() => navigate('/psychic/login'), 2000);
      }
      
      setError(errorMessage);
      return { success: false };
    }
  };
  
  // Process API response - UPDATED to include payment history
  const processApiResponse = (response, paymentHistory = []) => {
    const d = response.data;
    
    if (!d || !d.summary) {
      return createMockData();
    }
    
    // Calculate payment summary from payment history
    const totalEarnings = d.summary.allTime?.totalPaid || 0;
    const totalPaid = paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingAmount = totalEarnings * 0.25 - totalPaid; // 25% of total earnings minus paid
    
    return {
      today: {
        totalPaid: d.summary.daily?.totalPaid || 0,
        psychicEarnings: d.summary.daily?.psychicEarnings || 0,
        platformEarnings: d.summary.daily?.platformEarnings || 0,
        chatEarnings: d.summary.daily?.chatEarnings || 0,
        callEarnings: d.summary.daily?.callEarnings || 0,
        sessions: d.summary.daily?.sessions || 0,
        chatSessions: d.summary.daily?.chatSessions || 0,
        callSessions: d.summary.daily?.callSessions || 0
      },
      week: {
        totalPaid: d.summary.weekly?.totalPaid || 0,
        psychicEarnings: d.summary.weekly?.psychicEarnings || 0,
        platformEarnings: d.summary.weekly?.platformEarnings || 0,
        chatEarnings: d.summary.weekly?.chatEarnings || 0,
        callEarnings: d.summary.weekly?.callEarnings || 0,
        sessions: d.summary.weekly?.sessions || 0,
        chatSessions: d.summary.weekly?.chatSessions || 0,
        callSessions: d.summary.weekly?.callSessions || 0
      },
      month: {
        totalPaid: d.summary.monthly?.totalPaid || 0,
        psychicEarnings: d.summary.monthly?.psychicEarnings || 0,
        platformEarnings: d.summary.monthly?.platformEarnings || 0,
        chatEarnings: d.summary.monthly?.chatEarnings || 0,
        callEarnings: d.summary.monthly?.callEarnings || 0,
        sessions: d.summary.monthly?.sessions || 0,
        chatSessions: d.summary.monthly?.chatSessions || 0,
        callSessions: d.summary.monthly?.callSessions || 0
      },
      allTime: {
        totalPaid: d.summary.allTime?.totalPaid || 0,
        psychicEarnings: d.summary.allTime?.psychicEarnings || 0,
        platformEarnings: d.summary.allTime?.platformEarnings || 0,
        chatEarnings: d.summary.allTime?.chatEarnings || 0,
        callEarnings: d.summary.allTime?.callEarnings || 0,
        sessions: d.summary.allTime?.sessions || 0,
        chatSessions: d.summary.allTime?.chatSessions || 0,
        callSessions: d.summary.allTime?.callSessions || 0,
        totalUsers: d.summary.allTime?.totalUsers || 0
      },
      userBreakdown: (d.userBreakdown || []).map(user => ({
        ...user,
        totalEarnings: user.psychicEarnings || 0,
        chatEarnings: user.chatPaid ? user.chatPaid * 0.25 : 0,
        callEarnings: user.callPaid ? user.callPaid * 0.25 : 0,
        totalSessions: user.totalSessions || 0,
        chatSessions: user.chatSessions || 0,
        callSessions: user.callSessions || 0,
        totalTimeMinutes: user.totalTimeMinutes || 0,
        avgEarningsPerSession: user.avgEarningsPerSession || 0
      })),
      recentSessions: (d.recentSessions || []).map(s => ({
        ...s,
        type: s.type || (s.totalCreditsUsed ? 'call' : 'chat'),
        amount: s.psychicEarnings || 0
      })),
      paymentHistory: paymentHistory || [], // Add payment history
      paymentSummary: { // Add payment summary
        totalEarnings: d.summary.allTime?.totalPaid || 0,
        totalPaid,
        pendingAmount: Math.max(0, pendingAmount),
        totalPayments: paymentHistory.length
      },
      splitRatio: d.splitRatio || { psychic: 0.25, platform: 0.75 }
    };
  };

  // Create mock data - UPDATED to include payment history
  const createMockData = () => {
    const mockPaymentHistory = [
      {
        _id: '1',
        amount: 1.00,
        paymentId: 'dsfkjsdflkdjsfklsdfdsfdsfds',
        paymentMethod: 'paypal',
        paymentDate: new Date().toISOString(),
        beforePaymentStats: {
          totalEarnings: 7.37,
          paidAmount: 0,
          pendingAmount: 1.84
        },
        afterPaymentStats: {
          totalEarnings: 7.37,
          paidAmount: 1,
          pendingAmount: 0.84
        },
        earningsBreakdown: {
          sessionsBreakdown: [
            {
              sessionId: '1',
              sessionType: 'ChatRequest',
              amount: 1,
              date: new Date().toISOString(),
              duration: 2
            }
          ]
        }
      }
    ];

    return {
      today: {
        totalPaid: 6.65,
        psychicEarnings: 1.66,
        platformEarnings: 4.99,
        chatEarnings: 0.65,
        callEarnings: 6.00,
        sessions: 2,
        chatSessions: 1,
        callSessions: 1
      },
      week: {
        totalPaid: 6.65,
        psychicEarnings: 1.66,
        platformEarnings: 4.99,
        chatEarnings: 0.65,
        callEarnings: 6.00,
        sessions: 2,
        chatSessions: 1,
        callSessions: 1
      },
      month: {
        totalPaid: 6.65,
        psychicEarnings: 1.66,
        platformEarnings: 4.99,
        chatEarnings: 0.65,
        callEarnings: 6.00,
        sessions: 2,
        chatSessions: 1,
        callSessions: 1
      },
      allTime: {
        totalPaid: 7.37,
        psychicEarnings: 1.84,
        platformEarnings: 5.53,
        chatEarnings: 7.37,
        callEarnings: 0,
        sessions: 3,
        chatSessions: 2,
        callSessions: 1,
        totalUsers: 1
      },
      userBreakdown: [
        {
          user: { _id: '1', username: 'Zia', email: 'zia@gmail.com' },
          totalEarnings: 1.84,
          psychicEarnings: 1.84,
          platformEarnings: 5.53,
          totalPaid: 7.37,
          chatPaid: 7.37,
          callPaid: 0,
          chatEarnings: 1.84,
          callEarnings: 0,
          totalSessions: 3,
          chatSessions: 2,
          callSessions: 1,
          totalTimeMinutes: 6,
          avgEarningsPerSession: 0.61
        }
      ],
      recentSessions: [
        {
          _id: '1',
          type: 'chat',
          user: { username: 'Zia', email: 'zia@gmail.com' },
          totalAmount: 7.37,
          psychicEarnings: 1.84,
          platformEarnings: 5.53,
          amount: 1.84,
          durationMinutes: 2,
          endedAt: new Date().toISOString()
        }
      ],
      paymentHistory: mockPaymentHistory,
      paymentSummary: {
        totalEarnings: 7.37,
        totalPaid: 1.00,
        pendingAmount: 0.84,
        totalPayments: 1
      },
      splitRatio: { psychic: 0.25, platform: 0.75 }
    };
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDashboardData();
      setLoading(false);
    };

    if (isDashboardHome) {
      loadData();
    }
  }, [isDashboardHome]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // Calculate growth percentages
  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const todayGrowth = calculateGrowth(dashboardData.today.psychicEarnings, dashboardData.today.psychicEarnings * 0.8);
  const weekGrowth = calculateGrowth(dashboardData.week.psychicEarnings, dashboardData.week.psychicEarnings * 0.7);

  // Get user rank color
  const getUserRankColor = (index) => {
    switch(index) {
      case 0: return `bg-yellow-100 text-yellow-700 border-yellow-300`;
      case 1: return `bg-gray-100 text-gray-700 border-gray-300`;
      case 2: return `bg-orange-100 text-orange-700 border-orange-300`;
      default: return `bg-blue-100 text-blue-700 border-blue-300`;
    }
  };

  // Calculate session mix percentages
  const totalSessions = dashboardData.allTime.sessions;
  const chatPercentage = totalSessions > 0 ? Math.round((dashboardData.allTime.chatSessions / totalSessions) * 100) : 0;
  const callPercentage = totalSessions > 0 ? Math.round((dashboardData.allTime.callSessions / totalSessions) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {isDashboardHome && (
        <>
          {/* Header */}
          <div className="shadow-sm border-b">
            <div className="px-4 md:px-6 py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>Tableau de Bord des Gains</h1>
                  <p className="mt-1" style={{ color: colors.textLight }}>
                    Bon retour, <span className="font-semibold" style={{ color: colors.secondary }}>{psychic?.name || 'Médium'}</span> !
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRefresh}
                    disabled={loading || refreshing}
                    className="px-4 py-2 rounded-lg font-bold transition-all duration-300 hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50"
                    style={{
                      backgroundColor: colors.secondary,
                      color: colors.primary
                    }}
                  >
                    {refreshing ? <FaSpinner className="animate-spin" /> : <FaChartBar />}
                    <span>{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
                  </button>
                </div>
              </div>
              
              {/* Payment Summary Banner - NEW */}
              {!loading && dashboardData.paymentSummary && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border" style={{ borderColor: colors.primary + '20' }}>
                    <p className="text-sm" style={{ color: colors.primary + '70' }}>Gains Totaux</p>
                    <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {formatCurrency(dashboardData.paymentSummary.totalEarnings)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border" style={{ borderColor: colors.success + '20' }}>
                    <p className="text-sm" style={{ color: colors.success + '80' }}>Montant Payé</p>
                    <p className="text-2xl font-bold" style={{ color: colors.success }}>
                      {formatCurrency(dashboardData.paymentSummary.totalPaid)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: colors.primary + '60' }}>
                      {dashboardData.paymentSummary.totalPayments} paiements
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border" style={{ borderColor: colors.warning + '20' }}>
                    <p className="text-sm" style={{ color: colors.warning + '80' }}>Solde en Attente</p>
                    <p className="text-2xl font-bold" style={{ color: colors.warning }}>
                      {formatCurrency(dashboardData.paymentSummary.pendingAmount)}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Tabs */}
              <div className="flex gap-1 mt-6 border-b overflow-x-auto" style={{ borderColor: colors.primary + '50' }}>
                {[
                  { id: 'overview', label: 'Aperçu' },
                  { id: 'payments', label: 'Paiements' },
                  { id: 'users', label: 'Utilisateurs' },
                  { id: 'sessions', label: 'Sessions' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 font-bold capitalize transition-colors whitespace-nowrap relative ${
                      activeTab === tab.id
                        ? 'text-white'
                        : `hover:text-white ${colors.textLight}`
                    }`}
                  >
                    {tab.label}
                    {tab.id === 'payments' && dashboardData.paymentHistory?.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-500 text-white">
                        {dashboardData.paymentHistory.length}
                      </span>
                    )}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: colors.secondary }}></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {/* Debug Panel */}
            <DebugPanel apiResponse={apiResponse} loading={loading} />

            {/* Error Display */}
            {error && (
              <div className="mb-6">
                <div className={`px-4 py-3 rounded-lg flex justify-between items-center border ${
                  error.includes('démonstration') 
                    ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
                    : 'border-red-300 bg-red-50 text-red-700'
                }`}>
                  <div className="flex items-center">
                    <FaExclamationTriangle className="mr-2" />
                    <span>{error}</span>
                  </div>
                  <button onClick={() => setError(null)} className="ml-4 hover:opacity-70">✕</button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <FaSpinner className="text-4xl animate-spin mx-auto mb-4" style={{ color: colors.secondary }} />
                <p style={{ color: colors.primary + '70' }}>Chargement des données du tableau de bord...</p>
              </div>
            ) : (
              <>
                {activeTab === "overview" && (
                  <>
                    {/* Session Type Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-white rounded-xl shadow-md p-6 border" style={{ borderColor: colors.chat + '30' }}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 rounded-full" style={{ backgroundColor: colors.chat + '20' }}>
                            <FaComment className="text-xl" style={{ color: colors.chat }} />
                          </div>
                          <h3 className="text-lg font-bold" style={{ color: colors.primary }}>Sessions Chat</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm" style={{ color: colors.primary + '70' }}>Vos Gains</p>
                            <p className="text-2xl font-bold" style={{ color: colors.chat }}>
                              {formatCurrency(dashboardData.allTime.chatEarnings * 0.25)}
                            </p>
                            <p className="text-xs" style={{ color: colors.primary + '60' }}>
                              sur {formatCurrency(dashboardData.allTime.chatEarnings)} total
                            </p>
                          </div>
                          <div>
                            <p className="text-sm" style={{ color: colors.primary + '70' }}>Sessions</p>
                            <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                              {dashboardData.allTime.chatSessions}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-md p-6 border" style={{ borderColor: colors.call + '30' }}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 rounded-full" style={{ backgroundColor: colors.call + '20' }}>
                            <FaPhone className="text-xl" style={{ color: colors.call }} />
                          </div>
                          <h3 className="text-lg font-bold" style={{ color: colors.primary }}>Sessions Appel</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm" style={{ color: colors.primary + '70' }}>Vos Gains</p>
                            <p className="text-2xl font-bold" style={{ color: colors.call }}>
                              {formatCurrency(dashboardData.allTime.callEarnings * 0.25)}
                            </p>
                            <p className="text-xs" style={{ color: colors.primary + '60' }}>
                              sur {formatCurrency(dashboardData.allTime.callEarnings)} total
                            </p>
                          </div>
                          <div>
                            <p className="text-sm" style={{ color: colors.primary + '70' }}>Sessions</p>
                            <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                              {dashboardData.allTime.callSessions}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Users & Recent Sessions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Top Users */}
                      <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-md p-6 border"
                          style={{ borderColor: colors.primary + '20' }}>
                          <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold" style={{ color: colors.primary }}>
                              <FaCrown className="inline mr-2" style={{ color: colors.secondary }} />
                              Meilleurs Utilisateurs
                            </h2>
                          </div>
                          <div className="space-y-4">
                            {dashboardData.userBreakdown.length > 0 ? (
                              dashboardData.userBreakdown.slice(0, 5).map((user, index) => (
                                <div key={user.user?._id || index} 
                                  className="bg-white rounded-lg border p-4 hover:bg-gray-50 transition-all"
                                  style={{ borderColor: colors.primary + '20' }}>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${getUserRankColor(index)} relative`}>
                                        <span className="font-bold">{index + 1}</span>
                                        {index === 0 && <FaCrown className="absolute -top-1 -right-1 text-yellow-400 text-xs" />}
                                      </div>
                                      <div>
                                        <p className="font-bold" style={{ color: colors.primary }}>
                                          {user.user?.username || user.userName || 'Utilisateur Anonyme'}
                                        </p>
                                       
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-lg" style={{ color: colors.success }}>
                                        {formatCurrency(user.totalEarnings || 0)}
                                      </p>
                                      <p className="text-sm" style={{ color: colors.primary + '70' }}>
                                        {user.totalSessions || 0} sessions
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Chat/Call Breakdown */}
                                  <div className="mt-3 grid grid-cols-2 gap-2">
                                    <div className="text-xs p-2 rounded" style={{ backgroundColor: colors.chat + '10' }}>
                                      <span className="font-medium" style={{ color: colors.chat }}>Chat:</span>
                                      <span className="ml-2" style={{ color: colors.primary }}>
                                        {formatCurrency(user.chatEarnings || 0)} ({user.chatSessions || 0})
                                      </span>
                                    </div>
                                    <div className="text-xs p-2 rounded" style={{ backgroundColor: colors.call + '10' }}>
                                      <span className="font-medium" style={{ color: colors.call }}>Appel:</span>
                                      <span className="ml-2" style={{ color: colors.primary }}>
                                        {formatCurrency(user.callEarnings || 0)} ({user.callSessions || 0})
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-sm"
                                    style={{ borderColor: colors.primary + '10' }}>
                                    <div>
                                      <p className="font-semibold mb-1" style={{ color: colors.primary + '80' }}>Temps</p>
                                      <p className="font-bold" style={{ color: colors.primary }}>
                                        {user.totalTimeMinutes || 0} min
                                      </p>
                                    </div>
                                    <div>
                                      <p className="font-semibold mb-1" style={{ color: colors.accent }}>Moy/Session</p>
                                      <p className="font-bold" style={{ color: colors.accent }}>
                                        {formatCurrency(user.avgEarningsPerSession || 0)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="font-semibold mb-1" style={{ color: colors.secondary }}>Fréquence</p>
                                      <p className="font-bold" style={{ color: colors.secondary }}>
                                        {((user.totalSessions || 0) / 4).toFixed(1)}/sem
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8">
                                <FaUserFriends className="text-4xl mx-auto mb-3" style={{ color: colors.primary + '30' }} />
                                <p style={{ color: colors.primary + '70' }}>Aucune donnée utilisateur disponible</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Recent Sessions & Stats */}
                      <div className="space-y-6">
                        {/* Recent Sessions */}
                        <div className="bg-white rounded-xl shadow-md p-6 border"
                          style={{ borderColor: colors.primary + '20' }}>
                          <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold" style={{ color: colors.primary }}>
                              <FaHistory className="inline mr-2" style={{ color: colors.accent }} />
                              Sessions Récentes
                            </h2>
                          </div>
                          <div className="space-y-4">
                            {dashboardData.recentSessions.length > 0 ? (
                              dashboardData.recentSessions.slice(0, 5).map((session, index) => {
                                const sessionColor = session.type === 'call' ? colors.call : colors.chat;
                                const SessionIcon = session.type === 'call' ? FaPhone : FaComment;
                                
                                return (
                                  <div key={session._id || index} 
                                    className="pl-4 py-3 rounded-r hover:bg-gray-50 transition-colors"
                                    style={{ 
                                      borderLeft: `4px solid ${sessionColor}`,
                                      backgroundColor: index % 2 === 0 ? colors.primary + '03' : 'transparent'
                                    }}>
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <SessionIcon className="text-xs" style={{ color: sessionColor }} />
                                          <p className="font-bold" style={{ color: colors.primary }}>
                                            {session.user?.username || 'Utilisateur'}
                                          </p>
                                        </div>
                                        <p className="text-xs" style={{ color: colors.primary + '60' }}>
                                          {session.type === 'call' ? 'Appel' : 'Chat'} • {session.endedAt ? new Date(session.endedAt).toLocaleDateString('fr-FR') : 'Récent'}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold" style={{ color: colors.success }}>
                                          {formatCurrency(session.amount || 0)}
                                        </p>
                                        <p className="text-xs" style={{ color: colors.primary + '70' }}>
                                          {session.durationMinutes || 0} min
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-4">
                                <p style={{ color: colors.primary + '70' }}>Aucune session récente</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Session Mix Stats */}
                        <div className="bg-white rounded-xl shadow-md p-6 border"
                          style={{ borderColor: colors.primary + '20' }}>
                          <h3 className="text-lg font-bold mb-4" style={{ color: colors.primary }}>
                            <FaChartPie className="inline mr-2" style={{ color: colors.secondary }} />
                            Répartition des Sessions
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span style={{ color: colors.chat }}>Sessions Chat</span>
                                <span className="font-bold" style={{ color: colors.chat }}>
                                  {chatPercentage}%
                                </span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.primary + '20' }}>
                                <div className="h-full" style={{ 
                                  backgroundColor: colors.chat,
                                  width: `${chatPercentage}%` 
                                }}></div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span style={{ color: colors.call }}>Sessions Appel</span>
                                <span className="font-bold" style={{ color: colors.call }}>
                                  {callPercentage}%
                                </span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.primary + '20' }}>
                                <div className="h-full" style={{ 
                                  backgroundColor: colors.call,
                                  width: `${callPercentage}%` 
                                }}></div>
                              </div>
                              <p className="text-xs mt-2" style={{ color: colors.primary + '60' }}>
                                {dashboardData.allTime.chatSessions} chats • {dashboardData.allTime.callSessions} appels
                              </p>
                            </div>
                            
                            <div className="pt-4 border-t" style={{ borderColor: colors.primary + '20' }}>
                              <div className="flex justify-between items-center mb-2">
                                <span style={{ color: colors.primary + '70' }}>Valeur Moyenne par Session (Vos Gains)</span>
                                <span className="font-bold" style={{ color: colors.accent }}>
                                  {dashboardData.allTime.sessions > 0 
                                    ? formatCurrency(dashboardData.allTime.psychicEarnings / dashboardData.allTime.sessions)
                                    : '0,00 €'}
                                </span>
                              </div>
                              <p className="text-xs text-right" style={{ color: colors.primary + '60' }}>
                                sur une moyenne de {formatCurrency(dashboardData.allTime.totalPaid / dashboardData.allTime.sessions)} total
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Payments Tab - NEW */}
                {activeTab === "payments" && (
                  <div className="bg-white rounded-xl shadow-md p-6 border"
                    style={{ borderColor: colors.primary + '20' }}>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>
                        <FaReceipt className="inline mr-2" style={{ color: colors.secondary }} />
                        Historique des Paiements
                      </h2>
                      <div className="text-right">
                        <p className="text-sm" style={{ color: colors.primary + '70' }}>Montant Payé Total</p>
                        <p className="text-2xl font-bold" style={{ color: colors.success }}>
                          {formatCurrency(dashboardData.paymentSummary?.totalPaid || 0)}
                        </p>
                      </div>
                    </div>
                    
                    {dashboardData.paymentHistory?.length > 0 ? (
                      <div className="space-y-4">
                        {dashboardData.paymentHistory.map((payment) => (
                          <PaymentCard key={payment._id} payment={payment} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FaCreditCard className="text-4xl mx-auto mb-3" style={{ color: colors.primary + '30' }} />
                        <p style={{ color: colors.primary + '70' }}>Aucun historique de paiement</p>
                        <p className="text-sm mt-2" style={{ color: colors.primary + '50' }}>
                          Les paiements apparaîtront ici une fois traités par l'administrateur
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === "users" && (
                  <div className="bg-white rounded-xl shadow-md p-6 border"
                    style={{ borderColor: colors.primary + '20' }}>
                    <h2 className="text-2xl font-bold mb-6" style={{ color: colors.primary }}>
                      <FaUserTie className="inline mr-2" style={{ color: colors.secondary }} />
                      Analyse des Utilisateurs
                    </h2>
                    
                    {dashboardData.userBreakdown.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y" style={{ borderColor: colors.primary + '20' }}>
                          <thead style={{ backgroundColor: colors.primary + '05' }}>
                            <tr>
                              {['Rang', 'Utilisateur', 'Vos Gains', 'Chat (Votre Part)', 'Appel (Votre Part)', 'Sessions', 'Temps', 'Moy/Session'].map((header) => (
                                <th key={header} className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider"
                                  style={{ color: colors.primary + '70' }}>
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y" style={{ borderColor: colors.primary + '10' }}>
                            {dashboardData.userBreakdown.map((user, index) => (
                              <tr key={user.user?._id || index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${getUserRankColor(index)} relative`}>
                                    <span className="font-bold">{index + 1}</span>
                                    {index === 0 && <FaCrown className="absolute -top-1 -right-1 text-yellow-400 text-xs" />}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center"
                                      style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)` }}>
                                      <span className="font-bold text-white">
                                        {user.user?.username?.[0]?.toUpperCase() || user.user?.email?.[0]?.toUpperCase() || 'U'}
                                      </span>
                                    </div>
                                    <div className="ml-4">
                                      <div className="font-bold" style={{ color: colors.primary }}>
                                        {user.user?.username || 'Utilisateur Anonyme'}
                                      </div>
                                      
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-lg font-bold" style={{ color: colors.success }}>
                                    {formatCurrency(user.totalEarnings || 0)}
                                  </div>
                                  <div className="text-xs" style={{ color: colors.primary + '60' }}>
                                    sur {formatCurrency((user.totalEarnings || 0) * 4)} total
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-medium" style={{ color: colors.chat }}>
                                    {formatCurrency(user.chatEarnings || 0)}
                                  </div>
                                  <div className="text-xs" style={{ color: colors.primary + '60' }}>
                                    {user.chatSessions || 0} sess
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-medium" style={{ color: colors.call }}>
                                    {formatCurrency(user.callEarnings || 0)}
                                  </div>
                                  <div className="text-xs" style={{ color: colors.primary + '60' }}>
                                    {user.callSessions || 0} sess
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-bold" style={{ color: colors.primary }}>{user.totalSessions || 0}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-medium" style={{ color: colors.primary }}>
                                    {user.totalTimeMinutes || 0} min
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-bold" style={{ color: colors.accent }}>
                                    {formatCurrency(user.avgEarningsPerSession || 0)}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FaUserFriends className="text-4xl mx-auto mb-3" style={{ color: colors.primary + '30' }} />
                        <p style={{ color: colors.primary + '70' }}>Aucune donnée utilisateur disponible</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Sessions Tab */}
                {activeTab === "sessions" && (
                  <div className="bg-white rounded-xl shadow-md p-6 border"
                    style={{ borderColor: colors.primary + '20' }}>
                    <h2 className="text-2xl font-bold mb-6" style={{ color: colors.primary }}>
                      <FaHistory className="inline mr-2" style={{ color: colors.secondary }} />
                      Historique des Sessions
                    </h2>
                    
                    {dashboardData.recentSessions.length > 0 ? (
                      <div className="space-y-4">
                        {dashboardData.recentSessions.map((session, index) => {
                          const sessionColor = session.type === 'call' ? colors.call : colors.chat;
                          const SessionIcon = session.type === 'call' ? FaPhone : FaComment;
                          
                          return (
                            <div key={session._id || index} 
                              className="p-4 rounded-lg hover:scale-[1.01] transition-all duration-300 border"
                              style={{ 
                                borderColor: sessionColor + '30',
                                backgroundColor: colors.primary + '02'
                              }}>
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: sessionColor + '20' }}>
                                    <SessionIcon className="" style={{ color: sessionColor }} />
                                  </div>
                                  <div>
                                    <h4 className="font-bold" style={{ color: colors.primary }}>
                                      {session.user?.username || 'Utilisateur'}
                                    </h4>
                                    <p className="text-xs" style={{ color: colors.primary + '70' }}>
                                      {session.type === 'call' ? 'Session Appel' : 'Session Chat'} • {session.endedAt ? new Date(session.endedAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm mt-2" style={{ color: colors.primary + '70' }}>
                                      <span className="flex items-center">
                                        <FaClock className="mr-1" /> {session.durationMinutes || 0} min
                                      </span>
                                      <span className="flex items-center">
                                        <FaMoneyBillWave className="mr-1" /> {formatCurrency(session.amount || 0)}
                                      </span>
                                      {session.totalAmount && (
                                        <span className="text-xs" style={{ color: colors.primary + '50' }}>
                                          (total: {formatCurrency(session.totalAmount)})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-xs" style={{ color: colors.primary + '50' }}>
                                  {session.endedAt ? new Date(session.endedAt).toLocaleTimeString('fr-FR') : ''}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FaHistory className="text-4xl mx-auto mb-3" style={{ color: colors.primary + '30' }} />
                        <p style={{ color: colors.primary + '70' }}>Aucun historique de sessions</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
      {!isDashboardHome && <Outlet />}
    </div>
  );
}