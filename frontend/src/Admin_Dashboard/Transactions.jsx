import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard_Navbar from './Admin_Navbar';
import Doctor_Side_Bar from './SideBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ChevronDown, 
  Trash, 
  User, 
  DollarSign, 
  Calendar, 
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { toast } from 'sonner'; // For notifications - install if not already: npm install sonner

const Transactionss = () => {
  const [side, setSide] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sort: 'createdAt',
    order: 'desc'
  });

  const navigate = useNavigate();
  const user = {
    name: "User",
    email: "user@gmail.com",
    profile: "https://avatars.mds.yandex.net/i?id=93f523ab7f890b9175f222cd947dc36ccbd81bf7-9652646-images-thumbs&n=13"
  };

  // Fetch transactions
  const fetchTransactions = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        ...filters
      });

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/payments/admin/transactions?${params}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data.transactions);
        setPagination(data.data.pagination);
      } else {
        toast.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Error loading transactions');
    } finally {
      setLoading(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (transactionId) => {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/payments/admin/transactions/${transactionId}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Transaction deleted successfully');
        // Refresh current page
        fetchTransactions(pagination.current, filters);
      } else {
        toast.error('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Error deleting transaction');
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchTransactions(newPage, filters);
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    fetchTransactions(1, { ...filters, ...newFilters }); // Reset to page 1
  };

  useEffect(() => {
    fetchTransactions(1, filters);
    setIsLoaded(true);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      case 'canceled': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fallback for toast if sonner is not installed
  const showToast = (message, type = 'success') => {
    if (typeof toast !== 'undefined') {
      toast[type](message);
    } else {
      // Fallback alert
      alert(`${type.toUpperCase()}: ${message}`);
    }
  };

  return (
    <div>
      <div>
        <Dashboard_Navbar side={side} setSide={setSide} user={user} />
      </div>
     <div className="dashboard-wrapper min-h-screen bg-[#F5F3EB] flex">
  <Doctor_Side_Bar side={side} setSide={setSide} user={user} />
  <div className="dashboard-side flex-1 ml-0 lg:ml-64 p-4 sm:p-6 lg:p-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fetchTransactions(pagination.current, filters)}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="mx-2 md:mx-4">
            {/* Filters Row */}
            <Card className="mb-4 bg-white/10 border-white/20 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={filters.search}
                      onChange={(e) => handleFilterChange({ search: e.target.value })}
                    />
                  </div>

                  {/* Status Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[180px] justify-between"
                      >
                        Status: {filters.status === 'all' ? 'All' : filters.status}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleFilterChange({ status: 'all' })}
                      >
                        All Statuses
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleFilterChange({ status: 'paid' })}
                      >
                        Paid
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleFilterChange({ status: 'pending' })}
                      >
                        Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleFilterChange({ status: 'failed' })}
                      >
                        Failed
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Page Size */}
                  <Select
                    value={pagination.limit.toString()}
                    onValueChange={(value) => {
                      setPagination(prev => ({ ...prev, limit: parseInt(value) }));
                      fetchTransactions(1, { ...filters, limit: parseInt(value) });
                    }}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Main Table Card */}
            <Card
              className={`w-full bg-white/10 border border-gray-200 backdrop-blur-md shadow-xl transition-all duration-500 hover:shadow-2xl ${
                isLoaded ? "animate-slide-in-bottom opacity-100" : "opacity-0"
              }`}
              style={{ animationDelay: "1.3s" }}
            >
              <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    {pagination.total} total transactions • Page {pagination.current} of {pagination.pages}
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent>
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading transactions...</span>
                  </div>
                )}
                
                {!loading && (
                  <Table className="[&_tbody_tr:hover]:bg-white/20">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">User</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead className="w-[120px]">Amount</TableHead>
                        <TableHead className="w-[150px]">Date</TableHead>
                        <TableHead className="text-right w-[100px]">Credits</TableHead>
                        <TableHead className="text-right w-[120px]">Status</TableHead>
                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((transaction, index) => (
                          <TableRow
                            key={transaction._id || index}
                            className="transition-all duration-300 hover:scale-[1.01]"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-900 to-purple-900 flex items-center justify-center">
                                    {!transaction.user.profile ? (
                                      <User className="h-5 w-5 text-white" />
                                    ) : (
                                      <img 
                                        src={transaction.user.profile} 
                                        alt={transaction.user.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.parentNode.innerHTML = '<User class="h-5 w-5 text-white" />';
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-sm font-semibold text-gray-900">
                                    {transaction.user.name}
                                  </h3>
                                  <p className="text-xs text-muted-foreground">
                                    {transaction.user.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="font-mono text-sm">
                              <div className="flex items-center gap-1">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                  {transaction.tran_id?.substring(0, 8)}...
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1"
                                  onClick={() => {
                                    navigator.clipboard.writeText(transaction.tran_id);
                                    showToast('Transaction ID copied!', 'success');
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="font-semibold text-green-600">
                                  €{(transaction.amount || 0).toFixed(2)}
                                </span>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-900">
                                  {formatDate(transaction.createdAt)}
                                </span>
                              </div>
                            </TableCell>
                            
                            <TableCell className="text-right">
                              <span className="font-semibold text-blue-600">
                                {transaction.credits || 0}
                              </span>
                            </TableCell>
                            
                            <TableCell className="text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                {transaction.status?.toUpperCase() || 'UNKNOWN'}
                              </span>
                            </TableCell>
                            
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                              
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleDeleteTransaction(transaction._id)}
                                  disabled={loading}
                                  title="Delete Transaction"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-6 px-2">
                    <div className="text-sm text-muted-foreground">
                      Showing {((pagination.current - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.current * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} transactions
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.current - 1)}
                        disabled={pagination.current <= 1 || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(pagination.pages, pagination.current + i - 2));
                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.current === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              disabled={loading}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.current + 1)}
                        disabled={pagination.current >= pagination.pages || loading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactionss;