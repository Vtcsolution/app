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
  AlertCircle,
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
  FileText,
  Star,
  Shield,
  Sparkles,
  Users,
  Clock,
  Heart,
  Award,
  Zap,
  CheckCircle,
  Lock,
  Phone,
  MessageCircle,
  User,
  Mail,
  Home as HomeIcon
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

  useEffect(() => {
    fetchActiveHome();
    fetchVersions();
  }, [currentPage]);

  const fetchActiveHome = async () => {
    try {
      setLoading(true);
      console.log('Fetching active home content...');
      
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/home`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setHomeContent(data.data);
        console.log('Active home content loaded:', data.data);
      }
    } catch (error) {
      console.error('Error fetching home content:', error);
      
      // If no active home exists, create one
      try {
        console.log('No active home found, creating default...');
        const createResponse = await fetch(`${import.meta.env.VITE_BASE_URL}/api/home`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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

  const fetchVersions = async () => {
    try {
      console.log('Fetching versions...');
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/home/admin/all?page=${currentPage}&limit=${limit}`,
        {
          credentials: 'include'
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setVersions(data.data);
        setTotalPages(data.pagination.pages);
        console.log('Versions loaded:', data.data.length);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const handleSave = async () => {
    if (!homeContent) return;

    setSaving(true);
    try {
      console.log('Saving home content with SEO:', homeContent.seo);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/home/${homeContent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(homeContent)
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Home page content updated successfully");
        setHomeContent(data.data);
        fetchVersions();
        console.log('Home content saved with SEO:', data.data.seo);
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
      console.log('Duplicating version:', id);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/home/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      console.log('Deleting version:', id);
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

  const updateHeroSection = (field, value) => {
    setHomeContent(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        [field]: value
      }
    }));
  };

  const updateHeroTitle = (line, value) => {
    setHomeContent(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        title: {
          ...prev.hero.title,
          [line]: value
        }
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
          [type]: {
            ...prev.hero.buttons[type],
            [field]: value
          }
        }
      }
    }));
  };

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

  // SEO update functions
  const updateSeoMetaTitle = (value) => {
    setHomeContent(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        metaTitle: value
      }
    }));
  };

  const updateSeoMetaDescription = (value) => {
    setHomeContent(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        metaDescription: value
      }
    }));
  };

  const updateSeoMetaKeywords = (value) => {
    setHomeContent(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        metaKeywords: value
      }
    }));
  };

  const updateSeoOgImage = (value) => {
    setHomeContent(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        ogImage: value
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

            {/* Edit Content Tab */}
            <TabsContent value="edit">
              {homeContent && (
                <div className="space-y-6">
                  {/* Hero Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" style={{ color: colors.secondary }} />
                        Hero Section
                      </CardTitle>
                      <CardDescription>
                        Configure the main banner and headline
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Badge Text</Label>
                          <Input
                            value={homeContent.hero.badge}
                            onChange={(e) => updateHeroSection('badge', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Title Line 1</Label>
                          <Input
                            value={homeContent.hero.title.line1}
                            onChange={(e) => updateHeroTitle('line1', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Title Line 2</Label>
                          <Input
                            value={homeContent.hero.title.line2}
                            onChange={(e) => updateHeroTitle('line2', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={3}
                          value={homeContent.hero.description}
                          onChange={(e) => updateHeroSection('description', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Primary Button Text</Label>
                          <Input
                            value={homeContent.hero.buttons.primary.text}
                            onChange={(e) => updateHeroButton('primary', 'text', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Secondary Button Text</Label>
                          <Input
                            value={homeContent.hero.buttons.secondary.text}
                            onChange={(e) => updateHeroButton('secondary', 'text', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2 block">Trust Indicators</Label>
                        <div className="space-y-3">
                          {homeContent.hero.trustIndicators.map((indicator, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                className="flex-1"
                                value={indicator.text}
                                onChange={(e) => {
                                  const newIndicators = [...homeContent.hero.trustIndicators];
                                  newIndicators[index].text = e.target.value;
                                  setHomeContent(prev => ({
                                    ...prev,
                                    hero: {
                                      ...prev.hero,
                                      trustIndicators: newIndicators
                                    }
                                  }));
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trust Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" style={{ color: colors.secondary }} />
                        Trust & Security Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {homeContent.trustSection.items.map((item, index) => (
                          <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                            <div>
                              <Label>Title</Label>
                              <Input
                                value={item.title}
                                onChange={(e) => updateTrustItem(index, 'title', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Input
                                value={item.description}
                                onChange={(e) => updateTrustItem(index, 'description', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Featured Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" style={{ color: colors.secondary }} />
                        Featured Psychics Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Section Badge</Label>
                        <Input
                          value={homeContent.featuredSection.badge}
                          onChange={(e) => setHomeContent(prev => ({
                            ...prev,
                            featuredSection: {
                              ...prev.featuredSection,
                              badge: e.target.value
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Section Title</Label>
                        <Input
                          value={homeContent.featuredSection.title}
                          onChange={(e) => setHomeContent(prev => ({
                            ...prev,
                            featuredSection: {
                              ...prev.featuredSection,
                              title: e.target.value
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Section Description</Label>
                        <Textarea
                          rows={2}
                          value={homeContent.featuredSection.description}
                          onChange={(e) => setHomeContent(prev => ({
                            ...prev,
                            featuredSection: {
                              ...prev.featuredSection,
                              description: e.target.value
                            }
                          }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Display Count</Label>
                          <Input
                            type="number"
                            value={homeContent.featuredSection.displayCount}
                            onChange={(e) => setHomeContent(prev => ({
                              ...prev,
                              featuredSection: {
                                ...prev.featuredSection,
                                displayCount: parseInt(e.target.value)
                              }
                            }))}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={homeContent.featuredSection.showViewAllButton}
                            onCheckedChange={(checked) => setHomeContent(prev => ({
                              ...prev,
                              featuredSection: {
                                ...prev.featuredSection,
                                showViewAllButton: checked
                              }
                            }))}
                          />
                          <Label>Show View All Button</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Features Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" style={{ color: colors.secondary }} />
                        Features Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {homeContent.featuresSection.features.map((feature, index) => (
                          <div key={index} className="p-4 border rounded-lg space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Icon</Label>
                                <Input
                                  value={feature.icon}
                                  onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Title</Label>
                                <Input
                                  value={feature.title}
                                  onChange={(e) => updateFeature(index, 'title', e.target.value)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                rows={2}
                                value={feature.description}
                                onChange={(e) => updateFeature(index, 'description', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Features (one per line)</Label>
                              <Textarea
                                rows={3}
                                value={feature.features.join('\n')}
                                onChange={(e) => {
                                  const bullets = e.target.value.split('\n').filter(b => b.trim());
                                  setHomeContent(prev => ({
                                    ...prev,
                                    featuresSection: {
                                      ...prev.featuresSection,
                                      features: prev.featuresSection.features.map((f, i) =>
                                        i === index ? { ...f, features: bullets } : f
                                      )
                                    }
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* CTA Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5" style={{ color: colors.secondary }} />
                        Call to Action Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={homeContent.ctaSection.title}
                          onChange={(e) => setHomeContent(prev => ({
                            ...prev,
                            ctaSection: {
                              ...prev.ctaSection,
                              title: e.target.value
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={2}
                          value={homeContent.ctaSection.description}
                          onChange={(e) => setHomeContent(prev => ({
                            ...prev,
                            ctaSection: {
                              ...prev.ctaSection,
                              description: e.target.value
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Button Text</Label>
                        <Input
                          value={homeContent.ctaSection.button.text}
                          onChange={(e) => setHomeContent(prev => ({
                            ...prev,
                            ctaSection: {
                              ...prev.ctaSection,
                              button: {
                                ...prev.ctaSection.button,
                                text: e.target.value
                              }
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Footer Text</Label>
                        <Input
                          value={homeContent.ctaSection.footer}
                          onChange={(e) => setHomeContent(prev => ({
                            ...prev,
                            ctaSection: {
                              ...prev.ctaSection,
                              footer: e.target.value
                            }
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
                    All saved versions of your homepage
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
              {/* Theme Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" style={{ color: colors.secondary }} />
                    Theme Settings
                  </CardTitle>
                  <CardDescription>
                    Customize colors and appearance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {homeContent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Deep Purple</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={homeContent.colors.deepPurple}
                            onChange={(e) => setHomeContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                deepPurple: e.target.value
                              }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={homeContent.colors.deepPurple}
                            onChange={(e) => setHomeContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                deepPurple: e.target.value
                              }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Antique Gold</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={homeContent.colors.antiqueGold}
                            onChange={(e) => setHomeContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                antiqueGold: e.target.value
                              }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={homeContent.colors.antiqueGold}
                            onChange={(e) => setHomeContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                antiqueGold: e.target.value
                              }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Soft Ivory</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={homeContent.colors.softIvory}
                            onChange={(e) => setHomeContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                softIvory: e.target.value
                              }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={homeContent.colors.softIvory}
                            onChange={(e) => setHomeContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                softIvory: e.target.value
                              }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Light Gold</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={homeContent.colors.lightGold}
                            onChange={(e) => setHomeContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                lightGold: e.target.value
                              }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={homeContent.colors.lightGold}
                            onChange={(e) => setHomeContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                lightGold: e.target.value
                              }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Dark Purple</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={homeContent.colors.darkPurple}
                            onChange={(e) => setHomeContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                darkPurple: e.target.value
                              }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={homeContent.colors.darkPurple}
                            onChange={(e) => setHomeContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                darkPurple: e.target.value
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SEO Settings - FIXED */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" style={{ color: colors.secondary }} />
                    SEO Settings
                  </CardTitle>
                  <CardDescription>
                    Configure search engine optimization settings for your homepage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {homeContent && homeContent.seo ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input
                          id="metaTitle"
                          placeholder="Enter meta title for SEO"
                          value={homeContent.seo.metaTitle || ''}
                          onChange={(e) => updateSeoMetaTitle(e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended length: 50-60 characters. This appears as the clickable headline in search results.
                        </p>
                        <p className="text-xs mt-1">
                          Length: {homeContent.seo.metaTitle?.length || 0} characters
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <Textarea
                          id="metaDescription"
                          placeholder="Enter meta description for SEO"
                          rows={3}
                          value={homeContent.seo.metaDescription || ''}
                          onChange={(e) => updateSeoMetaDescription(e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended length: 150-160 characters. This appears as the description in search results.
                        </p>
                        <p className="text-xs mt-1">
                          Length: {homeContent.seo.metaDescription?.length || 0} characters
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="metaKeywords">Meta Keywords</Label>
                        <Input
                          id="metaKeywords"
                          placeholder="Enter keywords separated by commas"
                          value={homeContent.seo.metaKeywords || ''}
                          onChange={(e) => updateSeoMetaKeywords(e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Separate keywords with commas. Example: psychic, tarot, astrology, spiritual guidance
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="ogImage">OG Image URL (Open Graph)</Label>
                        <Input
                          id="ogImage"
                          placeholder="Enter image URL for social media sharing"
                          value={homeContent.seo.ogImage || ''}
                          onChange={(e) => updateSeoOgImage(e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          This image will appear when your page is shared on social media platforms.
                        </p>
                      </div>

                      {/* SEO Preview */}
                      <div className="mt-6 p-4 rounded-lg border bg-muted/50">
                        <h4 className="text-sm font-semibold mb-3">Search Result Preview</h4>
                        <div className="space-y-1">
                          <p className="text-blue-600 text-lg font-medium hover:underline cursor-pointer">
                            {homeContent.seo.metaTitle || "HecateVoyance - Spiritual Guidance & Psychic Readings"}
                          </p>
                          <p className="text-green-700 text-sm">
                            {import.meta.env.VITE_BASE_URL?.replace('https://', '') || 'hecatevoyance.com'}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {homeContent.seo.metaDescription || "Connect with gifted psychics for personalized guidance, clarity, and spiritual growth. Experience authentic connections that illuminate your life's journey."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading SEO settings...
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    style={{ backgroundColor: colors.secondary, color: colors.primary }}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving SEO Settings...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save SEO Settings
                      </>
                    )}
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