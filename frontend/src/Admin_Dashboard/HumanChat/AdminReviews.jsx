// src/pages/admin/AdminReviews.jsx (UPDATED VERSION)
import { useState, useEffect } from 'react';
import Dashboard_Navbar from '../../Admin_Dashboard/Admin_Navbar';
import Doctor_Side_Bar from '../../Admin_Dashboard/SideBar';
import { 
  Search, 
  Filter, 
  Star, 
  MessageSquare, 
  Users,
  Eye,
  Edit, 
  Trash2, 
  Download, 
  RefreshCw,
  Loader2,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAdminAuth } from '@/context/AdminAuthContext';

const AdminReviews = () => {
  const [error, setError] = useState(null);

  const { admin } = useAdminAuth();
  
  const [side, setSide] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRatings: 0,
    averageRating: 0,
    totalWithComments: 0,
    ratingDistribution: {},
    summary: {}
  });
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    rating: '',
    psychicName: '',
    userName: '',
    minRating: '',
    maxRating: '',
    startDate: '',
    endDate: '',
    hasComment: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 20
  });
  
  const [selectedReview, setSelectedReview] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ rating: '', comment: '' });
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch all ratings using admin endpoint
  const fetchAllReviews = async () => {
    if (!admin) {
      toast.error('Please log in as admin first');
      return;
    }

    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/ratings/admin/all?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Use the admin's token from context or cookies
          },
          credentials: 'include' // This will send cookies automatically
        }
      );

      if (response.status === 401) {
        toast.error('Session expired. Please log in again.');
        // You might want to redirect to login here
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setReviews(data.data.ratings || []);
        setPagination(data.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          limit: 20
        });
        
        // Update stats from response
        if (data.data.summary) {
          setStats(prev => ({
            ...prev,
            totalRatings: data.data.summary.totalRatings || 0,
            averageRating: data.data.summary.averageRating || 0,
            totalWithComments: data.data.summary.totalWithComments || 0,
            ratingDistribution: data.data.summary.ratingDistribution || {}
          }));
        }
        
        toast.success(`Loaded ${data.data.ratings?.length || 0} reviews`);
      } else {
        toast.error(data.message || 'Failed to fetch reviews');
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('Failed to load reviews. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    if (!admin) return;
    
    setStatsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/ratings/admin/statistics`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(prev => ({
            ...prev,
            ...data.data.summary,
            chartData: data.data.chartData,
            topPsychics: data.data.topPsychics,
            ratingDistribution: data.data.ratingDistribution
          }));
        }
      }
    } catch (error) {
      console.log('Statistics endpoint not available, using basic stats');
    } finally {
      setStatsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (!admin) return;
    fetchAllReviews();
    fetchStatistics();
  }, [admin]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    if (!admin) {
      toast.error('Please log in as admin first');
      return;
    }
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchAllReviews();
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: '',
      rating: '',
      psychicName: '',
      userName: '',
      minRating: '',
      maxRating: '',
      startDate: '',
      endDate: '',
      hasComment: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  // Pagination
  const handlePageChange = (page) => {
    if (!admin) {
      toast.error('Please log in as admin first');
      return;
    }
    setFilters(prev => ({ ...prev, page }));
    fetchAllReviews();
  };

  // View review details
  const handleViewReview = (review) => {
    setSelectedReview(review);
    setViewDialogOpen(true);
  };

  // Edit review
  const handleEditReview = async (review) => {
    setSelectedReview(review);
    setEditForm({
      rating: review.rating.toString(),
      comment: review.comment || ''
    });
    setEditDialogOpen(true);
  };

  // Delete review
  const handleDeleteReview = (review) => {
    setSelectedReview(review);
    setDeleteDialogOpen(true);
  };

  // Save edited review
  const saveEdit = async () => {
    if (!admin) {
      toast.error('Please log in as admin first');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/ratings/admin/${selectedReview._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            rating: parseInt(editForm.rating),
            comment: editForm.comment
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success('Review updated successfully');
        setEditDialogOpen(false);
        setSelectedReview(null);
        fetchAllReviews();
        fetchStatistics();
      } else {
        toast.error(data.message || 'Failed to update review');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Failed to update review');
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!admin) {
      toast.error('Please log in as admin first');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/ratings/admin/${selectedReview._id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success('Review deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedReview(null);
        fetchAllReviews();
        fetchStatistics();
      } else {
        toast.error(data.message || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    setExportLoading(true);
    try {
      if (reviews.length === 0) {
        toast.error('No reviews to export');
        return;
      }

      const headers = ['ID', 'User Name', 'User Email', 'Psychic', 'Rating', 'Comment', 'Date', 'Edited'];
      const rows = reviews.map(review => [
        review._id || 'N/A',
        `${review.user?.firstName || ''} ${review.user?.lastName || ''}`.trim() || 'Anonymous',
        review.user?.email || 'N/A',
        review.psychic?.name || 'Unknown Coach',
        review.rating,
        `"${(review.comment || '').replace(/"/g, '""')}"`,
        new Date(review.createdAt).toLocaleDateString(),
        review.isEdited ? 'Yes' : 'No'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `coach-reviews_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Error exporting reviews:', error);
      toast.error('Failed to export reviews');
    } finally {
      setExportLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Get rating color
  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600 bg-green-100';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

 // Calculate percentage for rating distribution
const calculateRatingPercentage = (rating) => {
  const ratingData = stats.ratingDistribution?.[rating];
  const count = ratingData?.count || ratingData || 0;
  const total = stats.totalRatings || 1;
  return Math.round((count / total) * 100);
};
  // If not admin, show loading
  if (!admin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2">Loading admin session...</span>
      </div>
    );
  }

  return (
    <div>
     <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
     <div className="dashboard-wrapper min-h-screen bg-[#F5F3EB] flex">
  <Doctor_Side_Bar  />
  <div className="dashboard-side flex-1 ml-0 lg:ml-64 p-4 sm:p-6 lg:p-12">
    {/* Header */}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalRatings || 0}
                    </h3>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.averageRating?.toFixed(1) || '0.0'}
                      <span className="text-sm text-gray-500 ml-1">/5</span>
                    </h3>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Star className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">With Comments</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalWithComments || 0}
                    </h3>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Actions</p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={fetchAllReviews}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Refresh
                      </Button>
                      <Button
                        onClick={exportToCSV}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        disabled={exportLoading || reviews.length === 0}
                      >
                        {exportLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        Export
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Filter className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                    Search User/Psychic
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search users or psychics..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="rating" className="text-sm font-medium mb-2 block">
                    Rating
                  </Label>
        <Select 
  value={filters.rating} 
  onValueChange={(value) => handleFilterChange('rating', value)}
>
  <SelectTrigger id="rating">
    <SelectValue placeholder="All ratings" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All ratings</SelectItem>
    <SelectItem value="5">5 Stars</SelectItem>
    <SelectItem value="4">4 Stars</SelectItem>
    <SelectItem value="3">3 Stars</SelectItem>
    <SelectItem value="2">2 Stars</SelectItem>
    <SelectItem value="1">1 Star</SelectItem>
  </SelectContent>
</Select>
                </div>

                <div>
                  <Label htmlFor="hasComment" className="text-sm font-medium mb-2 block">
                    Comment Status
                  </Label>
                 <Select 
  value={filters.hasComment} 
  onValueChange={(value) => handleFilterChange('hasComment', value)}
>
  <SelectTrigger id="hasComment">
    <SelectValue placeholder="All reviews" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All reviews</SelectItem>
    <SelectItem value="true">With comments</SelectItem>
    <SelectItem value="false">Without comments</SelectItem>
  </SelectContent>
</Select>
                </div>

                <div>
                  <Label htmlFor="sortBy" className="text-sm font-medium mb-2 block">
                    Sort By
                  </Label>
                  <Select 
  value={filters.sortBy} 
  onValueChange={(value) => handleFilterChange('sortBy', value)}
>
  <SelectTrigger id="sortBy">
    <SelectValue placeholder="Sort by" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="createdAt-desc">Newest first</SelectItem>
    <SelectItem value="createdAt-asc">Oldest first</SelectItem>
    <SelectItem value="rating-desc">Highest rating</SelectItem>
    <SelectItem value="rating-asc">Lowest rating</SelectItem>
  </SelectContent>
</Select>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label htmlFor="psychicName" className="text-sm font-medium mb-2 block">
                    Psychic Name
                  </Label>
                  <Input
                    id="psychicName"
                    placeholder="Filter by psychic name..."
                    value={filters.psychicName}
                    onChange={(e) => handleFilterChange('psychicName', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="userName" className="text-sm font-medium mb-2 block">
                    User Name
                  </Label>
                  <Input
                    id="userName"
                    placeholder="Filter by user name..."
                    value={filters.userName}
                    onChange={(e) => handleFilterChange('userName', e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="minRating" className="text-sm font-medium mb-2 block">
                      Min Rating
                    </Label>
                    <Input
                      id="minRating"
                      type="number"
                      min="1"
                      max="5"
                      placeholder="1"
                      value={filters.minRating}
                      onChange={(e) => handleFilterChange('minRating', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="maxRating" className="text-sm font-medium mb-2 block">
                      Max Rating
                    </Label>
                    <Input
                      id="maxRating"
                      type="number"
                      min="1"
                      max="5"
                      placeholder="5"
                      value={filters.maxRating}
                      onChange={(e) => handleFilterChange('maxRating', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-between items-center mt-6">
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  size="sm"
                >
                  Reset Filters
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleSearch}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating Distribution */}
       {/* Rating Distribution */}
{stats.ratingDistribution && Object.keys(stats.ratingDistribution).length > 0 && (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle>Rating Distribution</CardTitle>
      <CardDescription>Breakdown of ratings by star</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((star) => {
          // FIX: Extract the count from the object
          const ratingData = stats.ratingDistribution[star];
          const count = ratingData?.count || ratingData || 0;
          const percentage = calculateRatingPercentage(star);
          
          return (
            <div key={star} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-16">
                <span className="text-sm font-medium">{star}★</span>
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              </div>
              <Progress 
                value={percentage} 
                className="h-2 flex-1"
              />
              <div className="w-16 text-right">
                <span className="text-sm font-medium">
                  {count}
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  ({percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
)}
          {/* Main Content */}
          <Card>
            <CardHeader>
              <CardTitle>All Human Coach Reviews</CardTitle>
              <CardDescription>
                Showing {reviews.length} of {pagination.totalItems} reviews
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
                    <p className="mt-3 text-gray-600">Loading reviews...</p>
                  </div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No reviews found</h3>
                  <p className="mt-2 text-gray-600">
                    {filters.search ? 'Try adjusting your search or filters' : 'No reviews have been submitted yet'}
                  </p>
                  <Button
                    onClick={fetchAllReviews}
                    className="mt-4"
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              ) : (
                <>
                  {/* Reviews Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Coach</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Comment</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reviews.map((review) => (
                          <TableRow key={review._id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={review.user?.image} />
                                  <AvatarFallback className="bg-gray-200">
                                    {review.user?.firstName?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">
                                    {review.user?.firstName} {review.user?.lastName || ''}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {review.user?.email || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={review.psychic?.image} />
                                  <AvatarFallback className="text-xs">
                                    {review.psychic?.name?.charAt(0) || 'C'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="font-medium block">{review.psychic?.name || 'Unknown Coach'}</span>
                                  <Badge className="text-xs mt-1 bg-blue-100 text-blue-800">
                                    Human Coach
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`px-3 py-1 rounded-full ${getRatingColor(review.rating)}`}>
                                <Star className="h-3 w-3 mr-1" />
                                {review.rating}/5
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="text-sm truncate">
                                  {review.comment || 'No comment'}
                                </p>
                                {review.comment && review.comment.length > 30 && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 h-auto text-xs"
                                    onClick={() => handleViewReview(review)}
                                  >
                                    View full
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(review.createdAt)}
                                {review.isEdited && (
                                  <div className="text-xs text-gray-500">Edited</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewReview(review)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditReview(review)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteReview(review)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-600">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1}
                        >
                          Previous
                        </Button>
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.currentPage >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Review Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>
              Full review information
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedReview.user?.image} />
                  <AvatarFallback className="bg-gray-200">
                    {selectedReview.user?.firstName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">
                    {selectedReview.user?.firstName} {selectedReview.user?.lastName || ''}
                  </h4>
                  <p className="text-sm text-gray-600">{selectedReview.user?.email || 'N/A'}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`px-3 py-1 text-lg ${getRatingColor(selectedReview.rating)}`}>
                      <Star className="h-4 w-4 mr-1" />
                      {selectedReview.rating}/5
                    </Badge>
                    {selectedReview.isEdited && (
                      <Badge variant="outline">Edited</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Submitted: {formatDate(selectedReview.createdAt)}
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge className="bg-blue-100 text-blue-800">
                    Human Coach
                  </Badge>
                  <p className="font-medium mt-1">{selectedReview.psychic?.name}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Comment</h4>
                {selectedReview.comment ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedReview.comment}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No comment provided</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setViewDialogOpen(false);
              handleEditReview(selectedReview);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Review Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>
              Update the rating and comment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rating">Rating</Label>
             <Select value={editForm.rating} onValueChange={(value) => setEditForm({...editForm, rating: value})}>
  <SelectTrigger id="rating">
    <SelectValue placeholder="Select rating" />
  </SelectTrigger>
  <SelectContent>
    {/* Make sure these have non-empty values */}
    <SelectItem value="5">5 Stars - Excellent</SelectItem>
    <SelectItem value="4">4 Stars - Good</SelectItem>
    <SelectItem value="3">3 Stars - Average</SelectItem>
    <SelectItem value="2">2 Stars - Poor</SelectItem>
    <SelectItem value="1">1 Star - Very Poor</SelectItem>
  </SelectContent>
</Select>
            </div>

            <div>
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                placeholder="Enter comment..."
                value={editForm.comment}
                onChange={(e) => setEditForm({...editForm, comment: e.target.value})}
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to remove existing comment
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Review Details</h4>
                  <ul className="text-sm text-red-700 mt-1 space-y-1">
                    <li>User: {selectedReview.user?.firstName} {selectedReview.user?.lastName || ''}</li>
                    <li>Coach: {selectedReview.psychic?.name || 'Unknown'}</li>
                    <li>Rating: {selectedReview.rating}/5</li>
                    <li>Date: {formatDate(selectedReview.createdAt)}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviews;