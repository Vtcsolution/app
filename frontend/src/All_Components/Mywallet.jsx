import React, { useState, useEffect } from 'react';
import { 
  History, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle,
  Clock,
  XCircle,
  Gift,
  RefreshCw,
  MoreVertical,
  Search,
  Filter,
  Loader2
} from 'lucide-react';

// Import UI components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navigation from './Navigator';
import { useAuth } from './screen/AuthContext';
import axios from 'axios';

const MyWallet = () => {
  // Color scheme
  const colors = {
    deepPurple: "#2B1B3F",
    antiqueGold: "#C9A24D",
    softIvory: "#F5F3EB",
    lightGold: "#E8D9B0",
    darkPurple: "#1A1129",
    mediumPurple: "#3D2B56",
    successGreen: "#10B981",
    warningOrange: "#F59E0B",
    errorRed: "#EF4444",
  };

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Transactions data state
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalCreditsPurchased: 0,
    totalBonusCredits: 0,
    totalPayments: 0,
    successfulPayments: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch transactions when component mounts or page changes
  useEffect(() => {
    if (user?._id) {
      fetchTransactions();
    }
  }, [user, currentPage, statusFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: pagination.itemsPerPage,
        page: currentPage
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/usersession/transactions/${user._id}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        const { transactions, summary, pagination } = response.data.data;
        
        setTransactions(transactions);
        setSummary(summary);
        setPagination(pagination);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.message || 'Échec du chargement des transactions');
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on search
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.planName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'refunded':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'failed':
      case 'canceled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading && transactions.length === 0) {
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

  return (
    <div className="px-2 sm:px-4" style={{ backgroundColor: colors.softIvory }}>
      <div className="max-w-7xl mx-auto pb-10">
        <Navigation />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: colors.deepPurple }}>
              Historique des Transactions
            </h1>
            <p className="text-lg" style={{ color: colors.deepPurple + "CC" }}>
              Consultez tous vos dépôts et paiements de sessions
            </p>
          </div>
          
          {/* Export Button */}
          <Button 
            className="mt-4 md:mt-0" 
            style={{ 
              backgroundColor: colors.antiqueGold,
              color: colors.deepPurple
            }}
            onClick={() => {
              // Implement export functionality
              const dataStr = JSON.stringify(transactions, null, 2);
              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
              const exportFileDefaultName = `transactions_${new Date().toISOString()}.json`;
              const linkElement = document.createElement('a');
              linkElement.setAttribute('href', dataUri);
              linkElement.setAttribute('download', exportFileDefaultName);
              linkElement.click();
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter l'Historique
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: colors.deepPurple + "60" }} />
            <Input
              placeholder="Rechercher des transactions..."
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
        </div>

        {/* Transactions List */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle style={{ color: colors.deepPurple }}>
              Transactions Récentes ({filteredTransactions.length} sur {pagination.totalItems})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.antiqueGold }} />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => {
                  const formattedDate = formatDate(transaction.createdAt || transaction.date);
                  
                  return (
                    <div key={transaction.id} 
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-shadow"
                      style={{ borderColor: colors.lightGold }}>
                      
                      {/* Transaction Info */}
                      <div className="flex-1 mb-4 md:mb-0">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg mt-1 ${
                            transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {transaction.amount > 0 ? (
                              <ArrowDownRight className="h-5 w-5 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-semibold" style={{ color: colors.deepPurple }}>
                                {transaction.description || transaction.planName || 'Transaction'}
                              </h3>
                              <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                                dépôt
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm" style={{ color: colors.deepPurple + "CC" }}>
                              <span>{formattedDate.date} • {formattedDate.time}</span>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(transaction.status)}
                                <span className="capitalize">
                                  {transaction.status === 'paid' ? 'payé' :
                                   transaction.status === 'completed' ? 'terminé' :
                                   transaction.status === 'pending' ? 'en attente' :
                                   transaction.status === 'processing' ? 'traitement' :
                                   transaction.status === 'refunded' ? 'remboursé' :
                                   transaction.status === 'failed' ? 'échoué' :
                                   transaction.status === 'canceled' ? 'annulé' :
                                   transaction.status}
                                </span>
                              </div>
                              {transaction.paymentMethod && (
                                <span className="text-xs">via {transaction.paymentMethod}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Amount and Credits */}
                      <div className="flex items-center justify-between md:justify-end gap-4">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{Math.abs(transaction.amount).toFixed(2)} €
                          </p>
                          {transaction.credits > 0 && (
                            <p className="text-sm" style={{ color: colors.deepPurple + "CC" }}>
                              {transaction.credits > 0 ? '+' : ''}{Math.abs(transaction.credits)} crédits
                              {transaction.bonusCredits > 0 && (
                                <span className="text-green-600 ml-1">
                                  (+{transaction.bonusCredits} bonus)
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          style={{ color: colors.deepPurple + "80" }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Empty State */}
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                      style={{ backgroundColor: colors.lightGold }}>
                      <History className="h-8 w-8" style={{ color: colors.antiqueGold }} />
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: colors.deepPurple }}>
                      Aucune Transaction Trouvée
                    </h3>
                    <p style={{ color: colors.deepPurple + "CC" }}>
                      {searchTerm 
                        ? 'Aucune transaction ne correspond à votre recherche.'
                        : 'Aucune transaction disponible.'}
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!pagination.hasPrevPage}
                      style={{ 
                        borderColor: colors.antiqueGold,
                        color: colors.deepPurple
                      }}
                    >
                      Précédent
                    </Button>
                    <span className="px-4 py-2" style={{ color: colors.deepPurple }}>
                      Page {pagination.currentPage} sur {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!pagination.hasNextPage}
                      style={{ 
                        borderColor: colors.antiqueGold,
                        color: colors.deepPurple
                      }}
                    >
                      Suivant
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyWallet;