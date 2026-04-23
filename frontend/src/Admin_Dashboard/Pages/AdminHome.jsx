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
  ChevronLeft,
  ChevronRight,
  Loader2,
  Globe,
  Palette,
  Sparkles,
  Shield,
  Award,
  Zap,
  Heart,
  Plus,
  X
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

const AdminHome = ({ side, setSide }) => {
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [homeContent, setHomeContent] = useState(null);
  const [versions, setVersions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('edit');
  const limit = 10;

  useEffect(() => {
    fetchActiveHome();
    fetchVersions();
  }, [currentPage]);

  const fetchActiveHome = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/home`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setHomeContent(data.data);
      }
    } catch (error) {
      console.error('Error fetching home content:', error);
      try {
        const createResponse = await fetch(`${import.meta.env.VITE_BASE_URL}/api/home`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({})
        });
        
        const createData = await createResponse.json();
        if (createData.success) {
          setHomeContent(createData.data);
          toast.success("Default home page created");
        }
      } catch (createError) {
        console.error('Error creating default home:', createError);
        toast.error("Failed to create default home page");
      }
    } finally {
      setLoading(false);
    }
  };
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
  const fetchVersions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/home/admin/all?page=${currentPage}&limit=${limit}`,
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
    if (!homeContent) return;
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/home/${homeContent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(homeContent)
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Home page content updated successfully");
        setHomeContent(data.data);
        fetchVersions();
      } else {
        toast.error(data.message || "Failed to save changes");
      }
    } catch (error) {
      console.error('Error saving home content:', error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/home/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Version duplicated successfully");
        fetchVersions();
      } else {
        toast.error(data.message || "Failed to duplicate version");
      }
    } catch (error) {
      console.error('Error duplicating version:', error);
      toast.error("Failed to duplicate version");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this version?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/home/${id}`, {
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
      } else {
        toast.error(data.message || "Failed to delete version");
      }
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error("Failed to delete version");
    }
  };

  const handlePreview = (id) => {
    window.open(`/admin/home/preview/${id}`, '_blank');
  };

  // ============= UPDATE FUNCTIONS =============
  
  const updateHeroSection = (field, value) => {
    setHomeContent(prev => ({
      ...prev,
      hero: { ...prev.hero, [field]: value }
    }));
  };

  const updateHeroTitle = (line, value) => {
    setHomeContent(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        title: { ...prev.hero.title, [line]: value }
      }
    }));
  };

  const updateHeroButton = (type, field, value) => {
    setHomeContent(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        buttons: {
          ...prev.hero.buttons,
          [type]: { ...prev.hero.buttons[type], [field]: value }
        }
      }
    }));
  };

  const addTrustIndicator = () => {
    setHomeContent(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        trustIndicators: [...prev.hero.trustIndicators, { icon: "star", text: "New Indicator", value: "0" }]
      }
    }));
  };

  const updateTrustIndicator = (index, field, value) => {
    setHomeContent(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        trustIndicators: prev.hero.trustIndicators.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const removeTrustIndicator = (index) => {
    setHomeContent(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        trustIndicators: prev.hero.trustIndicators.filter((_, i) => i !== index)
      }
    }));
  };

  // Trust Section Items
  const updateTrustItem = (index, field, value) => {
    setHomeContent(prev => ({
      ...prev,
      trustSection: {
        ...prev.trustSection,
        items: prev.trustSection.items.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const addTrustItem = () => {
    setHomeContent(prev => ({
      ...prev,
      trustSection: {
        ...prev.trustSection,
        items: [...prev.trustSection.items, { icon: "shield", title: "New Item", description: "Description" }]
      }
    }));
  };

  const removeTrustItem = (index) => {
    setHomeContent(prev => ({
      ...prev,
      trustSection: {
        ...prev.trustSection,
        items: prev.trustSection.items.filter((_, i) => i !== index)
      }
    }));
  };

  // Featured Section
  const updateFeaturedSection = (field, value) => {
    setHomeContent(prev => ({
      ...prev,
      featuredSection: { ...prev.featuredSection, [field]: value }
    }));
  };

  // Features Section - FIXED
  const updateFeature = (index, field, value) => {
    setHomeContent(prev => ({
      ...prev,
      featuresSection: {
        ...prev.featuresSection,
        features: prev.featuresSection.features.map((feature, i) =>
          i === index ? { ...feature, [field]: value } : feature
        )
      }
    }));
  };

  const updateFeatureBullet = (featureIndex, bulletIndex, value) => {
    setHomeContent(prev => ({
      ...prev,
      featuresSection: {
        ...prev.featuresSection,
        features: prev.featuresSection.features.map((feature, fIdx) =>
          fIdx === featureIndex ? {
            ...feature,
            features: feature.features.map((bullet, bIdx) =>
              bIdx === bulletIndex ? value : bullet
            )
          } : feature
        )
      }
    }));
  };

  const addFeatureBullet = (featureIndex) => {
    setHomeContent(prev => ({
      ...prev,
      featuresSection: {
        ...prev.featuresSection,
        features: prev.featuresSection.features.map((feature, fIdx) =>
          fIdx === featureIndex ? {
            ...feature,
            features: [...feature.features, "New feature point"]
          } : feature
        )
      }
    }));
  };

  const removeFeatureBullet = (featureIndex, bulletIndex) => {
    setHomeContent(prev => ({
      ...prev,
      featuresSection: {
        ...prev.featuresSection,
        features: prev.featuresSection.features.map((feature, fIdx) =>
          fIdx === featureIndex ? {
            ...feature,
            features: feature.features.filter((_, bIdx) => bIdx !== bulletIndex)
          } : feature
        )
      }
    }));
  };

  const addFeature = () => {
    setHomeContent(prev => ({
      ...prev,
      featuresSection: {
        ...prev.featuresSection,
        features: [...prev.featuresSection.features, {
          icon: "✨",
          title: "New Feature",
          description: "Feature description goes here",
          features: ["Point 1", "Point 2", "Point 3"]
        }]
      }
    }));
  };

  const removeFeature = (index) => {
    setHomeContent(prev => ({
      ...prev,
      featuresSection: {
        ...prev.featuresSection,
        features: prev.featuresSection.features.filter((_, i) => i !== index)
      }
    }));
  };

  // CTA Section
  const updateCtaSection = (section, field, value) => {
    if (section === 'button') {
      setHomeContent(prev => ({
        ...prev,
        ctaSection: {
          ...prev.ctaSection,
          button: { ...prev.ctaSection.button, [field]: value }
        }
      }));
    } else {
      setHomeContent(prev => ({
        ...prev,
        ctaSection: { ...prev.ctaSection, [field]: value }
      }));
    }
  };

  // Colors
  const updateColor = (name, value) => {
    setHomeContent(prev => ({
      ...prev,
      colors: { ...prev.colors, [name]: value }
    }));
  };

  // SEO
  const updateSeo = (field, value) => {
    setHomeContent(prev => ({
      ...prev,
      seo: { ...prev.seo, [field]: value }
    }));
  };

  if (loading) {
    return (
      <div>
        <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
        <div className="dashboard-wrapper">
          <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />
          <div className="dashboard-side min-h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Home Page Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Customize your homepage content and appearance
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <Button
                onClick={handleSave}
                disabled={saving || !homeContent}
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

            {/* ============= EDIT CONTENT TAB ============= */}
            <TabsContent value="edit">
              {homeContent && (
                <div className="space-y-6">
                  
                  {/* ===== HERO SECTION ===== */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-600" />
                        Hero Section
                      </CardTitle>
                      <CardDescription>Configure the main banner and headline</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Badge Text</Label>
                        <Input
                          value={homeContent.hero?.badge || ''}
                          onChange={(e) => updateHeroSection('badge', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Title Line 1</Label>
                          <Input
                            value={homeContent.hero?.title?.line1 || ''}
                            onChange={(e) => updateHeroTitle('line1', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Title Line 2</Label>
                          <Input
                            value={homeContent.hero?.title?.line2 || ''}
                            onChange={(e) => updateHeroTitle('line2', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={3}
                          value={homeContent.hero?.description || ''}
                          onChange={(e) => updateHeroSection('description', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Primary Button Text</Label>
                          <Input
                            value={homeContent.hero?.buttons?.primary?.text || ''}
                            onChange={(e) => updateHeroButton('primary', 'text', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Secondary Button Text</Label>
                          <Input
                            value={homeContent.hero?.buttons?.secondary?.text || ''}
                            onChange={(e) => updateHeroButton('secondary', 'text', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Trust Indicators</Label>
                          <Button type="button" variant="outline" size="sm" onClick={addTrustIndicator}>
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {homeContent.hero?.trustIndicators?.map((indicator, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <Input
                                className="flex-1"
                                placeholder="Icon (star, users, globe)"
                                value={indicator.icon || ''}
                                onChange={(e) => updateTrustIndicator(index, 'icon', e.target.value)}
                              />
                              <Input
                                className="flex-2"
                                placeholder="Text"
                                value={indicator.text || ''}
                                onChange={(e) => updateTrustIndicator(index, 'text', e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTrustIndicator(index)}
                                className="text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ===== TRUST & SECURITY SECTION ===== */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-amber-600" />
                        Trust & Security Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {homeContent.trustSection?.items?.map((item, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                            <div>
                              <Label>Icon</Label>
                              <Input
                                value={item.icon || ''}
                                onChange={(e) => updateTrustItem(index, 'icon', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Title</Label>
                              <Input
                                value={item.title || ''}
                                onChange={(e) => updateTrustItem(index, 'title', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Input
                                value={item.description || ''}
                                onChange={(e) => updateTrustItem(index, 'description', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addTrustItem}>
                          <Plus className="h-4 w-4 mr-1" /> Add Trust Item
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ===== FEATURED PSYCHICS SECTION ===== */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-amber-600" />
                        Featured Psychics Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Section Badge</Label>
                        <Input
                          value={homeContent.featuredSection?.badge || ''}
                          onChange={(e) => updateFeaturedSection('badge', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Section Title</Label>
                        <Input
                          value={homeContent.featuredSection?.title || ''}
                          onChange={(e) => updateFeaturedSection('title', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Section Description</Label>
                        <Textarea
                          rows={2}
                          value={homeContent.featuredSection?.description || ''}
                          onChange={(e) => updateFeaturedSection('description', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Display Count</Label>
                          <Input
                            type="number"
                            value={homeContent.featuredSection?.displayCount || 6}
                            onChange={(e) => updateFeaturedSection('displayCount', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <Switch
                            checked={homeContent.featuredSection?.showViewAllButton !== false}
                            onCheckedChange={(checked) => updateFeaturedSection('showViewAllButton', checked)}
                          />
                          <Label>Show View All Button</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ===== FEATURES SECTION - COMPLETELY REWRITTEN ===== */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-amber-600" />
                        Features Section
                      </CardTitle>
                      <CardDescription>Configure the features displayed on the homepage</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Section Header Fields */}
                      <div className="space-y-4 mb-6 pb-4 border-b">
                        <div>
                          <Label>Section Badge</Label>
                          <Input
                            value={homeContent.featuresSection?.badge || ''}
                            onChange={(e) => setHomeContent(prev => ({
                              ...prev,
                              featuresSection: { ...prev.featuresSection, badge: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Section Title</Label>
                          <Input
                            value={homeContent.featuresSection?.title || ''}
                            onChange={(e) => setHomeContent(prev => ({
                              ...prev,
                              featuresSection: { ...prev.featuresSection, title: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Section Description</Label>
                          <Textarea
                            rows={2}
                            value={homeContent.featuresSection?.description || ''}
                            onChange={(e) => setHomeContent(prev => ({
                              ...prev,
                              featuresSection: { ...prev.featuresSection, description: e.target.value }
                            }))}
                          />
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="space-y-6">
                        {homeContent.featuresSection?.features?.map((feature, featureIndex) => (
                          <div key={featureIndex} className="p-4 border rounded-lg space-y-4 bg-gray-50">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold">Feature #{featureIndex + 1}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFeature(featureIndex)}
                                className="text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Icon (emoji or text)</Label>
                                <Input
                                  value={feature.icon || ''}
                                  onChange={(e) => updateFeature(featureIndex, 'icon', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Title</Label>
                                <Input
                                  value={feature.title || ''}
                                  onChange={(e) => updateFeature(featureIndex, 'title', e.target.value)}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                rows={2}
                                value={feature.description || ''}
                                onChange={(e) => updateFeature(featureIndex, 'description', e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label>Feature Bullets / Points</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addFeatureBullet(featureIndex)}
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Add Point
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {(feature.features || []).map((bullet, bulletIndex) => (
                                  <div key={bulletIndex} className="flex gap-2">
                                    <Input
                                      className="flex-1"
                                      value={bullet}
                                      onChange={(e) => updateFeatureBullet(featureIndex, bulletIndex, e.target.value)}
                                      placeholder={`Point ${bulletIndex + 1}`}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFeatureBullet(featureIndex, bulletIndex)}
                                      className="text-red-500"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <Button type="button" variant="outline" onClick={addFeature}>
                          <Plus className="h-4 w-4 mr-1" /> Add New Feature
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ===== CTA SECTION ===== */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-amber-600" />
                        Call to Action Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={homeContent.ctaSection?.title || ''}
                          onChange={(e) => updateCtaSection('title', 'title', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={2}
                          value={homeContent.ctaSection?.description || ''}
                          onChange={(e) => updateCtaSection('description', 'description', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Button Text</Label>
                        <Input
                          value={homeContent.ctaSection?.button?.text || ''}
                          onChange={(e) => updateCtaSection('button', 'text', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Footer Text</Label>
                        <Input
                          value={homeContent.ctaSection?.footer || ''}
                          onChange={(e) => updateCtaSection('footer', 'footer', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                </div>
              )}
            </TabsContent>

            {/* ============= VERSIONS TAB ============= */}
            <TabsContent value="versions">
              <Card>
                <CardHeader>
                  <CardTitle>Version History</CardTitle>
                  <CardDescription>All saved versions of your homepage</CardDescription>
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
                                  <Badge className="bg-green-500">Active</Badge>
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
                                  <Button variant="ghost" size="sm" onClick={() => handlePreview(version._id)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDuplicate(version._id)}>
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  {!version.isActive && (
                                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(version._id)}>
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

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-sm">Page {currentPage} of {totalPages}</span>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============= SETTINGS TAB ============= */}
            <TabsContent value="settings">
              {/* Theme Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-amber-600" />
                    Theme Settings
                  </CardTitle>
                  <CardDescription>Customize colors and appearance</CardDescription>
                </CardHeader>
                <CardContent>
                  {homeContent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Deep Purple</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={homeContent.colors?.deepPurple || '#2B1B3F'}
                            onChange={(e) => updateColor('deepPurple', e.target.value)}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={homeContent.colors?.deepPurple || '#2B1B3F'}
                            onChange={(e) => updateColor('deepPurple', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Antique Gold</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={homeContent.colors?.antiqueGold || '#C9A24D'}
                            onChange={(e) => updateColor('antiqueGold', e.target.value)}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={homeContent.colors?.antiqueGold || '#C9A24D'}
                            onChange={(e) => updateColor('antiqueGold', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Soft Ivory</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={homeContent.colors?.softIvory || '#F5F3EB'}
                            onChange={(e) => updateColor('softIvory', e.target.value)}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={homeContent.colors?.softIvory || '#F5F3EB'}
                            onChange={(e) => updateColor('softIvory', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Light Gold</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={homeContent.colors?.lightGold || '#E8D9B0'}
                            onChange={(e) => updateColor('lightGold', e.target.value)}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={homeContent.colors?.lightGold || '#E8D9B0'}
                            onChange={(e) => updateColor('lightGold', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Dark Purple</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={homeContent.colors?.darkPurple || '#1A1129'}
                            onChange={(e) => updateColor('darkPurple', e.target.value)}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={homeContent.colors?.darkPurple || '#1A1129'}
                            onChange={(e) => updateColor('darkPurple', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SEO Settings */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-amber-600" />
                    SEO Settings
                  </CardTitle>
                  <CardDescription>Configure search engine optimization settings</CardDescription>
                </CardHeader>
                <CardContent>
                  {homeContent && (
                    <div className="space-y-4">
                      <div>
                        <Label>Meta Title</Label>
                        <Input
                          value={homeContent.seo?.metaTitle || ''}
                          onChange={(e) => updateSeo('metaTitle', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Length: {(homeContent.seo?.metaTitle?.length || 0)} characters</p>
                      </div>
                      <div>
                        <Label>Meta Description</Label>
                        <Textarea
                          rows={3}
                          value={homeContent.seo?.metaDescription || ''}
                          onChange={(e) => updateSeo('metaDescription', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Length: {(homeContent.seo?.metaDescription?.length || 0)} characters</p>
                      </div>
                      <div>
                        <Label>Meta Keywords</Label>
                        <Input
                          value={homeContent.seo?.metaKeywords || ''}
                          onChange={(e) => updateSeo('metaKeywords', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Separate keywords with commas</p>
                      </div>
                      <div>
                        <Label>OG Image URL</Label>
                        <Input
                          value={homeContent.seo?.ogImage || ''}
                          onChange={(e) => updateSeo('ogImage', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save SEO Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
