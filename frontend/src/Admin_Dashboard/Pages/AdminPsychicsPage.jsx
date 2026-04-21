// AdminPsychicsPage.jsx
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
  Eye,
  Save,
  Copy,
  Trash2,
  Loader2,
  Globe,
  Palette,
  Star,
  Sparkles,
  Users,
  Heart,
  Shield,
  Award,
  Zap,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp
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

const AdminPsychicsPage = ({ side, setSide }) => {
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageContent, setPageContent] = useState(null);
  const [versions, setVersions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('edit');
  const limit = 10;

  const colors = {
    primary: "#2B1B3F",
    secondary: "#C9A24D",
  };

  useEffect(() => {
    fetchActiveContent();
    fetchVersions();
  }, [currentPage]);

  const fetchActiveContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/psychics-page`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPageContent(data.data);
      }
    } catch (error) {
      console.error('Error fetching psychics page content:', error);
      
      // If no active content exists, create one
      try {
        const createResponse = await fetch(`${import.meta.env.VITE_BASE_URL}/api/psychics-page`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({})
        });
        
        const createData = await createResponse.json();
        
        if (createData.success) {
          setPageContent(createData.data);
          toast.success("Default psychics page created");
        }
      } catch (createError) {
        console.error('Error creating default psychics page:', createError);
        toast.error("Failed to create default psychics page");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/psychics-page/admin/all?page=${currentPage}&limit=${limit}`,
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
    if (!pageContent) return;

    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/psychics-page/${pageContent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(pageContent)
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Psychics page content updated successfully");
        setPageContent(data.data);
        fetchVersions();
      } else {
        toast.error(data.message || "Failed to save changes");
      }
    } catch (error) {
      console.error('Error saving psychics page content:', error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/psychics-page/${id}/duplicate`, {
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
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/psychics-page/${id}`, {
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
    window.open(`/psychics-page/preview/${id}`, '_blank');
  };

  // Update helper functions
  const updateHero = (field, value) => {
    setPageContent(prev => ({
      ...prev,
      hero: { ...prev.hero, [field]: value }
    }));
  };

  const updateFeature = (index, field, value) => {
    setPageContent(prev => ({
      ...prev,
      featuresSection: {
        ...prev.featuresSection,
        features: prev.featuresSection.features.map((feature, i) => 
          i === index ? { ...feature, [field]: value } : feature
        )
      }
    }));
  };

  const updateStat = (index, field, value) => {
    setPageContent(prev => ({
      ...prev,
      stats: prev.stats.map((stat, i) => 
        i === index ? { ...stat, [field]: value } : stat
      )
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
                Psychics Page Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Customize your psychics page content and appearance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePreview(pageContent?._id)}
                disabled={!pageContent}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !pageContent}
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
              {pageContent && (
                <div className="space-y-6">
                  {/* Hero Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" style={{ color: colors.secondary }} />
                        Hero Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Badge Text</Label>
                        <Input
                          value={pageContent.hero.badge}
                          onChange={(e) => updateHero('badge', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={pageContent.hero.title}
                          onChange={(e) => updateHero('title', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Highlighted Text</Label>
                        <Input
                          value={pageContent.hero.highlightedText}
                          onChange={(e) => updateHero('highlightedText', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={3}
                          value={pageContent.hero.description}
                          onChange={(e) => updateHero('description', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stats Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" style={{ color: colors.secondary }} />
                        Statistics Display
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {pageContent.stats.map((stat, index) => (
                          <div key={index} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                            <div>
                              <Label>Label</Label>
                              <Input
                                value={stat.label}
                                onChange={(e) => updateStat(index, 'label', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Suffix</Label>
                              <Input
                                value={stat.suffix}
                                onChange={(e) => updateStat(index, 'suffix', e.target.value)}
                                placeholder="e.g., +, %, etc."
                              />
                            </div>
                            <div>
                              <Label>Icon</Label>
                              <Select
                                value={stat.icon}
                                onValueChange={(value) => updateStat(index, 'icon', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="users">Users</SelectItem>
                                  <SelectItem value="zap">Zap</SelectItem>
                                  <SelectItem value="star">Star</SelectItem>
                                  <SelectItem value="award">Award</SelectItem>
                                  <SelectItem value="clock">Clock</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Search Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" style={{ color: colors.secondary }} />
                        Search & Filters
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Search Placeholder</Label>
                        <Input
                          value={pageContent.searchSection.placeholder}
                          onChange={(e) => setPageContent(prev => ({
                            ...prev,
                            searchSection: { ...prev.searchSection, placeholder: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Available Now Button Text</Label>
                        <Input
                          value={pageContent.searchSection.availableNowText}
                          onChange={(e) => setPageContent(prev => ({
                            ...prev,
                            searchSection: { ...prev.searchSection, availableNowText: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Clear Button Text</Label>
                        <Input
                          value={pageContent.searchSection.clearText}
                          onChange={(e) => setPageContent(prev => ({
                            ...prev,
                            searchSection: { ...prev.searchSection, clearText: e.target.value }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* No Results Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" style={{ color: colors.secondary }} />
                        No Results Message
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={pageContent.noResultsSection.title}
                          onChange={(e) => setPageContent(prev => ({
                            ...prev,
                            noResultsSection: { ...prev.noResultsSection, title: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={2}
                          value={pageContent.noResultsSection.description}
                          onChange={(e) => setPageContent(prev => ({
                            ...prev,
                            noResultsSection: { ...prev.noResultsSection, description: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Button Text</Label>
                        <Input
                          value={pageContent.noResultsSection.buttonText}
                          onChange={(e) => setPageContent(prev => ({
                            ...prev,
                            noResultsSection: { ...prev.noResultsSection, buttonText: e.target.value }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Features Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" style={{ color: colors.secondary }} />
                        Features Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Section Title</Label>
                        <Input
                          value={pageContent.featuresSection.title}
                          onChange={(e) => setPageContent(prev => ({
                            ...prev,
                            featuresSection: { ...prev.featuresSection, title: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Section Description</Label>
                        <Textarea
                          rows={2}
                          value={pageContent.featuresSection.description}
                          onChange={(e) => setPageContent(prev => ({
                            ...prev,
                            featuresSection: { ...prev.featuresSection, description: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">Features</Label>
                        {pageContent.featuresSection.features.map((feature, index) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg space-y-3">
                            <div>
                              <Label>Icon</Label>
                              <Select
                                value={feature.icon}
                                onValueChange={(value) => updateFeature(index, 'icon', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="shield">Shield</SelectItem>
                                  <SelectItem value="heart">Heart</SelectItem>
                                  <SelectItem value="award">Award</SelectItem>
                                  <SelectItem value="users">Users</SelectItem>
                                  <SelectItem value="zap">Zap</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Title</Label>
                              <Input
                                value={feature.title}
                                onChange={(e) => updateFeature(index, 'title', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                rows={2}
                                value={feature.description}
                                onChange={(e) => updateFeature(index, 'description', e.target.value)}
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
                        <Sparkles className="h-5 w-5" style={{ color: colors.secondary }} />
                        Call to Action
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={pageContent.ctaSection.title}
                          onChange={(e) => setPageContent(prev => ({
                            ...prev,
                            ctaSection: { ...prev.ctaSection, title: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={2}
                          value={pageContent.ctaSection.description}
                          onChange={(e) => setPageContent(prev => ({
                            ...prev,
                            ctaSection: { ...prev.ctaSection, description: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Primary Button Text</Label>
                          <Input
                            value={pageContent.ctaSection.buttons.primary.text}
                            onChange={(e) => setPageContent(prev => ({
                              ...prev,
                              ctaSection: {
                                ...prev.ctaSection,
                                buttons: {
                                  ...prev.ctaSection.buttons,
                                  primary: { ...prev.ctaSection.buttons.primary, text: e.target.value }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Primary Button Action</Label>
                          <Input
                            value={pageContent.ctaSection.buttons.primary.action}
                            onChange={(e) => setPageContent(prev => ({
                              ...prev,
                              ctaSection: {
                                ...prev.ctaSection,
                                buttons: {
                                  ...prev.ctaSection.buttons,
                                  primary: { ...prev.ctaSection.buttons.primary, action: e.target.value }
                                }
                              }
                            }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Secondary Button Text</Label>
                          <Input
                            value={pageContent.ctaSection.buttons.secondary.text}
                            onChange={(e) => setPageContent(prev => ({
                              ...prev,
                              ctaSection: {
                                ...prev.ctaSection,
                                buttons: {
                                  ...prev.ctaSection.buttons,
                                  secondary: { ...prev.ctaSection.buttons.secondary, text: e.target.value }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Secondary Button Action</Label>
                          <Input
                            value={pageContent.ctaSection.buttons.secondary.action}
                            onChange={(e) => setPageContent(prev => ({
                              ...prev,
                              ctaSection: {
                                ...prev.ctaSection,
                                buttons: {
                                  ...prev.ctaSection.buttons,
                                  secondary: { ...prev.ctaSection.buttons.secondary, action: e.target.value }
                                }
                              }
                            }))}
                          />
                        </div>
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
                    All saved versions of your psychics page
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
                  {pageContent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Deep Purple</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={pageContent.colors.deepPurple}
                            onChange={(e) => setPageContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, deepPurple: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={pageContent.colors.deepPurple}
                            onChange={(e) => setPageContent(prev => ({
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
                            value={pageContent.colors.antiqueGold}
                            onChange={(e) => setPageContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, antiqueGold: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={pageContent.colors.antiqueGold}
                            onChange={(e) => setPageContent(prev => ({
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
                            value={pageContent.colors.softIvory}
                            onChange={(e) => setPageContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, softIvory: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={pageContent.colors.softIvory}
                            onChange={(e) => setPageContent(prev => ({
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
                            value={pageContent.colors.lightGold}
                            onChange={(e) => setPageContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, lightGold: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={pageContent.colors.lightGold}
                            onChange={(e) => setPageContent(prev => ({
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
                            value={pageContent.colors.darkPurple}
                            onChange={(e) => setPageContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, darkPurple: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={pageContent.colors.darkPurple}
                            onChange={(e) => setPageContent(prev => ({
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
                  {pageContent && (
                    <div className="space-y-4">
                      <div>
                        <Label>Meta Title</Label>
                        <Input
                          value={pageContent.seo.metaTitle}
                          onChange={(e) => setPageContent(prev => ({
                            ...prev,
                            seo: { ...prev.seo, metaTitle: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Meta Description</Label>
                        <Textarea
                          rows={3}
                          value={pageContent.seo.metaDescription}
                          onChange={(e) => setPageContent(prev => ({
                            ...prev,
                            seo: { ...prev.seo, metaDescription: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Meta Keywords (comma separated)</Label>
                        <Input
                          value={pageContent.seo.metaKeywords}
                          onChange={(e) => setPageContent(prev => ({
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

export default AdminPsychicsPage;