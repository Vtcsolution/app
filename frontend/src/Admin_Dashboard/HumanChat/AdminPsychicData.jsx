import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  MessageSquare,
  Clock,
  Star,
  Calendar,
  TrendingUp,
  BarChart3,
  User,
  Mail,
  Phone,
  MapPin,
  Activity,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Save,
  X,
  AlertCircle,
  UserPlus,
  UserCheck,
  UserX,
  CreditCard,
  Briefcase,
  Heart,
  Sparkles,
  Calendar as CalendarIcon,
  Award,
  Zap,
  Settings,
  MoreHorizontal,
  Languages,
  Globe,
  PhoneCall,
  Wallet,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  Percent
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard_Navbar from "../Admin_Navbar";
import Doctor_Side_Bar from "../SideBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axios from 'axios';

const AdminPsychicsData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const [side, setSide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // State for psychics list
  const [psychics, setPsychics] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [summaryStats, setSummaryStats] = useState(null);
  
  // State for psychic details
  const [psychicDetails, setPsychicDetails] = useState(null);
  
  // State for edit modal - UPDATED with all schema fields
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    email: '',
    ratePerMin: '',
    bio: '',
    gender: '',
    type: '',
    abilities: [],
    isVerified: false,
    status: '',
    // New fields from schema
    category: '',
    location: '',
    languages: [],
    experience: '',
    specialization: '',
    availability: true,
    responseTime: '5',
    maxSessions: '1',
    isActive: true
  });
  const [newAbility, setNewAbility] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  
  // State for status update dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPsychicId, setSelectedPsychicId] = useState('');
  const [selectedPsychicName, setSelectedPsychicName] = useState('');
  
  // State for verification dialog
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [newVerificationStatus, setNewVerificationStatus] = useState(false);
  const [verifyPsychicId, setVerifyPsychicId] = useState('');
  const [verifyPsychicName, setVerifyPsychicName] = useState('');
  
  // State for rate update dialog
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [newRate, setNewRate] = useState('');
  const [ratePsychicId, setRatePsychicId] = useState('');
  const [ratePsychicName, setRatePsychicName] = useState('');
  
  const isDetailsView = !!id;
  const COMMISSION_RATE = 0.25;

  useEffect(() => {
    if (isDetailsView) {
      fetchPsychicDetails();
    } else {
      fetchPsychics();
    }
  }, [id, currentPage, limit, filterStatus]);

  const fetchPsychics = async () => {
    try {
      setLoading(true);
      
      let url = `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/psychics?page=${currentPage}&limit=${limit}`;
      
      if (filterStatus !== 'all') {
        url += `&status=${filterStatus}`;
      }
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }

      const response = await axios.get(url, { withCredentials: true });

      if (response.data.success) {
        setPsychics(response.data.data.psychics);
        setTotalPages(response.data.data.pagination.pages);
        setSummaryStats(response.data.data.summary);
        
        toast({
          title: "Success",
          description: `Loaded ${response.data.data.psychics.length} psychics`,
        });
      }
    } catch (error) {
      console.error('❌ Fetch psychics error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load psychics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPsychicDetails = async () => {
    try {
      setLoadingDetails(true);
      
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/psychics/${id}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setPsychicDetails(response.data.data);
        // Initialize edit form with current data including all fields
        setEditFormData({
          id: response.data.data.profile._id,
          name: response.data.data.profile.name || '',
          email: response.data.data.profile.email || '',
          ratePerMin: response.data.data.profile.ratePerMin || '',
          bio: response.data.data.profile.bio || '',
          gender: response.data.data.profile.gender || '',
          type: response.data.data.profile.type || 'Human Psychic',
          abilities: response.data.data.profile.abilities || [],
          isVerified: response.data.data.profile.isVerified || false,
          status: response.data.data.profile.status || 'offline',
          // New fields
          category: response.data.data.profile.category || 'Reading',
          location: response.data.data.profile.location || '',
          languages: response.data.data.profile.languages || ['English'],
          experience: response.data.data.profile.experience || 0,
          specialization: response.data.data.profile.specialization || '',
          availability: response.data.data.profile.availability !== false,
          responseTime: response.data.data.profile.responseTime || 5,
          maxSessions: response.data.data.profile.maxSessions || 1,
          isActive: response.data.data.profile.isActive !== false
        });
        
        toast({
          title: "Success",
          description: `Loaded details for ${response.data.data.profile.name}`,
        });
      }
    } catch (error) {
      console.error('❌ Fetch psychic details error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load psychic details",
        variant: "destructive"
      });
      navigate('/admin/dashboard/humancoach');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open edit modal for a specific psychic
  const openEditModal = (psychic) => {
    setEditFormData({
      id: psychic._id,
      name: psychic.name || '',
      email: psychic.email || '',
      ratePerMin: psychic.ratePerMin || '',
      bio: psychic.bio || '',
      gender: psychic.gender || '',
      type: psychic.type || 'Human Psychic',
      abilities: psychic.abilities || [],
      isVerified: psychic.isVerified || false,
      status: psychic.status || 'offline',
      category: psychic.category || 'Reading',
      location: psychic.location || '',
      languages: psychic.languages || ['English'],
      experience: psychic.experience || 0,
      specialization: psychic.specialization || '',
      availability: psychic.availability !== false,
      responseTime: psychic.responseTime || 5,
      maxSessions: psychic.maxSessions || 1,
      isActive: psychic.isActive !== false
    });
    setIsEditModalOpen(true);
  };

  // Update Psychic Details - UPDATED with all fields
  const handleUpdatePsychic = async () => {
    try {
      setUpdating(true);
      
      const updatePayload = {
        name: editFormData.name || '',
        email: editFormData.email || '',
        ratePerMin: parseFloat(editFormData.ratePerMin) || 0,
        bio: editFormData.bio || 'No bio provided',
        gender: editFormData.gender ? editFormData.gender.toLowerCase() : 'other',
        type: editFormData.type || 'Human Psychic',
        abilities: editFormData.abilities || [],
        isVerified: editFormData.isVerified,
        status: editFormData.status || 'offline',
        category: editFormData.category || 'Reading',
        location: editFormData.location || '',
        languages: editFormData.languages || ['English'],
        experience: parseInt(editFormData.experience) || 0,
        specialization: editFormData.specialization || '',
        availability: editFormData.availability,
        responseTime: parseInt(editFormData.responseTime) || 5,
        maxSessions: parseInt(editFormData.maxSessions) || 1,
        isActive: editFormData.isActive
      };
      
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/psychics/${editFormData.id}`,
        updatePayload,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        });
        setIsEditModalOpen(false);
        
        // Refresh the appropriate view
        if (isDetailsView) {
          fetchPsychicDetails();
        } else {
          fetchPsychics();
        }
      }
    } catch (error) {
      console.error('❌ Update psychic error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update psychic",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Add ability
  const handleAddAbility = () => {
    if (newAbility.trim() && !editFormData.abilities.includes(newAbility.trim())) {
      setEditFormData({
        ...editFormData,
        abilities: [...editFormData.abilities, newAbility.trim()]
      });
      setNewAbility('');
    }
  };

  // Remove ability
  const handleRemoveAbility = (abilityToRemove) => {
    setEditFormData({
      ...editFormData,
      abilities: editFormData.abilities.filter(ability => ability !== abilityToRemove)
    });
  };

  // Add language
  const handleAddLanguage = () => {
    if (newLanguage.trim() && !editFormData.languages.includes(newLanguage.trim())) {
      setEditFormData({
        ...editFormData,
        languages: [...editFormData.languages, newLanguage.trim()]
      });
      setNewLanguage('');
    }
  };

  // Remove language
  const handleRemoveLanguage = (languageToRemove) => {
    setEditFormData({
      ...editFormData,
      languages: editFormData.languages.filter(lang => lang !== languageToRemove)
    });
  };

  // Open status update dialog
  const openStatusDialog = (psychicId, psychicName, currentStatus) => {
    setSelectedPsychicId(psychicId);
    setSelectedPsychicName(psychicName);
    setSelectedStatus(currentStatus === 'active' ? 'inactive' : 'active');
    setStatusDialogOpen(true);
  };

  // Update Psychic Status
  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      
      const response = await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/psychics/${selectedPsychicId}/status`,
        { status: selectedStatus },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        });
        setStatusDialogOpen(false);
        
        if (isDetailsView && selectedPsychicId === id) {
          fetchPsychicDetails();
        } else {
          fetchPsychics();
        }
      }
    } catch (error) {
      console.error('❌ Update status error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Open verification dialog
  const openVerifyDialog = (psychicId, psychicName, currentVerified) => {
    setVerifyPsychicId(psychicId);
    setVerifyPsychicName(psychicName);
    setNewVerificationStatus(!currentVerified);
    setVerifyDialogOpen(true);
  };

  // Toggle Verification
  const handleToggleVerification = async () => {
    try {
      setUpdating(true);
      
      const response = await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/psychics/${verifyPsychicId}/verify`,
        { isVerified: newVerificationStatus },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        });
        setVerifyDialogOpen(false);
        
        if (isDetailsView && verifyPsychicId === id) {
          fetchPsychicDetails();
        } else {
          fetchPsychics();
        }
      }
    } catch (error) {
      console.error('❌ Toggle verification error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update verification",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Open rate update dialog
  const openRateDialog = (psychicId, psychicName, currentRate) => {
    setRatePsychicId(psychicId);
    setRatePsychicName(psychicName);
    setNewRate(currentRate?.toString() || '');
    setRateDialogOpen(true);
  };

  // Update Rate
  const handleUpdateRate = async () => {
    try {
      setUpdating(true);
      
      const response = await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/psychics/${ratePsychicId}/rate`,
        { ratePerMin: parseFloat(newRate) },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        });
        setRateDialogOpen(false);
        
        if (isDetailsView && ratePsychicId === id) {
          fetchPsychicDetails();
        } else {
          fetchPsychics();
        }
      }
    } catch (error) {
      console.error('❌ Update rate error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update rate",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return "N/A";
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPsychics();
  };

  const handleFilterChange = (value) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const handleViewPsychic = (psychicId) => {
    navigate(`/admin/dashboard/psychics/${psychicId}`);
  };

  const handleBackToList = () => {
    navigate('/admin/dashboard/humancoach');
  };

  if (loading && !isDetailsView) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Dashboard_Navbar side={side} setSide={setSide} />
        <div className="flex">
          <Doctor_Side_Bar side={side} setSide={setSide} />
          <main className="flex-1 mt-16 lg:mt-20 p-4 lg:p-6 ml-0 lg:ml-64 flex items-center justify-center overflow-x-hidden">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-muted-foreground">Loading psychics...</span>
          </main>
        </div>
      </div>
    );
  }

  if (loadingDetails && isDetailsView) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Dashboard_Navbar side={side} setSide={setSide} />
        <div className="flex">
          <Doctor_Side_Bar side={side} setSide={setSide} />
          <main className="flex-1 mt-16 lg:mt-20 p-4 lg:p-6 ml-0 lg:ml-64 flex items-center justify-center overflow-x-hidden">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-muted-foreground">Loading psychic details...</span>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard_Navbar side={side} setSide={setSide} />
      <div className="flex">
        <Doctor_Side_Bar side={side} setSide={setSide} />
        <main className="flex-1 mt-16 lg:mt-20 p-4 lg:p-6 ml-0 lg:ml-64 transition-all duration-300 overflow-x-hidden">
          
          {isDetailsView ? (
            // Psychic Details View
            psychicDetails ? (
              <>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={handleBackToList}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Psychics
                    </Button>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        {psychicDetails.profile.name}
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={
                          psychicDetails.profile.isVerified 
                            ? "bg-green-500/10 text-green-700 border-green-500/20"
                            : "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                        }>
                          {psychicDetails.profile.isVerified ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Verified
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                        <Badge variant="outline" className={
                          psychicDetails.profile.status === 'online' ? "bg-green-500/10 text-green-700" :
                          psychicDetails.profile.status === 'busy' ? "bg-red-500/10 text-red-700" :
                          psychicDetails.profile.status === 'away' ? "bg-yellow-500/10 text-yellow-700" :
                          "bg-gray-500/10 text-gray-700"
                        }>
                          {psychicDetails.profile.status || 'offline'}
                        </Badge>
                        {psychicDetails.profile.isActive === false && (
                          <Badge variant="destructive">
                            Deactivated
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          <CalendarIcon className="h-3 w-3 inline mr-1" />
                          Joined: {formatDate(psychicDetails.profile.joinDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => openEditModal(psychicDetails.profile)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit psychic profile information</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchPsychicDetails} 
                      disabled={loadingDetails}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingDetails ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={psychicDetails.profile.isActive === false ? "default" : "destructive"}
                          size="sm"
                          onClick={() => openStatusDialog(psychicDetails.profile._id, psychicDetails.profile.name, psychicDetails.profile.isActive ? 'active' : 'inactive')}
                          className={psychicDetails.profile.isActive !== false ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                          {psychicDetails.profile.isActive !== false ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{psychicDetails.profile.isActive !== false ? 'Deactivate this psychic' : 'Activate this psychic'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={psychicDetails.profile.isVerified ? "outline" : "default"}
                          size="sm"
                          onClick={() => openVerifyDialog(psychicDetails.profile._id, psychicDetails.profile.name, psychicDetails.profile.isVerified)}
                          className={!psychicDetails.profile.isVerified ? "bg-purple-600 hover:bg-purple-700" : ""}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {psychicDetails.profile.isVerified ? 'Remove Verification' : 'Verify Psychic'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{psychicDetails.profile.isVerified ? 'Remove verification badge' : 'Mark as verified psychic'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRateDialog(psychicDetails.profile._id, psychicDetails.profile.name, psychicDetails.profile.ratePerMin)}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Update Rate
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Update chat rate per minute</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Split Info Banner */}
                <Card className="mb-6 border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Percent className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Revenue Split: 75% Platform / 25% Psychic</p>
                          <p className="text-sm text-muted-foreground">
                            Psychic receives 25% of all payments from users
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20">
                        Commission Rate: 25%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Profile Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Profile Info */}
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center text-center mb-6">
                        <Avatar className="h-24 w-24 mb-4 border-4 border-purple-100">
                          {psychicDetails.profile.image ? (
                            <AvatarImage src={psychicDetails.profile.image} />
                          ) : (
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                              {psychicDetails.profile.name?.[0]?.toUpperCase() || 'P'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <h2 className="text-xl font-bold">{psychicDetails.profile.name}</h2>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {psychicDetails.profile.email}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-3">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">
                            {psychicDetails.profile.averageRating?.toFixed(1) || '0.0'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({psychicDetails.profile.totalRatings || 0} ratings)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Chat Rate:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(psychicDetails.profile.ratePerMin)}/min
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <PhoneCall className="h-4 w-4" />
                            Call Rate:
                          </span>
                          <span className="font-medium">
                            $1.00/min (1 credit = $1)
                          </span>
                        </div>
                        
                        {psychicDetails.profile.category && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Award className="h-4 w-4" />
                              Category:
                            </span>
                            <span className="font-medium">{psychicDetails.profile.category}</span>
                          </div>
                        )}
                        
                        {psychicDetails.profile.gender && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Gender:
                            </span>
                            <span className="font-medium capitalize">{psychicDetails.profile.gender}</span>
                          </div>
                        )}
                        
                        {psychicDetails.profile.location && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              Location:
                            </span>
                            <span className="font-medium">{psychicDetails.profile.location}</span>
                          </div>
                        )}
                        
                        {psychicDetails.profile.experience > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Experience:
                            </span>
                            <span className="font-medium">{psychicDetails.profile.experience} years</span>
                          </div>
                        )}
                        
                        {psychicDetails.profile.specialization && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              Specialization:
                            </span>
                            <span className="font-medium">{psychicDetails.profile.specialization}</span>
                          </div>
                        )}
                        
                        {psychicDetails.profile.type && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Sparkles className="h-4 w-4" />
                              Type:
                            </span>
                            <span className="font-medium">{psychicDetails.profile.type}</span>
                          </div>
                        )}
                        
                        {psychicDetails.profile.languages?.length > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground block mb-2 flex items-center gap-1">
                              <Languages className="h-4 w-4" />
                              Languages:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {psychicDetails.profile.languages.map((lang, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {lang}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {psychicDetails.profile.abilities?.length > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground block mb-2 flex items-center gap-1">
                              <Zap className="h-4 w-4" />
                              Abilities:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {psychicDetails.profile.abilities.map((ability, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-gradient-to-r from-purple-50 to-pink-50">
                                  {ability}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Max Sessions:
                          </span>
                          <span className="font-medium">{psychicDetails.profile.maxSessions || 1}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Activity className="h-4 w-4" />
                            Availability:
                          </span>
                          <Badge variant={psychicDetails.profile.availability !== false ? "default" : "secondary"} className="text-xs">
                            {psychicDetails.profile.availability !== false ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                        
                        {psychicDetails.profile.bio && (
                          <div>
                            <span className="text-sm text-muted-foreground block mb-2 flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              Bio:
                            </span>
                            <p className="text-sm leading-relaxed">{psychicDetails.profile.bio}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistics Cards */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Total Paid by Users</p>
                              <p className="text-2xl font-bold mt-1">
                                {formatCurrency(psychicDetails.financials.totalPaidByUsers)}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs">
                                <span className="text-green-600">Chat: {formatCurrency(psychicDetails.financials.chatPaidByUsers)}</span>
                                <span className="text-blue-600">Call: {formatCurrency(psychicDetails.financials.callPaidByUsers)}</span>
                              </div>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                              <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Psychic Earnings (25%)</p>
                              <p className="text-2xl font-bold mt-1 text-purple-600">
                                {formatCurrency(psychicDetails.financials.psychicEarnings)}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs">
                                <span className="text-purple-600">Chat: {formatCurrency(psychicDetails.financials.chatPsychicEarnings)}</span>
                                <span className="text-purple-600">Call: {formatCurrency(psychicDetails.financials.callPsychicEarnings)}</span>
                              </div>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                              <Wallet className="h-6 w-6 text-purple-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Platform Earnings (75%)</p>
                              <p className="text-2xl font-bold mt-1 text-blue-600">
                                {formatCurrency(psychicDetails.financials.platformEarnings)}
                              </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <TrendingUpIcon className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                              <p className="text-2xl font-bold mt-1">
                                {psychicDetails.statistics.totals.chatSessions + psychicDetails.statistics.totals.callSessions}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs">
                                <span className="text-green-600">Chats: {psychicDetails.statistics.totals.chatSessions}</span>
                                <span className="text-blue-600">Calls: {psychicDetails.statistics.totals.callSessions}</span>
                              </div>
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
                              <p className="text-sm font-medium text-muted-foreground">Hours Worked</p>
                              <p className="text-2xl font-bold mt-1">
                                {psychicDetails.statistics.totals.hoursWorked}
                              </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                              <Clock className="h-6 w-6 text-orange-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Avg Session Value</p>
                              <p className="text-2xl font-bold mt-1">
                                {formatCurrency(psychicDetails.statistics.performance.avgEarningsPerSession)}
                              </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                              <BarChart3 className="h-6 w-6 text-purple-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="recent-activity" className="mb-6">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="recent-activity">
                      <Activity className="h-4 w-4 mr-2" />
                      Recent Activity
                    </TabsTrigger>
                    <TabsTrigger value="monthly-earnings">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Monthly Earnings
                    </TabsTrigger>
                    <TabsTrigger value="user-interactions">
                      <Users className="h-4 w-4 mr-2" />
                      Top Users
                    </TabsTrigger>
                    <TabsTrigger value="reviews">
                      <Star className="h-4 w-4 mr-2" />
                      Reviews
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="recent-activity">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest sessions and interactions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {psychicDetails.recentActivity?.chatSessions?.length === 0 && 
                         psychicDetails.recentActivity?.callSessions?.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No recent activity found</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {psychicDetails.recentActivity?.chatSessions?.slice(0, 5).map((session, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <MessageSquare className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{session.user}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Chat session • {session.duration} minutes
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                                  {session.status}
                                </Badge>
                              </div>
                            ))}
                            {psychicDetails.recentActivity?.callSessions?.slice(0, 5).map((call, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <PhoneCall className="h-5 w-5 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{call.user}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Call session • {call.duration} minutes
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={call.status === 'in-progress' ? 'default' : 'secondary'}>
                                  {call.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="monthly-earnings">
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Earnings Breakdown</CardTitle>
                        <CardDescription>Earnings over the last 6 months</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {psychicDetails.financials?.monthlyBreakdown?.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No monthly earnings data available</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {psychicDetails.financials?.monthlyBreakdown?.map((month, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">{month.period}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {month.sessionCount} sessions • {month.totalMinutes} minutes
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-purple-600">{formatCurrency(month.psychicEarnings)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Platform: {formatCurrency(month.platformEarnings)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="user-interactions">
                    <Card>
                      <CardHeader>
                        <CardTitle>Top User Interactions</CardTitle>
                        <CardDescription>Users who interact most with this psychic</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {psychicDetails.userInteractions?.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No user interactions yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {psychicDetails.userInteractions?.map((user, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">{user.userName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {user.totalSessions} sessions • Last: {formatDate(user.lastSession)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-green-600">{formatCurrency(user.totalSpentByUser)}</p>
                                  <p className="text-xs text-purple-600">
                                    Psychic: {formatCurrency(user.psychicEarnings)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="reviews">
                    <Card>
                      <CardHeader>
                        <CardTitle>Reviews & Ratings</CardTitle>
                        <CardDescription>Feedback from users</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {psychicDetails.recentActivity?.recentReviews?.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No reviews yet</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {psychicDetails.recentActivity?.recentReviews?.map((review, idx) => (
                              <div key={idx} className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    <span className="font-medium">{review.rating}/5</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {formatDate(review.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm">{review.comment}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  - {review.userName}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : null
          ) : (
            // Psychics List View
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Psychics Management
                  </h1>
                  <p className="text-muted`-foreground mt-1">
                    Overview of all registered psychics and their performance (Chats & Calls)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={fetchPsychics} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Split Info Banner */}
              <Card className="mb-6 border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                        <Percent className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Revenue Split: 75% Platform / 25% Psychic</p>
                        <p className="text-sm text-muted-foreground">
                          All earnings shown are based on this split
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20 self-start sm:self-center">
                      Commission Rate: 25%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Filters and Search - RESPONSIVE */}
              <Card className="mb-6">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Button type="submit" disabled={loading}>
                        Search
                      </Button>
                    </form>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Select value={filterStatus} onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="pending">Pending Verification</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                        <SelectTrigger className="w-full sm:w-[150px]">
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

              {/* Summary Stats - RESPONSIVE */}
              {summaryStats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  <Card>
                    <CardContent className="p-3 sm:p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Psychics</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">{summaryStats.totalPsychics}</p>
                        </div>
                        <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <Users className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-3 sm:p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Paid by Users</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 truncate">
                            {formatCurrency(summaryStats.totalPaidByUsers)}
                          </p>
                        </div>
                        <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-3 sm:p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Psychic Earnings (25%)</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 text-purple-600 truncate">
                            {formatCurrency(summaryStats.totalPsychicEarnings)}
                          </p>
                        </div>
                        <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <Wallet className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="col-span-2 lg:col-span-1">
                    <CardContent className="p-3 sm:p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Platform Earnings (75%)</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 text-blue-600 truncate">
                            {formatCurrency(summaryStats.totalPlatformEarnings)}
                          </p>
                        </div>
                        <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <TrendingUpIcon className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Psychics Table - WITH HORIZONTAL SCROLL FOR RESPONSIVENESS */}
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Psychics List</CardTitle>
                  <CardDescription className="text-sm">
                    Showing {psychics.length} of {totalPages * limit} psychics
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {psychics.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="font-medium">No psychics found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="min-w-[1200px] lg:min-w-full">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Psychic</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Rate/Min</TableHead>
                              <TableHead>Rating</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Total Paid</TableHead>
                              <TableHead>Psychic Earnings</TableHead>
                              <TableHead>Platform Earnings</TableHead>
                              <TableHead>Sessions</TableHead>
                              <TableHead>Active</TableHead>
                              <TableHead>Joined</TableHead>
                              <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {psychics.map((psychic) => (
                              <TableRow key={psychic._id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                      {psychic.image ? (
                                        <AvatarImage src={psychic.image} />
                                      ) : (
                                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                          {psychic.name?.[0]?.toUpperCase() || 'P'}
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{psychic.name}</p>
                                      <p className="text-sm text-muted-foreground">{psychic.email}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <Badge className={
                                      psychic.isVerified 
                                        ? "bg-green-500/10 text-green-700 border-green-500/20"
                                        : "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                                    }>
                                      {psychic.isVerified ? (
                                        <>
                                          <UserCheck className="h-3 w-3 mr-1" />
                                          Verified
                                        </>
                                      ) : (
                                        <>
                                          <UserX className="h-3 w-3 mr-1" />
                                          Pending
                                        </>
                                      )}
                                    </Badge>
                                    <Badge variant="outline" className={
                                      psychic.status === 'online' ? "text-green-600" :
                                      psychic.status === 'busy' ? "text-red-600" :
                                      "text-gray-600"
                                    }>
                                      {psychic.status || 'offline'}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4 text-yellow-600" />
                                    <span className="font-medium">
                                      ${(psychic.ratePerMin || 0).toFixed(2)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    <span className="font-medium">
                                      {psychic.averageRating ? psychic.averageRating.toFixed(1) : '0.0'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      ({psychic.totalRatings || 0})
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {psychic.category || 'Reading'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {formatCurrency(psychic.statistics?.totalPaidByUsers || 0)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-purple-600">
                                      {formatCurrency(psychic.statistics?.psychicEarnings || 0)}
                                    </span>
                                    <p className="text-xs text-muted-foreground">
                                      ${(psychic.statistics?.earningsPerHour || 0).toFixed(2)}/hr
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-blue-600">
                                      {formatCurrency(psychic.statistics?.platformEarnings || 0)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{psychic.statistics?.totalSessions || 0}</span>
                                    <p className="text-xs text-muted-foreground">
                                      Chats: {psychic.statistics?.chatSessions || 0} | 
                                      Calls: {psychic.statistics?.callSessions || 0}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    {psychic.statistics?.activeChats > 0 && (
                                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700">
                                        <MessageSquare className="h-3 w-3 mr-1" />
                                        {psychic.statistics.activeChats} chats
                                      </Badge>
                                    )}
                                    {psychic.statistics?.activeCalls > 0 && (
                                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700">
                                        <PhoneCall className="h-3 w-3 mr-1" />
                                        {psychic.statistics.activeCalls} calls
                                      </Badge>
                                    )}
                                    {psychic.statistics?.activeChats === 0 && psychic.statistics?.activeCalls === 0 && (
                                      <span className="text-xs text-muted-foreground">None</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {formatDate(psychic.createdAt)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewPsychic(psychic._id)}
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>View Details</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditModal(psychic)}
                                          >
                                            <Edit className="h-4 w-4 text-blue-600" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Edit Psychic</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => openStatusDialog(psychic._id, psychic.name, psychic.isActive ? 'active' : 'inactive')}>
                                          {psychic.isActive !== false ? (
                                            <>
                                              <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                              Deactivate
                                            </>
                                          ) : (
                                            <>
                                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                              Activate
                                            </>
                                          )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openVerifyDialog(psychic._id, psychic.name, psychic.isVerified)}>
                                          {psychic.isVerified ? (
                                            <>
                                              <UserX className="h-4 w-4 mr-2 text-yellow-600" />
                                              Remove Verification
                                            </>
                                          ) : (
                                            <>
                                              <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                                              Verify Psychic
                                            </>
                                          )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openRateDialog(psychic._id, psychic.name, psychic.ratePerMin)}>
                                          <CreditCard className="h-4 w-4 mr-2 text-purple-600" />
                                          Update Rate
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
                
                {/* Pagination - RESPONSIVE */}
                {totalPages > 1 && (
                  <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t p-4">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline ml-1">Previous</span>
                      </Button>
                      
                      <div className="hidden sm:flex items-center gap-1">
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
                        <span className="hidden sm:inline mr-1">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
            </>
          )}
        </main>
      </div>

      {/* Edit Psychic Modal - UPDATED with all fields */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Psychic Profile
            </DialogTitle>
            <DialogDescription>
              Update the psychic's information. Changes will be reflected immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  placeholder="Enter name"
                  className="focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  placeholder="Enter email"
                  className="focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ratePerMin" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Rate per Minute (USD)
                </Label>
                <Input
                  id="ratePerMin"
                  type="number"
                  step="0.01"
                  value={editFormData.ratePerMin}
                  onChange={(e) => setEditFormData({...editFormData, ratePerMin: parseFloat(e.target.value)})}
                  placeholder="Enter rate"
                  className="focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Gender
                </Label>
                <Select
                  value={editFormData.gender}
                  onValueChange={(value) => setEditFormData({...editFormData, gender: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Psychic Type
                </Label>
                <Input
                  id="type"
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({...editFormData, type: e.target.value})}
                  placeholder="e.g., Human Psychic"
                  className="focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  Category
                </Label>
                <Select
                  value={editFormData.category}
                  onValueChange={(value) => setEditFormData({...editFormData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tarot Reading">Tarot Reading</SelectItem>
                    <SelectItem value="Astrology">Astrology</SelectItem>
                    <SelectItem value="Reading">Reading</SelectItem>
                    <SelectItem value="Love & Relationships">Love & Relationships</SelectItem>
                    <SelectItem value="Career & Finance">Career & Finance</SelectItem>
                    <SelectItem value="Spiritual Guidance">Spiritual Guidance</SelectItem>
                    <SelectItem value="Numerology">Numerology</SelectItem>
                    <SelectItem value="Clairvoyant">Clairvoyant</SelectItem>
                    <SelectItem value="Dream Analysis">Dream Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                  placeholder="Enter location"
                  className="focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization" className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  Specialization
                </Label>
                <Input
                  id="specialization"
                  value={editFormData.specialization}
                  onChange={(e) => setEditFormData({...editFormData, specialization: e.target.value})}
                  placeholder="Enter specialization"
                  className="focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Experience (Years)
                </Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={editFormData.experience}
                  onChange={(e) => setEditFormData({...editFormData, experience: parseInt(e.target.value)})}
                  placeholder="Years"
                  className="focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSessions" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Max Concurrent Sessions
                </Label>
                <Input
                  id="maxSessions"
                  type="number"
                  min="1"
                  max="5"
                  value={editFormData.maxSessions}
                  onChange={(e) => setEditFormData({...editFormData, maxSessions: parseInt(e.target.value)})}
                  placeholder="Max sessions"
                  className="focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responseTime" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Avg Response Time (min)
                </Label>
                <Input
                  id="responseTime"
                  type="number"
                  min="1"
                  value={editFormData.responseTime}
                  onChange={(e) => setEditFormData({...editFormData, responseTime: parseInt(e.target.value)})}
                  placeholder="Minutes"
                  className="focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  Online Status
                </Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) => setEditFormData({...editFormData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="away">Away</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="verification" className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Verification Status
                </Label>
                <Select
                  value={editFormData.isVerified ? "verified" : "pending"}
                  onValueChange={(value) => setEditFormData({...editFormData, isVerified: value === "verified"})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availability" className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Availability
                </Label>
                <Select
                  value={editFormData.availability ? "available" : "unavailable"}
                  onValueChange={(value) => setEditFormData({...editFormData, availability: value === "available"})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available for Sessions</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive" className="flex items-center gap-1">
                  <UserCheck className="h-4 w-4" />
                  Account Status
                </Label>
                <Select
                  value={editFormData.isActive ? "active" : "inactive"}
                  onValueChange={(value) => setEditFormData({...editFormData, isActive: value === "active"})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive (Deactivated)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Languages */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Languages className="h-4 w-4" />
                Languages Spoken
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Add language (e.g., English, Spanish)"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                  className="focus:ring-purple-500 flex-1"
                />
                <Button type="button" onClick={handleAddLanguage} size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {editFormData.languages.map((lang, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1 bg-blue-100 text-blue-700">
                    <Globe className="h-3 w-3" />
                    {lang}
                    <button
                      onClick={() => handleRemoveLanguage(lang)}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Abilities */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                Abilities / Special Skills
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={newAbility}
                  onChange={(e) => setNewAbility(e.target.value)}
                  placeholder="Add ability (e.g., Tarot Reading, Mediumship)"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddAbility()}
                  className="focus:ring-purple-500 flex-1"
                />
                <Button type="button" onClick={handleAddAbility} size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {editFormData.abilities.map((ability, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1 bg-purple-100 text-purple-700">
                    <Zap className="h-3 w-3" />
                    {ability}
                    <button
                      onClick={() => handleRemoveAbility(ability)}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                Bio / Description
              </Label>
              <Textarea
                id="bio"
                value={editFormData.bio}
                onChange={(e) => setEditFormData({...editFormData, bio: e.target.value})}
                placeholder="Enter bio description"
                rows={4}
                className="focus:ring-purple-500"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePsychic} disabled={updating} className="bg-purple-600 hover:bg-purple-700">
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Update Psychic Status
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {selectedStatus === 'active' ? 'activate' : 'deactivate'} <span className="font-semibold">{selectedPsychicName}</span>?
              {selectedStatus === 'inactive' && " They will no longer be available for sessions."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateStatus} className={selectedStatus === 'inactive' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verification Dialog */}
      <AlertDialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {newVerificationStatus ? 'Verify Psychic' : 'Remove Verification'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {newVerificationStatus ? 'verify' : 'unverify'} <span className="font-semibold">{verifyPsychicName}</span>?
              {newVerificationStatus && " Verified psychics will have a verified badge on their profile."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleVerification} className="bg-purple-600 hover:bg-purple-700">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rate Update Dialog */}
      <AlertDialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Update Chat Rate for {ratePsychicName}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Enter the new rate per minute for chat sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="newRate" className="flex items-center gap-1 mb-2">
              <DollarSign className="h-4 w-4" />
              Rate per minute (USD)
            </Label>
            <Input
              id="newRate"
              type="number"
              step="0.01"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              placeholder="Enter rate"
              className="focus:ring-purple-500"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateRate} className="bg-purple-600 hover:bg-purple-700">
              Update Rate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPsychicsData;