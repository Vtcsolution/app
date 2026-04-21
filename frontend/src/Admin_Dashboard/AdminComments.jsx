import { useEffect, useState } from 'react';
import axios from 'axios';
import Dashboard_Navbar from './Admin_Navbar';
import Doctor_Side_Bar from './SideBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  Eye,
  MoreHorizontal,
  Star,
  Trash2,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Filter,
  BookOpen,
  Calendar,
  Mail,
  User,
  ThumbsUp,
  Reply,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const AdminComments = ({ side, setSide, admin }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [limit, setLimit] = useState(10);
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    pending: 0,
    approved: 0
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [currentPage, filter, debouncedSearch, limit]);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${import.meta.env.VITE_BASE_URL}/api/comments/admin?page=${currentPage}&limit=${limit}`;
      
      if (filter !== 'all') {
        url += `&isApproved=${filter === 'approved'}`;
      }
      
      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`;
      }

      console.log('Fetching comments from:', url);
      
      const response = await axios.get(url, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      console.log('Comments response:', response.data);

      if (response.data.success) {
        setComments(response.data.data || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalComments(response.data.pagination?.total || 0);
        
        // Calculate summary stats
        const allComments = response.data.data || [];
        setSummaryStats({
          total: response.data.pagination?.total || 0,
          pending: allComments.filter(c => !c.isApproved).length,
          approved: allComments.filter(c => c.isApproved).length
        });
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err.response?.data?.message || 'Failed to load comments');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // Approve comment
  const handleApprove = async (commentId) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/api/comments/${commentId}/approve`,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      if (response.data.success) {
        setComments(prevComments => 
          prevComments.map(comment => 
            comment._id === commentId 
              ? { ...comment, isApproved: true }
              : comment
          )
        );
        
        // Update summary stats
        setSummaryStats(prev => ({
          ...prev,
          pending: prev.pending - 1,
          approved: prev.approved + 1
        }));
      }
    } catch (err) {
      console.error('Error approving comment:', err);
    }
  };

  // Delete comment
  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment? This will also delete all replies.')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/comments/${commentId}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      if (response.data.success) {
        setComments(prevComments => 
          prevComments.filter(comment => comment._id !== commentId)
        );
        setTotalComments(prev => prev - 1);
        
        // Update summary stats based on the deleted comment's status
        const deletedComment = comments.find(c => c._id === commentId);
        if (deletedComment) {
          setSummaryStats(prev => ({
            ...prev,
            total: prev.total - 1,
            pending: deletedComment.isApproved ? prev.pending : prev.pending - 1,
            approved: deletedComment.isApproved ? prev.approved - 1 : prev.approved
          }));
        }
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Get blog title
  const getBlogTitle = (comment) => {
    if (comment.blog) {
      if (typeof comment.blog === 'object') {
        return comment.blog.title || 'Unknown Blog';
      }
      return comment.blogId || 'Unknown Blog';
    }
    return 'Unknown Blog';
  };

  // Get blog ID
  const getBlogId = (comment) => {
    if (comment.blog) {
      if (typeof comment.blog === 'object') {
        return comment.blog._id || comment.blog;
      }
      return comment.blog;
    }
    return null;
  };

  // Pagination controls
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
      <div className="flex">
        <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 ml-0 lg:ml-64 transition-all duration-300 mt-20">
          {/* Header - Matching Psychics Management */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Comments Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage and moderate user comments on blog posts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={fetchComments} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters and Search - Matching Psychics Management */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <form onSubmit={(e) => { e.preventDefault(); setCurrentPage(1); fetchComments(); }} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email, or content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button type="submit" disabled={loading}>
                      Search
                    </Button>
                  </form>
                </div>
                
                <div>
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Comments</SelectItem>
                      <SelectItem value="pending">Pending Approval</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Items per page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="20">20 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                      <SelectItem value="100">100 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards - Matching Psychics Management */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Comments</p>
                    <p className="text-2xl font-bold mt-1">{summaryStats.total}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                    <p className="text-2xl font-bold mt-1 text-yellow-600">{summaryStats.pending}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Approved</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">{summaryStats.approved}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments Table - Matching Psychics Management */}
          <Card>
            <CardHeader>
              <CardTitle>Comments List</CardTitle>
              <CardDescription>
                Showing {comments.length} of {totalComments} comments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading comments...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <p className="text-red-500 font-medium mb-2">{error}</p>
                  <Button onClick={fetchComments} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No comments found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm || filter !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'There are no comments available at the moment'}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Comment</TableHead>
                        <TableHead>Blog Post</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comments.map((comment) => (
                        <TableRow key={comment._id} className="hover:bg-muted/50">
                          <TableCell className="max-w-md">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{comment.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{comment.email}</span>
                              </div>
                              <p className="text-sm mt-1 bg-muted/30 p-2 rounded">
                                {comment.comment}
                              </p>
                              {comment.replies && comment.replies.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-blue-600">
                                  <Reply className="h-3 w-3" />
                                  <span>{comment.replies.length} replies</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ThumbsUp className="h-3 w-3" />
                                <span>{comment.likes || 0} likes</span>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {comment.blog ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-sm font-medium">
                                  <BookOpen className="h-3 w-3 text-gray-400" />
                                  <span className="truncate max-w-[150px]">
                                    {getBlogTitle(comment)}
                                  </span>
                                </div>
                                {getBlogId(comment) && (
                                  <Badge variant="outline" className="text-xs">
                                    ID: {getBlogId(comment).substring(0, 8)}...
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Unknown Blog</span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {comment.isApproved ? (
                              <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(comment.createdAt)}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                {!comment.isApproved && (
                                  <DropdownMenuItem 
                                    className="cursor-pointer text-green-600"
                                    onClick={() => handleApprove(comment._id)}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuItem 
                                  className="cursor-pointer text-red-600"
                                  onClick={() => handleDelete(comment._id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                                
                                {comment.blog && typeof comment.blog === 'object' && comment.blog._id && (
                                  <DropdownMenuItem 
                                    className="cursor-pointer"
                                    onClick={() => window.open(`/blog/${comment.blog._id}`, '_blank')}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Blog
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            
            {/* Pagination - Matching Psychics Management */}
            {totalPages > 1 && (
              <CardFooter className="flex items-center justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminComments;