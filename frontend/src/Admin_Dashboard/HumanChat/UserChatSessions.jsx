import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  User, 
  MessageSquare, 
  Clock, 
  DollarSign,
  Search,
  MoreVertical,
  Download,
  Eye,
  Trash2,
  Mail,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  BarChart3,
  Users,
  Activity,
  Calendar
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/context/AdminAuthContext";
import Dashboard_Navbar from "../Admin_Navbar";
import Doctor_Side_Bar from "../SideBar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UserChatSessions = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState(false);
  const [user, setUser] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [chatRequests, setChatRequests] = useState([]);
  const [statistics, setStatistics] = useState({
    totalSessions: 0,
    activeSessions: 0,
    pendingRequests: 0,
    totalSpent: 0,
    totalPaidSessions: 0,
    totalTimeSeconds: 0
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    startDate: '',
    endDate: '',
    type: 'all' // 'all', 'sessions', 'requests'
  });
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  const { toast } = useToast();
  const { admin } = useAdminAuth();

  useEffect(() => {
    if (admin && userId) {
      fetchUserAndChats();
    }
  }, [userId, pagination.page, filters, admin]);

  const fetchUserAndChats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        navigate('/admin/login');
        return;
      }

      // Build query params
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.type && filters.type !== 'all' && { type: filters.type }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/admindata/users/${userId}/chats?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setUser(data.user || null);
        setChatSessions(data.chatSessions || []);
        setChatRequests(data.chatRequests || []);
        setStatistics(data.statistics || {
          totalSessions: 0,
          activeSessions: 0,
          pendingRequests: 0,
          totalSpent: 0,
          totalPaidSessions: 0,
          totalTimeSeconds: 0
        });
        setPagination(data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch user chats",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load user chats",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      search: '',
      startDate: '',
      endDate: '',
      type: 'all'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const token = localStorage.getItem('admin_token');
      const itemId = itemToDelete._id || itemToDelete.id;
      
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/${itemId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Item deleted successfully"
        });
        
        // Remove from appropriate state
        if (itemToDelete.type === 'session') {
          setChatSessions(prev => prev.filter(session => 
            (session._id || session.id) !== itemId
          ));
          setStatistics(prev => ({
            ...prev,
            totalSessions: prev.totalSessions - 1
          }));
        } else {
          setChatRequests(prev => prev.filter(request => 
            (request._id || request.id) !== itemId
          ));
          setStatistics(prev => ({
            ...prev,
            pendingRequests: Math.max(0, prev.pendingRequests - 1)
          }));
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: "bg-green-500/10 text-green-700 border-green-500/20",
      ended: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
      accepted: "bg-purple-500/10 text-purple-700 border-purple-500/20",
      rejected: "bg-red-500/10 text-red-700 border-red-500/20",
      completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
    };
    return variants[status] || "bg-gray-500/10 text-gray-700 border-gray-500/20";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return "N/A";
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return "0m";
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const handleViewDetails = (item) => {
    const itemId = item._id || item.id;
    navigate(`/admin/dashboard/chat-details/${itemId}`);
  };

  const handleViewPsychicChats = (psychicId) => {
    navigate(`/admin/dashboard/psychics/${psychicId}/chats`);
  };

  // Combine sessions and requests based on filter
  const getDisplayItems = () => {
    if (filters.type === 'sessions') {
      return chatSessions;
    } else if (filters.type === 'requests') {
      return chatRequests;
    } else {
      return [...chatRequests, ...chatSessions].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    }
  };

  if (!admin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const displayItems = getDisplayItems();
  const displayCount = displayItems.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
      
      <div className="flex">
        <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />
        
        <main className="flex-1 p-6 ml-0 lg:ml-64 transition-all duration-300">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin/dashboard/human-chat')}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to All Chats
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Loading...'} - Chat History
                </h1>
                <p className="text-muted-foreground mt-1">
                  View all chat sessions and requests for this user
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchUserAndChats}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* User Info Card */}
          {user && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden">
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={user.firstName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        {user.firstName} {user.lastName || ''}
                      </h2>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        {user.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20">
                    User
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                    <p className="text-2xl font-bold mt-1">{statistics.totalSessions}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>{statistics.activeSessions} active</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                    <p className="text-2xl font-bold mt-1">{statistics.pendingRequests}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Awaiting response
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold mt-1">{formatAmount(statistics.totalSpent)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Over {statistics.totalPaidSessions} sessions
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Time</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatDuration(statistics.totalTimeSeconds)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Chat time spent
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter user's chat history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Select
                  value={filters.type}
                  onValueChange={(value) => handleFilterChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="sessions">Chat Sessions Only</SelectItem>
                    <SelectItem value="requests">Chat Requests Only</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full"
                />
                
                <Input
                  type="date"
                  placeholder="End Date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {displayCount} items
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Clear Filters
                  </Button>
                  <Button onClick={fetchUserAndChats} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat History Table */}
          <Card>
            <CardHeader>
              <CardTitle>Chat History</CardTitle>
              <CardDescription>
                {loading ? 'Loading...' : `${displayCount} items found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Type</TableHead>
                      <TableHead>Psychic</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <span className="text-muted-foreground">Loading chat history...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : displayCount === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center gap-3">
                            <MessageSquare className="h-12 w-12 text-gray-300" />
                            <div>
                              <p className="font-medium">No chat history found</p>
                              <p className="text-sm mt-1">
                                {user?.firstName || 'This user'} has no chat sessions or requests yet.
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayItems.map((item, index) => {
                        const isRequest = item.requestType || !item.sessionDuration;
                        const psychic = item.psychic || {};
                        const itemId = item._id || item.id;
                        
                        return (
                          <TableRow key={itemId || index} className="hover:bg-muted/50">
                            <TableCell>
                              <Badge variant="outline" className={
                                isRequest 
                                  ? "bg-purple-500/10 text-purple-700 border-purple-500/20"
                                  : "bg-blue-500/10 text-blue-700 border-blue-500/20"
                              }>
                                {isRequest ? 'Request' : 'Session'}
                              </Badge>
                            </TableCell>
                            
                            <TableCell>
                              {psychic.name ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                    <User className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">{psychic.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {psychic.email || ''}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Not assigned</span>
                              )}
                            </TableCell>
                            
                            <TableCell>
                              <Badge className={getStatusBadge(item.status)}>
                                {item.status}
                              </Badge>
                            </TableCell>
                            
                            <TableCell>
                              {isRequest ? '-' : formatDuration(item.sessionDuration)}
                            </TableCell>
                            
                            <TableCell>
                              {item.totalAmount || item.totalAmountPaid ? (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 text-yellow-600" />
                                  <span className="font-medium">
                                    ${(item.totalAmount || item.totalAmountPaid || 0).toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            
                            <TableCell className="text-sm">
                              {formatDate(item.createdAt)}
                            </TableCell>
                            
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(item)}
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                {psychic._id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewPsychicChats(psychic._id)}
                                    title="View psychic chats"
                                  >
                                    <User className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuSeparator />
                                    
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setItemToDelete({...item, type: isRequest ? 'request' : 'session'});
                                        setIsDeleteDialogOpen(true);
                                      }}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Confirmation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {itemToDelete?.type === 'request' ? 'chat request' : 'chat session'}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserChatSessions;