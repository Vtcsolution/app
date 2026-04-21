import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { 
  Upload, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Save,
  Plus,
  Trash2
} from 'lucide-react';

const UpdateBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    fullContent: '',
    category: '',
    author: '',
    authorBio: '',
    readTime: '',
    featured: false,
    trending: false,
    backlinks: []
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [authorImage, setAuthorImage] = useState(null);
  const [authorImagePreview, setAuthorImagePreview] = useState(null);
  const [currentAuthorImage, setCurrentAuthorImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [characterCount, setCharacterCount] = useState({
    excerpt: 0,
    fullContent: 0
  });

  // Fetch blog data and categories
  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        setFetchLoading(true);
        setError(null);

        // Fetch blog data
        const blogResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/blogs/${id}`);
        const blog = blogResponse.data.data;

        // Fetch categories
        const categoriesResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/blogs/categories/all`);
        setCategories(categoriesResponse.data.data);

        // Set form data
        setFormData({
          title: blog.title || '',
          excerpt: blog.excerpt || '',
          fullContent: blog.fullContent || '',
          category: blog.category || '',
          author: blog.author || '',
          authorBio: blog.authorBio || '',
          readTime: blog.readTime || '',
          featured: blog.featured || false,
          trending: blog.trending || false,
          backlinks: blog.backlinks || []
        });

        // Set current image
        if (blog.image) {
          setCurrentImage(`${import.meta.env.VITE_BASE_URL}${blog.image}`);
        }

        // Set current author image
        if (blog.authorImage) {
          setCurrentAuthorImage(`${import.meta.env.VITE_BASE_URL}${blog.authorImage}`);
        }

        // Set character counts
        setCharacterCount({
          excerpt: blog.excerpt?.length || 0,
          fullContent: blog.fullContent?.length || 0
        });

      } catch (err) {
        console.error('Error fetching blog data:', err);
        if (err.response?.status === 404) {
          setError('Blog not found. It may have been deleted.');
        } else {
          setError(err.response?.data?.message || 'Failed to load blog data.');
        }
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchBlogData();
    }
  }, [id]);

  // Update character count whenever formData changes
  useEffect(() => {
    setCharacterCount({
      excerpt: formData.excerpt.length,
      fullContent: formData.fullContent.length
    });
  }, [formData.excerpt, formData.fullContent]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // For excerpt, enforce character limit
    if (name === 'excerpt' && value.length > 200) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBacklinkChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      backlinks: prev.backlinks.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const addBacklink = () => {
    setFormData(prev => ({
      ...prev,
      backlinks: [...prev.backlinks, { text: '', url: '' }]
    }));
  };

  const removeBacklink = (index) => {
    setFormData(prev => ({
      ...prev,
      backlinks: prev.backlinks.filter((_, i) => i !== index)
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setImage(file);
      setError(null);

      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
      setImagePreview(null);
    }
  };

  const handleAuthorImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setAuthorImage(file);
      setError(null);

      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAuthorImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setAuthorImage(null);
      setAuthorImagePreview(null);
    }
  };

  const removeNewImage = () => {
    setImage(null);
    setImagePreview(null);
    const fileInput = document.getElementById('image');
    if (fileInput) fileInput.value = '';
  };

  const removeNewAuthorImage = () => {
    setAuthorImage(null);
    setAuthorImagePreview(null);
    const fileInput = document.getElementById('authorImage');
    if (fileInput) fileInput.value = '';
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.excerpt.trim()) {
      setError('Excerpt is required');
      return false;
    }
    if (formData.excerpt.length > 200) {
      setError('Excerpt should be less than 200 characters');
      return false;
    }
    if (!formData.fullContent.trim()) {
      setError('Full content is required');
      return false;
    }
    if (!formData.category) {
      setError('Please select a category');
      return false;
    }
    if (!formData.author.trim()) {
      setError('Author name is required');
      return false;
    }
    if (!formData.readTime.trim()) {
      setError('Read time is required');
      return false;
    }
    return true;
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setSuccess(null);

  if (!validateForm()) return;

  setLoading(true);

  try {
    const data = new FormData();
    data.append('title', formData.title.trim());
    data.append('excerpt', formData.excerpt.trim());
    data.append('fullContent', formData.fullContent.trim());
    data.append('category', formData.category);
    data.append('author', formData.author.trim());
    data.append('authorBio', formData.authorBio.trim());
    data.append('readTime', formData.readTime.trim());
    data.append('featured', formData.featured);
    data.append('trending', formData.trending);
    data.append('backlinks', JSON.stringify(formData.backlinks));
    
    // Only append image if a new one was selected
    if (image) {
      data.append('image', image);
      console.log('New image added to FormData:', image.name); // Debug log
    } else {
      console.log('No new image selected, keeping current image'); // Debug log
    }

    // Only append authorImage if a new one was selected
    if (authorImage) {
      data.append('authorImage', authorImage);
      console.log('New authorImage added to FormData:', authorImage.name); // Debug log
    } else {
      console.log('No new authorImage selected, keeping current authorImage'); // Debug log
    }

    // Debug: Log FormData contents
    for (let [key, value] of data.entries()) {
      console.log('FormData:', key, value);
    }

    const response = await axios.put(
      `${import.meta.env.VITE_BASE_URL}/api/blogs/${id}`,
      data,
      { 
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      }
    );

    console.log('Update response:', response.data); // Debug log

    setSuccess('Blog updated successfully! 🎉');

    // Auto-clear success message and redirect after 2 seconds
    setTimeout(() => {
      setSuccess(null);
      navigate('/admin-dashboard/manage-blogs');
    }, 2000);

  } catch (err) {
    console.error('Error updating blog:', err);
    console.error('Error details:', err.response?.data); // Debug log
    
    if (err.code === 'ECONNABORTED') {
      setError('Request timeout. Please try again.');
    } else if (err.response?.data?.message) {
      setError(err.response.data.message);
    } else if (err.message) {
      setError(err.message);
    } else {
      setError('Failed to update blog. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

  if (fetchLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#e1e1e1] via-white to-[#e1e1e1]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-8">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-6 h-6 text-[#2e7d7b] animate-spin" />
                <span className="text-gray-600">Loading blog data...</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error && !fetchLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#e1e1e1] via-white to-[#e1e1e1]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-[#e1e1e1] p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Blog</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={() => navigate('/admin-dashboard/manage-blogs')}
                  className="inline-flex items-center px-6 py-3 bg-[#2e7d7b] hover:bg-[#256967] text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Manage Blogs
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#e1e1e1] via-white to-[#e1e1e1]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <button
                    onClick={() => navigate('/admin-dashboard/manage-blogs')}
                    className="inline-flex items-center text-[#2e7d7b] hover:text-[#256967] mb-4 transition-colors duration-200"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Blogs
                  </button>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Update Blog Post
                  </h1>
                  <p className="text-gray-600">
                    Modify and update your existing blog content
                  </p>
                </div>
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

            {/* Blog Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e1e1e1] overflow-hidden">
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-3">
                    Blog Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2e7d7b] focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-900"
                    placeholder="Enter a compelling blog title..."
                  />
                </div>

                {/* Excerpt with Character Counter */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label htmlFor="excerpt" className="block text-sm font-semibold text-gray-900">
                      Excerpt <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-xs font-medium ${
                      characterCount.excerpt > 200 
                        ? 'text-red-500' 
                        : characterCount.excerpt > 150 
                        ? 'text-orange-500'
                        : 'text-gray-500'
                    }`}>
                      {characterCount.excerpt}/200
                    </span>
                  </div>
                  <textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleChange}
                    required
                    rows="3"
                    maxLength="200"
                    className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2e7d7b] focus:border-transparent transition-all duration-200 resize-none placeholder-gray-400 text-gray-900 ${
                      characterCount.excerpt > 200 
                        ? 'border-red-300 ring-1 ring-red-200' 
                        : characterCount.excerpt > 150 
                        ? 'border-orange-300'
                        : 'border-gray-300'
                    }`}
                    placeholder="Write a brief summary that captures attention (max 200 characters)..."
                  />
                  {characterCount.excerpt > 150 && characterCount.excerpt <= 200 && (
                    <p className="text-xs text-orange-600 mt-2">
                      {200 - characterCount.excerpt} characters remaining
                    </p>
                  )}
                  {characterCount.excerpt > 200 && (
                    <p className="text-xs text-red-600 mt-2">
                      Excerpt exceeds 200 character limit!
                    </p>
                  )}
                </div>

                {/* Full Content with Character Counter */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label htmlFor="fullContent" className="block text-sm font-semibold text-gray-900">
                      Full Content <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-gray-500 font-medium">
                      {characterCount.fullContent} characters
                    </span>
                  </div>
                  <textarea
                    id="fullContent"
                    name="fullContent"
                    value={formData.fullContent}
                    onChange={handleChange}
                    required
                    rows="12"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2e7d7b] focus:border-transparent transition-all duration-200 resize-vertical placeholder-gray-400 text-gray-900"
                    placeholder="Write your complete blog post here... You can use markdown or HTML formatting."
                  />
                </div>

                {/* Category & Author & Read Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-semibold text-gray-900 mb-3">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2e7d7b] focus:border-transparent transition-all duration-200 text-gray-900"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="py-2 text-gray-900">{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="author" className="block text-sm font-semibold text-gray-900 mb-3">
                      Author <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2e7d7b] focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-900"
                      placeholder="Author name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="readTime" className="block text-sm font-semibold text-gray-900 mb-3">
                      Read Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="readTime"
                      name="readTime"
                      value={formData.readTime}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2e7d7b] focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-900"
                      placeholder='e.g., "5 min read"'
                    />
                  </div>
                </div>

                {/* Author Bio */}
                <div>
                  <label htmlFor="authorBio" className="block text-sm font-semibold text-gray-900 mb-3">
                    Author Bio
                  </label>
                  <textarea
                    id="authorBio"
                    name="authorBio"
                    value={formData.authorBio}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2e7d7b] focus:border-transparent transition-all duration-200 resize-vertical placeholder-gray-400 text-gray-900"
                    placeholder="Write a short bio about the author..."
                  />
                </div>

                {/* Blog Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Blog Image
                  </label>
                  
                  {/* Current Image Display */}
                  {currentImage && !imagePreview && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">Current Image:</p>
                      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <img
                          src={currentImage}
                          alt="Current blog"
                          className="w-full sm:w-48 h-48 object-cover rounded-lg shadow-sm border border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-2">
                            Current blog image
                          </p>
                          <p className="text-xs text-gray-500">
                            Upload a new image below to replace this one
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* New Image Upload */}
                  {!imagePreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#2e7d7b] transition-colors duration-200 bg-gray-50">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        {currentImage ? 'Upload new image to replace current' : 'Upload blog image'}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">or</p>
                      <label htmlFor="image" className="cursor-pointer">
                        <span className="px-6 py-3 bg-[#2e7d7b] text-white rounded-lg font-medium hover:bg-[#256967] transition-colors duration-200 inline-block">
                          Browse Files
                        </span>
                        <input
                          type="file"
                          id="image"
                          name="image"
                          onChange={handleImageChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-3">PNG, JPG, JPEG up to 5MB</p>
                      {currentImage && (
                        <p className="text-xs text-gray-500 mt-2">
                          Leave empty to keep current image
                        </p>
                      )}
                    </div>
                  ) : (
                    /* New Image Preview */
                    <div className="relative">
                      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                        <p className="text-sm font-medium text-gray-700 mb-3">New Image Preview</p>
                        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                          <img
                            src={imagePreview}
                            alt="New preview"
                            className="w-full sm:w-48 h-48 object-cover rounded-lg shadow-sm border border-gray-300"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-2">
                              {image?.name} ({(image?.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                            <button
                              type="button"
                              onClick={removeNewImage}
                              className="flex items-center space-x-2 text-red-600 hover:text-red-800 font-medium text-sm transition-colors duration-200"
                            >
                              <X className="w-4 h-4" />
                              <span>Remove New Image</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Author Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Author Image
                  </label>
                  
                  {/* Current Author Image Display */}
                  {currentAuthorImage && !authorImagePreview && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">Current Author Image:</p>
                      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <img
                          src={currentAuthorImage}
                          alt="Current author"
                          className="w-full sm:w-48 h-48 object-cover rounded-lg shadow-sm border border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-2">
                            Current author image
                          </p>
                          <p className="text-xs text-gray-500">
                            Upload a new image below to replace this one
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* New Author Image Upload */}
                  {!authorImagePreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#2e7d7b] transition-colors duration-200 bg-gray-50">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        {currentAuthorImage ? 'Upload new author image to replace current' : 'Upload author image'}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">or</p>
                      <label htmlFor="authorImage" className="cursor-pointer">
                        <span className="px-6 py-3 bg-[#2e7d7b] text-white rounded-lg font-medium hover:bg-[#256967] transition-colors duration-200 inline-block">
                          Browse Files
                        </span>
                        <input
                          type="file"
                          id="authorImage"
                          name="authorImage"
                          onChange={handleAuthorImageChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-3">PNG, JPG, JPEG up to 5MB</p>
                      {currentAuthorImage && (
                        <p className="text-xs text-gray-500 mt-2">
                          Leave empty to keep current image
                        </p>
                      )}
                    </div>
                  ) : (
                    /* New Author Image Preview */
                    <div className="relative">
                      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                        <p className="text-sm font-medium text-gray-700 mb-3">New Author Image Preview</p>
                        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                          <img
                            src={authorImagePreview}
                            alt="New author preview"
                            className="w-full sm:w-48 h-48 object-cover rounded-lg shadow-sm border border-gray-300"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-2">
                              {authorImage?.name} ({(authorImage?.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                            <button
                              type="button"
                              onClick={removeNewAuthorImage}
                              className="flex items-center space-x-2 text-red-600 hover:text-red-800 font-medium text-sm transition-colors duration-200"
                            >
                              <X className="w-4 h-4" />
                              <span>Remove New Image</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Backlinks */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Backlinks
                  </label>
                  <div className="space-y-3">
                    {formData.backlinks.map((backlink, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <input
                          type="text"
                          placeholder="Link text"
                          value={backlink.text}
                          onChange={(e) => handleBacklinkChange(index, 'text', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2e7d7b] focus:border-transparent"
                        />
                        <input
                          type="url"
                          placeholder="Link URL"
                          value={backlink.url}
                          onChange={(e) => handleBacklinkChange(index, 'url', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2e7d7b] focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => removeBacklink(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {formData.backlinks.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No backlinks added yet.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={addBacklink}
                    className="mt-3 flex items-center space-x-2 px-4 py-2 text-[#2e7d7b] hover:text-[#256967] font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Backlink</span>
                  </button>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-6 pt-4">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="featured"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded transition-all duration-200 ${
                        formData.featured 
                          ? 'bg-[#2e7d7b] border-[#2e7d7b]' 
                          : 'border-gray-300 group-hover:border-[#2e7d7b]'
                      }`}>
                        {formData.featured && (
                          <CheckCircle className="w-4 h-4 text-white absolute top-0.5 left-0.5" />
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                      Featured Post
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="trending"
                        name="trending"
                        checked={formData.trending}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded transition-all duration-200 ${
                        formData.trending 
                          ? 'bg-[#2e7d7b] border-[#2e7d7b]' 
                          : 'border-gray-300 group-hover:border-[#2e7d7b]'
                      }`}>
                        {formData.trending && (
                          <CheckCircle className="w-4 h-4 text-white absolute top-0.5 left-0.5" />
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                      Trending Post
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <button
                    type="button"
                    onClick={() => navigate('/admin-dashboard/manage-blogs')}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || characterCount.excerpt > 200}
                    className="w-full sm:w-auto px-8 py-4 bg-[#2e7d7b] hover:bg-[#256967] disabled:bg-gray-400 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2 min-w-[140px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Update Blog</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UpdateBlog;