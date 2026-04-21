import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { 
  Loader2, 
  X, 
  DollarSign, 
  Wallet, 
  History, 
  Eye,
  CheckCircle,
  Image as ImageIcon,
  User,
  Sparkles,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Phone,
  CreditCard,
  Banknote,
  Upload,
  Download,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import Dashboard_Navbar from "../Admin_Navbar";
import Doctor_Side_Bar from "../SideBar";

// Color scheme matching your app's design system
const colors = {
  deepPurple: "#2B1B3F",
  antiqueGold: "#C9A24D",
  softIvory: "#F5F3EB",
  lightGold: "#E8D9B0",
  darkPurple: "#1A1129",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
};

export default function PsychicEarningsPayment() {
  const { admin } = useAdminAuth();
  const navigate = useNavigate();
  const [side, setSide] = useState(false);
  
  // State for psychics list
  const [psychics, setPsychics] = useState([]);
  const [selectedPsychic, setSelectedPsychic] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPsychics, setLoadingPsychics] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentNotes, setPaymentNotes] = useState("");
  
  // Image upload states
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState(null);
  const [paymentPreviewUrl, setPaymentPreviewUrl] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // View payment details modal
  const [viewPaymentModal, setViewPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch all psychics on component mount
  useEffect(() => {
    fetchAllPsychics();
  }, []);

  // Fetch earnings when psychic is selected
  useEffect(() => {
    if (selectedPsychic) {
      fetchPsychicEarningsDetails(selectedPsychic._id);
      fetchPsychicPaymentHistory(selectedPsychic._id);
    }
  }, [selectedPsychic]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (paymentPreviewUrl) {
        URL.revokeObjectURL(paymentPreviewUrl);
      }
    };
  }, [paymentPreviewUrl]);

  // Fetch all psychics from the admin payments endpoint
  const fetchAllPsychics = async () => {
    setLoadingPsychics(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/admin/payments/psychics`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        const psychicsList = result.data.map(item => ({
          _id: item._id,
          name: item.name,
          email: item.email,
          image: item.image,
          phone: item.phone,
          category: item.category || 'Psychic',
          currentBalance: item.earnings?.totalPsychicEarnings - (item.paymentSummary?.totalPaid || 0) || 0,
          totalEarned: item.earnings?.totalPsychicEarnings || 0,
          totalPaid: item.paymentSummary?.totalPaid || 0,
          lastPaymentDate: item.paymentSummary?.lastPaymentDate
        }));
        
        setPsychics(psychicsList);
      } else {
        toast.error(result.message || "Failed to fetch psychics");
      }
    } catch (error) {
      console.error("Error fetching psychics:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoadingPsychics(false);
    }
  };

  // Fetch psychic earnings details
  const fetchPsychicEarningsDetails = async (psychicId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/admin/payments/psychic/${psychicId}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        const data = result.data;
        
        setEarningsData({
          summary: data.earnings,
          breakdown: {
            chatEarnings: data.earnings?.chatEarnings || 0,
            callEarnings: data.earnings?.callEarnings || 0,
            totalPsychicEarnings: data.earnings?.totalPsychicEarnings || 0,
            platformCommission: data.earnings?.totalPlatformCommission || 0
          },
          recentActivity: {
            totalRecentEarnings: data.sessions
              ?.filter(s => {
                const sessionDate = new Date(s.date);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return sessionDate >= thirtyDaysAgo;
              })
              .reduce((sum, s) => sum + s.amount, 0) || 0,
            chatSessions: data.sessions?.filter(s => s.type === 'chat') || [],
            callSessions: data.sessions?.filter(s => s.type === 'call') || []
          },
          sessions: data.sessions || [],
          paymentHistory: data.paymentHistory || [],
          splitRatio: data.splitRatio
        });
      } else {
        toast.error(result.message || "Failed to fetch earnings");
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // Fetch psychic payment history
  const fetchPsychicPaymentHistory = async (psychicId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/admin/payments/psychic/${psychicId}/payments`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        const paymentHistory = result.data.payments?.map(p => ({
          amount: p.amount,
          paymentId: p.paymentId,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          notes: p.notes,
          paymentScreenshot: p.paymentScreenshot,
          processedBy: p.processedBy,
          status: p.status
        })) || [];
        
        setEarningsData(prev => prev ? {
          ...prev,
          paymentHistory
        } : null);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
    }
  };

  // Cloudinary upload function
  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "ml_default");
    
    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dovyqaltq/image/upload", {
        method: "POST",
        body: data,
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Upload failed");
      return json.secure_url;
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw error;
    }
  };

  // Handle payment screenshot file selection
  const handlePaymentScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file (JPG, PNG, GIF)");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      setPaymentScreenshotFile(file);
      
      if (paymentPreviewUrl) {
        URL.revokeObjectURL(paymentPreviewUrl);
      }
      setPaymentPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Remove payment screenshot
  const removePaymentScreenshot = () => {
    if (paymentPreviewUrl) {
      URL.revokeObjectURL(paymentPreviewUrl);
    }
    setPaymentScreenshotFile(null);
    setPaymentPreviewUrl(null);
  };

  // Process payment
  const handleProcessPayment = async (e) => {
    e.preventDefault();

    if (!selectedPsychic) {
      toast.error("Please select a psychic first");
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!paymentId.trim()) {
      toast.error("Please enter a payment ID/Reference");
      return;
    }

    if (!paymentScreenshotFile) {
      toast.error("Please upload payment screenshot");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount > earningsData?.summary?.pendingAmount) {
      toast.error(`Amount ($${amount}) exceeds available balance ($${earningsData?.summary?.pendingAmount?.toFixed(2)})`);
      return;
    }

    setIsProcessingPayment(true);
    setIsUploadingImage(true);

    try {
      toast.info("Uploading payment screenshot...");
      const screenshotUrl = await uploadToCloudinary(paymentScreenshotFile);
      
      toast.info("Processing payment...");

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/admin/payments/psychic/${selectedPsychic._id}/pay`,
        {
          method: 'POST',
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount,
            paymentMethod: paymentMethod,
            paymentId: paymentId,
            notes: paymentNotes,
            paymentScreenshot: screenshotUrl
          })
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`Payment of $${amount.toFixed(2)} processed successfully!`);
        
        setPaymentAmount("");
        setPaymentId("");
        setPaymentMethod("bank_transfer");
        setPaymentNotes("");
        removePaymentScreenshot();
        setIsPaymentModalOpen(false);
        
        fetchPsychicEarningsDetails(selectedPsychic._id);
        fetchPsychicPaymentHistory(selectedPsychic._id);
        fetchAllPsychics();
      } else {
        toast.error(result.message || "Failed to process payment");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment: " + (error.message || "Unknown error"));
    } finally {
      setIsProcessingPayment(false);
      setIsUploadingImage(false);
    }
  };

  // Filter psychics
  const filteredPsychics = psychics.filter(psychic => {
    const matchesSearch = psychic.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         psychic.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "positive") return psychic.currentBalance > 0 && matchesSearch;
    if (filterStatus === "zero") return psychic.currentBalance === 0 && matchesSearch;
    
    return matchesSearch;
  });

  // View payment details
  const viewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setViewPaymentModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div>
      <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
      <div className="dashboard-wrapper">
        <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />
        <div className="dashboard-side min-h-screen p-6" style={{ backgroundColor: colors.softIvory }}>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin/dashboard")}
                  className="rounded-full"
                  style={{ 
                    borderColor: colors.antiqueGold,
                    color: colors.deepPurple,
                    backgroundColor: "transparent"
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <h1 className="text-3xl font-bold" style={{ color: colors.deepPurple }}>
                  Psychic Earnings & Payments
                </h1>
              </div>
              <Button
                onClick={fetchAllPsychics}
                variant="outline"
                className="rounded-full"
                style={{ 
                  borderColor: colors.antiqueGold,
                  color: colors.deepPurple
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-xl" style={{ 
                background: `linear-gradient(135deg, ${colors.deepPurple} 0%, ${colors.darkPurple} 100%)`,
              }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: colors.softIvory + "CC" }}>Total Pending Payments</p>
                      <p className="text-3xl font-bold mt-2" style={{ color: colors.antiqueGold }}>
                        {formatCurrency(psychics.reduce((sum, p) => sum + (p.currentBalance || 0), 0))}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.antiqueGold + "20" }}>
                      <Wallet className="h-6 w-6" style={{ color: colors.antiqueGold }} />
                    </div>
                  </div>
                  <p className="text-sm mt-2" style={{ color: colors.softIvory + "80" }}>
                    Across {psychics.filter(p => p.currentBalance > 0).length} psychics
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl" style={{ 
                background: `linear-gradient(135deg, ${colors.deepPurple} 0%, ${colors.darkPurple} 100%)`,
              }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: colors.softIvory + "CC" }}>Total Paid</p>
                      <p className="text-3xl font-bold mt-2" style={{ color: colors.success }}>
                        {formatCurrency(psychics.reduce((sum, p) => sum + (p.totalPaid || 0), 0))}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.success + "20" }}>
                      <CheckCircle className="h-6 w-6" style={{ color: colors.success }} />
                    </div>
                  </div>
                  <p className="text-sm mt-2" style={{ color: colors.softIvory + "80" }}>
                    Lifetime payments to all psychics
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl" style={{ 
                background: `linear-gradient(135deg, ${colors.deepPurple} 0%, ${colors.darkPurple} 100%)`,
              }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: colors.softIvory + "CC" }}>Active Psychics</p>
                      <p className="text-3xl font-bold mt-2" style={{ color: colors.antiqueGold }}>
                        {psychics.length}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.antiqueGold + "20" }}>
                      <User className="h-6 w-6" style={{ color: colors.antiqueGold }} />
                    </div>
                  </div>
                  <p className="text-sm mt-2" style={{ color: colors.softIvory + "80" }}>
                    {psychics.filter(p => p.currentBalance > 0).length} with pending balance
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Psychics List */}
              <Card className="lg:col-span-1 border-0 shadow-xl" style={{ backgroundColor: "white" }}>
                <CardHeader className="border-b" style={{ borderColor: colors.lightGold, backgroundColor: colors.softIvory }}>
                  <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: colors.deepPurple }}>
                    <User className="h-5 w-5" style={{ color: colors.antiqueGold }} />
                    Psychics List
                  </CardTitle>
                  <CardDescription style={{ color: colors.deepPurple + "CC" }}>
                    Select a psychic to view details
                  </CardDescription>
                  
                  {/* Search and Filter */}
                  <div className="mt-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: colors.deepPurple + "80" }} />
                      <Input
                        placeholder="Search by name or email..."
                        className="pl-9 rounded-full"
                        style={{ borderColor: colors.lightGold }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger style={{ borderColor: colors.lightGold, borderRadius: "9999px" }}>
                        <Filter className="h-4 w-4 mr-2" style={{ color: colors.antiqueGold }} />
                        <SelectValue placeholder="Filter by balance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Psychics</SelectItem>
                        <SelectItem value="positive">With Balance</SelectItem>
                        <SelectItem value="zero">Zero Balance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 max-h-[500px] overflow-y-auto">
                  {loadingPsychics ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.antiqueGold }} />
                    </div>
                  ) : filteredPsychics.length === 0 ? (
                    <div className="text-center py-8" style={{ color: colors.deepPurple + "CC" }}>
                      No psychics found
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredPsychics.map((psychic) => (
                        <div
                          key={psychic._id}
                          className={`p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedPsychic?._id === psychic._id
                              ? 'border-2'
                              : 'border border-transparent'
                          }`}
                          style={{
                            backgroundColor: selectedPsychic?._id === psychic._id ? colors.antiqueGold + "15" : colors.softIvory,
                            borderColor: selectedPsychic?._id === psychic._id ? colors.antiqueGold : "transparent"
                          }}
                          onClick={() => setSelectedPsychic(psychic)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: colors.lightGold }}>
                              {psychic.image ? (
                                <img 
                                  src={psychic.image} 
                                  alt={psychic.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <User className="h-5 w-5" style={{ color: colors.deepPurple }} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate" style={{ color: colors.deepPurple }}>
                                {psychic.name || 'Unknown'}
                              </p>
                              <p className="text-xs truncate" style={{ color: colors.deepPurple + "CC" }}>
                                {psychic.email}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold" style={{ color: colors.antiqueGold }}>
                                {formatCurrency(psychic.currentBalance)}
                              </p>
                              <p className="text-xs" style={{ color: colors.deepPurple + "CC" }}>
                                Balance
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right Column - Psychic Details */}
              <Card className="lg:col-span-2 border-0 shadow-xl" style={{ backgroundColor: "white" }}>
                {selectedPsychic ? (
                  <>
                    <CardHeader className="border-b" style={{ borderColor: colors.lightGold, backgroundColor: colors.softIvory }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-full overflow-hidden border-4" style={{ borderColor: colors.antiqueGold }}>
                            {selectedPsychic.image ? (
                              <img 
                                src={selectedPsychic.image} 
                                alt={selectedPsychic.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: colors.lightGold }}>
                                <User className="h-8 w-8" style={{ color: colors.deepPurple }} />
                              </div>
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-2xl font-bold" style={{ color: colors.deepPurple }}>
                              {selectedPsychic.name}
                            </CardTitle>
                            <CardDescription style={{ color: colors.deepPurple + "CC" }}>
                              {selectedPsychic.email} • {selectedPsychic.category || 'Psychic'}
                            </CardDescription>
                          </div>
                        </div>
                        
                        {/* Payment Button */}
                        {earningsData?.summary?.pendingAmount > 0 && (
                          <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                            <DialogTrigger asChild>
                              <Button
                                className="rounded-full"
                                style={{ 
                                  backgroundColor: colors.success,
                                  color: "white"
                                }}
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Process Payment
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md" style={{ borderRadius: "24px" }}>
                              <DialogHeader>
                                <DialogTitle className="text-xl font-bold" style={{ color: colors.deepPurple }}>
                                  Process Payment to {selectedPsychic.name}
                                </DialogTitle>
                                <DialogDescription>
                                  Available Balance: {formatCurrency(earningsData?.summary?.pendingAmount)}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <form onSubmit={handleProcessPayment} className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="amount" className="font-semibold" style={{ color: colors.deepPurple }}>
                                    Payment Amount ($)
                                  </Label>
                                  <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={earningsData?.summary?.pendingAmount}
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    required
                                    className="rounded-xl"
                                    style={{ borderColor: colors.lightGold }}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="paymentId" className="font-semibold" style={{ color: colors.deepPurple }}>
                                    Payment ID / Reference
                                  </Label>
                                  <Input
                                    id="paymentId"
                                    value={paymentId}
                                    onChange={(e) => setPaymentId(e.target.value)}
                                    placeholder="e.g., TRX123456, Bank Transfer #"
                                    required
                                    className="rounded-xl"
                                    style={{ borderColor: colors.lightGold }}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="paymentMethod" className="font-semibold" style={{ color: colors.deepPurple }}>
                                    Payment Method
                                  </Label>
                                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger className="rounded-xl" style={{ borderColor: colors.lightGold }}>
                                      <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                      <SelectItem value="paypal">PayPal</SelectItem>
                                      <SelectItem value="stripe">Stripe</SelectItem>
                                      <SelectItem value="cash">Cash</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label className="font-semibold" style={{ color: colors.deepPurple }}>
                                    Payment Screenshot *
                                  </Label>
                                  
                                  {!paymentScreenshotFile ? (
                                    <div 
                                      className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
                                      style={{ borderColor: colors.lightGold }}
                                      onMouseEnter={() => setIsHovered(true)}
                                      onMouseLeave={() => setIsHovered(false)}
                                      onClick={() => document.getElementById('screenshot-upload').click()}
                                    >
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="screenshot-upload"
                                        onChange={handlePaymentScreenshotChange}
                                      />
                                      <Upload className={`h-8 w-8 mx-auto mb-2 transition-colors ${isHovered ? 'text-purple-600' : 'text-gray-400'}`} />
                                      <span className="text-sm font-medium block mb-1" style={{ color: colors.antiqueGold }}>
                                        Click to upload screenshot
                                      </span>
                                      <span className="text-xs" style={{ color: colors.deepPurple + "CC" }}>
                                        PNG, JPG, GIF up to 5MB
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      <div className="relative rounded-xl overflow-hidden border group">
                                        <img
                                          src={paymentPreviewUrl}
                                          alt="Payment preview"
                                          className="w-full h-40 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="bg-white rounded-full"
                                            onClick={() => window.open(paymentPreviewUrl, '_blank')}
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                        onClick={removePaymentScreenshot}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                      <p className="text-xs mt-1" style={{ color: colors.success }}>
                                        ✓ {paymentScreenshotFile.name} ({(paymentScreenshotFile.size / 1024).toFixed(1)} KB)
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="notes" className="font-semibold" style={{ color: colors.deepPurple }}>
                                    Notes (Optional)
                                  </Label>
                                  <Textarea
                                    id="notes"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="Any additional notes about this payment"
                                    rows={2}
                                    className="rounded-xl"
                                    style={{ borderColor: colors.lightGold }}
                                  />
                                </div>

                                <DialogFooter>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full"
                                    onClick={() => {
                                      setIsPaymentModalOpen(false);
                                      removePaymentScreenshot();
                                      setPaymentAmount("");
                                      setPaymentId("");
                                      setPaymentNotes("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="submit"
                                    disabled={isProcessingPayment || isUploadingImage}
                                    className="rounded-full"
                                    style={{ backgroundColor: colors.success, color: "white" }}
                                  >
                                    {isProcessingPayment || isUploadingImage ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {isUploadingImage ? "Uploading..." : "Processing..."}
                                      </>
                                    ) : (
                                      <>
                                        <DollarSign className="h-4 w-4 mr-2" />
                                        Process Payment
                                      </>
                                    )}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-6">
                      {loading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.antiqueGold }} />
                        </div>
                      ) : earningsData ? (
                        <Tabs defaultValue="summary" className="space-y-4">
                          <TabsList className="grid w-full grid-cols-3 rounded-xl" style={{ backgroundColor: colors.softIvory }}>
                            <TabsTrigger value="summary" className="rounded-lg data-[state=active]:shadow-md" style={{ color: colors.deepPurple, data: { state: { active: { backgroundColor: colors.antiqueGold, color: colors.deepPurple } } } }}>Summary</TabsTrigger>
                            <TabsTrigger value="breakdown" className="rounded-lg" style={{ color: colors.deepPurple }}>Breakdown</TabsTrigger>
                            <TabsTrigger value="history" className="rounded-lg" style={{ color: colors.deepPurple }}>Payment History</TabsTrigger>
                          </TabsList>

                          {/* Summary Tab */}
                          <TabsContent value="summary" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Card className="border-0 shadow-md" style={{ backgroundColor: colors.softIvory }}>
                                <CardContent className="p-4 text-center">
                                  <p className="text-sm" style={{ color: colors.deepPurple + "CC" }}>Total Earnings</p>
                                  <p className="text-2xl font-bold mt-1" style={{ color: colors.deepPurple }}>
                                    {formatCurrency(earningsData.summary.totalEarnings)}
                                  </p>
                                </CardContent>
                              </Card>
                              
                              <Card className="border-0 shadow-md" style={{ backgroundColor: colors.success + "10" }}>
                                <CardContent className="p-4 text-center">
                                  <p className="text-sm" style={{ color: colors.deepPurple + "CC" }}>Total Paid</p>
                                  <p className="text-2xl font-bold mt-1" style={{ color: colors.success }}>
                                    {formatCurrency(earningsData.summary.totalPaid)}
                                  </p>
                                </CardContent>
                              </Card>
                              
                              <Card className="border-0 shadow-md" style={{ backgroundColor: colors.antiqueGold + "10" }}>
                                <CardContent className="p-4 text-center">
                                  <p className="text-sm" style={{ color: colors.deepPurple + "CC" }}>Current Balance</p>
                                  <p className="text-2xl font-bold mt-1" style={{ color: colors.antiqueGold }}>
                                    {formatCurrency(earningsData.summary.pendingAmount)}
                                  </p>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Progress Bar */}
                            {earningsData.summary.totalEarnings > 0 && (
                              <Card className="border-0 shadow-md">
                                <CardContent className="p-4">
                                  <div className="flex justify-between text-sm mb-2">
                                    <span style={{ color: colors.deepPurple }}>Paid: {formatCurrency(earningsData.summary.totalPaid)}</span>
                                    <span style={{ color: colors.deepPurple }}>Remaining: {formatCurrency(earningsData.summary.pendingAmount)}</span>
                                  </div>
                                  <div className="h-4 w-full rounded-full overflow-hidden" style={{ backgroundColor: colors.lightGold }}>
                                    <div 
                                      className="h-full rounded-full"
                                      style={{ 
                                        width: `${(earningsData.summary.totalPaid / earningsData.summary.totalEarnings) * 100}%`,
                                        backgroundColor: colors.success
                                      }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-center mt-2" style={{ color: colors.deepPurple + "CC" }}>
                                    {((earningsData.summary.totalPaid / earningsData.summary.totalEarnings) * 100).toFixed(1)}% Paid
                                  </p>
                                </CardContent>
                              </Card>
                            )}

                            {/* Split Ratio Info */}
                            {earningsData.splitRatio && (
                              <Card className="border-0 shadow-md" style={{ backgroundColor: colors.softIvory }}>
                                <CardContent className="p-4">
                                  <p className="text-sm font-medium mb-2" style={{ color: colors.deepPurple }}>Revenue Split</p>
                                  <div className="flex justify-between text-sm">
                                    <span style={{ color: colors.deepPurple + "CC" }}>Psychic ({(earningsData.splitRatio.psychic * 100).toFixed(0)}%):</span>
                                    <span className="font-semibold" style={{ color: colors.deepPurple }}>
                                      {formatCurrency(earningsData.breakdown.totalPsychicEarnings)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm mt-1">
                                    <span style={{ color: colors.deepPurple + "CC" }}>Platform ({(earningsData.splitRatio.platform * 100).toFixed(0)}%):</span>
                                    <span className="font-semibold" style={{ color: colors.antiqueGold }}>
                                      {formatCurrency(earningsData.breakdown.platformCommission)}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Recent Activity */}
                            {earningsData.recentActivity && (
                              <Card className="border-0 shadow-md">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg" style={{ color: colors.deepPurple }}>Recent Activity (30 Days)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span style={{ color: colors.deepPurple + "CC" }}>Chat Sessions:</span>
                                      <span className="font-semibold" style={{ color: colors.deepPurple }}>{earningsData.recentActivity.chatSessions.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span style={{ color: colors.deepPurple + "CC" }}>Call Sessions:</span>
                                      <span className="font-semibold" style={{ color: colors.deepPurple }}>{earningsData.recentActivity.callSessions.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold pt-2 border-t" style={{ borderColor: colors.lightGold }}>
                                      <span style={{ color: colors.deepPurple }}>Recent Earnings:</span>
                                      <span style={{ color: colors.antiqueGold }}>
                                        {formatCurrency(earningsData.recentActivity.totalRecentEarnings)}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </TabsContent>

                          {/* Breakdown Tab */}
                          <TabsContent value="breakdown" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Card className="border-0 shadow-md">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg flex items-center gap-2" style={{ color: colors.deepPurple }}>
                                    <Sparkles className="h-4 w-4" style={{ color: colors.antiqueGold }} />
                                    Chat Earnings
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-3xl font-bold" style={{ color: colors.deepPurple }}>
                                    {formatCurrency(earningsData.breakdown.chatEarnings)}
                                  </p>
                                  <p className="text-sm mt-1" style={{ color: colors.deepPurple + "CC" }}>
                                    From {earningsData.recentActivity?.chatSessions?.length || 0} recent sessions
                                  </p>
                                </CardContent>
                              </Card>

                              <Card className="border-0 shadow-md">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg flex items-center gap-2" style={{ color: colors.deepPurple }}>
                                    <Phone className="h-4 w-4" style={{ color: colors.antiqueGold }} />
                                    Call Earnings
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-3xl font-bold" style={{ color: colors.deepPurple }}>
                                    {formatCurrency(earningsData.breakdown.callEarnings)}
                                  </p>
                                  <p className="text-sm mt-1" style={{ color: colors.deepPurple + "CC" }}>
                                    From {earningsData.recentActivity?.callSessions?.length || 0} recent calls
                                  </p>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Sessions List */}
                            {earningsData.sessions && earningsData.sessions.length > 0 && (
                              <Card className="border-0 shadow-md">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg" style={{ color: colors.deepPurple }}>Recent Sessions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {earningsData.sessions.slice(0, 5).map((session, idx) => (
                                      <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: colors.softIvory }}>
                                        <div className="flex justify-between items-center">
                                          <div>
                                            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: colors.antiqueGold + "20", color: colors.antiqueGold }}>
                                              {session.type === 'chat' ? '💬 Chat' : '📞 Call'}
                                            </span>
                                            <p className="text-sm mt-1" style={{ color: colors.deepPurple }}>
                                              Amount: {formatCurrency(session.amount)}
                                            </p>
                                            <p className="text-xs" style={{ color: colors.deepPurple + "CC" }}>
                                              {formatDate(session.date)} • {session.duration} min
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </TabsContent>

                          {/* Payment History Tab */}
                          <TabsContent value="history">
                            <Card className="border-0 shadow-md">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2" style={{ color: colors.deepPurple }}>
                                  <History className="h-4 w-4" style={{ color: colors.antiqueGold }} />
                                  Payment History
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {earningsData.paymentHistory?.length > 0 ? (
                                  <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {earningsData.paymentHistory.map((payment, idx) => (
                                      <div
                                        key={idx}
                                        className="p-4 rounded-lg cursor-pointer transition-colors"
                                        style={{ backgroundColor: colors.softIvory }}
                                        onClick={() => viewPaymentDetails(payment)}
                                      >
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="font-semibold" style={{ color: colors.success }}>
                                              +{formatCurrency(payment.amount)}
                                            </p>
                                            <p className="text-xs" style={{ color: colors.deepPurple + "CC" }}>
                                              ID: {payment.paymentId}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: colors.antiqueGold + "20", color: colors.antiqueGold }}>
                                                {payment.paymentMethod?.replace('_', ' ')}
                                              </span>
                                              <span className="text-xs" style={{ color: colors.deepPurple + "CC" }}>
                                                {formatDate(payment.paymentDate)}
                                              </span>
                                            </div>
                                            {payment.paymentScreenshot && (
                                              <div className="mt-2">
                                                <span className="text-xs flex items-center gap-1" style={{ color: colors.success }}>
                                                  <ImageIcon className="h-3 w-3" />
                                                  Screenshot attached
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                          <Button variant="ghost" size="sm" className="rounded-full">
                                            <Eye className="h-4 w-4" style={{ color: colors.antiqueGold }} />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-center py-4" style={{ color: colors.deepPurple + "CC" }}>
                                    No payment history yet
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          </TabsContent>
                        </Tabs>
                      ) : (
                        <div className="text-center py-12" style={{ color: colors.deepPurple + "CC" }}>
                          Select a psychic to view earnings details
                        </div>
                      )}
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <User className="h-12 w-12 mx-auto mb-4" style={{ color: colors.deepPurple + "60" }} />
                      <p style={{ color: colors.deepPurple + "CC" }}>Select a psychic from the list to view details</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* View Payment Details Modal */}
      <Dialog open={viewPaymentModal} onOpenChange={setViewPaymentModal}>
        <DialogContent className="sm:max-w-lg" style={{ borderRadius: "24px" }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: colors.deepPurple }}>
              Payment Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm" style={{ color: colors.deepPurple + "CC" }}>Amount</p>
                  <p className="text-2xl font-bold" style={{ color: colors.success }}>+{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: colors.deepPurple + "CC" }}>Payment Method</p>
                  <p className="font-medium capitalize" style={{ color: colors.deepPurple }}>{selectedPayment.paymentMethod?.replace('_', ' ')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm mb-2" style={{ color: colors.deepPurple + "CC" }}>Payment ID</p>
                <p className="font-mono text-sm p-2 rounded-lg" style={{ backgroundColor: colors.softIvory, color: colors.deepPurple }}>{selectedPayment.paymentId}</p>
              </div>

              <div>
                <p className="text-sm mb-2" style={{ color: colors.deepPurple + "CC" }}>Payment Date</p>
                <p style={{ color: colors.deepPurple }}>{formatDate(selectedPayment.paymentDate)}</p>
              </div>

              {selectedPayment.notes && (
                <div>
                  <p className="text-sm mb-2" style={{ color: colors.deepPurple + "CC" }}>Notes</p>
                  <p className="p-3 rounded-lg" style={{ backgroundColor: colors.softIvory, color: colors.deepPurple }}>{selectedPayment.notes}</p>
                </div>
              )}

              {selectedPayment.paymentScreenshot && (
                <div>
                  <p className="text-sm mb-2" style={{ color: colors.deepPurple + "CC" }}>Payment Screenshot</p>
                  <div className="relative group">
                    <img
                      src={selectedPayment.paymentScreenshot}
                      alt="Payment proof"
                      className="w-full rounded-xl border shadow-sm cursor-pointer transition-transform hover:scale-[1.02]"
                      onClick={() => window.open(selectedPayment.paymentScreenshot, '_blank')}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                      onClick={() => window.open(selectedPayment.paymentScreenshot, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm mb-2" style={{ color: colors.deepPurple + "CC" }}>Status</p>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  selectedPayment.status === 'processed' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedPayment.status || 'Processed'}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewPaymentModal(false)} className="rounded-full" style={{ borderColor: colors.antiqueGold, color: colors.deepPurple }} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}