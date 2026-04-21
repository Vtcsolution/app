import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard_Navbar from '../Admin_Navbar';
import Doctor_Side_Bar from '../SideBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Save,
  Eye,
  Copy,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Globe,
  Settings,
  Palette,
  CreditCard,
  DollarSign,
  Award,
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  Star,
  CheckCircle,
  Edit,
  X,
  AlertCircle
} from 'lucide-react';
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAdminAuth } from '@/context/AdminAuthContext';

const AdminPayments = ({ side, setSide }) => {
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('plans');
  const [editingPlan, setEditingPlan] = useState(null);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const limit = 10;

  // Color scheme
  const colors = {
    primary: "#2B1B3F",
    secondary: "#C9A24D",
    accent: "#9B7EDE",
    bgLight: "#3A2B4F",
    textLight: "#E8D9B0",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
  };

  // Default credit plans from your CREDIT_SYSTEM
  const defaultPlans = [
    { 
      id: 'starter', 
      name: 'Starter Plan', 
      amount: 10,
      credits: 10,
      totalCredits: 10,
      bonusCredits: 0,
      description: '10 Credits for $10',
      pricePerCredit: 1.00,
      popular: false,
      active: true
    },
    { 
      id: 'popular', 
      name: 'Popular Plan', 
      amount: 20,
      credits: 20,
      totalCredits: 22,
      bonusCredits: 2,
      description: '20 Credits + 2 Bonus = 22 Credits for $20',
      pricePerCredit: 0.91,
      popular: true,
      active: true
    },
    { 
      id: 'standard', 
      name: 'Standard Plan', 
      amount: 50,
      credits: 50,
      totalCredits: 60,
      bonusCredits: 10,
      description: '50 Credits + 10 Bonus = 60 Credits for $50',
      pricePerCredit: 0.83,
      popular: false,
      active: true
    },
    { 
      id: 'premium', 
      name: 'Premium Plan', 
      amount: 100,
      credits: 100,
      totalCredits: 125,
      bonusCredits: 25,
      description: '100 Credits + 25 Bonus = 125 Credits for $100',
      pricePerCredit: 0.80,
      popular: false,
      active: true
    }
  ];

  // Credit system settings
  const [creditSettings, setCreditSettings] = useState({
    creditRate: 1,
    minimumTopup: 5,
    currency: 'usd',
    bonusThresholds: [
      { amount: 25, bonus: 2 },
      { amount: 50, bonus: 10 },
      { amount: 100, bonus: 25 }
    ]
  });

  useEffect(() => {
    fetchPaymentData();
    fetchTransactions();
  }, [currentPage]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      // In a real app, you would fetch this from your backend
      // For now, we'll use the default data
      setPaymentConfig({
        plans: defaultPlans,
        settings: creditSettings
      });
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/payments/admin/transactions?page=${currentPage}&limit=${limit}`,
        {
          credentials: 'include'
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data.transactions || []);
        setTotalPages(data.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleSavePlans = async () => {
    setSaving(true);
    try {
      // Here you would save to your backend
      toast.success("Payment plans updated successfully");
    } catch (error) {
      console.error('Error saving plans:', error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Here you would save to your backend
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPlan = () => {
    const newPlan = {
      id: `plan_${Date.now()}`,
      name: 'New Plan',
      amount: 0,
      credits: 0,
      totalCredits: 0,
      bonusCredits: 0,
      description: '',
      pricePerCredit: 0,
      popular: false,
      active: true
    };
    setEditingPlan(newPlan);
    setShowPlanDialog(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan({ ...plan });
    setShowPlanDialog(true);
  };

  const handleDeletePlan = (plan) => {
    setPlanToDelete(plan);
    setShowDeleteDialog(true);
  };

  const confirmDeletePlan = () => {
    if (planToDelete) {
      // Here you would delete from backend
      setPaymentConfig(prev => ({
        ...prev,
        plans: prev.plans.filter(p => p.id !== planToDelete.id)
      }));
      toast.success(`Plan "${planToDelete.name}" deleted`);
      setShowDeleteDialog(false);
      setPlanToDelete(null);
    }
  };

  const handlePlanChange = (field, value) => {
    setEditingPlan(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate totalCredits and pricePerCredit
      if (field === 'credits' || field === 'bonusCredits') {
        updated.totalCredits = (updated.credits || 0) + (updated.bonusCredits || 0);
      }
      if (field === 'amount' || field === 'credits') {
        updated.pricePerCredit = updated.amount > 0 && updated.credits > 0 
          ? (updated.amount / updated.credits).toFixed(2) 
          : 0;
      }
      
      return updated;
    });
  };

  const savePlan = () => {
    if (!editingPlan.name || !editingPlan.amount || !editingPlan.credits) {
      toast.error("Please fill in all required fields");
      return;
    }

    setPaymentConfig(prev => {
      const existingIndex = prev.plans.findIndex(p => p.id === editingPlan.id);
      let updatedPlans;
      
      if (existingIndex >= 0) {
        // Update existing plan
        updatedPlans = [...prev.plans];
        updatedPlans[existingIndex] = editingPlan;
        toast.success(`Plan "${editingPlan.name}" updated`);
      } else {
        // Add new plan
        updatedPlans = [...prev.plans, editingPlan];
        toast.success(`Plan "${editingPlan.name}" added`);
      }
      
      return { ...prev, plans: updatedPlans };
    });

    setShowPlanDialog(false);
    setEditingPlan(null);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      paid: 'bg-green-500/10 text-green-700',
      pending: 'bg-yellow-500/10 text-yellow-700',
      failed: 'bg-red-500/10 text-red-700',
      canceled: 'bg-gray-500/10 text-gray-700',
      processing: 'bg-blue-500/10 text-blue-700'
    };
    
    return (
      <Badge className={statusColors[status] || 'bg-gray-500/10 text-gray-700'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div>
        <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
        <div className="dashboard-wrapper">
          <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />
          <div className="dashboard-side min-h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.secondary }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
      <div className="dashboard-wrapper">
        <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />
        <div className="dashboard-side min-h-screen mb-10 p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Payment Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage credit packages, pricing, and view transactions
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
              <TabsTrigger value="plans">Credit Plans</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Credit Plans Tab */}
            <TabsContent value="plans">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" style={{ color: colors.secondary }} />
                        Credit Packages
                      </CardTitle>
                      <CardDescription>
                        Manage your credit packages and pricing
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleAddPlan}
                      style={{ backgroundColor: colors.secondary, color: colors.primary }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Plan
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paymentConfig?.plans.map((plan) => (
                      <Card key={plan.id} className={`relative overflow-hidden border-2 ${plan.popular ? 'border-yellow-400' : 'border-gray-200'}`}>
                        {plan.popular && (
                          <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-3 py-1 text-xs font-bold rounded-bl-lg">
                            POPULAR
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Price:</span>
                              <span className="text-xl font-bold" style={{ color: colors.primary }}>
                                ${plan.amount}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Credits:</span>
                              <span className="font-semibold">{plan.credits}</span>
                            </div>
                            {plan.bonusCredits > 0 && (
                              <div className="flex justify-between items-center text-green-600">
                                <span className="text-sm">Bonus:</span>
                                <span className="font-semibold">+{plan.bonusCredits}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total:</span>
                              <span className="font-bold" style={{ color: colors.secondary }}>
                                {plan.totalCredits} credits
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Price/Credit:</span>
                              <span>${plan.pricePerCredit}</span>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                              <Switch
                                checked={plan.active}
                                onCheckedChange={(checked) => {
                                  setPaymentConfig(prev => ({
                                    ...prev,
                                    plans: prev.plans.map(p =>
                                      p.id === plan.id ? { ...p, active: checked } : p
                                    )
                                  }));
                                }}
                              />
                              <Label>Active</Label>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEditPlan(plan)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-600 hover:text-red-700"
                            onClick={() => handleDeletePlan(plan)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-6">
                  <Button
                    onClick={handleSavePlans}
                    disabled={saving}
                    style={{ backgroundColor: colors.secondary, color: colors.primary }}
                  >
                    {saving ? (
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
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" style={{ color: colors.secondary }} />
                    Transaction History
                  </CardTitle>
                  <CardDescription>
                    View all payment transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactions.map((transaction) => (
                            <TableRow key={transaction._id}>
                              <TableCell className="font-mono text-xs">
                                {transaction.tran_id?.slice(-8) || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{transaction.username || 'Unknown'}</p>
                                  <p className="text-xs text-gray-500">{transaction.userEmail}</p>
                                </div>
                              </TableCell>
                              <TableCell>{transaction.planName}</TableCell>
                              <TableCell>${transaction.amount}</TableCell>
                              <TableCell>{transaction.credits}</TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                              <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/admin/transactions/${transaction._id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" style={{ color: colors.secondary }} />
                    Payment Settings
                  </CardTitle>
                  <CardDescription>
                    Configure credit system and bonus thresholds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Credit Rate */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Credit Conversion</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Credit Rate (1 credit = $X)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={creditSettings.creditRate}
                          onChange={(e) => setCreditSettings(prev => ({
                            ...prev,
                            creditRate: parseFloat(e.target.value)
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Minimum Top-up Amount ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={creditSettings.minimumTopup}
                          onChange={(e) => setCreditSettings(prev => ({
                            ...prev,
                            minimumTopup: parseFloat(e.target.value)
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Currency</Label>
                        <Input
                          value={creditSettings.currency.toUpperCase()}
                          onChange={(e) => setCreditSettings(prev => ({
                            ...prev,
                            currency: e.target.value.toLowerCase()
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bonus Thresholds */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Bonus Thresholds</h3>
                    <p className="text-sm text-gray-500">
                      Configure bonus credits for different purchase amounts
                    </p>
                    
                    {creditSettings.bonusThresholds.map((threshold, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                        <div>
                          <Label>Minimum Amount ($)</Label>
                          <Input
                            type="number"
                            value={threshold.amount}
                            onChange={(e) => {
                              const newThresholds = [...creditSettings.bonusThresholds];
                              newThresholds[index].amount = parseFloat(e.target.value);
                              setCreditSettings(prev => ({
                                ...prev,
                                bonusThresholds: newThresholds
                              }));
                            }}
                          />
                        </div>
                        <div>
                          <Label>Bonus Credits</Label>
                          <Input
                            type="number"
                            value={threshold.bonus}
                            onChange={(e) => {
                              const newThresholds = [...creditSettings.bonusThresholds];
                              newThresholds[index].bonus = parseInt(e.target.value);
                              setCreditSettings(prev => ({
                                ...prev,
                                bonusThresholds: newThresholds
                              }));
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => {
                              setCreditSettings(prev => ({
                                ...prev,
                                bonusThresholds: prev.bonusThresholds.filter((_, i) => i !== index)
                              }));
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      onClick={() => {
                        setCreditSettings(prev => ({
                          ...prev,
                          bonusThresholds: [
                            ...prev.bonusThresholds,
                            { amount: 0, bonus: 0 }
                          ]
                        }));
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Bonus Threshold
                    </Button>
                  </div>

                  {/* Stripe Settings */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Stripe Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Publishable Key</Label>
                        <Input
                          type="password"
                          value="••••••••••••••••"
                          disabled
                          placeholder="Stored in environment variables"
                        />
                      </div>
                      <div>
                        <Label>Webhook Secret</Label>
                        <Input
                          type="password"
                          value="••••••••••••••••"
                          disabled
                          placeholder="Stored in environment variables"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-6">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    style={{ backgroundColor: colors.secondary, color: colors.primary }}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Add/Edit Plan Dialog */}
          <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan?.id.startsWith('plan_') ? 'Add New Plan' : 'Edit Plan'}
                </DialogTitle>
                <DialogDescription>
                  Configure the credit package details
                </DialogDescription>
              </DialogHeader>
              
              {editingPlan && (
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Plan Name *</Label>
                    <Input
                      value={editingPlan.name}
                      onChange={(e) => handlePlanChange('name', e.target.value)}
                      placeholder="e.g., Starter Plan"
                    />
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={editingPlan.description}
                      onChange={(e) => handlePlanChange('description', e.target.value)}
                      placeholder="e.g., 10 Credits for $10"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Amount ($) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingPlan.amount}
                        onChange={(e) => handlePlanChange('amount', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Base Credits *</Label>
                      <Input
                        type="number"
                        value={editingPlan.credits}
                        onChange={(e) => handlePlanChange('credits', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Bonus Credits</Label>
                      <Input
                        type="number"
                        value={editingPlan.bonusCredits}
                        onChange={(e) => handlePlanChange('bonusCredits', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Total Credits</Label>
                      <Input
                        type="number"
                        value={editingPlan.totalCredits}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Price per Credit</Label>
                    <Input
                      value={`$${editingPlan.pricePerCredit}`}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingPlan.popular}
                      onCheckedChange={(checked) => handlePlanChange('popular', checked)}
                    />
                    <Label>Mark as Popular</Label>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={savePlan} style={{ backgroundColor: colors.secondary, color: colors.primary }}>
                  Save Plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  Delete Plan
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{planToDelete?.name}"? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={confirmDeletePlan}
                  style={{ backgroundColor: colors.danger, color: 'white' }}
                >
                  Delete Plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;