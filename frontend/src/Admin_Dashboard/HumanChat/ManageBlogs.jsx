import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Plus,
  Calendar,
  User,
  Clock,
  TrendingUp,
  Star,
  AlertCircle,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react';

const ManageBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const categories = [
    'Artificial Intelligence',
    'Blockchain',
    'Data Science and Analytics',
    'Enterprise',
    'Industry',
    'Software Development',
    'Technology',
    'UI/UX Design'
  ];

  // Fetch blogs from API
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/blogs`);
      
      if (response.data && response.data.data) {
        setBlogs(response.data.data);
      } else {
        setBlogs([]);
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError(err.response?.data?.message || 'Failed to load blogs. Please try again.');
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Delete blog function
  const handleDeleteBlog = async (blogId) => {
    try {
      setDeleteLoading(true);
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/blogs/${blogId}`);
      setSuccess('Blog deleted successfully!');
      setDeleteConfirm(null);
      // Refresh the blogs list
      fetchBlogs();
    } catch (err) {
      console.error('Error deleting blog:', err);
      setError(err.response?.data?.message || 'Failed to delete blog. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter blogs based on search and filters
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.author?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || blog.category === categoryFilter;
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'featured' && blog.featured) ||
                         (statusFilter === 'trending' && blog.trending);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
  };

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#e1e1e1] via-white to-[#e1e1e1]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Manage Blogs
                  </h1>
                  <p className="text-gray-600">
                    View, edit, and manage all your blog posts
                  </p>
                </div>
                <Link
                  to="/admin-dashboard/add-blog"
                  className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-[#2e7d7b] hover:bg-[#256967] text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Blog
                </Link>
              </div>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-700 font-medium">Error</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-green-700 font-medium">Success!</p>
                  <p className="text-green-600 text-sm mt-1">{success}</p>
                </div>
                <button
                  onClick={() => setSuccess(null)}
                  className="text-green-500 hover:text-green-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e1e1e1] p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Search Blogs
                  </label>
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by title or author..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2e7d7b] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2e7d7b] focus:border-transparent transition-all duration-200"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2e7d7b] focus:border-transparent transition-all duration-200"
                  >
                    <option value="">All Status</option>
                    <option value="featured">Featured</option>
                    <option value="trending">Trending</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchTerm || categoryFilter || statusFilter) && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[#2e7d7b] hover:text-[#256967] font-medium transition-colors duration-200"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* Blogs Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e1e1e1] overflow-hidden">
              {/* Table Header */}
              <div className="px-6 py-4 border-b border-[#e1e1e1] bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Blog Posts {!loading && `(${filteredBlogs.length})`}
                  </h3>
                  <Filter className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-6 h-6 text-[#2e7d7b] animate-spin" />
                    <span className="text-gray-600">Loading blogs...</span>
                  </div>
                </div>
              )}

              {/* Table Content */}
              {!loading && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-[#e1e1e1]">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Blog Post
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Author
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Views
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#e1e1e1]">
                      {filteredBlogs.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <AlertCircle className="w-12 h-12 mb-4 text-gray-300" />
                              <p className="text-lg font-medium text-gray-900 mb-2">
                                {blogs.length === 0 ? 'No blogs found' : 'No matching blogs'}
                              </p>
                              <p className="text-gray-600 mb-4">
                                {blogs.length === 0 
                                  ? 'No blogs have been created yet.' 
                                  : 'No blogs match your current filters.'
                                }
                              </p>
                              {blogs.length === 0 && (
                                <Link
                                  to="/admin-dashboard/add-blog"
                                  className="inline-flex items-center px-6 py-3 bg-[#2e7d7b] hover:bg-[#256967] text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
                                >
                                  <Plus className="w-5 h-5 mr-2" />
                                  Create Your First Blog
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredBlogs.map((blog) => (
                          <tr key={blog._id} className="hover:bg-gray-50 transition-colors duration-150">
                            {/* Blog Info */}
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-4">
                                <img
                                  src={`${import.meta.env.VITE_BASE_URL}${blog.image}`}
                                  alt={blog.title}
                                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-200"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {blog.title}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate mt-1">
                                    {blog.excerpt}
                                  </p>
                                  <div className="flex items-center mt-1 space-x-4">
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {blog.readTime}
                                    </div>
                                    {blog.featured && (
                                      <div className="flex items-center text-xs text-amber-600">
                                        <Star className="w-3 h-3 mr-1" />
                                        Featured
                                      </div>
                                    )}
                                    {blog.trending && (
                                      <div className="flex items-center text-xs text-purple-600">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        Trending
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {blog.category}
                              </span>
                            </td>

                            {/* Author */}
                            <td className="px-6 py-4">
                              <div className="flex items-center text-sm text-gray-900">
                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                {blog.author}
                              </div>
                            </td>

                            {/* Date */}
                            <td className="px-6 py-4">
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                {formatDate(blog.date || blog.createdAt)}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              <div className="flex flex-col space-y-1">
                                {blog.featured && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 w-fit">
                                    Featured
                                  </span>
                                )}
                                {blog.trending && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 w-fit">
                                    Trending
                                  </span>
                                )}
                                {!blog.featured && !blog.trending && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 w-fit">
                                    Normal
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Views */}
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {blog.views || 0}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end space-x-2">
                                {/* View Button */}
                                <button
                                  onClick={() => window.open(`${import.meta.env.VITE_BASE_URL}/blog/${blog._id}`, '_blank')}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors duration-200"
                                  title="View Blog"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Edit Button */}
                                <Link
                                  to={`/admin-dashboard/edit-blog/${blog._id}`}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors duration-200"
                                  title="Edit Blog"
                                >
                                  <Edit className="w-4 h-4" />
                                </Link>

                                {/* Delete Button */}
                                <button
                                  onClick={() => setDeleteConfirm(blog)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200"
                                  title="Delete Blog"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-md w-full p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Blog</h3>
                    <p className="text-gray-600">This action cannot be undone.</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? This will permanently remove the blog post and all associated data.
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteBlog(deleteConfirm._id)}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium disabled:opacity-50 flex items-center justify-center"
                  >
                    {deleteLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Delete Blog'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ManageBlogs;