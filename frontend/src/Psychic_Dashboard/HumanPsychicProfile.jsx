import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePsychicAuth } from "../context/PsychicAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  DollarSign, 
  Clock, 
  Edit, 
  Save, 
  X, 
  Trash2, 
  Shield,
  Calendar,
  Key,
  Info,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Star
} from 'lucide-react';
import { toast } from "sonner";
import axios from "axios";

const HumanPsychicProfile = () => {
  const { psychic, loading: authLoading, isAuthenticated, logout, refreshPsychic } = usePsychicAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    ratePerMin: '',
    bio: '',
    gender: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [deleteConfirm, setDeleteConfirm] = useState('');
  
  // Color scheme
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
  
  // Create axios instance
  const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
  });

  // Add token to requests
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('psychicToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/psychic/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await api.get('/api/human-psychics/profile/me');
      
      if (data.success) {
        setProfile(data.psychic);
        setFormData({
          name: data.psychic.name || '',
          email: data.psychic.email || '',
          ratePerMin: data.psychic.ratePerMin?.toString() || '',
          bio: data.psychic.bio || '',
          gender: data.psychic.gender || '',
        });
      } else {
        throw new Error(data.message || 'Échec du chargement du profil');
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError(err.response?.data?.message || err.message || 'Échec du chargement du profil');
      
      if (err.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        logout();
        navigate("/psychic/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate rate
      if (formData.ratePerMin && (isNaN(formData.ratePerMin) || parseFloat(formData.ratePerMin) <= 0)) {
        toast.error("Veuillez saisir un tarif valide par minute");
        return;
      }

      const updateData = {
        name: formData.name,
        email: formData.email,
        ratePerMin: parseFloat(formData.ratePerMin),
        bio: formData.bio,
        gender: formData.gender,
      };

      const { data } = await api.put('/api/human-psychics/profile/me', updateData);
      
      if (data.success) {
        setProfile(data.psychic);
        setIsEditing(false);
        refreshPsychic(); // Refresh auth context
        
        toast.success("Profil mis à jour avec succès !");
        
        // Update form data with new values
        setFormData({
          name: data.psychic.name || '',
          email: data.psychic.email || '',
          ratePerMin: data.psychic.ratePerMin?.toString() || '',
          bio: data.psychic.bio || '',
          gender: data.psychic.gender || '',
        });
      } else {
        throw new Error(data.message || 'Échec de la mise à jour du profil');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      toast.error(err.response?.data?.message || err.message || 'Échec de la mise à jour du profil');
      
      if (err.response?.status === 401) {
        logout();
        navigate("/psychic/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      setLoading(true);
      
      const { data } = await api.put('/api/human-psychics/profile/me', {
        password: passwordData.newPassword,
        currentPassword: passwordData.currentPassword,
      });
      
      if (data.success) {
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        toast.success("Mot de passe modifié avec succès !");
        refreshPsychic(); // Refresh auth context
      } else {
        throw new Error(data.message || 'Échec de la modification du mot de passe');
      }
    } catch (err) {
      console.error('Change password error:', err);
      toast.error(err.response?.data?.message || err.message || 'Échec de la modification du mot de passe');
      
      if (err.response?.status === 401) {
        toast.error("Le mot de passe actuel est incorrect");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'SUPPRIMER') {
      toast.error("Veuillez saisir 'SUPPRIMER' pour confirmer la suppression du compte");
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible !")) {
      return;
    }

    try {
      setLoading(true);
      
      const { data } = await api.delete('/api/human-psychics/profile/me');
      
      if (data.success) {
        toast.success("Compte supprimé avec succès");
        logout();
        navigate("/psychic/login");
      } else {
        throw new Error(data.message || 'Échec de la suppression du compte');
      }
    } catch (err) {
      console.error('Delete account error:', err);
      toast.error(err.response?.data?.message || err.message || 'Échec de la suppression du compte');
      
      if (err.response?.status === 401) {
        logout();
        navigate("/psychic/login");
      }
    } finally {
      setLoading(false);
      setIsDeleting(false);
      setDeleteConfirm('');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await api.post('/api/human-psychics/logout');
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      logout();
      navigate("/psychic/login");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Loading state
  if (authLoading || (loading && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <div className="h-12 w-12 border-4 rounded-full animate-spin mx-auto mb-4" 
            style={{ borderColor: colors.secondary, borderTopColor: 'transparent' }}></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Card className="w-full max-w-md mx-4 border" style={{ borderColor: colors.danger + '30' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.danger }}>
              <AlertCircle className="h-5 w-5" />
              Erreur de Chargement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={fetchProfile} 
              className="w-full"
              style={{ backgroundColor: colors.secondary, color: colors.primary }}
            >
              Réessayer
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: colors.background }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: colors.primary }}>Profil Médium</h1>
          <p className="mt-2" style={{ color: colors.primary + '80' }}>Gérez les paramètres de votre compte et vos informations personnelles</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Overview */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border shadow-sm" style={{ borderColor: colors.secondary + '30' }}>
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-32 w-32 border-4 shadow-lg" 
                    style={{ borderColor: colors.secondary }}>
                    <AvatarImage src={profile?.image} />
                    <AvatarFallback className="text-2xl" 
                      style={{ backgroundColor: colors.secondary, color: colors.primary }}>
                      {profile?.name?.[0] || 'P'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl" style={{ color: colors.primary }}>{profile?.name}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-2 mt-2">
                  <Badge 
                    variant={profile?.isVerified ? "default" : "outline"} 
                    className="gap-1"
                    style={profile?.isVerified ? {
                      backgroundColor: colors.success + '20',
                      color: colors.success,
                      borderColor: colors.success + '30'
                    } : {
                      borderColor: colors.warning,
                      color: colors.warning
                    }}
                  >
                    {profile?.isVerified ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Vérifié
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        En Attente de Vérification
                      </>
                    )}
                  </Badge>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 pt-0">
                <div className="flex items-center gap-3 p-3 rounded-lg" 
                  style={{ backgroundColor: colors.primary + '05' }}>
                  <Mail className="h-4 w-4" style={{ color: colors.secondary }} />
                  <span className="text-sm" style={{ color: colors.primary + '90' }}>{profile?.email}</span>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg" 
                  style={{ backgroundColor: colors.primary + '05' }}>
                  <DollarSign className="h-4 w-4" style={{ color: colors.secondary }} />
                  <span className="text-sm" style={{ color: colors.primary + '90' }}>
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(profile?.ratePerMin || 0)}/min
                  </span>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg" 
                  style={{ backgroundColor: colors.primary + '05' }}>
                  <User className="h-4 w-4" style={{ color: colors.secondary }} />
                  <span className="text-sm capitalize" style={{ color: colors.primary + '90' }}>
                    {profile?.gender === 'male' ? 'Homme' : 
                     profile?.gender === 'female' ? 'Femme' : 
                     profile?.gender || 'Non spécifié'}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg" 
                  style={{ backgroundColor: colors.primary + '05' }}>
                  <Calendar className="h-4 w-4" style={{ color: colors.secondary }} />
                  <span className="text-sm" style={{ color: colors.primary + '90' }}>
                    Inscrit(e) le {formatDate(profile?.createdAt)}
                  </span>
                </div>
              </CardContent>
              
              <CardFooter className="pt-0">
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="w-full"
                  style={{ 
                    borderColor: colors.danger + '30',
                    color: colors.danger,
                    backgroundColor: colors.danger + '05'
                  }}
                >
                  Déconnexion
                </Button>
              </CardFooter>
            </Card>

            {/* Stats Card */}
            <Card className="border shadow-sm" style={{ borderColor: colors.secondary + '30' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: colors.primary }}>
                  <Star className="h-4 w-4" style={{ color: colors.secondary }} />
                  Statistiques du Compte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded" 
                  style={{ backgroundColor: colors.primary + '05' }}>
                  <span className="text-sm" style={{ color: colors.primary + '70' }}>Statut</span>
                  <Badge 
                    style={profile?.isVerified ? {
                      backgroundColor: colors.success + '20',
                      color: colors.success,
                    } : {
                      backgroundColor: colors.warning + '20',
                      color: colors.warning,
                    }}
                  >
                    {profile?.isVerified ? 'Actif' : 'En attente'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 rounded" 
                  style={{ backgroundColor: colors.primary + '05' }}>
                  <span className="text-sm" style={{ color: colors.primary + '70' }}>Membre depuis</span>
                  <span className="text-sm font-medium" style={{ color: colors.primary }}>
                    {formatDate(profile?.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded" 
                  style={{ backgroundColor: colors.primary + '05' }}>
                  <span className="text-sm" style={{ color: colors.primary + '70' }}>Dernière mise à jour</span>
                  <span className="text-sm font-medium" style={{ color: colors.primary }}>
                    {formatDate(profile?.updatedAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Edit Forms */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid grid-cols-3 bg-gray-100 p-1">
                <TabsTrigger 
                  value="profile"
                  className="data-[state=active]:shadow-sm"
                  style={{
                    color: colors.primary,
                  }}
                >
                  Profil
                </TabsTrigger>
                <TabsTrigger 
                  value="security"
                  className="data-[state=active]:shadow-sm"
                  style={{
                    color: colors.primary,
                  }}
                >
                  Sécurité
                </TabsTrigger>
                <TabsTrigger 
                  value="danger"
                  className="data-[state=active]:shadow-sm"
                  style={{
                    color: colors.danger,
                  }}
                >
                  Zone à Risque
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card className="border shadow-sm" style={{ borderColor: colors.secondary + '30' }}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle style={{ color: colors.primary }}>Informations du Profil</CardTitle>
                        <CardDescription style={{ color: colors.primary + '70' }}>
                          Mettez à jour vos informations personnelles et votre biographie
                        </CardDescription>
                      </div>
                      {!isEditing ? (
                        <Button 
                          onClick={() => setIsEditing(true)} 
                          variant="outline" 
                          className="gap-2"
                          style={{ 
                            borderColor: colors.secondary,
                            color: colors.secondary,
                            backgroundColor: colors.secondary + '05'
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Modifier le Profil
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => setIsEditing(false)} 
                            variant="outline" 
                            className="gap-2"
                            style={{ 
                              borderColor: colors.primary + '30',
                              color: colors.primary,
                            }}
                          >
                            <X className="h-4 w-4" />
                            Annuler
                          </Button>
                          <Button 
                            onClick={handleUpdateProfile} 
                            className="gap-2"
                            disabled={loading}
                            style={{ backgroundColor: colors.secondary, color: colors.primary }}
                          >
                            <Save className="h-4 w-4" />
                            Enregistrer
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {isEditing ? (
                      <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="name" style={{ color: colors.primary }}>
                              Nom Complet *
                            </Label>
                            <Input
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              required
                              placeholder="Entrez votre nom complet"
                              className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                              style={{ color: colors.primary }}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email" style={{ color: colors.primary }}>
                              Adresse Email *
                            </Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                              placeholder="Entrez votre email"
                              className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                              style={{ color: colors.primary }}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="ratePerMin" style={{ color: colors.primary }}>
                              Tarif par Minute (€) *
                            </Label>
                            <Input
                              id="ratePerMin"
                              name="ratePerMin"
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={formData.ratePerMin}
                              onChange={handleInputChange}
                              required
                              placeholder="ex: 1.50"
                              className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                              style={{ color: colors.primary }}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="gender" style={{ color: colors.primary }}>
                              Genre *
                            </Label>
                            <Select 
                              value={formData.gender} 
                              onValueChange={(value) => handleSelectChange('gender', value)}
                            >
                              <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                                <SelectValue placeholder="Sélectionnez votre genre" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Homme</SelectItem>
                                <SelectItem value="female">Femme</SelectItem>
                                <SelectItem value="other">Autre</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bio" style={{ color: colors.primary }}>
                            Biographie *
                          </Label>
                          <Textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            required
                            placeholder="Parlez de vous aux clients..."
                            rows={4}
                            className="min-h-[120px] border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            style={{ color: colors.primary }}
                          />
                          <p className="text-xs" style={{ color: colors.primary + '70' }}>
                            Minimum 50 caractères. Décrivez vos compétences, votre expérience et vos spécialités.
                          </p>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label style={{ color: colors.primary + '70' }}>Nom Complet</Label>
                            <p className="font-medium" style={{ color: colors.primary }}>{profile?.name}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label style={{ color: colors.primary + '70' }}>Adresse Email</Label>
                            <p className="font-medium" style={{ color: colors.primary }}>{profile?.email}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label style={{ color: colors.primary + '70' }}>Tarif par Minute</Label>
                            <p className="font-medium" style={{ color: colors.primary }}>
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(profile?.ratePerMin || 0)}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label style={{ color: colors.primary + '70' }}>Genre</Label>
                            <p className="font-medium capitalize" style={{ color: colors.primary }}>
                              {profile?.gender === 'male' ? 'Homme' : 
                               profile?.gender === 'female' ? 'Femme' : 
                               profile?.gender || 'Non spécifié'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label style={{ color: colors.primary + '70' }}>Biographie</Label>
                          <div className="p-4 rounded-lg border" 
                            style={{ 
                              backgroundColor: colors.primary + '05',
                              borderColor: colors.secondary + '30'
                            }}>
                            <p className="whitespace-pre-wrap" style={{ color: colors.primary }}>
                              {profile?.bio}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <Card className="border shadow-sm" style={{ borderColor: colors.secondary + '30' }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                      <Shield className="h-5 w-5" style={{ color: colors.secondary }} />
                      Paramètres de Sécurité
                    </CardTitle>
                    <CardDescription style={{ color: colors.primary + '70' }}>
                      Gérez votre mot de passe et la sécurité de votre compte
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {isChangingPassword ? (
                      <form onSubmit={handleChangePassword} className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword" style={{ color: colors.primary }}>
                              Mot de Passe Actuel *
                            </Label>
                            <Input
                              id="currentPassword"
                              name="currentPassword"
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              required
                              placeholder="Entrez votre mot de passe actuel"
                              className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                              style={{ color: colors.primary }}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="newPassword" style={{ color: colors.primary }}>
                              Nouveau Mot de Passe *
                            </Label>
                            <Input
                              id="newPassword"
                              name="newPassword"
                              type="password"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              required
                              placeholder="Entrez le nouveau mot de passe"
                              minLength={6}
                              className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                              style={{ color: colors.primary }}
                            />
                            <p className="text-xs" style={{ color: colors.primary + '70' }}>
                              Le mot de passe doit contenir au moins 6 caractères
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword" style={{ color: colors.primary }}>
                              Confirmer le Nouveau Mot de Passe *
                            </Label>
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              required
                              placeholder="Confirmez le nouveau mot de passe"
                              minLength={6}
                              className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                              style={{ color: colors.primary }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            onClick={() => {
                              setIsChangingPassword(false);
                              setPasswordData({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: '',
                              });
                            }}
                            variant="outline"
                            style={{ 
                              borderColor: colors.primary + '30',
                              color: colors.primary,
                            }}
                          >
                            Annuler
                          </Button>
                          <Button 
                            type="submit"
                            disabled={loading}
                            style={{ backgroundColor: colors.secondary, color: colors.primary }}
                          >
                            Changer le Mot de Passe
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="rounded-lg p-4" 
                          style={{ 
                            backgroundColor: colors.accent + '10',
                            borderColor: colors.accent + '30',
                            borderWidth: '1px'
                          }}>
                          <div className="flex items-start gap-3">
                            <Key className="h-5 w-5 mt-0.5" style={{ color: colors.accent }} />
                            <div>
                              <h4 className="font-medium" style={{ color: colors.primary }}>Sécurité du Mot de Passe</h4>
                              <p className="text-sm mt-1" style={{ color: colors.primary + '70' }}>
                                Changez régulièrement votre mot de passe pour sécuriser votre compte.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <Separator style={{ backgroundColor: colors.primary + '20' }} />
                        
                        <div className="flex justify-between items-center p-4 rounded-lg" 
                          style={{ backgroundColor: colors.primary + '05' }}>
                          <div>
                            <h4 className="font-medium" style={{ color: colors.primary }}>Mot de Passe</h4>
                            <p className="text-sm mt-1" style={{ color: colors.primary + '70' }}>
                              Dernière modification : {formatDate(profile?.updatedAt)}
                            </p>
                          </div>
                          <Button 
                            onClick={() => setIsChangingPassword(true)}
                            variant="outline"
                            className="gap-2"
                            style={{ 
                              borderColor: colors.secondary,
                              color: colors.secondary,
                              backgroundColor: colors.secondary + '05'
                            }}
                          >
                            <Key className="h-4 w-4" />
                            Changer le Mot de Passe
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Danger Zone Tab */}
              <TabsContent value="danger">
                <Card className="border shadow-sm" 
                  style={{ 
                    borderColor: colors.danger + '30',
                    backgroundColor: colors.danger + '05'
                  }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2" style={{ color: colors.danger }}>
                      <AlertCircle className="h-5 w-5" />
                      Zone à Risque
                    </CardTitle>
                    <CardDescription style={{ color: colors.danger + '80' }}>
                      Actions irréversibles. À utiliser avec prudence.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {isDeleting ? (
                      <div className="space-y-4">
                        <div className="rounded-lg p-4" 
                          style={{ 
                            backgroundColor: colors.danger + '10',
                            borderColor: colors.danger + '30',
                            borderWidth: '1px'
                          }}>
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 mt-0.5" style={{ color: colors.danger }} />
                            <div>
                              <h4 className="font-medium" style={{ color: colors.danger }}>Attention : Cette action est irréversible</h4>
                              <p className="text-sm mt-1" style={{ color: colors.danger + '80' }}>
                                Cela supprimera définitivement votre compte, toutes les sessions de chat et toutes les données associées.
                                Vous ne pourrez pas récupérer votre compte.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="deleteConfirm" style={{ color: colors.danger }}>
                            Saisissez "SUPPRIMER" pour confirmer *
                          </Label>
                          <Input
                            id="deleteConfirm"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder="Saisissez SUPPRIMER pour confirmer"
                            className="focus:border-red-500 focus:ring-red-500"
                            style={{ 
                              borderColor: colors.danger + '50',
                              color: colors.danger,
                            }}
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => {
                              setIsDeleting(false);
                              setDeleteConfirm('');
                            }}
                            variant="outline"
                            style={{ 
                              borderColor: colors.primary + '30',
                              color: colors.primary,
                            }}
                          >
                            Annuler
                          </Button>
                          <Button 
                            onClick={handleDeleteAccount}
                            variant="destructive"
                            disabled={loading || deleteConfirm !== 'SUPPRIMER'}
                            style={{ backgroundColor: colors.danger }}
                          >
                            {loading ? 'Suppression...' : 'Supprimer le Compte Définitivement'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-lg p-4" 
                          style={{ 
                            backgroundColor: colors.warning + '10',
                            borderColor: colors.warning + '30',
                            borderWidth: '1px'
                          }}>
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 mt-0.5" style={{ color: colors.warning }} />
                            <div>
                              <h4 className="font-medium" style={{ color: colors.primary }}>Suppression du Compte</h4>
                              <p className="text-sm mt-1" style={{ color: colors.primary + '70' }}>
                                Une fois votre compte supprimé, il n'y a pas de retour possible. Soyez certain(e) de votre décision.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center p-4 rounded-lg border" 
                          style={{ 
                            backgroundColor: colors.primary + '05',
                            borderColor: colors.danger + '30'
                          }}>
                          <div>
                            <h4 className="font-medium" style={{ color: colors.primary }}>Supprimer le Compte</h4>
                            <p className="text-sm mt-1" style={{ color: colors.primary + '70' }}>
                              Supprimer définitivement votre compte et toutes vos données
                            </p>
                          </div>
                          <Button 
                            onClick={() => setIsDeleting(true)}
                            variant="destructive"
                            style={{ backgroundColor: colors.danger }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer le Compte
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Verification Status Card */}
            {!profile?.isVerified && (
              <Card className="mt-6 border shadow-sm" 
                style={{ 
                  borderColor: colors.warning + '30',
                  backgroundColor: colors.warning + '05'
                }}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2" style={{ color: colors.warning }}>
                    <Clock className="h-5 w-5" />
                    Vérification du Compte en Attente
                  </CardTitle>
                  <CardDescription style={{ color: colors.primary + '70' }}>
                    Votre compte est en attente de vérification par l'administrateur
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg p-4" 
                    style={{ 
                      backgroundColor: colors.warning + '10',
                      borderColor: colors.warning + '30',
                      borderWidth: '1px'
                    }}>
                    <p className="text-sm" style={{ color: colors.primary + '80' }}>
                      Votre compte est actuellement en cours de révision. Une fois vérifié par un administrateur,
                      vous pourrez recevoir des demandes de chat et commencer à gagner.
                      Ce processus prend généralement 24 à 48 heures.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanPsychicProfile;