import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePsychicAuth } from "../context/PsychicAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  Filter, 
  Search, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  BarChart3,
  StarHalf,
  StarOff,
  CheckCircle2,
  Clock,
  Eye,
  MoreHorizontal,
  AlertCircle,
  Sparkles,
  ThumbsUp
} from 'lucide-react';
import { toast } from "sonner";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PsychicReviews = () => {
  const { psychic, loading: authLoading, isAuthenticated } = usePsychicAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [hasRatings, setHasRatings] = useState(false);
  
  // Pagination and filter states
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
    hasMore: false
  });
  
  const [filters, setFilters] = useState({
    minRating: '',
    maxRating: '',
    hasComment: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: ''
  });
  
  // Selected review for detailed view
  const [selectedReview, setSelectedReview] = useState(null);
  
  // Create axios instance
  const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
  });

  // Add token to requests
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('psychicToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/psychic/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Debug function to check API response
  const debugAPI = async (endpoint, params = {}) => {
    try {
      console.log(`Testing ${endpoint} with params:`, params);
      const response = await api.get(endpoint, { params });
      console.log(`✅ ${endpoint} success:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ ${endpoint} error:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      throw error;
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First check if psychic has ratings
      await checkHasRatings();
      
      if (hasRatings) {
        // Fetch reviews
        await fetchReviews();
        
        // Fetch summary
        await fetchSummary();
        
        // Fetch monthly stats
        await fetchMonthlyStats();
      }
      
    } catch (err) {
      console.error('Fetch data error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || err.message || 'Échec du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });
      
      console.log('Fetching reviews with params:', params);
      
      const { data } = await api.get('/api/ratings/psychic-reviews/my-ratings', { params });
      
      if (data.success) {
        console.log('Reviews fetched successfully:', data.data.ratings.length);
        setReviews(data.data.ratings);
        setPagination(prev => ({
          ...prev,
          totalPages: data.data.pagination.totalPages,
          totalItems: data.data.pagination.totalItems,
          hasMore: data.data.pagination.hasMore
        }));
      } else {
        throw new Error(data.message || 'Échec du chargement des avis');
      }
    } catch (err) {
      console.error('Fetch reviews error:', err);
      throw err;
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    try {
      console.log('Fetching summary...');
      const { data } = await api.get('/api/ratings/psychic-reviews/my-summary');
      
      if (data.success) {
        console.log('Summary fetched:', data.data);
        setSummary(data.data);
      } else {
        throw new Error(data.message || 'Échec du chargement du résumé');
      }
    } catch (err) {
      console.error('Fetch summary error:', err);
      throw err;
    }
  };

  // Fetch monthly stats
  const fetchMonthlyStats = async () => {
    try {
      console.log('Fetching monthly stats...');
      const { data } = await api.get('/api/ratings/psychic-reviews/monthly-stats', {
        params: { months: 6 }
      });
      
      if (data.success) {
        console.log('Monthly stats fetched:', data.data.monthlyStats.length);
        setMonthlyStats(data.data.monthlyStats);
      } else {
        throw new Error(data.message || 'Échec du chargement des statistiques mensuelles');
      }
    } catch (err) {
      console.error('Fetch monthly stats error:', err);
      throw err;
    }
  };

  // Check if psychic has ratings
  const checkHasRatings = async () => {
    try {
      console.log('Checking if psychic has ratings...');
      const { data } = await api.get('/api/ratings/psychic-reviews/has-ratings');
      
      if (data.success) {
        console.log('Has ratings response:', data.data);
        setHasRatings(data.data.hasRatings);
      } else {
        throw new Error(data.message || 'Échec de la vérification des avis');
      }
    } catch (err) {
      console.error('Check has ratings error:', err);
      throw err;
    }
  };

  // Fetch specific review
  const fetchReviewById = async (id) => {
    try {
      const { data } = await api.get(`/api/ratings/psychic-reviews/rating/${id}`);
      if (data.success) {
        setSelectedReview(data.data);
      }
    } catch (err) {
      toast.error('Échec du chargement des détails de l\'avis');
      console.error('Fetch review by ID error:', err);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Psychic authenticated, fetching data...');
      fetchAllData();
    }
  }, [isAuthenticated, pagination.page, filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchReviews();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      minRating: '',
      maxRating: '',
      hasComment: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Refresh data
  const handleRefresh = () => {
    fetchAllData();
    toast.success('Données actualisées');
  };

  // Pagination handlers
  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const nextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const prevPage = () => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time ago
  const timeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `il y a ${diffMins}m`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays < 30) return `il y a ${diffDays}j`;
    return formatDate(dateString);
  };

  // Render star rating
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Test API endpoint (for debugging)
  const testEndpoints = async () => {
    try {
      console.log('=== Testing API Endpoints ===');
      
      // Test psychic auth
      const token = localStorage.getItem('psychicToken');
      console.log('Psychic Token exists:', !!token);
      
      // Test basic endpoint
      await debugAPI('/ratings/psychic-reviews/has-ratings');
      
      // Test with simple params
      await debugAPI('/ratings/psychic-reviews/my-ratings', { 
        page: 1, 
        limit: 5 
      });
      
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  // Call test on component mount for debugging
  useEffect(() => {
    if (isAuthenticated) {
      // Uncomment for debugging:
      // testEndpoints();
    }
  }, [isAuthenticated]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des avis...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Erreur de Chargement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-3">
              <Button onClick={fetchAllData} className="w-full">
                Réessayer
              </Button>
              <Button 
                onClick={testEndpoints} 
                variant="outline" 
                className="w-full"
              >
                Tester la Connexion API
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
     <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Avis Clients</h1>
              <p className="text-gray-600 mt-2">Consultez et gérez vos notes et avis clients.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {!hasRatings ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 bg-blue-50 p-3 rounded-full w-16 h-16 flex items-center justify-center">
                <Star className="h-8 w-8 text-blue-500" />
              </div>
              <CardTitle>Aucun Avis pour le Moment</CardTitle>
              <CardDescription>
                Vous n'avez encore reçu aucune note ou avis de clients.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Dès que les clients noteront leurs sessions de chat avec vous, les avis apparaîtront ici.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate('/psychic/dashboard')}>
                Aller au Tableau de Bord
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Note Moyenne</p>
                      <div className="flex items-center mt-2">
                        <span className="text-3xl font-bold text-gray-800">
                          {summary?.summary?.averageRating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-gray-400 ml-2">/ 5.0</span>
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-full">
                      <Star className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total des Avis</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {summary?.summary?.totalRatings || 0}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-full">
                      <MessageSquare className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Avec Commentaires</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {reviews.filter(r => r.comment).length}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-full">
                      <ThumbsUp className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Tendance Récente</p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-xl font-bold text-gray-800">
                          {summary?.summary?.recentAverage?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-gray-400 ml-2">30 derniers jours</span>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-full">
                      <BarChart3 className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Reviews List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Avis Clients</CardTitle>
                        <CardDescription>
                          {pagination.totalItems} avis au total
                        </CardDescription>
                      </div>
                      
                      {/* Filters */}
                      <div className="flex items-center gap-3">
                        <form onSubmit={handleSearch} className="flex gap-2">
                          <Input
                            placeholder="Rechercher des avis..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-48"
                          />
                          <Button type="submit" size="sm" className="gap-2">
                            <Search className="h-4 w-4" />
                            Rechercher
                          </Button>
                        </form>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Filter className="h-4 w-4" />
                              Filtrer
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Filtrer les Avis</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <div className="p-2 space-y-3">
                              <div className="space-y-2">
                                <Label className="text-xs">Plage de Notes</Label>
                                <div className="flex gap-2">
                                  <Select
                                    value={filters.minRating}
                                    onValueChange={(value) => handleFilterChange('minRating', value)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="Min" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">Toutes</SelectItem>
                                      {[1, 2, 3, 4, 5].map(num => (
                                        <SelectItem key={`min-${num}`} value={num.toString()}>
                                          {num}+ étoiles
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  <Select
                                    value={filters.maxRating}
                                    onValueChange={(value) => handleFilterChange('maxRating', value)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="Max" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">Toutes</SelectItem>
                                      {[1, 2, 3, 4, 5].map(num => (
                                        <SelectItem key={`max-${num}`} value={num.toString()}>
                                          Jusqu'à {num}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-xs">Commentaires</Label>
                                <Select
                                  value={filters.hasComment}
                                  onValueChange={(value) => handleFilterChange('hasComment', value)}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Filtrer par commentaires" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">Tous les avis</SelectItem>
                                    <SelectItem value="true">Avec commentaires</SelectItem>
                                    <SelectItem value="false">Sans commentaires</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-xs">Trier par</Label>
                                <Select
                                  value={filters.sortBy}
                                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Trier par" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="createdAt">Date</SelectItem>
                                    <SelectItem value="rating">Note</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="pt-2">
                                <Button
                                  onClick={resetFilters}
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                >
                                  Réinitialiser les Filtres
                                </Button>
                              </div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Reviews List */}
                    <div className="space-y-4">
                      {reviews.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-600">Aucun avis trouvé</h3>
                          <p className="text-gray-500 mt-1">Essayez d'ajuster vos filtres</p>
                        </div>
                      ) : (
                        reviews.map((review) => (
                          <div
                            key={review._id}
                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => fetchReviewById(review._id)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={review.user?.image} />
                                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                    {review.user?.firstName?.[0] || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">
                                      {review.user?.firstName} {review.user?.lastName}
                                    </h4>
                                    {review.user?.country && (
                                      <Badge variant="outline" className="text-xs">
                                        {review.user.country}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mt-1">
                                    {renderStars(review.rating)}
                                    <span className="text-xs text-gray-500">
                                      {timeAgo(review.createdAt)}
                                    </span>
                                    {review.isEdited && (
                                      <Badge variant="outline" className="text-xs">
                                        Modifié
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => fetchReviewById(review._id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir les Détails
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            {review.comment && (
                              <div className="mt-3 ml-12">
                                <p className="text-gray-700 text-sm line-clamp-2">
                                  {review.comment}
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    
                    {/* Pagination */}
                    {reviews.length > 0 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-500">
                          Affichage de {(pagination.page - 1) * pagination.limit + 1} à{' '}
                          {Math.min(pagination.page * pagination.limit, pagination.totalItems)} sur{' '}
                          {pagination.totalItems} avis
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={prevPage}
                            disabled={pagination.page === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let pageNum;
                            if (pagination.totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                              pageNum = i + 1;
                            } else if (pagination.page >= pagination.totalPages - 2) {
                              pageNum = pagination.totalPages - 4 + i;
                            } else {
                              pageNum = pagination.page - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={pagination.page === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => goToPage(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={nextPage}
                            disabled={pagination.page === pagination.totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Column - Stats and Details */}
              <div className="space-y-6">
                {/* Rating Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Répartition des Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {summary?.summary?.ratingPercentages && (
                      <div className="space-y-4">
                        {Object.entries(summary.summary.ratingPercentages)
                          .sort(([a], [b]) => b - a)
                          .map(([rating, percentage]) => (
                            <div key={rating} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  {renderStars(parseInt(rating))}
                                </div>
                                <span className="font-medium">{percentage}%</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    rating >= 4
                                      ? 'bg-green-500'
                                      : rating >= 3
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Reviews */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Avis Récents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {summary?.latestReviews?.slice(0, 3).map((review) => (
                        <div key={review._id} className="border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {review.user?.firstName?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {review.user?.firstName} {review.user?.lastName?.[0]}.
                                </p>
                                <div className="flex items-center gap-1">
                                  {renderStars(review.rating)}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {timeAgo(review.createdAt)}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              "{review.comment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: 'createdAt', sortOrder: 'desc' }))}
                    >
                      Voir Tous les Récents
                    </Button>
                  </CardFooter>
                </Card>

                {/* Monthly Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Performance Mensuelle
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {monthlyStats.slice(-3).reverse().map((stat) => (
                        <div key={stat.month} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{stat.month}</span>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-medium">{stat.averageRating}</div>
                              <div className="text-xs text-gray-500">note moyenne</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{stat.totalRatings}</div>
                              <div className="text-xs text-gray-500">avis</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Review Detail Modal */}
            {selectedReview && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Détails de l'Avis</CardTitle>
                        <CardDescription>
                          {formatDate(selectedReview.rating.createdAt)}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReview(null)}
                      >
                        ✕
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedReview.rating.user?.image} />
                        <AvatarFallback className="text-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                          {selectedReview.rating.user?.firstName?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="text-xl font-semibold">
                          {selectedReview.rating.user?.firstName} {selectedReview.rating.user?.lastName}
                        </h3>
                        {selectedReview.rating.user?.username && (
                          <p className="text-gray-600">@{selectedReview.rating.user.username}</p>
                        )}
                        {selectedReview.rating.user?.country && (
                          <Badge variant="outline" className="mt-2">
                            {selectedReview.rating.user.country}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Rating */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Note</h4>
                      <div className="flex items-center gap-3">
                        <div className="text-4xl font-bold">{selectedReview.rating.rating.toFixed(1)}</div>
                        <div className="flex items-center">
                          {renderStars(selectedReview.rating.rating)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Comment */}
                    {selectedReview.rating.comment && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Avis</h4>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            "{selectedReview.rating.comment}"
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Review Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Date de l'Avis</h4>
                        <p className="font-medium">
                          {formatDate(selectedReview.rating.createdAt)}
                        </p>
                      </div>
                      
                      {selectedReview.rating.isEdited && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Dernière Modification</h4>
                          <p className="font-medium">
                            {formatDate(selectedReview.rating.editedAt)}
                          </p>
                        </div>
                      )}
                      
                      {selectedReview.navigation?.previous && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Avis Précédent</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchReviewById(selectedReview.navigation.previous)}
                          >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Voir Précédent
                          </Button>
                        </div>
                      )}
                      
                      {selectedReview.navigation?.next && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Avis Suivant</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchReviewById(selectedReview.navigation.next)}
                          >
                            Voir Suivant
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedReview(null)}
                    >
                      Fermer
                    </Button>
                    
                    <div className="flex gap-2">
                      {selectedReview.navigation?.previous && (
                        <Button
                          variant="outline"
                          onClick={() => fetchReviewById(selectedReview.navigation.previous)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {selectedReview.navigation?.next && (
                        <Button
                          variant="outline"
                          onClick={() => fetchReviewById(selectedReview.navigation.next)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PsychicReviews;