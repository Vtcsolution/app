import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,        // User icon
  Mail,        // Email icon
  Lock,        // Password/lock icon
  DollarSign,  // Money/rate icon
  BookOpen,    // Book/bio icon
  Globe,       // Languages/globe icon
  Award,       // Abilities/award icon
  Briefcase,   // Specialization/briefcase icon
  CheckCircle, // Success/verified icon
  XCircle,     // Error/unverified icon
  Loader2,     // Loading spinner
  ArrowLeft,   // Back arrow
  Image,       // Image icon
  MapPin,      // Location icon
  Calendar,    // Experience/calendar icon
  Clock,       // Response time icon
  Shield,      // Verification shield icon
  Sparkles,    // Psychic theme icon
  Layers,      // Category icon
  Upload,      // Upload icon
  X            // X icon for removing image
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Dashboard_Navbar from "../Admin_Navbar";
import Doctor_Side_Bar from "../SideBar";
import { Label } from "@/components/ui/label";
import axios from 'axios';

// Color scheme matching psychic dashboard
const colors = {
  primary: "#2B1B3F",      // Deep purple
  secondary: "#C9A24D",    // Antique gold
  accent: "#9B7EDE",       // Light purple
  bgLight: "#3A2B4F",      // Lighter purple
  textLight: "#E8D9B0",    // Light gold text
  success: "#10B981",      // Green
  warning: "#F59E0B",      // Yellow
  danger: "#EF4444",       // Red
  background: "#F5F3EB",   // Soft ivory
};

// Psychic categories from the model
const psychicCategories = [
  'Tarot Reading',
  'Astrology',
  'Reading',
  'Love & Relationships',
  'Career & Finance',
  'Spiritual Guidance',
  'Numerology',
  'Clairvoyant',
  'Dream Analysis'
];

const AddPsychic = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [side, setSide] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [errors, setErrors] = useState({});
  
  // New state for image upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    ratePerMin: "1.50",
    bio: "",
    gender: "female",
    category: "Reading", // Default category
    image: "",
    abilities: "",
    location: "",
    languages: "English",
    experience: "0",
    specialization: "",
    isVerified: false,
    availability: true,
    responseTime: "5",
  });

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

  // Handle image file selection
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (JPG, PNG, GIF)",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Image size should be less than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, image: "" })); // Clear URL when file is selected
      setPreviewImage(''); // Clear URL preview
    }
  };

  // Handle image URL change
  const handleImageUrlChange = (value) => {
    setPreviewImage(value);
    setFormData(prev => ({ ...prev, image: value }));
    setImageFile(null); // Clear file when URL is entered
    setImagePreviewUrl(null); // Clear file preview
  };

  // Remove image
  const removeImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    setPreviewImage('');
    setFormData(prev => ({ ...prev, image: '' }));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle switch changes
  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.email.includes('@')) newErrors.email = "Please enter a valid email";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm password";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match";
    if (!formData.ratePerMin) newErrors.ratePerMin = "Rate is required";
    if (!formData.bio.trim()) newErrors.bio = "Bio is required";
    if (formData.bio.length < 10) newErrors.bio = "Bio must be at least 10 characters";
    if (!formData.category) newErrors.category = "Category is required";
    
    // Validate image - either URL or file
    if (formData.image && !formData.image.startsWith('http')) {
      newErrors.image = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      let finalImageUrl = formData.image;
      
      // Upload image to Cloudinary if file is selected
      if (imageFile) {
        setIsUploadingImage(true);
        toast({
          title: "Uploading Image",
          description: "Please wait while we upload the profile image...",
          variant: "default"
        });
        
        try {
          finalImageUrl = await uploadToCloudinary(imageFile);
          setIsUploadingImage(false);
          toast({
            title: "Image Uploaded",
            description: "Profile image uploaded successfully",
            variant: "default"
          });
        } catch (uploadError) {
          setIsUploadingImage(false);
          toast({
            title: "Image Upload Failed",
            description: uploadError.message || "Failed to upload image. Please try again or use a URL instead.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      // Prepare abilities array
      const abilitiesArray = formData.abilities 
        ? formData.abilities.split(',').map(ability => ability.trim()).filter(ability => ability)
        : [];

      // Prepare languages array
      const languagesArray = formData.languages 
        ? formData.languages.split(',').map(lang => lang.trim()).filter(lang => lang)
        : ['English'];

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        ratePerMin: parseFloat(formData.ratePerMin),
        bio: formData.bio.trim(),
        gender: formData.gender,
        category: formData.category,
        image: finalImageUrl || '',
        abilities: abilitiesArray,
        location: formData.location.trim(),
        languages: languagesArray,
        experience: parseInt(formData.experience) || 0,
        specialization: formData.specialization.trim(),
        isVerified: formData.isVerified,
        availability: formData.availability,
        responseTime: parseInt(formData.responseTime) || 5,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/human-psychics/admin/create`,
        payload,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: `Psychic "${formData.name}" created successfully`,
          variant: "default"
        });

        // Redirect to psychics list
        navigate('/admin/dashboard/humancoach');
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to create psychic",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Create psychic error:', error);
      
      let errorMessage = "Failed to create psychic";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).join(', ');
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsUploadingImage(false);
    }
  };

  // Back to list
  const handleBack = () => {
    navigate('/admin/dashboard/humancoach');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <Dashboard_Navbar side={side} setSide={setSide} />
      <div className="flex pt-16">
        <Doctor_Side_Bar side={side} setSide={setSide} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 ml-0 lg:ml-64 transition-all duration-300"> 
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="hover:scale-105 transition-transform duration-200"
                style={{
                  borderColor: colors.secondary,
                  color: colors.secondary,
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-6 w-6" style={{ color: colors.secondary }} />
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: colors.primary }}>
                    Add New Psychic
                  </h1>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Profile & Image */}
              <div className="lg:col-span-1 space-y-6">
                {/* Profile Image Card - UPDATED with upload functionality */}
                <Card 
                  className="border-none shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
                    borderColor: colors.primary + '10',
                  }}
                >
                  <CardHeader className="pb-3" style={{ borderBottomColor: colors.primary + '10' }}>
                    <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                      <Image className="h-5 w-5" />
                      Profile Image
                    </CardTitle>
                    <CardDescription style={{ color: colors.primary + '70' }}>
                      Upload or enter URL for profile picture
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Image Preview with Upload */}
                    <div className="flex flex-col items-center">
                      <div 
                        className="relative h-48 w-48 rounded-full overflow-hidden shadow-lg group cursor-pointer"
                        style={{ border: `4px solid ${colors.secondary}30` }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                      >
                        {imagePreviewUrl || previewImage ? (
                          <img
                            src={imagePreviewUrl || previewImage}
                            alt="Preview"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%239ca3af' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <div 
                            className="h-full w-full flex items-center justify-center"
                            style={{ backgroundColor: colors.primary + '05' }}
                          >
                            <User className="h-24 w-24" style={{ color: colors.primary + '30' }} />
                          </div>
                        )}
                        
                        {/* Upload Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Upload className="h-8 w-8 text-white" />
                        </div>
                        
                        {/* Hidden file input */}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleImageFileChange}
                        />
                      </div>
                      
                      {/* Remove Image Button */}
                      {(imagePreviewUrl || previewImage) && (
                        <button
                          type="button"
                          className="mt-2 text-sm flex items-center gap-1 px-3 py-1 rounded-full transition-all duration-200 hover:scale-105"
                          style={{ 
                            backgroundColor: colors.danger + '10',
                            color: colors.danger
                          }}
                          onClick={removeImage}
                        >
                          <X className="h-3 w-3" />
                          Remove Image
                        </button>
                      )}
                      
                      <p className="text-sm mt-3" style={{ color: colors.primary + '70' }}>
                        Click to upload or use URL below
                      </p>
                    </div>

                    {/* Image URL Input */}
                    <div className="space-y-2">
                      <Label htmlFor="image" className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                        <Image className="h-4 w-4" />
                        Image URL (Optional)
                      </Label>
                      <Input
                        id="image"
                        name="image"
                        placeholder="https://example.com/image.jpg"
                        value={formData.image}
                        onChange={(e) => handleImageUrlChange(e.target.value)}
                        className={errors.image ? "border-red-500" : ""}
                        style={{ borderColor: colors.primary + '20' }}
                        disabled={!!imageFile} // Disable URL input if file is selected
                      />
                      {errors.image && (
                        <p className="text-sm text-red-500">{errors.image}</p>
                      )}
                      <p className="text-sm" style={{ color: colors.primary + '60' }}>
                        {imageFile ? "✓ File selected for upload" : "Enter a direct URL to the profile image"}
                      </p>
                      {imageFile && (
                        <p className="text-xs" style={{ color: colors.success }}>
                          File: {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>

                    {/* Status Switches */}
                    <div className="space-y-4 pt-4">
                      <div 
                        className="flex items-center justify-between rounded-lg p-3 transition-all duration-200 hover:scale-[1.02]"
                        style={{ 
                          backgroundColor: colors.secondary + '05',
                          border: `1px solid ${colors.secondary}20`,
                        }}
                      >
                        <div className="space-y-0.5">
                          <Label className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                            <Shield className="h-4 w-4" style={{ color: formData.isVerified ? colors.success : colors.primary + '50' }} />
                            Verified Account
                          </Label>
                          <p className="text-sm" style={{ color: colors.primary + '60' }}>
                            Verified psychics can log in immediately
                          </p>
                        </div>
                        <Switch
                          checked={formData.isVerified}
                          onCheckedChange={(checked) => handleSwitchChange('isVerified', checked)}
                          style={{
                            backgroundColor: formData.isVerified ? colors.secondary : colors.primary + '20',
                          }}
                        />
                      </div>

                      <div 
                        className="flex items-center justify-between rounded-lg p-3 transition-all duration-200 hover:scale-[1.02]"
                        style={{ 
                          backgroundColor: colors.success + '05',
                          border: `1px solid ${colors.success}20`,
                        }}
                      >
                        <div className="space-y-0.5">
                          <Label className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                            {formData.availability ? (
                              <CheckCircle className="h-4 w-4" style={{ color: colors.success }} />
                            ) : (
                              <XCircle className="h-4 w-4" style={{ color: colors.primary + '50' }} />
                            )}
                            Available Online
                          </Label>
                          <p className="text-sm" style={{ color: colors.primary + '60' }}>
                            Make psychic available for chat
                          </p>
                        </div>
                        <Switch
                          checked={formData.availability}
                          onCheckedChange={(checked) => handleSwitchChange('availability', checked)}
                          style={{
                            backgroundColor: formData.availability ? colors.success : colors.primary + '20',
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rate Information */}
                <Card 
                  className="border-none shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
                    borderColor: colors.primary + '10',
                  }}
                >
                  <CardHeader className="pb-3" style={{ borderBottomColor: colors.primary + '10' }}>
                    <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                      <DollarSign className="h-5 w-5" />
                      Rate Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="ratePerMin" className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                        <DollarSign className="h-4 w-4" />
                        Rate per Minute *
                      </Label>
                      <div className="relative">
                        <div 
                          className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                          style={{ color: colors.secondary }}
                        >
                          <span className="font-bold">$</span>
                        </div>
                        <Input
                          id="ratePerMin"
                          name="ratePerMin"
                          type="number"
                          step="0.01"
                          min="0.50"
                          max="10.00"
                          className={`pl-8 ${errors.ratePerMin ? "border-red-500" : ""}`}
                          style={{ borderColor: colors.primary + '20' }}
                          value={formData.ratePerMin}
                          onChange={handleInputChange}
                        />
                      </div>
                      {errors.ratePerMin && (
                        <p className="text-sm text-red-500">{errors.ratePerMin}</p>
                      )}
                      <p className="text-sm" style={{ color: colors.primary + '60' }}>
                        Standard rate is $1.50 - $5.00 per minute
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Form Fields */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information Card */}
                <Card 
                  className="border-none shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
                    borderColor: colors.primary + '10',
                  }}
                >
                  <CardHeader className="pb-3" style={{ borderBottomColor: colors.primary + '10' }}>
                    <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                      <User className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                    <CardDescription style={{ color: colors.primary + '70' }}>
                      Enter the psychic's basic details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                        <User className="h-4 w-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={errors.name ? "border-red-500" : ""}
                        style={{ borderColor: colors.primary + '20' }}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                        <Mail className="h-4 w-4" />
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="psychic@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={errors.email ? "border-red-500" : ""}
                        style={{ borderColor: colors.primary + '20' }}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                        <Lock className="h-4 w-4" />
                        Password *
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={errors.password ? "border-red-500" : ""}
                        style={{ borderColor: colors.primary + '20' }}
                      />
                      {errors.password && (
                        <p className="text-sm text-red-500">{errors.password}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                        <Lock className="h-4 w-4" />
                        Confirm Password *
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={errors.confirmPassword ? "border-red-500" : ""}
                        style={{ borderColor: colors.primary + '20' }}
                      />
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="font-medium" style={{ color: colors.primary }}>Gender *</Label>
                      <Select 
                        value={formData.gender} 
                        onValueChange={(value) => handleSelectChange('gender', value)}
                      >
                        <SelectTrigger 
                          id="gender" 
                          className={errors.gender ? "border-red-500" : ""}
                          style={{ borderColor: colors.primary + '20' }}
                        >
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: colors.background }}>
                          <SelectItem value="male" style={{ color: colors.primary }}>Male</SelectItem>
                          <SelectItem value="female" style={{ color: colors.primary }}>Female</SelectItem>
                          <SelectItem value="other" style={{ color: colors.primary }}>Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && (
                        <p className="text-sm text-red-500">{errors.gender}</p>
                      )}
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label htmlFor="category" className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                        <Layers className="h-4 w-4" />
                        Category *
                      </Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => handleSelectChange('category', value)}
                      >
                        <SelectTrigger 
                          id="category" 
                          className={errors.category ? "border-red-500" : ""}
                          style={{ borderColor: colors.primary + '20' }}
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: colors.background }}>
                          {psychicCategories.map((category) => (
                            <SelectItem 
                              key={category} 
                              value={category}
                              style={{ color: colors.primary }}
                            >
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-red-500">{errors.category}</p>
                      )}
                      <p className="text-sm" style={{ color: colors.primary + '60' }}>
                        Select the psychic's primary category
                      </p>
                    </div>

                    {/* Response Time */}
                    <div className="space-y-2">
                      <Label htmlFor="responseTime" className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                        <Clock className="h-4 w-4" />
                        Response Time (minutes)
                      </Label>
                      <Input
                        id="responseTime"
                        name="responseTime"
                        type="number"
                        min="1"
                        max="60"
                        placeholder="5"
                        value={formData.responseTime}
                        onChange={handleInputChange}
                        style={{ borderColor: colors.primary + '20' }}
                      />
                      <p className="text-sm" style={{ color: colors.primary + '60' }}>
                        Average response time to messages
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Details Card */}
                <Card 
                  className="border-none shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
                    borderColor: colors.primary + '10',
                  }}
                >
                  <CardHeader className="pb-3" style={{ borderBottomColor: colors.primary + '10' }}>
                    <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                      <Briefcase className="h-5 w-5" />
                      Professional Details
                    </CardTitle>
                    <CardDescription style={{ color: colors.primary + '70' }}>
                      Information about psychic's professional background
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                        <BookOpen className="h-4 w-4" />
                        Biography *
                      </Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        placeholder="Describe the psychic's background, skills, and experience..."
                        className={`min-h-[120px] ${errors.bio ? "border-red-500" : ""}`}
                        style={{ borderColor: colors.primary + '20' }}
                        value={formData.bio}
                        onChange={handleInputChange}
                      />
                      {errors.bio && (
                        <p className="text-sm text-red-500">{errors.bio}</p>
                      )}
                      <p className="text-sm" style={{ color: colors.primary + '60' }}>
                        This will be displayed on the psychic's profile
                      </p>
                    </div>

                    {/* Abilities */}
                    <div className="space-y-2">
                      <Label htmlFor="abilities" className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                        <Award className="h-4 w-4" />
                        Special Abilities
                      </Label>
                      <Input
                        id="abilities"
                        name="abilities"
                        placeholder="Tarot, Astrology, Numerology, Mediumship"
                        value={formData.abilities}
                        onChange={handleInputChange}
                        style={{ borderColor: colors.primary + '20' }}
                      />
                      <p className="text-sm" style={{ color: colors.primary + '60' }}>
                        Separate multiple abilities with commas
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Location */}
                      <div className="space-y-2">
                        <Label htmlFor="location" className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                          <MapPin className="h-4 w-4" />
                          Location
                        </Label>
                        <Input
                          id="location"
                          name="location"
                          placeholder="New York, USA"
                          value={formData.location}
                          onChange={handleInputChange}
                          style={{ borderColor: colors.primary + '20' }}
                        />
                      </div>

                      {/* Languages */}
                      <div className="space-y-2">
                        <Label htmlFor="languages" className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                          <Globe className="h-4 w-4" />
                          Languages
                        </Label>
                        <Input
                          id="languages"
                          name="languages"
                          placeholder="English, Spanish, French"
                          value={formData.languages}
                          onChange={handleInputChange}
                          style={{ borderColor: colors.primary + '20' }}
                        />
                        <p className="text-sm" style={{ color: colors.primary + '60' }}>
                          Separated by commas
                        </p>
                      </div>

                      {/* Experience */}
                      <div className="space-y-2">
                        <Label htmlFor="experience" className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                          <Calendar className="h-4 w-4" />
                          Experience (years)
                        </Label>
                        <Input
                          id="experience"
                          name="experience"
                          type="number"
                          min="0"
                          max="50"
                          placeholder="5"
                          value={formData.experience}
                          onChange={handleInputChange}
                          style={{ borderColor: colors.primary + '20' }}
                        />
                      </div>

                      {/* Specialization */}
                      <div className="space-y-2">
                        <Label htmlFor="specialization" className="flex items-center gap-2 font-medium" style={{ color: colors.primary }}>
                          <Briefcase className="h-4 w-4" />
                          Specialization
                        </Label>
                        <Input
                          id="specialization"
                          name="specialization"
                          placeholder="Love & Relationships"
                          value={formData.specialization}
                          onChange={handleInputChange}
                          style={{ borderColor: colors.primary + '20' }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Form Actions */}
            <Card 
              className="border-none shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
                borderColor: colors.primary + '10',
              }}
            >
              <CardFooter className="flex justify-between px-6 py-4 border-t" style={{ borderColor: colors.primary + '10' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading || isUploadingImage}
                  className="hover:scale-105 transition-transform duration-200"
                  style={{
                    borderColor: colors.primary + '20',
                    color: colors.primary,
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || isUploadingImage}
                  className="hover:scale-105 transition-transform duration-200"
                  style={{
                    backgroundColor: colors.secondary,
                    color: colors.primary,
                  }}
                >
                  {loading || isUploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isUploadingImage ? "Uploading Image..." : "Creating Psychic..."}
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      Create Psychic Account
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Quick Tips */}
          <Card 
            className="mt-6 border-none shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
              borderColor: colors.primary + '10',
            }}
          >
            <CardHeader className="pb-3" style={{ borderBottomColor: colors.primary + '10' }}>
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: colors.primary }}>
                <Sparkles className="h-4 w-4" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm" style={{ color: colors.primary + '80' }}>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                  <span>Set <strong style={{ color: colors.secondary }}>isVerified</strong> to true if you want the psychic to be able to login immediately</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                  <span>Choose the appropriate <strong style={{ color: colors.secondary }}>category</strong> from the dropdown list</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                  <span><strong style={{ color: colors.secondary }}>Upload an image</strong> by clicking on the profile circle, or enter a URL</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                  <span>Use a professional image (JPG, PNG) - maximum 5MB, 300x300 pixels recommended</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                  <span>Standard rates range from <strong style={{ color: colors.secondary }}>$1.50</strong> to <strong style={{ color: colors.secondary }}>$5.00</strong> per minute</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                  <span>Make sure the email is unique and not already registered</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AddPsychic;