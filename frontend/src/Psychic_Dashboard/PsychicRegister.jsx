// src/pages/psychic/PsychicRegister.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePsychicAuth } from "@/context/PsychicAuthContext";
import { 
  Loader2, Upload, X, Sparkles, UserPlus, Mail, Lock, 
  User, Award, Globe, Shield, BookOpen, Star,
  Heart, Briefcase, Moon, Sun, Compass, Sparkle, Brain,
  Eye, Cloud, MapPin, Calendar, Layers, Hash
} from "lucide-react";
import { toast } from "sonner";

// Define the same color scheme
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

// Define psychic categories with icons
const psychicCategories = [
  { value: "Tarot Reading", label: "Lecture de Tarot", icon: <Sparkle className="h-4 w-4" /> },
  { value: "Astrology", label: "Astrologie", icon: <Moon className="h-4 w-4" /> },
  { value: "Reading", label: "Lecture Spirituelle", icon: <BookOpen className="h-4 w-4" /> },
  { value: "Love & Relationships", label: "Amour & Relations", icon: <Heart className="h-4 w-4" /> },
  { value: "Career & Finance", label: "Carrière & Finances", icon: <Briefcase className="h-4 w-4" /> },
  { value: "Spiritual Guidance", label: "Guidance Spirituelle", icon: <Compass className="h-4 w-4" /> },
  { value: "Numerology", label: "Numérologie", icon: <Brain className="h-4 w-4" /> },
  { value: "Clairvoyant", label: "Clairvoyance", icon: <Eye className="h-4 w-4" /> },
  { value: "Dream Analysis", label: "Analyse des Rêves", icon: <Cloud className="h-4 w-4" /> },
];

export default function PsychicRegister() {
  const { register, loading } = usePsychicAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    bio: "",
    gender: "",
    category: "",
    abilities: "",           // Added missing field
    location: "",            // Added missing field
    languages: "Français",   // Added missing field (default)
    experience: "",          // Added missing field
    specialization: "",      // Added missing field
    image: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleGenderChange = (value) => {
    setFormData({ ...formData, gender: value });
  };

  const handleCategoryChange = (value) => {
    setFormData({ ...formData, category: value });
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
      toast.error("Échec du téléchargement de l'image: " + error.message);
      throw error;
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner un fichier image (JPG, PNG, GIF)");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La taille de l'image doit être inférieure à 5 Mo");
        return;
      }
      
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, image: "" }));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (!formData.gender) {
      toast.error("Veuillez sélectionner votre genre");
      return;
    }

    if (!formData.category) {
      toast.error("Veuillez sélectionner votre catégorie principale");
      return;
    }

    try {
      let finalImageUrl = formData.image;
      
      if (imageFile) {
        setIsUploadingImage(true);
        finalImageUrl = await uploadToCloudinary(imageFile);
        setIsUploadingImage(false);
      }

      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        bio: formData.bio,
        gender: formData.gender,
        category: formData.category,
        abilities: formData.abilities,                 // Add abilities
        location: formData.location,                    // Add location
        languages: formData.languages,                  // Add languages
        experience: formData.experience,                // Add experience
        specialization: formData.specialization,        // Add specialization
        image: finalImageUrl
      };

      const result = await register(registrationData);

      if (result?.success) {
        toast.success("Candidature soumise avec succès ! En attente d'approbation de l'administrateur.", {
          duration: 5000,
          action: {
            label: "Se connecter",
            onClick: () => navigate("/psychic/login"),
          },
        });
        setTimeout(() => {
          navigate("/psychic/login");
        }, 3000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || "Échec de l'inscription. Veuillez réessayer.");
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: colors.background }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 h-40 w-40 rounded-full" 
          style={{ backgroundColor: colors.accent, filter: 'blur(60px)' }}></div>
        <div className="absolute bottom-20 right-10 h-60 w-60 rounded-full" 
          style={{ backgroundColor: colors.secondary, filter: 'blur(80px)' }}></div>
      </div>

      <div className="w-full max-w-4xl z-10">
        {/* Header with mystical elements */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full mb-4" style={{ backgroundColor: colors.primary + '10' }}>
            <Sparkles className="h-12 w-12" style={{ color: colors.secondary }} />
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: colors.primary }}>
            Rejoignez Notre Cercle de Lumière
          </h1>
          <p className="text-lg" style={{ color: colors.bgLight }}>
            Partagez vos dons avec ceux qui cherchent des conseils
          </p>
        </div>

        <div className="grid md:grid-cols-1 gap-8">
          {/* Registration Form */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="pb-6 border-b"
              style={{ borderColor: colors.secondary + '20' }}>
              <CardTitle className="text-2xl font-bold flex items-center gap-3"
                style={{ color: colors.primary }}>
                <UserPlus className="h-6 w-6" style={{ color: colors.secondary }} />
                Formulaire de Candidature
              </CardTitle>
              <CardDescription>
                Remplissez vos informations pour postuler. Tous les champs sont obligatoires.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Image Section */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-bold"
                    style={{ color: colors.primary }}>
                    <User className="h-4 w-4" />
                    Photo de Profil
                  </Label>
                  <div className="flex items-center gap-6">
                    <div 
                      className="relative group cursor-pointer"
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                    >
                      <div className="h-20 w-20 rounded-full border-4 overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                        style={{ 
                          borderColor: colors.secondary,
                          backgroundColor: colors.secondary + '10'
                        }}>
                        {imagePreviewUrl ? (
                          <img 
                            src={imagePreviewUrl} 
                            alt="Aperçu" 
                            className="w-full h-full object-cover"
                          />
                        ) : formData.image ? (
                          <img 
                            src={formData.image} 
                            alt="Actuelle" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="h-8 w-8" style={{ color: colors.secondary + '50' }} />
                          </div>
                        )}
                      </div>
                      
                      {(imagePreviewUrl || formData.image) && (
                        <button
                          type="button"
                          className="absolute -top-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                          onClick={removeImage}
                          style={{ 
                            backgroundColor: colors.danger,
                            color: 'white'
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Upload className="h-8 w-8 text-white drop-shadow-lg" />
                      </div>
                      
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="profile-image"
                        onChange={handleImageChange}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <Label 
                        htmlFor="profile-image"
                        className="cursor-pointer flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105 inline-block"
                        style={{ color: colors.secondary }}
                      >
                        <Upload className="w-4 h-4" />
                        {imageFile ? "Changer l'image" : "Télécharger une image"}
                      </Label>
                      <p className="text-xs mt-1" style={{ color: colors.bgLight }}>
                        Recommandé : 400x400px, JPG ou PNG
                      </p>
                      
                      {/* Image URL Input */}
                      <div className="mt-3">
                        <Input 
                          type="text" 
                          id="image" 
                          value={formData.image} 
                          onChange={handleChange} 
                          placeholder="Ou entrez une URL d'image" 
                          disabled={!!imageFile}
                          className="text-sm"
                          style={{ 
                            borderColor: colors.secondary + '30',
                            color: colors.primary
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" style={{ color: colors.secondary }} />
                      Nom Complet *
                    </Label>
                    <Input 
                      id="name" 
                      required 
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Entrez votre nom complet"
                      style={{ 
                        borderColor: colors.secondary + '30',
                        color: colors.primary
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" style={{ color: colors.secondary }} />
                      Adresse Email *
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      required 
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="votre@email.com"
                      style={{ 
                        borderColor: colors.secondary + '30',
                        color: colors.primary
                      }}
                    />
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" style={{ color: colors.secondary }} />
                      Mot de passe *
                    </Label>
                    <Input 
                      id="password" 
                      type="password" 
                      required 
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 8 caractères"
                      style={{ 
                        borderColor: colors.secondary + '30',
                        color: colors.primary
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" style={{ color: colors.secondary }} />
                      Confirmer le mot de passe *
                    </Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      required 
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Ressaisissez votre mot de passe"
                      style={{ 
                        borderColor: colors.secondary + '30',
                        color: colors.primary
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-bold"
                      style={{ color: colors.primary }}>
                      <Layers className="h-4 w-4" style={{ color: colors.secondary }} />
                      Catégorie Principale *
                    </Label>
                    <Select onValueChange={handleCategoryChange} required>
                      <SelectTrigger style={{ 
                        borderColor: colors.secondary + '30',
                        color: colors.primary
                      }}>
                        <SelectValue placeholder="Sélectionnez votre catégorie principale" />
                      </SelectTrigger>
                      <SelectContent>
                        {psychicCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              <span style={{ color: colors.secondary }}>{category.icon}</span>
                              <span>{category.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs mt-1" style={{ color: colors.bgLight }}>
                      Choisissez la catégorie qui décrit le mieux votre don principal
                    </p>
                  </div>

                  {/* Gender Selection */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" style={{ color: colors.secondary }} />
                      Genre *
                    </Label>
                    <Select onValueChange={handleGenderChange} required>
                      <SelectTrigger style={{ 
                        borderColor: colors.secondary + '30',
                        color: colors.primary
                      }}>
                        <SelectValue placeholder="Sélectionnez votre genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Homme</SelectItem>
                        <SelectItem value="female">Femme</SelectItem>
                        <SelectItem value="other">Autre / Préfère ne pas dire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location & Languages */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" style={{ color: colors.secondary }} />
                      Lieu
                    </Label>
                    <Input 
                      id="location" 
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="ex : Paris, France"
                      style={{ 
                        borderColor: colors.secondary + '30',
                        color: colors.primary
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="languages" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" style={{ color: colors.secondary }} />
                      Langues
                    </Label>
                    <Input 
                      id="languages" 
                      value={formData.languages}
                      onChange={handleChange}
                      placeholder="Français, Anglais, Espagnol"
                      style={{ 
                        borderColor: colors.secondary + '30',
                        color: colors.primary
                      }}
                    />
                    <p className="text-xs" style={{ color: colors.bgLight }}>
                      Séparez plusieurs langues par des virgules
                    </p>
                  </div>
                </div>

                {/* Experience & Specialization */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" style={{ color: colors.secondary }} />
                      Expérience (années)
                    </Label>
                    <Input 
                      id="experience" 
                      type="number"
                      min="0"
                      max="50"
                      value={formData.experience}
                      onChange={handleChange}
                      placeholder="5"
                      style={{ 
                        borderColor: colors.secondary + '30',
                        color: colors.primary
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialization" className="flex items-center gap-2">
                      <Award className="h-4 w-4" style={{ color: colors.secondary }} />
                      Spécialisation
                    </Label>
                    <Input 
                      id="specialization" 
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="ex : Amour & Relations"
                      style={{ 
                        borderColor: colors.secondary + '30',
                        color: colors.primary
                      }}
                    />
                  </div>
                </div>

                {/* Abilities */}
                <div className="space-y-2">
                  <Label htmlFor="abilities" className="flex items-center gap-2">
                    <Award className="h-4 w-4" style={{ color: colors.secondary }} />
                    Capacités Spéciales
                  </Label>
                  <Input 
                    id="abilities" 
                    value={formData.abilities}
                    onChange={handleChange}
                    placeholder="Tarot, Astrologie, Numérologie, Médiumnité"
                    style={{ 
                      borderColor: colors.secondary + '30',
                      color: colors.primary
                    }}
                  />
                  <p className="text-xs" style={{ color: colors.bgLight }}>
                    Séparez plusieurs capacités par des virgules
                  </p>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" style={{ color: colors.secondary }} />
                    Biographie / Spécialisation *
                  </Label>
                  <textarea
                    id="bio"
                    rows={4}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 resize-none transition-all duration-200 focus:scale-[1.01]"
                    placeholder="Parlez-nous de vos dons spirituels, de votre expérience et de vos domaines d'expertise..."
                    required
                    value={formData.bio}
                    onChange={handleChange}
                    style={{ 
                      borderColor: colors.secondary + '30',
                      color: colors.primary,
                      minHeight: '100px'
                    }}
                  />
                  <p className="text-xs" style={{ color: colors.bgLight }}>
                    Décrivez vos capacités psychiques, vos styles de lecture et ce que les clients peuvent attendre
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full font-bold text-lg py-6 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                  style={{ 
                    backgroundColor: colors.secondary,
                    color: colors.primary
                  }}
                  disabled={loading || isUploadingImage}
                >
                  {(loading || isUploadingImage) ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {isUploadingImage ? "Téléchargement de l'image..." : "Soumission de la candidature..."}
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Postuler comme Médium
                    </>
                  )}
                </Button>
              </form>

              {/* Terms Note */}
              <div className="text-center text-sm pt-4 border-t"
                style={{ borderColor: colors.secondary + '20', color: colors.bgLight }}>
                <p className="flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" style={{ color: colors.success }} />
                  Vos informations sont sécurisées et cryptées
                </p>
                <p className="mt-1 text-xs">
                  En postulant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-sm" style={{ color: colors.bgLight }}>
            <span className="font-bold" style={{ color: colors.primary }}>Note :</span> 
            {" "}Toutes les candidatures sont examinées manuellement. L'approbation peut prendre 24 à 48 heures.
          </p>
        </div>
      </div>
    </div>
  );
}