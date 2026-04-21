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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  Star,
  
  Sparkles,
  Users,
  
  Zap,
 
  Home as HomeIcon,
  Target,
  TrendingUp,
 
  AlertTriangle,
  ArrowRight
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
const AdminAbout = ({ side, setSide }) => {
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aboutContent, setAboutContent] = useState(null);
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
    fetchActiveAbout();
    fetchVersions();
  }, [currentPage]);

  const fetchActiveAbout = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/about`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAboutContent(data.data);
      }
    } catch (error) {
      console.error('Error fetching about content:', error);
      
      // If no active about exists, create one
      try {
        const createResponse = await fetch(`${import.meta.env.VITE_BASE_URL}/api/about`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({})
        });
        
        const createData = await createResponse.json();
        
        if (createData.success) {
          setAboutContent(createData.data);
          toast.success("Default about page created");
        }
      } catch (createError) {
        console.error('Error creating default about:', createError);
        toast.error("Failed to create default about page");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/about/admin/all?page=${currentPage}&limit=${limit}`,
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
    if (!aboutContent) return;

    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/about/${aboutContent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(aboutContent)
      });

      const data = await response.json();

      if (data.success) {
        toast.success("About page content updated successfully");
        setAboutContent(data.data);
        fetchVersions();
      } else {
        toast.error(data.message || "Failed to save changes");
      }
    } catch (error) {
      console.error('Error saving about content:', error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/about/${id}/duplicate`, {
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
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/about/${id}`, {
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
    window.open(`/about/preview/${id}`, '_blank');
  };

  // Update functions for each section
  const updateHero = (field, value) => {
    setAboutContent(prev => ({
      ...prev,
      hero: { ...prev.hero, [field]: value }
    }));
  };

  const updateHeroTitle = (line, value) => {
    setAboutContent(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        title: { ...prev.hero.title, [line]: value }
      }
    }));
  };

  const updateStat = (index, field, value) => {
    setAboutContent(prev => ({
      ...prev,
      stats: prev.stats.map((stat, i) => 
        i === index ? { ...stat, [field]: value } : stat
      )
    }));
  };

  const updateMissionItem = (index, field, value) => {
    setAboutContent(prev => ({
      ...prev,
      mission: {
        ...prev.mission,
        items: prev.mission.items.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const updateVisionContent = (index, value) => {
    setAboutContent(prev => ({
      ...prev,
      vision: {
        ...prev.vision,
        content: prev.vision.content.map((item, i) => 
          i === index ? value : item
        )
      }
    }));
  };

  const updatePsychic = (index, field, value) => {
    setAboutContent(prev => ({
      ...prev,
      psychicsSection: {
        ...prev.psychicsSection,
        psychics: prev.psychicsSection.psychics.map((psychic, i) => 
          i === index ? { ...psychic, [field]: value } : psychic
        )
      }
    }));
  };

  const updateTestimonial = (index, field, value) => {
    setAboutContent(prev => ({
      ...prev,
      testimonialsSection: {
        ...prev.testimonialsSection,
        testimonials: prev.testimonialsSection.testimonials.map((testimonial, i) => 
          i === index ? { ...testimonial, [field]: value } : testimonial
        )
      }
    }));
  };

  const updateFeature = (index, field, value) => {
    setAboutContent(prev => ({
      ...prev,
      featuresSection: {
        ...prev.featuresSection,
        features: prev.featuresSection.features.map((feature, i) => 
          i === index ? { ...feature, [field]: value } : feature
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
                About Page Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Customize your about page content and appearance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePreview(aboutContent?._id)}
                disabled={!aboutContent}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !aboutContent}
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
              {aboutContent && (
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
                          value={aboutContent.hero.badge}
                          onChange={(e) => updateHero('badge', e.target.value)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Title Line 1</Label>
                          <Input
                            value={aboutContent.hero.title.line1}
                            onChange={(e) => updateHeroTitle('line1', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Title Line 2</Label>
                          <Input
                            value={aboutContent.hero.title.line2}
                            onChange={(e) => updateHeroTitle('line2', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={3}
                          value={aboutContent.hero.description}
                          onChange={(e) => updateHero('description', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Button Text</Label>
                          <Input
                            value={aboutContent.hero.button.text}
                            onChange={(e) => setAboutContent(prev => ({
                              ...prev,
                              hero: {
                                ...prev.hero,
                                button: { ...prev.hero.button, text: e.target.value }
                              }
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Button Action</Label>
                          <Input
                            value={aboutContent.hero.button.action}
                            onChange={(e) => setAboutContent(prev => ({
                              ...prev,
                              hero: {
                                ...prev.hero,
                                button: { ...prev.hero.button, action: e.target.value }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stats Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" style={{ color: colors.secondary }} />
                        Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {aboutContent.stats.map((stat, index) => (
                          <div key={index} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                            <div>
                              <Label>Label</Label>
                              <Input
                                value={stat.label}
                                onChange={(e) => updateStat(index, 'label', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Value</Label>
                              <Input
                                value={stat.value}
                                onChange={(e) => updateStat(index, 'value', e.target.value)}
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
                                  <SelectItem value="award">Award</SelectItem>
                                  <SelectItem value="users">Users</SelectItem>
                                  <SelectItem value="trending-up">Trending Up</SelectItem>
                                  <SelectItem value="target">Target</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mission Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" style={{ color: colors.secondary }} />
                        Mission Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Badge</Label>
                        <Input
                          value={aboutContent.mission.badge}
                          onChange={(e) => setAboutContent(prev => ({
                            ...prev,
                            mission: { ...prev.mission, badge: e.target.value }
                          }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={aboutContent.mission.title}
                          onChange={(e) => setAboutContent(prev => ({
                            ...prev,
                            mission: { ...prev.mission, title: e.target.value }
                          }))}
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={3}
                          value={aboutContent.mission.description}
                          onChange={(e) => setAboutContent(prev => ({
                            ...prev,
                            mission: { ...prev.mission, description: e.target.value }
                          }))}
                        />
                      </div>

                      <div>
                        <Label className="mb-2 block">Mission Items</Label>
                        {aboutContent.mission.items.map((item, index) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Icon</Label>
                                <Select
                                  value={item.icon}
                                  onValueChange={(value) => updateMissionItem(index, 'icon', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="microchip">Microchip</SelectItem>
                                    <SelectItem value="clock">Clock</SelectItem>
                                    <SelectItem value="dna">DNA</SelectItem>
                                    <SelectItem value="globe">Globe</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Title</Label>
                                <Input
                                  value={item.title}
                                  onChange={(e) => updateMissionItem(index, 'title', e.target.value)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Input
                                value={item.description}
                                onChange={(e) => updateMissionItem(index, 'description', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Vision Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" style={{ color: colors.secondary }} />
                        Vision Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Badge</Label>
                        <Input
                          value={aboutContent.vision.badge}
                          onChange={(e) => setAboutContent(prev => ({
                            ...prev,
                            vision: { ...prev.vision, badge: e.target.value }
                          }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={aboutContent.vision.title}
                          onChange={(e) => setAboutContent(prev => ({
                            ...prev,
                            vision: { ...prev.vision, title: e.target.value }
                          }))}
                        />
                      </div>

                      <div>
                        <Label>Content (one paragraph per line)</Label>
                        <Textarea
                          rows={6}
                          value={aboutContent.vision.content.join('\n\n')}
                          onChange={(e) => {
                            const paragraphs = e.target.value.split('\n\n').filter(p => p.trim());
                            setAboutContent(prev => ({
                              ...prev,
                              vision: { ...prev.vision, content: paragraphs }
                            }));
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Founder Name</Label>
                          <Input
                            value={aboutContent.vision.founder.name}
                            onChange={(e) => setAboutContent(prev => ({
                              ...prev,
                              vision: {
                                ...prev.vision,
                                founder: { ...prev.vision.founder, name: e.target.value }
                              }
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Founder Title</Label>
                          <Input
                            value={aboutContent.vision.founder.title}
                            onChange={(e) => setAboutContent(prev => ({
                              ...prev,
                              vision: {
                                ...prev.vision,
                                founder: { ...prev.vision.founder, title: e.target.value }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Problem/Solution Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" style={{ color: colors.secondary }} />
                        Problem & Solution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Section Title</Label>
                        <Input
                          value={aboutContent.problemSolution.title}
                          onChange={(e) => setAboutContent(prev => ({
                            ...prev,
                            problemSolution: { ...prev.problemSolution, title: e.target.value }
                          }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Section Description</Label>
                        <Textarea
                          rows={2}
                          value={aboutContent.problemSolution.description}
                          onChange={(e) => setAboutContent(prev => ({
                            ...prev,
                            problemSolution: { ...prev.problemSolution, description: e.target.value }
                          }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Problems */}
                        <div className="p-4 border rounded-lg">
                          <Label className="mb-2 block">Problems</Label>
                          <div className="space-y-2">
                            {aboutContent.problemSolution.problems.items.map((item, index) => (
                              <Input
                                key={index}
                                value={item}
                                onChange={(e) => {
                                  const newItems = [...aboutContent.problemSolution.problems.items];
                                  newItems[index] = e.target.value;
                                  setAboutContent(prev => ({
                                    ...prev,
                                    problemSolution: {
                                      ...prev.problemSolution,
                                      problems: {
                                        ...prev.problemSolution.problems,
                                        items: newItems
                                      }
                                    }
                                  }));
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Solutions */}
                        <div className="p-4 border rounded-lg">
                          <Label className="mb-2 block">Solutions</Label>
                          <div className="space-y-2">
                            {aboutContent.problemSolution.solutions.items.map((item, index) => (
                              <Input
                                key={index}
                                value={item}
                                onChange={(e) => {
                                  const newItems = [...aboutContent.problemSolution.solutions.items];
                                  newItems[index] = e.target.value;
                                  setAboutContent(prev => ({
                                    ...prev,
                                    problemSolution: {
                                      ...prev.problemSolution,
                                      solutions: {
                                        ...prev.problemSolution.solutions,
                                        items: newItems
                                      }
                                    }
                                  }));
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Conclusion</Label>
                        <Textarea
                          rows={3}
                          value={aboutContent.problemSolution.conclusion}
                          onChange={(e) => setAboutContent(prev => ({
                            ...prev,
                            problemSolution: { ...prev.problemSolution, conclusion: e.target.value }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Psychics Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" style={{ color: colors.secondary }} />
                        Featured Psychics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Badge</Label>
                          <Input
                            value={aboutContent.psychicsSection.badge}
                            onChange={(e) => setAboutContent(prev => ({
                              ...prev,
                              psychicsSection: { ...prev.psychicsSection, badge: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={aboutContent.psychicsSection.title}
                            onChange={(e) => setAboutContent(prev => ({
                              ...prev,
                              psychicsSection: { ...prev.psychicsSection, title: e.target.value }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={2}
                          value={aboutContent.psychicsSection.description}
                          onChange={(e) => setAboutContent(prev => ({
                            ...prev,
                            psychicsSection: { ...prev.psychicsSection, description: e.target.value }
                          }))}
                        />
                      </div>

                      <div>
                        <Label className="mb-2 block">Psychics</Label>
                        {aboutContent.psychicsSection.psychics.map((psychic, index) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Name</Label>
                                <Input
                                  value={psychic.name}
                                  onChange={(e) => updatePsychic(index, 'name', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Specialty</Label>
                                <Input
                                  value={psychic.specialty}
                                  onChange={(e) => updatePsychic(index, 'specialty', e.target.value)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Bio</Label>
                              <Textarea
                                rows={2}
                                value={psychic.bio}
                                onChange={(e) => updatePsychic(index, 'bio', e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label>Experience</Label>
                                <Input
                                  value={psychic.experience}
                                  onChange={(e) => updatePsychic(index, 'experience', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Rating</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="5"
                                  value={psychic.rating}
                                  onChange={(e) => updatePsychic(index, 'rating', parseFloat(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label>Sessions</Label>
                                <Input
                                  value={psychic.sessions}
                                  onChange={(e) => updatePsychic(index, 'sessions', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Features Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" style={{ color: colors.secondary }} />
                        Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {aboutContent.featuresSection.features.map((feature, index) => (
                          <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
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
                                  <SelectItem value="clock">Clock</SelectItem>
                                  <SelectItem value="heart">Heart</SelectItem>
                                  <SelectItem value="globe">Globe</SelectItem>
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
                            <div className="col-span-2">
                              <Label>Description</Label>
                              <Input
                                value={feature.description}
                                onChange={(e) => updateFeature(index, 'description', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Testimonials Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" style={{ color: colors.secondary }} />
                        Testimonials
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {aboutContent.testimonialsSection.testimonials.map((testimonial, index) => (
                          <div key={index} className="p-4 border rounded-lg space-y-3">
                            <div>
                              <Label>Quote</Label>
                              <Textarea
                                rows={2}
                                value={testimonial.quote}
                                onChange={(e) => updateTestimonial(index, 'quote', e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Author</Label>
                                <Input
                                  value={testimonial.author}
                                  onChange={(e) => updateTestimonial(index, 'author', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Role</Label>
                                <Input
                                  value={testimonial.role}
                                  onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Rating</Label>
                              <Input
                                type="number"
                                min="1"
                                max="5"
                                value={testimonial.rating}
                                onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value))}
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
                        <ArrowRight className="h-5 w-5" style={{ color: colors.secondary }} />
                        Call to Action
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={aboutContent.ctaSection.title}
                          onChange={(e) => setAboutContent(prev => ({
                            ...prev,
                            ctaSection: { ...prev.ctaSection, title: e.target.value }
                          }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={2}
                          value={aboutContent.ctaSection.description}
                          onChange={(e) => setAboutContent(prev => ({
                            ...prev,
                            ctaSection: { ...prev.ctaSection, description: e.target.value }
                          }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Primary Button Text</Label>
                          <Input
                            value={aboutContent.ctaSection.buttons.primary.text}
                            onChange={(e) => setAboutContent(prev => ({
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
                            value={aboutContent.ctaSection.buttons.primary.action}
                            onChange={(e) => setAboutContent(prev => ({
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
                            value={aboutContent.ctaSection.buttons.secondary.text}
                            onChange={(e) => setAboutContent(prev => ({
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
                            value={aboutContent.ctaSection.buttons.secondary.action}
                            onChange={(e) => setAboutContent(prev => ({
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

                      <div>
                        <Label>Footer Text</Label>
                        <Input
                          value={aboutContent.ctaSection.footer}
                          onChange={(e) => setAboutContent(prev => ({
                            ...prev,
                            ctaSection: { ...prev.ctaSection, footer: e.target.value }
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
                    All saved versions of your about page
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
                  {aboutContent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Deep Purple</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={aboutContent.colors.deepPurple}
                            onChange={(e) => setAboutContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, deepPurple: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={aboutContent.colors.deepPurple}
                            onChange={(e) => setAboutContent(prev => ({
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
                            value={aboutContent.colors.antiqueGold}
                            onChange={(e) => setAboutContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, antiqueGold: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={aboutContent.colors.antiqueGold}
                            onChange={(e) => setAboutContent(prev => ({
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
                            value={aboutContent.colors.softIvory}
                            onChange={(e) => setAboutContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, softIvory: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={aboutContent.colors.softIvory}
                            onChange={(e) => setAboutContent(prev => ({
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
                            value={aboutContent.colors.lightGold}
                            onChange={(e) => setAboutContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, lightGold: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={aboutContent.colors.lightGold}
                            onChange={(e) => setAboutContent(prev => ({
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
                            value={aboutContent.colors.darkPurple}
                            onChange={(e) => setAboutContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, darkPurple: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={aboutContent.colors.darkPurple}
                            onChange={(e) => setAboutContent(prev => ({
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
                  {aboutContent && (
                    <div className="space-y-4">
                      <div>
                        <Label>Meta Title</Label>
                        <Input
                          value={aboutContent.seo.metaTitle}
                          onChange={(e) => setAboutContent(prev => ({
                            ...prev,
                            seo: { ...prev.seo, metaTitle: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Meta Description</Label>
                        <Textarea
                          rows={3}
                          value={aboutContent.seo.metaDescription}
                          onChange={(e) => setAboutContent(prev => ({
                            ...prev,
                            seo: { ...prev.seo, metaDescription: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Meta Keywords (comma separated)</Label>
                        <Input
                          value={aboutContent.seo.metaKeywords}
                          onChange={(e) => setAboutContent(prev => ({
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

export default AdminAbout;