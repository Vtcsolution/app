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
  Palette,
  Star,
  Sparkles,
  Users,
  Zap,
  Home as HomeIcon,
  Target,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Shield,
  CheckCircle,
  Facebook,
  Instagram,
  Linkedin,
  Twitter
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

const AdminContact = ({ side, setSide }) => {
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contactContent, setContactContent] = useState(null);
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
    fetchActiveContact();
    fetchVersions();
  }, [currentPage]);

  const fetchActiveContact = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/contact`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setContactContent(data.data);
      }
    } catch (error) {
      console.error('Error fetching contact content:', error);
      
      // If no active contact exists, create one
      try {
        const createResponse = await fetch(`${import.meta.env.VITE_BASE_URL}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({})
        });
        
        const createData = await createResponse.json();
        
        if (createData.success) {
          setContactContent(createData.data);
          toast.success("Default contact page created");
        }
      } catch (createError) {
        console.error('Error creating default contact:', createError);
        toast.error("Failed to create default contact page");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/contact/admin/all?page=${currentPage}&limit=${limit}`,
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
    if (!contactContent) return;

    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/contact/${contactContent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(contactContent)
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Contact page content updated successfully");
        setContactContent(data.data);
        fetchVersions();
      } else {
        toast.error(data.message || "Failed to save changes");
      }
    } catch (error) {
      console.error('Error saving contact content:', error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/contact/${id}/duplicate`, {
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
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/contact/${id}`, {
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
    window.open(`/contact/preview/${id}`, '_blank');
  };

  // Update functions for each section
  const updateHero = (field, value) => {
    setContactContent(prev => ({
      ...prev,
      hero: { ...prev.hero, [field]: value }
    }));
  };

  const updateHeroBadge = (index, field, value) => {
    setContactContent(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        badges: prev.hero.badges.map((badge, i) => 
          i === index ? { ...badge, [field]: value } : badge
        )
      }
    }));
  };

  const updateContactPoint = (index, field, value) => {
    setContactContent(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        points: prev.contactInfo.points.map((point, i) => 
          i === index ? { ...point, [field]: value } : point
        )
      }
    }));
  };

  const updateBenefit = (index, value) => {
    setContactContent(prev => ({
      ...prev,
      benefits: {
        ...prev.benefits,
        items: prev.benefits.items.map((item, i) => 
          i === index ? value : item
        )
      }
    }));
  };

  const updateTestimonial = (index, field, value) => {
    setContactContent(prev => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        items: prev.testimonials.items.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const updateFAQ = (index, field, value) => {
    setContactContent(prev => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: prev.faq.items.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const updateSupportHour = (type, index, field, value) => {
    setContactContent(prev => ({
      ...prev,
      supportHours: {
        ...prev.supportHours,
        [type]: {
          ...prev.supportHours[type],
          hours: prev.supportHours[type].hours.map((hour, i) => 
            i === index ? { ...hour, [field]: value } : hour
          )
        }
      }
    }));
  };

  const updateSocialMedia = (platform, value) => {
    setContactContent(prev => ({
      ...prev,
      socialMedia: { ...prev.socialMedia, [platform]: value }
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
                Contact Page Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Customize your contact page content and appearance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePreview(contactContent?._id)}
                disabled={!contactContent}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !contactContent}
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
              {contactContent && (
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
                        <Label>Title</Label>
                        <Input
                          value={contactContent.hero.title}
                          onChange={(e) => updateHero('title', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label>Subtitle</Label>
                        <Textarea
                          rows={2}
                          value={contactContent.hero.subtitle}
                          onChange={(e) => updateHero('subtitle', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label className="mb-2 block">Badges</Label>
                        {contactContent.hero.badges.map((badge, index) => (
                          <div key={index} className="grid grid-cols-2 gap-4 mb-4 p-4 border rounded-lg">
                            <div>
                              <Label>Icon</Label>
                              <Select
                                value={badge.icon}
                                onValueChange={(value) => updateHeroBadge(index, 'icon', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="shield">Shield</SelectItem>
                                  <SelectItem value="clock">Clock</SelectItem>
                                  <SelectItem value="star">Star</SelectItem>
                                  <SelectItem value="check-circle">Check Circle</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Text</Label>
                              <Input
                                value={badge.text}
                                onChange={(e) => updateHeroBadge(index, 'text', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Information Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" style={{ color: colors.secondary }} />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Section Title</Label>
                        <Input
                          value={contactContent.contactInfo.title}
                          onChange={(e) => setContactContent(prev => ({
                            ...prev,
                            contactInfo: { ...prev.contactInfo, title: e.target.value }
                          }))}
                        />
                      </div>

                      <div>
                        <Label className="mb-2 block">Contact Points</Label>
                        {contactContent.contactInfo.points.map((point, index) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Icon</Label>
                                <Select
                                  value={point.icon}
                                  onValueChange={(value) => updateContactPoint(index, 'icon', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="mail">Mail</SelectItem>
                                    <SelectItem value="message-square">Message Square</SelectItem>
                                    <SelectItem value="phone">Phone</SelectItem>
                                    <SelectItem value="map-pin">Map Pin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Title</Label>
                                <Input
                                  value={point.title}
                                  onChange={(e) => updateContactPoint(index, 'title', e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Details</Label>
                                <Input
                                  value={point.details}
                                  onChange={(e) => updateContactPoint(index, 'details', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Link</Label>
                                <Input
                                  value={point.link}
                                  onChange={(e) => updateContactPoint(index, 'link', e.target.value)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Input
                                value={point.description}
                                onChange={(e) => updateContactPoint(index, 'description', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Benefits Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" style={{ color: colors.secondary }} />
                        Benefits
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Section Title</Label>
                        <Input
                          value={contactContent.benefits.title}
                          onChange={(e) => setContactContent(prev => ({
                            ...prev,
                            benefits: { ...prev.benefits, title: e.target.value }
                          }))}
                        />
                      </div>

                      <div>
                        <Label className="mb-2 block">Benefit Items</Label>
                        {contactContent.benefits.items.map((item, index) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg">
                            <Label>Item {index + 1}</Label>
                            <Input
                              value={item}
                              onChange={(e) => updateBenefit(index, e.target.value)}
                            />
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
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Section Title</Label>
                        <Input
                          value={contactContent.testimonials.title}
                          onChange={(e) => setContactContent(prev => ({
                            ...prev,
                            testimonials: { ...prev.testimonials, title: e.target.value }
                          }))}
                        />
                      </div>

                      <div>
                        <Label className="mb-2 block">Testimonials</Label>
                        {contactContent.testimonials.items.map((testimonial, index) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Name</Label>
                                <Input
                                  value={testimonial.name}
                                  onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
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
                              <Label>Testimonial Text</Label>
                              <Textarea
                                rows={3}
                                value={testimonial.text}
                                onChange={(e) => updateTestimonial(index, 'text', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Date</Label>
                              <Input
                                value={testimonial.date}
                                onChange={(e) => updateTestimonial(index, 'date', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Form Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" style={{ color: colors.secondary }} />
                        Contact Form
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Form Title</Label>
                        <Input
                          value={contactContent.contactForm.title}
                          onChange={(e) => setContactContent(prev => ({
                            ...prev,
                            contactForm: { ...prev.contactForm, title: e.target.value }
                          }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Form Subtitle</Label>
                        <Textarea
                          rows={2}
                          value={contactContent.contactForm.subtitle}
                          onChange={(e) => setContactContent(prev => ({
                            ...prev,
                            contactForm: { ...prev.contactForm, subtitle: e.target.value }
                          }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Submit Button Text</Label>
                          <Input
                            value={contactContent.contactForm.submitButtonText}
                            onChange={(e) => setContactContent(prev => ({
                              ...prev,
                              contactForm: { ...prev.contactForm, submitButtonText: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Success Message</Label>
                          <Input
                            value={contactContent.contactForm.successMessage}
                            onChange={(e) => setContactContent(prev => ({
                              ...prev,
                              contactForm: { ...prev.contactForm, successMessage: e.target.value }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Footer Text</Label>
                        <Input
                          value={contactContent.contactForm.footerText}
                          onChange={(e) => setContactContent(prev => ({
                            ...prev,
                            contactForm: { ...prev.contactForm, footerText: e.target.value }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* FAQ Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" style={{ color: colors.secondary }} />
                        Frequently Asked Questions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Section Title</Label>
                        <Input
                          value={contactContent.faq.title}
                          onChange={(e) => setContactContent(prev => ({
                            ...prev,
                            faq: { ...prev.faq, title: e.target.value }
                          }))}
                        />
                      </div>

                      <div>
                        <Label className="mb-2 block">FAQ Items</Label>
                        {contactContent.faq.items.map((faq, index) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg space-y-3">
                            <div>
                              <Label>Question</Label>
                              <Input
                                value={faq.question}
                                onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Answer</Label>
                              <Textarea
                                rows={3}
                                value={faq.answer}
                                onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Support Hours Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" style={{ color: colors.secondary }} />
                        Support Hours
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Section Title</Label>
                        <Input
                          value={contactContent.supportHours.title}
                          onChange={(e) => setContactContent(prev => ({
                            ...prev,
                            supportHours: { ...prev.supportHours, title: e.target.value }
                          }))}
                        />
                      </div>

                      {/* Standard Support */}
                      <div>
                        <Label className="mb-2 block">Standard Support</Label>
                        <div className="mb-4">
                          <Label>Title</Label>
                          <Input
                            value={contactContent.supportHours.standard.title}
                            onChange={(e) => setContactContent(prev => ({
                              ...prev,
                              supportHours: {
                                ...prev.supportHours,
                                standard: { ...prev.supportHours.standard, title: e.target.value }
                              }
                            }))}
                          />
                        </div>
                        {contactContent.supportHours.standard.hours.map((hour, index) => (
                          <div key={index} className="grid grid-cols-2 gap-4 mb-4 p-4 border rounded-lg">
                            <div>
                              <Label>Day</Label>
                              <Input
                                value={hour.day}
                                onChange={(e) => updateSupportHour('standard', index, 'day', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Hours</Label>
                              <Input
                                value={hour.hours}
                                onChange={(e) => updateSupportHour('standard', index, 'hours', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* VIP Support */}
                      <div>
                        <Label className="mb-2 block">VIP Support</Label>
                        <div className="mb-4">
                          <Label>Title</Label>
                          <Input
                            value={contactContent.supportHours.vip.title}
                            onChange={(e) => setContactContent(prev => ({
                              ...prev,
                              supportHours: {
                                ...prev.supportHours,
                                vip: { ...prev.supportHours.vip, title: e.target.value }
                              }
                            }))}
                          />
                        </div>
                        {contactContent.supportHours.vip.hours.map((hour, index) => (
                          <div key={index} className="grid grid-cols-2 gap-4 mb-4 p-4 border rounded-lg">
                            <div>
                              <Label>Day</Label>
                              <Input
                                value={hour.day}
                                onChange={(e) => updateSupportHour('vip', index, 'day', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Hours</Label>
                              <Input
                                value={hour.hours}
                                onChange={(e) => updateSupportHour('vip', index, 'hours', e.target.value)}
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
                          value={contactContent.ctaSection.title}
                          onChange={(e) => setContactContent(prev => ({
                            ...prev,
                            ctaSection: { ...prev.ctaSection, title: e.target.value }
                          }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={2}
                          value={contactContent.ctaSection.description}
                          onChange={(e) => setContactContent(prev => ({
                            ...prev,
                            ctaSection: { ...prev.ctaSection, description: e.target.value }
                          }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Button Text</Label>
                          <Input
                            value={contactContent.ctaSection.buttonText}
                            onChange={(e) => setContactContent(prev => ({
                              ...prev,
                              ctaSection: { ...prev.ctaSection, buttonText: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Button Action</Label>
                          <Input
                            value={contactContent.ctaSection.buttonAction}
                            onChange={(e) => setContactContent(prev => ({
                              ...prev,
                              ctaSection: { ...prev.ctaSection, buttonAction: e.target.value }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Footer Text</Label>
                        <Input
                          value={contactContent.ctaSection.footerText}
                          onChange={(e) => setContactContent(prev => ({
                            ...prev,
                            ctaSection: { ...prev.ctaSection, footerText: e.target.value }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Media Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" style={{ color: colors.secondary }} />
                        Social Media Links
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="flex items-center gap-2">
                            <Facebook className="h-4 w-4" />
                            Facebook
                          </Label>
                          <Input
                            value={contactContent.socialMedia.facebook}
                            onChange={(e) => updateSocialMedia('facebook', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="flex items-center gap-2">
                            <Instagram className="h-4 w-4" />
                            Instagram
                          </Label>
                          <Input
                            value={contactContent.socialMedia.instagram}
                            onChange={(e) => updateSocialMedia('instagram', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="flex items-center gap-2">
                            <Twitter className="h-4 w-4" />
                            Twitter
                          </Label>
                          <Input
                            value={contactContent.socialMedia.twitter}
                            onChange={(e) => updateSocialMedia('twitter', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4" />
                            LinkedIn
                          </Label>
                          <Input
                            value={contactContent.socialMedia.linkedin}
                            onChange={(e) => updateSocialMedia('linkedin', e.target.value)}
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
                    All saved versions of your contact page
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
                  {contactContent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Deep Purple</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={contactContent.colors.deepPurple}
                            onChange={(e) => setContactContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, deepPurple: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={contactContent.colors.deepPurple}
                            onChange={(e) => setContactContent(prev => ({
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
                            value={contactContent.colors.antiqueGold}
                            onChange={(e) => setContactContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, antiqueGold: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={contactContent.colors.antiqueGold}
                            onChange={(e) => setContactContent(prev => ({
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
                            value={contactContent.colors.softIvory}
                            onChange={(e) => setContactContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, softIvory: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={contactContent.colors.softIvory}
                            onChange={(e) => setContactContent(prev => ({
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
                            value={contactContent.colors.lightGold}
                            onChange={(e) => setContactContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, lightGold: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={contactContent.colors.lightGold}
                            onChange={(e) => setContactContent(prev => ({
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
                            value={contactContent.colors.darkPurple}
                            onChange={(e) => setContactContent(prev => ({
                              ...prev,
                              colors: { ...prev.colors, darkPurple: e.target.value }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={contactContent.colors.darkPurple}
                            onChange={(e) => setContactContent(prev => ({
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
                  {contactContent && (
                    <div className="space-y-4">
                      <div>
                        <Label>Meta Title</Label>
                        <Input
                          value={contactContent.seo.metaTitle}
                          onChange={(e) => setContactContent(prev => ({
                            ...prev,
                            seo: { ...prev.seo, metaTitle: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Meta Description</Label>
                        <Textarea
                          rows={3}
                          value={contactContent.seo.metaDescription}
                          onChange={(e) => setContactContent(prev => ({
                            ...prev,
                            seo: { ...prev.seo, metaDescription: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Meta Keywords (comma separated)</Label>
                        <Input
                          value={contactContent.seo.metaKeywords}
                          onChange={(e) => setContactContent(prev => ({
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

export default AdminContact;