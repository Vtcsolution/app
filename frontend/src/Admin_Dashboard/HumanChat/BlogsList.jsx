import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Dashboard_Navbar from "../Admin_Navbar";
import Doctor_Side_Bar from "../SideBar";
import axios from 'axios';

const colors = {
  primary: "#2B1B3F",
  secondary: "#C9A24D",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  background: "#F5F3EB",
};

const BlogsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [side, setSide] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    fetchBlogs();
  }, [category, status, search]); // Removed pagination dependency for now

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add filters
      if (category && category !== 'all') {
        params.append('category', category);
      }
      
      if (status && status !== 'all') {
        params.append('isPublished', status === 'published' ? 'true' : 'false');
      }
      
      if (search && search.trim() !== '') {
        params.append('search', search.trim());
      }

      // Add pagination
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);

      const url = `${import.meta.env.VITE_BASE_URL}/api/blogs?${params.toString()}`;
      console.log("📡 Fetching from:", url);

      const response = await axios.get(url, { 
        withCredentials: true 
      });

      console.log("📦 Response:", response.data);

      // Handle both response formats
      if (response.data.success) {
        // New format with success property
        setBlogs(response.data.data || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else if (Array.isArray(response.data)) {
        // Old format - direct array
        setBlogs(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Alternative format
        setBlogs(response.data.data);
      } else {
        console.error("Unexpected response format:", response.data);
        setBlogs([]);
      }

    } catch (error) {
      console.error("❌ Error fetching blogs:", error);
      
      let errorMessage = "Failed to fetch blogs";
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        errorMessage = error.response.data?.message || errorMessage;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/blogs/${id}`,
        { withCredentials: true }
      );
      
      console.log("Delete response:", response.data);
      
      toast({
        title: "Success",
        description: "Blog deleted successfully",
      });
      
      fetchBlogs(); // Refresh the list
      
    } catch (error) {
      console.error("❌ Error deleting blog:", error);
      
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete blog",
        variant: "destructive"
      });
    }
  };

  const toggleFeatured = async (id, currentFeatured) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/api/blogs/${id}/feature`,
        {},
        { withCredentials: true }
      );
      
      console.log("Feature toggle response:", response.data);
      
      toast({
        title: "Success",
        description: `Blog ${currentFeatured ? 'unfeatured' : 'featured'} successfully`,
      });
      
      fetchBlogs(); // Refresh the list
      
    } catch (error) {
      console.error("❌ Error toggling featured:", error);
      
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update featured status",
        variant: "destructive"
      });
    }
  };

  // Debug function to check if blogs exist in DB
  const checkBlogsInDB = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/blogs?limit=100`,
        { withCredentials: true }
      );
      console.log("📊 All blogs in DB:", response.data);
      
      toast({
        title: "Debug Info",
        description: `Found ${response.data.data?.length || 0} blogs in database`,
      });
    } catch (error) {
      console.error("Debug error:", error);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <Dashboard_Navbar side={side} setSide={setSide} />
      <div className="flex pt-16">
        <Doctor_Side_Bar side={side} setSide={setSide} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 ml-0 lg:ml-64">
          {/* Header with Debug Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-6 w-6" style={{ color: colors.secondary }} />
                <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.primary }}>
                  Blogs
                </h1>
              </div>
              <p className="text-sm" style={{ color: colors.primary + '70' }}>
                Manage your blog posts
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={checkBlogsInDB}
                style={{
                  borderColor: colors.primary + '20',
                  color: colors.primary,
                }}
              >
                Debug DB
              </Button>
              <Button
                onClick={() => navigate('/admin/dashboard/blogs/add')}
                className="hover:scale-105 transition-transform"
                style={{
                  backgroundColor: colors.secondary,
                  color: colors.primary,
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Blog
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6 border-none shadow-lg">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: colors.primary + '50' }} />
                  <Input
                    placeholder="Search blogs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                    style={{ borderColor: colors.primary + '20' }}
                  />
                </div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger style={{ borderColor: colors.primary + '20' }}>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="tarto">Tarto</SelectItem>
                    <SelectItem value="love">Love</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="career">Career</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="spirituality">Spirituality</SelectItem>
                    <SelectItem value="dreams">Dreams</SelectItem>
                    <SelectItem value="numerology">Numerology</SelectItem>
                    <SelectItem value="astrology">Astrology</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger style={{ borderColor: colors.primary + '20' }}>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={fetchBlogs}
                  style={{
                    borderColor: colors.secondary,
                    color: colors.secondary,
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Blogs List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.secondary }} />
            </div>
          ) : (
            <div className="space-y-4">
              {blogs.length > 0 ? (
                blogs.map((blog) => (
                  <Card key={blog._id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Blog Image */}
                        <div className="md:w-48 h-32 flex-shrink-0">
                          {blog.featuredImage ? (
                            <img
                              src={blog.featuredImage}
                              alt={blog.title}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/400x200?text=No+Image";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Blog Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold mb-1" style={{ color: colors.primary }}>
                                {blog.title}
                              </h3>
                              <div className="flex items-center gap-3 mb-2">
                                <Badge style={{ 
                                  backgroundColor: colors.secondary + '20',
                                  color: colors.secondary 
                                }}>
                                  {blog.category}
                                </Badge>
                                <Badge style={{ 
                                  backgroundColor: blog.isPublished ? colors.success + '20' : colors.warning + '20',
                                  color: blog.isPublished ? colors.success : colors.warning 
                                }}>
                                  {blog.isPublished ? 'Published' : 'Draft'}
                                </Badge>
                                {blog.isFeatured && (
                                  <Badge style={{ backgroundColor: colors.warning + '20', color: colors.warning }}>
                                    <Star className="h-3 w-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm mb-2" style={{ color: colors.primary + '70' }}>
                                {blog.excerpt?.substring(0, 150)}...
                              </p>
                              <div className="flex items-center gap-4 text-xs" style={{ color: colors.primary + '60' }}>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" /> {blog.views || 0} views
                                </span>
                                <span className="flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" /> {blog.readingTime || 1} min read
                                </span>
                                <span>By {blog.authorName || 'Admin'}</span>
                                <span>{blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : 'N/A'}</span>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleFeatured(blog._id, blog.isFeatured)}
                                style={{ color: blog.isFeatured ? colors.warning : colors.primary + '50' }}
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin/dashboard/blogs/edit/${blog._id}`)}
                                style={{ color: colors.primary }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(blog._id)}
                                style={{ color: colors.danger }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-none shadow-lg">
                  <CardContent className="p-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4" style={{ color: colors.primary + '30' }} />
                    <h3 className="text-lg font-medium mb-2" style={{ color: colors.primary }}>No blogs found</h3>
                    <p className="text-sm mb-4" style={{ color: colors.primary + '60' }}>
                      {search || category !== 'all' || status !== 'all' 
                        ? "Try adjusting your filters" 
                        : "Get started by creating your first blog post"}
                    </p>
                    <Button
                      onClick={() => navigate('/admin/dashboard/blogs/add')}
                      style={{
                        backgroundColor: colors.secondary,
                        color: colors.primary,
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Blog
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Pagination (if needed) */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => {
                  setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                  fetchBlogs();
                }}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => {
                  setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                  fetchBlogs();
                }}
              >
                Next
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BlogsList;