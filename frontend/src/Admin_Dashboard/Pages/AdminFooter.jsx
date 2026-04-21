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
  Instagram,
  Facebook,
  Youtube,
  Mail,
  MessageSquare,
  Linkedin,
  Twitter,
  Home,
  Info,
  Users,
  BookOpen,
  FileText,
  CreditCard
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

// TikTok Icon Component
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.04-.1z" />
  </svg>
);

const AdminFooter = ({ side, setSide }) => {
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [footerContent, setFooterContent] = useState(null);
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
    fetchActiveFooter();
    fetchVersions();
  }, [currentPage]);

  const fetchActiveFooter = async () => {
    try {
      setLoading(true);
      console.log('Fetching active footer content...');
      
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/footer`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFooterContent(data.data);
        console.log('Active footer content loaded:', data.data);
      }
    } catch (error) {
      console.error('Error fetching footer content:', error);
      
      // If no active footer exists, create one with default structure matching your footer
      try {
        console.log('No active footer found, creating default...');
        const defaultFooter = {
          company: {
            name: "HecateVoyance",
            tagline: "SPIRITUAL GUIDANCE",
            description: "Your trusted source for spiritual guidance, psychic readings, and personal transformation since 2020."
          },
          socialMedia: {
            instagram: { url: "https://instagram.com/hecatevoyance", active: true },
            facebook: { url: "https://facebook.com/hecatevoyance", active: true },
            linkedin: { url: "https://linkedin.com/company/hecatevoyance", active: true },
            twitter: { url: "https://twitter.com/hecatevoyance", active: true },
            tiktok: { url: "https://tiktok.com/@hecatevoyance", active: true },
            youtube: { url: "https://youtube.com/@hecatevoyance", active: true }
          },
          exploreLinks: [
            { label: "Home", url: "/", active: true },
            { label: "About Us", url: "/about", active: true },
            { label: "Our Psychics", url: "/psychics", active: true },
            { label: "Blogs & Articles", url: "/blogs", active: true }
          ],
          legalLinks: [
            { label: "Terms & Conditions", url: "/terms-&-conditions", active: true }
          ],
          contact: {
            email: {
              address: "info@hecatevoyance.com",
              displayText: "info@hecatevoyance.com",
              active: true
            },
            support: {
              text: "Support",
              url: "/contact",
              active: true
            }
          },
          bottomBar: {
            copyrightText: "All rights reserved.",
            tagline: "Spiritual guidance for the modern seeker",
            showPaymentMethods: true
          },
          paymentMethods: {
            visa: true,
            mastercard: true,
            paypal: true
          },
          colors: {
            background: "#F9FAFB",
            text: "#111827",
            link: "#4B5563",
            linkHover: "#7C3AED",
            border: "#E5E7EB",
            iconColor: "#6B7280"
          },
          seo: {
            metaTitle: "HecateVoyance - Spiritual Guidance",
            metaDescription: "Connect with us for spiritual guidance and psychic readings.",
            metaKeywords: "footer, contact, spiritual guidance"
          }
        };

        const createResponse = await fetch(`${import.meta.env.VITE_BASE_URL}/api/footer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(defaultFooter)
        });
        
        const createData = await createResponse.json();
        
        if (createData.success) {
          setFooterContent(createData.data);
          toast.success("Default footer created");
        }
      } catch (createError) {
        console.error('Error creating default footer:', createError);
        toast.error("Failed to create default footer");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      console.log('Fetching versions...');
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/footer/admin/all?page=${currentPage}&limit=${limit}`,
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
    if (!footerContent) return;

    setSaving(true);
    try {
      console.log('Saving footer content...');
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/footer/${footerContent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(footerContent)
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Footer content updated successfully");
        setFooterContent(data.data);
        fetchVersions();
        console.log('Footer content saved:', data.data);
      } else {
        toast.error(data.message || "Failed to save changes");
      }
    } catch (error) {
      console.error('Error saving footer content:', error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      console.log('Duplicating version:', id);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/footer/${id}/duplicate`, {
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
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/footer/${id}`, {
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
    window.open(`/admin/footer/preview/${id}`, '_blank');
  };

  // Update functions
  const updateCompany = (field, value) => {
    setFooterContent(prev => ({
      ...prev,
      company: {
        ...prev.company,
        [field]: value
      }
    }));
  };

  const updateSocialMedia = (platform, field, value) => {
    setFooterContent(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: {
          ...prev.socialMedia[platform],
          [field]: value
        }
      }
    }));
  };

  const updateExploreLink = (index, field, value) => {
    setFooterContent(prev => ({
      ...prev,
      exploreLinks: prev.exploreLinks.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const updateLegalLink = (index, field, value) => {
    setFooterContent(prev => ({
      ...prev,
      legalLinks: prev.legalLinks.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const updateContact = (field, subField, value) => {
    setFooterContent(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: {
          ...prev.contact[field],
          [subField]: value
        }
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Footer Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Customize your website footer content and appearance
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePreview(footerContent?._id)}
                disabled={!footerContent}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !footerContent}
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
              {footerContent && (
                <div className="space-y-6">
                  {/* Company Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" style={{ color: colors.secondary }} />
                        Company Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Company Name</Label>
                        <Input
                          value={footerContent.company.name}
                          onChange={(e) => updateCompany('name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Tagline</Label>
                        <Input
                          value={footerContent.company.tagline}
                          onChange={(e) => updateCompany('tagline', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={2}
                          value={footerContent.company.description}
                          onChange={(e) => updateCompany('description', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Media Links */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" style={{ color: colors.secondary }} />
                        Social Media Links
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(footerContent.socialMedia).map(([platform, data]) => (
                          <div key={platform} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                            <div className="flex items-center gap-2">
                              {platform === 'instagram' && <Instagram className="h-5 w-5 text-pink-600" />}
                              {platform === 'facebook' && <Facebook className="h-5 w-5 text-blue-600" />}
                              {platform === 'linkedin' && <Linkedin className="h-5 w-5 text-blue-700" />}
                              {platform === 'twitter' && <Twitter className="h-5 w-5 text-blue-400" />}
                              {platform === 'tiktok' && <TikTokIcon />}
                              {platform === 'youtube' && <Youtube className="h-5 w-5 text-red-600" />}
                              <span className="font-medium capitalize">{platform}</span>
                            </div>
                            <div>
                              <Input
                                value={data.url}
                                onChange={(e) => updateSocialMedia(platform, 'url', e.target.value)}
                                placeholder="URL"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={data.active}
                                onChange={(e) => updateSocialMedia(platform, 'active', e.target.checked)}
                                className="h-4 w-4"
                              />
                              <Label>Active</Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Explore Links - Home, About Us, Our Psychics, Blogs */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5" style={{ color: colors.secondary }} />
                        Explore Links
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {footerContent.exploreLinks.map((link, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                            <div>
                              <Label>Label</Label>
                              <Input
                                value={link.label}
                                onChange={(e) => updateExploreLink(index, 'label', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>URL</Label>
                              <Input
                                value={link.url}
                                onChange={(e) => updateExploreLink(index, 'url', e.target.value)}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={link.active}
                                onChange={(e) => updateExploreLink(index, 'active', e.target.checked)}
                                className="h-4 w-4"
                              />
                              <Label>Active</Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Legal Links - Terms & Conditions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" style={{ color: colors.secondary }} />
                        Legal Links
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {footerContent.legalLinks.map((link, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                            <div>
                              <Label>Label</Label>
                              <Input
                                value={link.label}
                                onChange={(e) => updateLegalLink(index, 'label', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>URL</Label>
                              <Input
                                value={link.url}
                                onChange={(e) => updateLegalLink(index, 'url', e.target.value)}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={link.active}
                                onChange={(e) => updateLegalLink(index, 'active', e.target.checked)}
                                className="h-4 w-4"
                              />
                              <Label>Active</Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" style={{ color: colors.secondary }} />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Email */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                        <div className="col-span-1">
                          <Label>Email Address</Label>
                          <Input
                            value={footerContent.contact.email.address}
                            onChange={(e) => updateContact('email', 'address', e.target.value)}
                          />
                        </div>
                        <div className="col-span-1">
                          <Label>Display Text</Label>
                          <Input
                            value={footerContent.contact.email.displayText}
                            onChange={(e) => updateContact('email', 'displayText', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={footerContent.contact.email.active}
                            onChange={(e) => updateContact('email', 'active', e.target.checked)}
                            className="h-4 w-4"
                          />
                          <Label>Show Email</Label>
                        </div>
                      </div>

                      {/* Support */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                        <div className="col-span-1">
                          <Label>Support Text</Label>
                          <Input
                            value={footerContent.contact.support.text}
                            onChange={(e) => updateContact('support', 'text', e.target.value)}
                          />
                        </div>
                        <div className="col-span-1">
                          <Label>Support URL</Label>
                          <Input
                            value={footerContent.contact.support.url}
                            onChange={(e) => updateContact('support', 'url', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={footerContent.contact.support.active}
                            onChange={(e) => updateContact('support', 'active', e.target.checked)}
                            className="h-4 w-4"
                          />
                          <Label>Show Support</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bottom Bar */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" style={{ color: colors.secondary }} />
                        Bottom Bar
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Copyright Text</Label>
                        <Input
                          value={footerContent.bottomBar.copyrightText}
                          onChange={(e) => setFooterContent(prev => ({
                            ...prev,
                            bottomBar: {
                              ...prev.bottomBar,
                              copyrightText: e.target.value
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Tagline</Label>
                        <Input
                          value={footerContent.bottomBar.tagline}
                          onChange={(e) => setFooterContent(prev => ({
                            ...prev,
                            bottomBar: {
                              ...prev.bottomBar,
                              tagline: e.target.value
                            }
                          }))}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={footerContent.bottomBar.showPaymentMethods}
                          onChange={(e) => setFooterContent(prev => ({
                            ...prev,
                            bottomBar: {
                              ...prev.bottomBar,
                              showPaymentMethods: e.target.checked
                            }
                          }))}
                          className="h-4 w-4"
                        />
                        <Label>Show Payment Methods</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Methods - Only if enabled */}
                  {footerContent.bottomBar.showPaymentMethods && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5" style={{ color: colors.secondary }} />
                          Payment Methods
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          {Object.entries(footerContent.paymentMethods).map(([method, active]) => (
                            <div key={method} className="flex items-center gap-2 p-2 border rounded-lg">
                              <input
                                type="checkbox"
                                checked={active}
                                onChange={(e) => setFooterContent(prev => ({
                                  ...prev,
                                  paymentMethods: {
                                    ...prev.paymentMethods,
                                    [method]: e.target.checked
                                  }
                                }))}
                                className="h-4 w-4"
                              />
                              <Label className="capitalize">{method}</Label>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Versions Tab */}
            <TabsContent value="versions">
              <Card>
                <CardHeader>
                  <CardTitle>Version History</CardTitle>
                  <CardDescription>
                    All saved versions of your footer
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
                  {footerContent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={footerContent.colors.background}
                            onChange={(e) => setFooterContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                background: e.target.value
                              }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={footerContent.colors.background}
                            onChange={(e) => setFooterContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                background: e.target.value
                              }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={footerContent.colors.text}
                            onChange={(e) => setFooterContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                text: e.target.value
                              }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={footerContent.colors.text}
                            onChange={(e) => setFooterContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                text: e.target.value
                              }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Link Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={footerContent.colors.link}
                            onChange={(e) => setFooterContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                link: e.target.value
                              }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={footerContent.colors.link}
                            onChange={(e) => setFooterContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                link: e.target.value
                              }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Link Hover Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={footerContent.colors.linkHover}
                            onChange={(e) => setFooterContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                linkHover: e.target.value
                              }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={footerContent.colors.linkHover}
                            onChange={(e) => setFooterContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                linkHover: e.target.value
                              }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Border Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={footerContent.colors.border}
                            onChange={(e) => setFooterContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                border: e.target.value
                              }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={footerContent.colors.border}
                            onChange={(e) => setFooterContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                border: e.target.value
                              }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Icon Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={footerContent.colors.iconColor}
                            onChange={(e) => setFooterContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                iconColor: e.target.value
                              }
                            }))}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={footerContent.colors.iconColor}
                            onChange={(e) => setFooterContent(prev => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                iconColor: e.target.value
                              }
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
                  {footerContent && (
                    <div className="space-y-4">
                      <div>
                        <Label>Meta Title</Label>
                        <Input
                          value={footerContent.seo.metaTitle}
                          onChange={(e) => setFooterContent(prev => ({
                            ...prev,
                            seo: {
                              ...prev.seo,
                              metaTitle: e.target.value
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Meta Description</Label>
                        <Textarea
                          rows={2}
                          value={footerContent.seo.metaDescription}
                          onChange={(e) => setFooterContent(prev => ({
                            ...prev,
                            seo: {
                              ...prev.seo,
                              metaDescription: e.target.value
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Meta Keywords (comma separated)</Label>
                        <Input
                          value={footerContent.seo.metaKeywords}
                          onChange={(e) => setFooterContent(prev => ({
                            ...prev,
                            seo: {
                              ...prev.seo,
                              metaKeywords: e.target.value
                            }
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

export default AdminFooter;