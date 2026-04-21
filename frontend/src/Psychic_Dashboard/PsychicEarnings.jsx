import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FaDollarSign,
  FaChartLine,
  FaUsers,
  FaClock,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaCalendar,
  FaUserTie,
  FaHistory,
  FaSpinner,
  FaArrowUp,
  FaArrowDown,
  FaPercent,
  FaMoneyBillWave,
  FaChartBar,
  FaFilter,
  FaDownload,
  FaEye,
  FaEyeSlash,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSearch,
  FaTimes,
  FaInfoCircle,
  FaCrown,
  FaChartPie,
  FaFire,
  FaStar,
  FaPhone,
  FaCommentDots,
  FaExchangeAlt
} from 'react-icons/fa';

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
const StatCard = ({ title, value, icon: Icon, color, change = null, loading = false, onClick = null, subtitle = null, tooltip = null }) => (
  <div 
    className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border ${
      loading ? 'animate-pulse' : 'border-gray-100'
    } hover:scale-[1.02]`}
    onClick={onClick}
    style={{ 
      borderColor: colors.primary + '10',
      background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`
    }}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium" style={{ color: colors.primary + '80' }}>{title}</p>
          {tooltip && (
            <FaInfoCircle className="text-xs" style={{ color: colors.primary + '40' }} title={tooltip} />
          )}
        </div>
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
             <span className="mr-1">→</span>}
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

// Period Card Component - UPDATED to show psychic earnings
const PeriodCard = ({ period, data, loading = false, active = false, onClick }) => {
  const getPeriodIcon = (period) => {
    switch (period) {
      case 'today': return FaCalendarDay;
      case 'week': return FaCalendarWeek;
      case 'month': return FaCalendarAlt;
      case 'year': return FaCalendar;
      default: return FaCalendar;
    }
  };
  
  const getPeriodLabel = (period) => {
    switch (period) {
      case 'today': return 'Aujourd\'hui';
      case 'week': return 'Cette Semaine';
      case 'month': return 'Ce Mois';
      case 'year': return 'Tout Temps';
      default: return period;
    }
  };
  
  const PeriodIcon = getPeriodIcon(period);

  return (
    <div 
      className={`rounded-xl shadow-md p-6 cursor-pointer transition-all duration-300 border ${
        active ? 'border-2 scale-[1.02]' : 'border-gray-100 hover:border-gray-200 hover:scale-[1.01]'
      }`}
      onClick={onClick}
      style={{
        backgroundColor: active ? colors.primary + '08' : 'white',
        borderColor: active ? colors.secondary : colors.primary + '10',
        background: active ? `linear-gradient(135deg, ${colors.primary}05 0%, ${colors.primary}15 100%)` : 'white'
      }}
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className={`p-2 rounded-lg`}
          style={{
            backgroundColor: active ? colors.secondary + '20' : colors.primary + '10',
            color: active ? colors.secondary : colors.primary + '70'
          }}>
          <PeriodIcon className="text-lg" />
        </div>
        <h4 className={`text-lg font-semibold`}
          style={{
            color: active ? colors.primary : colors.primary + '90'
          }}>
          {getPeriodLabel(period)}
        </h4>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Vos Gains (25%)</span>
          <span className="font-bold text-lg"
            style={{ color: colors.success }}>
            {loading ? "..." : formatCurrency(data?.psychicEarnings || 0)}
          </span>
        </div>
        
        <div className="flex justify-between items-center pl-2 text-xs" style={{ color: colors.primary + '60' }}>
          <span>Total Payé par les Utilisateurs</span>
          <span>{loading ? "..." : formatCurrency(data?.totalPaid || 0)}</span>
        </div>
        
        {/* Chat Earnings */}
        <div className="flex justify-between items-center pl-2 border-l-2" style={{ borderColor: colors.chat }}>
          <span className="text-sm text-gray-500">Gains Chat (votre part)</span>
          <span className="font-medium" style={{ color: colors.chat }}>
            {loading ? "..." : formatCurrency((data?.chatEarnings || 0) * 0.25)}
          </span>
        </div>
        
        {/* Call Earnings */}
        <div className="flex justify-between items-center pl-2 border-l-2" style={{ borderColor: colors.call }}>
          <span className="text-sm text-gray-500">Gains Appel (votre part)</span>
          <span className="font-medium" style={{ color: colors.call }}>
            {loading ? "..." : formatCurrency((data?.callEarnings || 0) * 0.25)}
          </span>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t"
          style={{ borderColor: colors.primary + '20' }}>
          <span className="text-gray-600">Sessions</span>
          <div className="text-right">
            <span className="font-semibold block" style={{ color: colors.primary }}>
              {loading ? "..." : (data?.sessions || 0)}
            </span>
            <span className="text-xs" style={{ color: colors.primary + '60' }}>
              {data?.chatSessions || 0} chat • {data?.callSessions || 0} appel
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Utilisateurs</span>
          <span className="font-semibold" style={{ color: colors.accent }}>
            {loading ? "..." : (data?.users || data?.totalUsers || 0)}
          </span>
        </div>
        
        {(data?.timeMinutes || 0) > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Temps Total</span>
            <span className="font-semibold" style={{ color: colors.warning }}>
              {loading ? "..." : `${data.timeMinutes || 0} min`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// User Earnings Card Component - UPDATED to show psychic earnings
const UserEarningsCard = ({ user, rank, onViewDetails }) => (
  <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-gray-100 group">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
          rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-yellow-300 shadow-lg' : 
          rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 border-2 border-gray-200' : 
          rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-500 border-2 border-orange-200' : 
          'bg-gradient-to-br from-blue-300 to-blue-500 border-2 border-blue-200'
        }`}>
          <span className={`font-bold ${rank <= 3 ? 'text-white' : 'text-white'}`}>
            {rank}
          </span>
          {rank === 1 && (
            <FaCrown className="absolute -top-1 -right-1 text-yellow-300 text-xs" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-lg truncate" style={{ color: colors.primary }}>
            {user.user?.username || user.userName || "Utilisateur Anonyme"}
          </p>
          <p className="text-sm truncate" style={{ color: colors.primary + '70' }}>
            {user.user?.email || user.userEmail || "Aucun email"}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xl font-bold" style={{ color: colors.success }}>
          {formatCurrency(user.psychicEarnings || user.totalEarnings || 0)}
        </p>
        <p className="text-xs mt-1" style={{ color: colors.primary + '50' }}>
          sur {formatCurrency(user.totalPaid || 0)} total
        </p>
        <p className="text-sm mt-1" style={{ color: colors.primary + '60' }}>
          {user.totalSessions || 0} sessions
        </p>
      </div>
    </div>
    
    {/* Chat/Call Breakdown - UPDATED to show psychic share */}
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.chat + '10' }}>
        <p className="text-xs mb-1" style={{ color: colors.chat }}>Chat (votre part)</p>
        <p className="font-bold text-sm" style={{ color: colors.chat }}>
          {formatCurrency(user.chatEarnings || 0)}
        </p>
        <p className="text-xs" style={{ color: colors.primary + '60' }}>
          sur {formatCurrency(user.chatPaid || 0)} total • {user.chatSessions || 0} sess
        </p>
      </div>
      <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.call + '10' }}>
        <p className="text-xs mb-1" style={{ color: colors.call }}>Appel (votre part)</p>
        <p className="font-bold text-sm" style={{ color: colors.call }}>
          {formatCurrency(user.callEarnings || 0)}
        </p>
        <p className="text-xs" style={{ color: colors.primary + '60' }}>
          sur {formatCurrency(user.callPaid || 0)} total • {user.callSessions || 0} sess
        </p>
      </div>
    </div>
    
    <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
      <div className="text-center p-2 rounded-lg bg-gray-50">
        <p className="font-semibold mb-1" style={{ color: colors.primary + '80' }}>Temps</p>
        <p className="font-bold" style={{ color: colors.primary }}>
          {user.totalTimeMinutes || 0} min
        </p>
      </div>
      <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.accent + '10' }}>
        <p className="font-semibold mb-1" style={{ color: colors.accent }}>Moy/Session</p>
        <p className="font-bold" style={{ color: colors.accent }}>
          {formatCurrency(user.avgEarningsPerSession || 0)}
        </p>
      </div>
      <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.secondary + '10' }}>
        <p className="font-semibold mb-1" style={{ color: colors.secondary }}>Fréquence</p>
        <p className="font-bold" style={{ color: colors.secondary }}>
          {((user.totalSessions || 0) / 4).toFixed(1)}/sem
        </p>
      </div>
    </div>
    
    <button
      onClick={() => onViewDetails(user.user?._id)}
      className="w-full px-4 py-3 rounded-lg font-bold transition-all duration-300 hover:scale-[1.02] group-hover:shadow-md flex items-center justify-center"
      style={{
        backgroundColor: colors.secondary,
        color: colors.primary
      }}
    >
      <FaEye className="mr-2" /> Voir Détails
    </button>
  </div>
);

// Filter Component
const FilterComponent = ({ filters, onFilterChange, onReset }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 mb-3"
        style={{
          backgroundColor: colors.primary + '10',
          color: colors.primary
        }}
      >
        <FaFilter />
        {showFilters ? 'Masquer Filtres' : 'Afficher Filtres'}
      </button>
      
      {showFilters && (
        <div className="bg-white rounded-xl shadow-md p-6 border" style={{ borderColor: colors.primary + '20' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.primary }}>
                Rechercher Utilisateur
              </label>
              <input
                type="text"
                value={filters.searchQuery || ''}
                onChange={(e) => onFilterChange('searchQuery', e.target.value)}
                placeholder="Nom ou email..."
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: colors.primary + '30' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.primary }}>
                Montant Minimum
              </label>
              <input
                type="number"
                value={filters.minAmount || ''}
                onChange={(e) => onFilterChange('minAmount', e.target.value)}
                placeholder="Gains minimum"
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: colors.primary + '30' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.primary }}>
                Sessions Minimum
              </label>
              <input
                type="number"
                value={filters.minSessions || ''}
                onChange={(e) => onFilterChange('minSessions', e.target.value)}
                placeholder="Sessions minimum"
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: colors.primary + '30' }}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={onReset}
                className="px-4 py-2 rounded-lg font-medium"
                style={{
                  backgroundColor: colors.primary + '10',
                  color: colors.primary
                }}
              >
                Réinitialiser Filtres
              </button>
            </div>
          </div>
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

// Format date helper
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format time helper
const formatTime = (minutes) => {
  if (!minutes) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const PsychicEarnings = () => {
  const navigate = useNavigate();
  
  // State variables
  const [earningsData, setEarningsData] = useState(null);
  const [userEarnings, setUserEarnings] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activePeriod, setActivePeriod] = useState('month');
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    minAmount: '',
    minSessions: '',
    searchQuery: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'psychicEarnings', direction: 'desc' });
  const [showUserModal, setShowUserModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showSplitInfo, setShowSplitInfo] = useState(true);

  // Create API instance
  const api = useRef(
    axios.create({
      baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  );

  // Add request interceptor to include token
  useEffect(() => {
    const requestInterceptor = api.current.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('psychicToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      api.current.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('psychicToken');
    if (!token) {
      setError('Veuillez vous connecter pour voir les gains');
      setLoading(false);
      navigate('/psychic/login');
      return;
    }
  }, [navigate]);

  // Fetch earnings data
  const fetchEarningsData = async () => {
    try {
      setError(null);
      const response = await api.current.get('/api/chatrequest/psychic/earnings');
      
      console.log('API Response:', response.data);
      setDebugInfo(response.data);
      
      setEarningsData(response.data);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error fetching earnings:', err);
      let errorMessage = 'Échec du chargement des gains';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          localStorage.removeItem('psychicToken');
          localStorage.removeItem('psychicData');
          setTimeout(() => navigate('/psychic/login'), 2000);
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorMessage = 'Pas de réponse du serveur. Vérifiez votre connexion.';
      }
      
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Fetch user-specific earnings
  const fetchUserEarnings = async (userId) => {
    try {
      setLoading(true);
      const response = await api.current.get(`/api/chatrequest/psychic/earnings/user/${userId}`);
      console.log('User Earnings Response:', response.data);
      setUserEarnings(response.data);
      setSelectedUser(response.data.user);
      setShowUserModal(true);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error fetching user earnings:', err);
      setError('Échec du chargement des gains utilisateur');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchEarningsData();
      setLoading(false);
    };

    loadData();
  }, []);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await fetchEarningsData();
    setRefreshing(false);
  };

  // Handle period change
  const handlePeriodChange = (period) => {
    setActivePeriod(period);
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      minAmount: '',
      minSessions: '',
      searchQuery: ''
    });
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle export
  const handleExport = async () => {
    setExporting(true);
    try {
      const data = earningsData?.data;
      
      const csvData = [
        ['Date', 'Utilisateur', 'Type', 'Vos Gains (25%)', 'Total Payé', 'Durée', 'Sessions'],
        ...(data?.recentSessions || []).map(session => [
          new Date(session.endedAt || session.endTime).toLocaleDateString('fr-FR'),
          session.user?.username || 'Inconnu',
          session.type || 'session',
          session.amount || 0,
          session.totalAmount || 0,
          `${session.durationMinutes || 0} min`,
          1
        ])
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gains-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError('Échec de l\'exportation des données');
    } finally {
      setExporting(false);
    }
  };

  // Close user modal
  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setUserEarnings(null);
  };

  // Calculate growth percentages
  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Get data for active period
  const getActivePeriodData = () => {
    if (!earningsData?.data?.summary) return null;
    
    const summary = earningsData.data.summary;
    
    switch (activePeriod) {
      case 'today': 
        return summary.daily || summary.today || { psychicEarnings: 0, totalPaid: 0, sessions: 0, users: 0, timeMinutes: 0 };
      case 'week': 
        return summary.weekly || summary.week || { psychicEarnings: 0, totalPaid: 0, sessions: 0, users: 0, timeMinutes: 0 };
      case 'month': 
        return summary.monthly || summary.month || { psychicEarnings: 0, totalPaid: 0, sessions: 0, users: 0, timeMinutes: 0 };
      case 'year': 
        return summary.allTime || summary.year || summary || { psychicEarnings: 0, totalPaid: 0, sessions: 0, users: 0, timeMinutes: 0 };
      default: 
        return summary.monthly || { psychicEarnings: 0, totalPaid: 0, sessions: 0, users: 0, timeMinutes: 0 };
    }
  };

  // Filter and sort users
  const getFilteredSortedUsers = () => {
    if (!earningsData?.data?.userBreakdown) return [];
    
    let users = [...earningsData.data.userBreakdown];
    
    if (filters.minAmount) {
      users = users.filter(user => (user.psychicEarnings || 0) >= parseFloat(filters.minAmount));
    }
    
    if (filters.minSessions) {
      users = users.filter(user => (user.totalSessions || 0) >= parseInt(filters.minSessions));
    }
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      users = users.filter(user => 
        user.user?.username?.toLowerCase().includes(query) ||
        user.user?.email?.toLowerCase().includes(query) ||
        user.userName?.toLowerCase().includes(query)
      );
    }
    
    users.sort((a, b) => {
      const aValue = a[sortConfig.key] || 0;
      const bValue = b[sortConfig.key] || 0;
      
      if (sortConfig.direction === 'asc') {
        return aValue - bValue;
      }
      return bValue - aValue;
    });
    
    return users;
  };

  // Get summary data with fallbacks
  const summary = earningsData?.data?.summary || {
    daily: { psychicEarnings: 0, totalPaid: 0, sessions: 0, users: 0, timeMinutes: 0 },
    weekly: { psychicEarnings: 0, totalPaid: 0, sessions: 0, users: 0, timeMinutes: 0 },
    monthly: { psychicEarnings: 0, totalPaid: 0, sessions: 0, users: 0, timeMinutes: 0 },
    allTime: { psychicEarnings: 0, totalPaid: 0, sessions: 0, users: 0, timeMinutes: 0, totalUsers: 0, chatEarnings: 0, callEarnings: 0, chatSessions: 0, callSessions: 0 }
  };

  // Active period data
  const activePeriodData = getActivePeriodData();
  const filteredUsers = getFilteredSortedUsers();

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: colors.primary }}>Tableau de Bord des Gains</h1>
            <p className="text-lg" style={{ color: colors.primary + '80' }}>
              Suivez vos gains des sessions chat et appel
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={exporting || !earningsData}
              className="px-4 py-3 rounded-lg font-bold transition-all duration-300 hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: colors.success,
                color: 'white'
              }}
            >
              {exporting ? <FaSpinner className="animate-spin" /> : <FaDownload />}
              <span>{exporting ? 'Export...' : 'Exporter CSV'}</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-3 rounded-lg font-bold transition-all duration-300 hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50"
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
        
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg flex justify-between items-center border"
            style={{ 
              backgroundColor: colors.danger + '10',
              borderColor: colors.danger + '30',
              color: colors.danger
            }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="hover:opacity-80">
              ✕
            </button>
          </div>
        )}
      </div>

      {loading && !earningsData ? (
        <div className="text-center py-12">
          <FaSpinner className="text-4xl animate-spin mx-auto mb-4" style={{ color: colors.secondary }} />
          <p style={{ color: colors.primary + '70' }}>Chargement des données des gains...</p>
        </div>
      ) : (
        <>
          {/* Session Type Summary - UPDATED to show psychic earnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border" style={{ borderColor: colors.chat + '30' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full" style={{ backgroundColor: colors.chat + '20' }}>
                  <FaCommentDots className="text-xl" style={{ color: colors.chat }} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: colors.primary }}>Sessions Chat</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm" style={{ color: colors.primary + '70' }}>Vos Gains</p>
                  <p className="text-2xl font-bold" style={{ color: colors.chat }}>
                    {formatCurrency((summary.allTime?.chatEarnings || 0) * 0.25)}
                  </p>
                  <p className="text-xs" style={{ color: colors.primary + '60' }}>
                    sur {formatCurrency(summary.allTime?.chatEarnings || 0)} total
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: colors.primary + '70' }}>Sessions</p>
                  <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {summary.allTime?.chatSessions || 0}
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
                    {formatCurrency((summary.allTime?.callEarnings || 0) * 0.25)}
                  </p>
                  <p className="text-xs" style={{ color: colors.primary + '60' }}>
                    sur {formatCurrency(summary.allTime?.callEarnings || 0)} total
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: colors.primary + '70' }}>Sessions</p>
                  <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {summary.allTime?.callSessions || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats - UPDATED to show psychic earnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Vos Gains Totaux"
              value={formatCurrency(summary.allTime?.psychicEarnings || 0)}
              icon={FaDollarSign}
              color={colors.success}
              change={calculateGrowth(summary.monthly?.psychicEarnings, summary.weekly?.psychicEarnings)}
              loading={loading}
              subtitle={`25% de ${formatCurrency(summary.allTime?.totalPaid || 0)} total`}
              tooltip="Ceci est votre part de 25% de tous les paiements de session"
              onClick={() => handlePeriodChange('year')}
            />
            <StatCard
              title="Utilisateurs Actifs"
              value={summary.allTime?.totalUsers || 0}
              icon={FaUsers}
              color={colors.accent}
              change={calculateGrowth(summary.monthly?.users, summary.weekly?.users)}
              loading={loading}
            />
            <StatCard
              title="Sessions Totales"
              value={summary.allTime?.sessions || 0}
              icon={FaChartLine}
              color={colors.secondary}
              change={calculateGrowth(summary.monthly?.sessions, summary.weekly?.sessions)}
              loading={loading}
              subtitle={`Chat: ${summary.allTime?.chatSessions || 0} • Appel: ${summary.allTime?.callSessions || 0}`}
            />
            <StatCard
              title="Temps Total"
              value={formatTime(summary.allTime?.timeMinutes || 0)}
              icon={FaClock}
              color={colors.warning}
              change={calculateGrowth(summary.monthly?.timeMinutes, summary.weekly?.timeMinutes)}
              loading={loading}
            />
          </div>

          {/* Period Selection - UPDATED to show psychic earnings */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.primary }}>Aperçu des Gains</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['today', 'week', 'month', 'year'].map((period) => {
                let periodData;
                if (period === 'today') periodData = summary.daily;
                else if (period === 'week') periodData = summary.weekly;
                else if (period === 'month') periodData = summary.monthly;
                else periodData = summary.allTime;
                
                return (
                  <PeriodCard
                    key={period}
                    period={period}
                    data={periodData}
                    loading={loading}
                    active={activePeriod === period}
                    onClick={() => handlePeriodChange(period)}
                  />
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <FilterComponent 
            filters={filters} 
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />

          {/* User Earnings Table - UPDATED headers and data */}
          <div className="rounded-xl shadow-md overflow-hidden mb-8 border"
            style={{ 
              backgroundColor: 'white',
              borderColor: colors.primary + '20'
            }}>
            <div className="p-6 border-b" style={{ borderColor: colors.primary + '20' }}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold" style={{ color: colors.primary }}>
                  <FaUserTie className="inline mr-2" style={{ color: colors.secondary }} />
                  Répartition des Gains par Utilisateur
                </h2>
                <div className="text-sm" style={{ color: colors.primary + '70' }}>
                  Affichage de {filteredUsers.length} sur {earningsData?.data?.userBreakdown?.length || 0} utilisateurs
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y" style={{ borderColor: colors.primary + '20' }}>
                <thead style={{ backgroundColor: colors.primary + '05' }}>
                  <tr>
                    {[
                      { key: 'rank', label: 'Rang' },
                      { key: 'userName', label: 'Utilisateur' },
                      { key: 'psychicEarnings', label: 'Vos Gains' },
                      { key: 'totalPaid', label: 'Total Payé' },
                      { key: 'chatEarnings', label: 'Chat (Votre Part)' },
                      { key: 'callEarnings', label: 'Appel (Votre Part)' },
                      { key: 'totalSessions', label: 'Sessions' },
                      { key: 'totalTimeMinutes', label: 'Temps' },
                      { key: 'avgEarningsPerSession', label: 'Moy/Session' },
                      { key: 'actions', label: 'Actions' }
                    ].map(({ key, label }) => (
                      <th key={key} className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider"
                        style={{ color: colors.primary + '70' }}>
                        {key !== 'actions' && key !== 'rank' ? (
                          <button 
                            onClick={() => handleSort(key)}
                            className="flex items-center space-x-1 hover:opacity-80"
                          >
                            <span>{label}</span>
                            {sortConfig.key === key && (
                              sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                            )}
                          </button>
                        ) : (
                          <span>{label}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: colors.primary + '10' }}>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <tr key={user.user?._id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 
                            index === 1 ? 'bg-gray-100 text-gray-700 border border-gray-300' : 
                            index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-300' : 
                            'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border border-blue-300'
                          }`}>
                            <span className="font-bold">{index + 1}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center"
                              style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)` }}>
                              <span className="font-bold text-white">
                                {user.user?.username?.[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="font-bold" style={{ color: colors.primary }}>
                                {user.user?.username || 'Utilisateur Anonyme'}
                              </div>
                              <div className="text-sm" style={{ color: colors.primary + '70' }}>
                                {user.user?.email || 'Aucun email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold" style={{ color: colors.success }}>
                            {formatCurrency(user.psychicEarnings || 0)}
                          </div>
                          <div className="text-xs" style={{ color: colors.primary + '50' }}>
                            part de 25%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium" style={{ color: colors.primary }}>
                            {formatCurrency(user.totalPaid || 0)}
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
                          <div className="font-bold" style={{ color: colors.primary }}>{user.totalSessions}</div>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => fetchUserEarnings(user.user?._id)}
                              className="px-3 py-1 rounded-lg text-sm font-bold transition-colors"
                              style={{
                                backgroundColor: colors.secondary + '20',
                                color: colors.secondary
                              }}
                            >
                              Détails
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-6 py-8 text-center">
                        <FaUserTie className="text-4xl mx-auto mb-3" style={{ color: colors.primary + '30' }} />
                        <p style={{ color: colors.primary + '70' }}>Aucun utilisateur trouvé</p>
                        <p className="text-sm mt-1" style={{ color: colors.primary + '50' }}>Essayez d'ajuster vos filtres</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Sessions - UPDATED to show earnings correctly */}
          {earningsData?.data?.recentSessions?.length > 0 && (
            <div className="rounded-xl shadow-md p-6 mb-8 border"
              style={{ 
                backgroundColor: 'white',
                borderColor: colors.primary + '20'
              }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold" style={{ color: colors.primary }}>
                  <FaHistory className="inline mr-2" style={{ color: colors.secondary }} />
                  Sessions Récentes
                </h2>
              </div>
              <div className="space-y-4">
                {earningsData.data.recentSessions.slice(0, 5).map((session, index) => {
                  const sessionColor = session.type === 'chat' ? colors.chat : colors.call;
                  const SessionIcon = session.type === 'chat' ? FaCommentDots : FaPhone;
                  
                  // Calculate earnings based on session type
                  let psychicEarnings = 0;
                  let totalAmount = 0;
                  
                  if (session.type === 'chat') {
                    // For chat sessions, use amount or calculate from totalAmount
                    psychicEarnings = session.amount || (session.totalAmount ? session.totalAmount * 0.25 : 0);
                    totalAmount = session.totalAmount || (session.amount ? session.amount * 4 : 0);
                  } else {
                    // For call sessions, use amount or calculate from totalAmount
                    psychicEarnings = session.amount || (session.totalAmount ? session.totalAmount * 0.25 : 0);
                    totalAmount = session.totalAmount || (session.amount ? session.amount * 4 : 0);
                  }
                  
                  // If we have creditsUsed or totalCreditsUsed, use those
                  if (session.creditsUsed) {
                    psychicEarnings = session.creditsUsed * 0.25;
                    totalAmount = session.creditsUsed;
                  } else if (session.totalCreditsUsed) {
                    psychicEarnings = session.totalCreditsUsed * 0.25;
                    totalAmount = session.totalCreditsUsed;
                  }
                  
                  // Ensure we have valid numbers
                  psychicEarnings = psychicEarnings || 0;
                  totalAmount = totalAmount || 0;
                  
                  return (
                    <div key={session._id || index} 
                      className="pl-4 py-3 rounded-r-lg hover:bg-gray-50 transition-colors"
                      style={{ 
                        borderLeft: `4px solid ${sessionColor}`,
                        backgroundColor: index % 2 === 0 ? colors.primary + '03' : 'transparent'
                      }}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full" style={{ backgroundColor: sessionColor + '20' }}>
                            <SessionIcon className="text-sm" style={{ color: sessionColor }} />
                          </div>
                          <div>
                            <p className="font-bold" style={{ color: colors.primary }}>
                              {session.user?.username || session.user?.firstName || 'Utilisateur'}
                            </p>
                            <p className="text-xs" style={{ color: colors.primary + '60' }}>
                              {session.type === 'chat' ? 'Session Chat' : 'Session Appel'} • {formatDate(session.endedAt || session.endTime)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: colors.success }}>
                            {formatCurrency(psychicEarnings)}
                          </p>
                          <p className="text-xs" style={{ color: colors.primary + '50' }}>
                            sur {formatCurrency(totalAmount)} total
                          </p>
                          <p className="text-xs" style={{ color: colors.primary + '60' }}>
                            {session.durationMinutes || 0} min
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary Stats - UPDATED to show psychic earnings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl p-6 text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${colors.success} 0%, #047857 100%)` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Valeur Moyenne par Session (Votre Part)</h3>
                <FaMoneyBillWave className="text-2xl" />
              </div>
              <p className="text-3xl font-bold">
                {summary.allTime?.sessions > 0 
                  ? formatCurrency((summary.allTime.psychicEarnings || 0) / summary.allTime.sessions)
                  : '0,00 €'
                }
              </p>
              <p className="opacity-90 mt-2">Par session (25% de la moyenne totale)</p>
            </div>
            
            <div className="rounded-xl p-6 text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, #7C3AED 100%)` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Fidélisation Utilisateurs</h3>
                <FaUsers className="text-2xl" />
              </div>
              <p className="text-3xl font-bold">
                {filteredUsers.filter(u => (u.totalSessions || 0) > 1).length > 0 
                  ? `${Math.round((filteredUsers.filter(u => (u.totalSessions || 0) > 1).length / filteredUsers.length) * 100)}%`
                  : '0%'
                }
              </p>
              <p className="opacity-90 mt-2">Utilisateurs avec multiples sessions</p>
            </div>

            <div className="rounded-xl p-6 text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${colors.secondary} 0%, #B45309 100%)` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Répartition des Sessions</h3>
                <FaChartPie className="text-2xl" />
              </div>
              <p className="text-3xl font-bold">
                {summary.allTime?.sessions > 0 
                  ? `${Math.round(((summary.allTime?.chatSessions || 0) / summary.allTime.sessions) * 100)}% Chat`
                  : '0% Chat'
                }
              </p>
              <p className="opacity-90 mt-2">
                {summary.allTime?.callSessions || 0} appels • {summary.allTime?.chatSessions || 0} chats
              </p>
            </div>
          </div>
        </>
      )}

      {/* User Earnings Modal - UPDATED to show psychic earnings */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>
                    Détails de {selectedUser.username}
                  </h2>
                  <p style={{ color: colors.primary + '70' }}>{selectedUser.email}</p>
                </div>
                <button
                  onClick={handleCloseUserModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                >
                  &times;
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <FaSpinner className="text-4xl animate-spin mx-auto mb-4" style={{ color: colors.secondary }} />
                  <p style={{ color: colors.primary + '70' }}>Chargement des détails utilisateur...</p>
                </div>
              ) : userEarnings ? (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="p-6 rounded-lg" style={{ backgroundColor: colors.primary + '05' }}>
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)` }}>
                        <span className="text-3xl font-bold text-white">
                          {selectedUser.username?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: colors.primary }}>
                          {selectedUser.username}
                        </h3>
                        <p style={{ color: colors.primary + '70' }}>{selectedUser.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Earnings Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['daily', 'weekly', 'monthly', 'allTime'].map((period) => {
                      const periodData = userEarnings.earnings?.[period];
                      if (!periodData) return null;
                      
                      return (
                        <div key={period} className="border rounded-lg p-4"
                          style={{ 
                            borderColor: colors.primary + '20',
                            backgroundColor: period === 'allTime' ? colors.secondary + '10' : 'white'
                          }}>
                          <div className="text-sm font-bold mb-2 capitalize" 
                            style={{ color: colors.primary + '70' }}>
                            {period === 'daily' ? 'Quotidien' : 
                             period === 'weekly' ? 'Hebdomadaire' :
                             period === 'monthly' ? 'Mensuel' : 'Total'}
                          </div>
                          <div className="text-2xl font-bold" style={{ color: colors.success }}>
                            {formatCurrency(periodData.psychicEarnings || 0)}
                          </div>
                          <div className="text-xs mb-2" style={{ color: colors.primary + '50' }}>
                            sur {formatCurrency(periodData.totalPaid || 0)} total
                          </div>
                          <div className="flex justify-between text-sm">
                            <span style={{ color: colors.chat }}>
                              Chat: {formatCurrency(periodData.chatEarnings || 0)}
                            </span>
                            <span style={{ color: colors.call }}>
                              Appel: {formatCurrency(periodData.callEarnings || 0)}
                            </span>
                          </div>
                          <div className="text-sm mt-1" style={{ color: colors.primary + '70' }}>
                            {periodData.sessions || 0} sessions
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Session History */}
                  {userEarnings.sessionHistory?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3" style={{ color: colors.primary }}>
                        Historique des Sessions
                      </h3>
                      <div className="space-y-3">
                        {userEarnings.sessionHistory.slice(0, 5).map((session, idx) => {
                          const sessionColor = session.type === 'chat' ? colors.chat : colors.call;
                          const SessionIcon = session.type === 'chat' ? FaCommentDots : FaPhone;
                          
                          return (
                            <div key={idx} 
                              className="flex justify-between items-center p-3 rounded-lg border"
                              style={{ borderColor: colors.primary + '10' }}>
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full" style={{ backgroundColor: sessionColor + '20' }}>
                                  <SessionIcon className="text-xs" style={{ color: sessionColor }} />
                                </div>
                                <div>
                                  <p className="font-medium" style={{ color: colors.primary }}>
                                    {session.type === 'chat' ? 'Session Chat' : 'Session Appel'}
                                  </p>
                                  <p className="text-xs" style={{ color: colors.primary + '60' }}>
                                    {formatDate(session.endTime)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold" style={{ color: colors.success }}>
                                  {formatCurrency(session.psychicEarnings || 0)}
                                </p>
                                <p className="text-xs" style={{ color: colors.primary + '50' }}>
                                  sur {formatCurrency(session.totalAmount || 0)} total
                                </p>
                                <p className="text-xs" style={{ color: colors.primary + '60' }}>
                                  {session.durationMinutes || 0} min
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t" style={{ borderColor: colors.primary + '20' }}>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={handleCloseUserModal}
                        className="px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{
                          borderColor: colors.primary + '30',
                          color: colors.primary,
                          backgroundColor: colors.primary + '05'
                        }}
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p style={{ color: colors.primary + '70' }}>Aucune donnée utilisateur disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PsychicEarnings;