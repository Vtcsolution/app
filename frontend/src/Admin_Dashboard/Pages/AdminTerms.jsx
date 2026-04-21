import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard_Navbar from '../Admin_Navbar';
import Doctor_Side_Bar from '../SideBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Eye,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Globe,
  Palette,
  ScrollText,
  Users,
  CreditCard,
  RotateCcw,
  AlertTriangle,
  Shield,
  Copyright
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
import { useAdminAuth } from '@/context/AdminAuthContext';

const AdminTerms = ({ side, setSide }) => {
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [termsContent, setTermsContent] = useState(null);
  const [versions, setVersions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('edit');
  const limit = 10;

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

  useEffect(() => {
    fetchActiveTerms();
    fetchVersions();
  }, [currentPage]);

  const fetchActiveTerms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/terms`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTermsContent(data.data);
      }
    } catch (error) {
      console.error('Error fetching terms content:', error);
      
      // If no active terms exists, create one
      try {
        const createResponse = await fetch(`${import.meta.env.VITE_BASE_URL}/api/terms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({})
        });
        
        const createData = await createResponse.json();
        
        if (createData.success) {
          setTermsContent(createData.data);
          toast.success("Default terms page created");
        }
      } catch (createError) {
        console.error('Error creating default terms:', createError);
        toast.error("Failed to create default terms page");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/terms/admin/all?page=${currentPage}&limit=${limit}`,
        { credentials: 'include' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setVersions(data.data);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const handleSave = async () => {
    if (!termsContent) return;

    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/terms/${termsContent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(termsContent)
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Terms page content updated successfully");
        setTermsContent(data.data);
        fetchVersions();
      } else {
        toast.error(data.message || "Failed to save changes");
      }
    } catch (error) {
      console.error('Error saving terms content:', error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/terms/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Version duplicated successfully");
        fetchVersions();
      }
    } catch (error) {
      console.error('Error duplicating version:', error);
      toast.error("Failed to duplicate version");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this version?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/terms/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Version deleted successfully");
        fetchVersions();
        
        if (versions.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      }
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error("Failed to delete version");
    }
  };

  const handlePreview = (id) => {
    window.open(`/terms/preview/${id}`, '_blank');
  };

  // Update functions for each section
  const updateHero = (field, value) => {
    setTermsContent(prev => ({
      ...prev,
      hero: { ...prev.hero, [field]: value }
    }));
  };

  const updateQuickNav = (index, field, value) => {
    setTermsContent(prev => ({
      ...prev,
      quickNav: prev.quickNav.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateUserResponsibilityItem = (index, value) => {
    setTermsContent(prev => ({
      ...prev,
      userResponsibilities: {
        ...prev.userResponsibilities,
        items: prev.userResponsibilities.items.map((item, i) => 
          i === index ? value : item
        )
      }
    }));
  };

  const updatePaymentSystem = (index, field, value) => {
    setTermsContent(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        systems: prev.paymentTerms.systems.map((system, i) => 
          i === index ? { ...system, [field]: value } : system
        )
      }
    }));
  };

  const updatePaymentNote = (index, value) => {
    setTermsContent(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        importantNotes: prev.paymentTerms.importantNotes.map((note, i) => 
          i === index ? value : note
        )
      }
    }));
  };

  const updateRefundException = (index, field, value) => {
    setTermsContent(prev => ({
      ...prev,
      refundPolicy: {
        ...prev.refundPolicy,
        exceptions: prev.refundPolicy.exceptions.map((exception, i) => 
          i === index ? { ...exception, [field]: value } : exception
        )
      }
    }));
  };

  const updateDisclaimerPoint = (index, field, value) => {
    setTermsContent(prev => ({
      ...prev,
      disclaimer: {
        ...prev.disclaimer,
        points: prev.disclaimer.points.map((point, i) => 
          i === index ? { ...point, [field]: value } : point
        )
      }
    }));
  };

  const updateProtectedItem = (index, value) => {
    setTermsContent(prev => ({
      ...prev,
      intellectualProperty: {
        ...prev.intellectualProperty,
        protected: prev.intellectualProperty.protected.map((item, i) => 
          i === index ? value : item
        )
      }
    }));
  };

  const updateRestrictedItem = (index, value) => {
    setTermsContent(prev => ({
      ...prev,
      intellectualProperty: {
        ...prev.intellectualProperty,
        restricted: prev.intellectualProperty.restricted.map((item, i) => 
          i === index ? value : item
        )
      }
    }));
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
        <div className="dashboard-side min-h-screen mb-10 p-4 md:p-2 lg:px-18">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between ">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Terms & Conditions Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Customize your terms and conditions page content
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePreview(termsContent?._id)}
                disabled={!termsContent}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !termsContent}
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
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
              <TabsTrigger value="edit">Edit Content</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Edit Content Tab */}
            <TabsContent value="edit">
              {termsContent && (
                <div className="space-y-6">
                  {/* Hero Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ScrollText className="h-5 w-5" style={{ color: colors.secondary }} />
                        Hero Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={termsContent.hero.title}
                          onChange={(e) => updateHero('title', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Subtitle</Label>
                        <Input
                          value={termsContent.hero.subtitle}
                          onChange={(e) => updateHero('subtitle', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Icon</Label>
                        <Select
                          value={termsContent.hero.icon}
                          onValueChange={(value) => updateHero('icon', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scroll-text">Scroll Text</SelectItem>
                            <SelectItem value="file-text">File Text</SelectItem>
                            <SelectItem value="book-open">Book Open</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Navigation */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" style={{ color: colors.secondary }} />
                        Quick Navigation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {termsContent.quickNav.map((item, index) => (
                          <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                            <div>
                              <Label>Label</Label>
                              <Input
                                value={item.label}
                                onChange={(e) => updateQuickNav(index, 'label', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>ID (for linking)</Label>
                              <Input
                                value={item.id}
                                onChange={(e) => updateQuickNav(index, 'id', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* User Responsibilities */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" style={{ color: colors.secondary }} />
                        User Responsibilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={termsContent.userResponsibilities.title}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            userResponsibilities: { ...prev.userResponsibilities, title: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Subtitle</Label>
                        <Input
                          value={termsContent.userResponsibilities.subtitle}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            userResponsibilities: { ...prev.userResponsibilities, subtitle: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={termsContent.userResponsibilities.description}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            userResponsibilities: { ...prev.userResponsibilities, description: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">Responsibility Items</Label>
                        {termsContent.userResponsibilities.items.map((item, index) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg">
                            <Label>Item {index + 1}</Label>
                            <Textarea
                              value={item}
                              onChange={(e) => updateUserResponsibilityItem(index, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label>Important Note</Label>
                        <Textarea
                          value={termsContent.userResponsibilities.importantNote}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            userResponsibilities: { ...prev.userResponsibilities, importantNote: e.target.value }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Terms */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" style={{ color: colors.secondary }} />
                        Payment Terms
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={termsContent.paymentTerms.title}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            paymentTerms: { ...prev.paymentTerms, title: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Subtitle</Label>
                        <Input
                          value={termsContent.paymentTerms.subtitle}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            paymentTerms: { ...prev.paymentTerms, subtitle: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={termsContent.paymentTerms.description}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            paymentTerms: { ...prev.paymentTerms, description: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">Payment Systems</Label>
                        {termsContent.paymentTerms.systems.map((system, index) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg space-y-3">
                            <div>
                              <Label>System Title</Label>
                              <Input
                                value={system.title}
                                onChange={(e) => updatePaymentSystem(index, 'title', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={system.description}
                                onChange={(e) => updatePaymentSystem(index, 'description', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label className="mb-2 block">Important Notes</Label>
                        {termsContent.paymentTerms.importantNotes.map((note, index) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg">
                            <Label>Note {index + 1}</Label>
                            <Input
                              value={note}
                              onChange={(e) => updatePaymentNote(index, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Refund Policy */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5" style={{ color: colors.secondary }} />
                        Refund Policy
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={termsContent.refundPolicy.title}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            refundPolicy: { ...prev.refundPolicy, title: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Subtitle</Label>
                        <Input
                          value={termsContent.refundPolicy.subtitle}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            refundPolicy: { ...prev.refundPolicy, subtitle: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={termsContent.refundPolicy.description}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            refundPolicy: { ...prev.refundPolicy, description: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Final Sale Note</Label>
                        <Textarea
                          value={termsContent.refundPolicy.finalSaleNote}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            refundPolicy: { ...prev.refundPolicy, finalSaleNote: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Technical Issue Title</Label>
                        <Input
                          value={termsContent.refundPolicy.technicalIssue.title}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            refundPolicy: {
                              ...prev.refundPolicy,
                              technicalIssue: { ...prev.refundPolicy.technicalIssue, title: e.target.value }
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Technical Issue Description</Label>
                        <Textarea
                          value={termsContent.refundPolicy.technicalIssue.description}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            refundPolicy: {
                              ...prev.refundPolicy,
                              technicalIssue: { ...prev.refundPolicy.technicalIssue, description: e.target.value }
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Response Time</Label>
                        <Input
                          value={termsContent.refundPolicy.technicalIssue.responseTime}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            refundPolicy: {
                              ...prev.refundPolicy,
                              technicalIssue: { ...prev.refundPolicy.technicalIssue, responseTime: e.target.value }
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">Exceptions</Label>
                        {termsContent.refundPolicy.exceptions.map((exception, index) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg space-y-3">
                            <div>
                              <Label>Type</Label>
                              <Select
                                value={exception.type}
                                onValueChange={(value) => updateRefundException(index, 'type', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="no-refund">No Refund</SelectItem>
                                  <SelectItem value="refund-eligible">Refund Eligible</SelectItem>
                                  <SelectItem value="pro-rated">Pro-rated</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Text</Label>
                              <Textarea
                                value={exception.text}
                                onChange={(e) => updateRefundException(index, 'text', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Disclaimer */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" style={{ color: colors.secondary }} />
                        Disclaimer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={termsContent.disclaimer.title}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            disclaimer: { ...prev.disclaimer, title: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Subtitle</Label>
                        <Input
                          value={termsContent.disclaimer.subtitle}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            disclaimer: { ...prev.disclaimer, subtitle: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Critical Warning Title</Label>
                        <Input
                          value={termsContent.disclaimer.criticalWarning.title}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            disclaimer: {
                              ...prev.disclaimer,
                              criticalWarning: { ...prev.disclaimer.criticalWarning, title: e.target.value }
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Critical Warning Text</Label>
                        <Textarea
                          value={termsContent.disclaimer.criticalWarning.text}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            disclaimer: {
                              ...prev.disclaimer,
                              criticalWarning: { ...prev.disclaimer.criticalWarning, text: e.target.value }
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">Disclaimer Points</Label>
                        {termsContent.disclaimer.points.map((point, index) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg space-y-3">
                            <div>
                              <Label>Point Title</Label>
                              <Input
                                value={point.title}
                                onChange={(e) => updateDisclaimerPoint(index, 'title', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={point.description}
                                onChange={(e) => updateDisclaimerPoint(index, 'description', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label>Liability Notice</Label>
                        <Textarea
                          value={termsContent.disclaimer.liabilityNotice}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            disclaimer: { ...prev.disclaimer, liabilityNotice: e.target.value }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Intellectual Property */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Copyright className="h-5 w-5" style={{ color: colors.secondary }} />
                        Intellectual Property
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={termsContent.intellectualProperty.title}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            intellectualProperty: { ...prev.intellectualProperty, title: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Subtitle</Label>
                        <Input
                          value={termsContent.intellectualProperty.subtitle}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            intellectualProperty: { ...prev.intellectualProperty, subtitle: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={termsContent.intellectualProperty.description}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            intellectualProperty: { ...prev.intellectualProperty, description: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">Protected Items</Label>
                        {termsContent.intellectualProperty.protected.map((item, index) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg">
                            <Label>Item {index + 1}</Label>
                            <Input
                              value={item}
                              onChange={(e) => updateProtectedItem(index, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label className="mb-2 block">Restricted Activities</Label>
                        {termsContent.intellectualProperty.restricted.map((item, index) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg">
                            <Label>Item {index + 1}</Label>
                            <Input
                              value={item}
                              onChange={(e) => updateRestrictedItem(index, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label>Warning</Label>
                        <Textarea
                          value={termsContent.intellectualProperty.warning}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            intellectualProperty: { ...prev.intellectualProperty, warning: e.target.value }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Acceptance Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" style={{ color: colors.secondary }} />
                        Acceptance Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={termsContent.acceptance.title}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            acceptance: { ...prev.acceptance, title: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={termsContent.acceptance.description}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            acceptance: { ...prev.acceptance, description: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Back to Top Text</Label>
                          <Input
                            value={termsContent.acceptance.backToTopText}
                            onChange={(e) => setTermsContent(prev => ({
                              ...prev,
                              acceptance: { ...prev.acceptance, backToTopText: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Return Home Text</Label>
                          <Input
                            value={termsContent.acceptance.returnHomeText}
                            onChange={(e) => setTermsContent(prev => ({
                              ...prev,
                              acceptance: { ...prev.acceptance, returnHomeText: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Footer */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Copyright className="h-5 w-5" style={{ color: colors.secondary }} />
                        Footer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Company Name</Label>
                        <Input
                          value={termsContent.footer.companyName}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            footer: { ...prev.footer, companyName: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Copyright Text</Label>
                        <Input
                          value={termsContent.footer.copyrightText}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            footer: { ...prev.footer, copyrightText: e.target.value }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Versions Tab */}
            <TabsContent value="versions">
              <Card>
                <CardHeader>
                  <CardTitle>Version History</CardTitle>
                  <CardDescription>
                    All saved versions of your terms and conditions page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Version</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead>Updated By</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {versions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No versions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          versions.map((version) => (
                            <TableRow key={version._id}>
                              <TableCell>v{version.version || '1.0'}</TableCell>
                              <TableCell>
                                {version.isActive ? (
                                  <Badge className="bg-green-500/10 text-green-700">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Draft</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {new Date(version.updatedAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {version.lastPublishedBy?.name || 'System'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePreview(version._id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDuplicate(version._id)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  {!version.isActive && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600"
                                      onClick={() => handleDelete(version._id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
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
                    <Palette className="h-5 w-5" style={{ color: colors.secondary }} />
                    Theme Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {termsContent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Deep Purple</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={termsContent.colors.deepPurple}
                            onChange={(e) => setTermsContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, deepPurple: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={termsContent.colors.deepPurple}
                            onChange={(e) => setTermsContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, deepPurple: e.target.value }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Antique Gold</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={termsContent.colors.antiqueGold}
                            onChange={(e) => setTermsContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, antiqueGold: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={termsContent.colors.antiqueGold}
                            onChange={(e) => setTermsContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, antiqueGold: e.target.value }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Soft Ivory</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={termsContent.colors.softIvory}
                            onChange={(e) => setTermsContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, softIvory: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={termsContent.colors.softIvory}
                            onChange={(e) => setTermsContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, softIvory: e.target.value }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Light Gold</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={termsContent.colors.lightGold}
                            onChange={(e) => setTermsContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, lightGold: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={termsContent.colors.lightGold}
                            onChange={(e) => setTermsContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, lightGold: e.target.value }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Dark Purple</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={termsContent.colors.darkPurple}
                            onChange={(e) => setTermsContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, darkPurple: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={termsContent.colors.darkPurple}
                            onChange={(e) => setTermsContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, darkPurple: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" style={{ color: colors.secondary }} />
                    SEO Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {termsContent && (
                    <div className="space-y-4">
                      <div>
                        <Label>Meta Title</Label>
                        <Input
                          value={termsContent.seo.metaTitle}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            seo: { ...prev.seo, metaTitle: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Meta Description</Label>
                        <Textarea
                          rows={3}
                          value={termsContent.seo.metaDescription}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            seo: { ...prev.seo, metaDescription: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Meta Keywords (comma separated)</Label>
                        <Input
                          value={termsContent.seo.metaKeywords}
                          onChange={(e) => setTermsContent(prev => ({
                            ...prev,
                            seo: { ...prev.seo, metaKeywords: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminTerms;