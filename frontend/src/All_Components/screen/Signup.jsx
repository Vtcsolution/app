import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, Gift, Sparkles, User, Mail, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';
import axios from 'axios';

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

export default function Signup() {
  const { register, user, error } = useAuth();
  const navigate = useNavigate();
  const hasInteracted = useRef(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to home when registration is successful
  useEffect(() => {
    if (registrationSuccess) {
      // Show success toast
      toast.success('Compte créé avec succès ! 🎉', {
        duration: 3000,
        description: 'Vous avez reçu 5 crédits gratuits comme cadeau de bienvenue !',
      });
      
      // Small delay to show the toast before redirect
      setTimeout(() => {
        navigate("/");
      }, 1500);
    }
  }, [registrationSuccess, navigate]);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !error && !registrationSuccess) {
      navigate("/");
    }
    if (error) {
      toast.error(error);
    }
  }, [user, error, navigate, registrationSuccess]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    setFormErrors({ ...formErrors, [id]: '' });

    if (!hasInteracted.current && window.ttq) {
      window.ttq.track('Lead', {
        content_id: formData.email || 'unknown',
        field: id,
      });
      hasInteracted.current = true;
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.username) errors.username = "Nom d'utilisateur requis";
    if (!formData.email) errors.email = 'Adresse email requise';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Format d\'email invalide';
    if (!formData.password) errors.password = 'Mot de passe requis';
    else if (formData.password.length < 6) errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsLoading(true);
      
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      const result = await register(payload);
      if (result.success) {
        if (window.ttq) {
          window.ttq.track('SignUp', {
            content_id: result.userId || formData.email,
            email: formData.email,
          });
        }

        setRegistrationSuccess(true);
        
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
        });

      } else {
        toast.error(result.message || 'Échec de l\'inscription');
      }
    } catch (err) {
      toast.error('Échec de l\'inscription : ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: colors.background }}>
      
      {/* Background elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 h-60 w-60 rounded-full" 
          style={{ backgroundColor: colors.accent, filter: 'blur(80px)' }}></div>
        <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full" 
          style={{ backgroundColor: colors.secondary, filter: 'blur(100px)' }}></div>
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-6 left-6 h-12 w-12 rounded-full border-4 opacity-20 hidden md:block"
        style={{ borderColor: colors.secondary }}></div>
      <div className="absolute bottom-6 right-6 h-16 w-16 rounded-full border-4 opacity-20 hidden md:block"
        style={{ borderColor: colors.accent }}></div>

      <div className="w-full max-w-md z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full flex items-center justify-center border-3"
              style={{ 
                backgroundColor: colors.primary,
                borderColor: colors.secondary,
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.bgLight} 100%)`
              }}>
              <Sparkles className="h-6 w-6" style={{ color: colors.secondary }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
              Commencez Votre Voyage
            </h1>
          </div>
        </div>

        <Card className="border-0 shadow-xl overflow-hidden"
          style={{ 
            backgroundColor: 'white',
            borderColor: colors.secondary + '20'
          }}>
          <CardHeader className="pb-6 border-b"
            style={{ borderColor: colors.secondary + '20' }}>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-3"
              style={{ color: colors.primary }}>
              <User className="h-6 w-6" style={{ color: colors.secondary }} />
              Créer un Compte
            </CardTitle>
            <CardDescription className="text-center text-base">
              Entrez vos coordonnées pour commencer
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-3">
                <Label htmlFor="username" className="flex items-center gap-2 font-semibold"
                  style={{ color: colors.primary }}>
                  <User className="h-4 w-4" style={{ color: colors.secondary }} />
                  Nom d'utilisateur
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <User className="h-5 w-5" style={{ color: colors.bgLight + '40' }} />
                  </div>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Entrez votre nom d'utilisateur"
                    required
                    className="w-full pl-11 py-6 transition-all duration-200 focus:scale-[1.01]"
                    disabled={isLoading || registrationSuccess}
                    style={{ 
                      borderColor: colors.secondary + '30',
                      color: colors.primary
                    }}
                  />
                </div>
                {formErrors.username && (
                  <div className="text-sm px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: colors.danger + '10',
                      color: colors.danger
                    }}>
                    {formErrors.username}
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-3">
                <Label htmlFor="email" className="flex items-center gap-2 font-semibold"
                  style={{ color: colors.primary }}>
                  <Mail className="h-4 w-4" style={{ color: colors.secondary }} />
                  Adresse Email
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Mail className="h-5 w-5" style={{ color: colors.bgLight + '40' }} />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Entrez votre email"
                    required
                    className="w-full pl-11 py-6 transition-all duration-200 focus:scale-[1.01]"
                    disabled={isLoading || registrationSuccess}
                    style={{ 
                      borderColor: colors.secondary + '30',
                      color: colors.primary
                    }}
                  />
                </div>
                {formErrors.email && (
                  <div className="text-sm px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: colors.danger + '10',
                      color: colors.danger
                    }}>
                    {formErrors.email}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <Label htmlFor="password" className="flex items-center gap-2 font-semibold"
                  style={{ color: colors.primary }}>
                  <Lock className="h-4 w-4" style={{ color: colors.secondary }} />
                  Mot de passe
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Lock className="h-5 w-5" style={{ color: colors.bgLight + '40' }} />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Créez un mot de passe (min. 6 caractères)"
                    required
                    className="w-full pl-11 pr-11 py-6 transition-all duration-200 focus:scale-[1.01]"
                    disabled={isLoading || registrationSuccess}
                    style={{ 
                      borderColor: colors.secondary + '30',
                      color: colors.primary
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-200 hover:scale-110"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ color: colors.secondary }}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <div className="text-sm px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: colors.danger + '10',
                      color: colors.danger
                    }}>
                    {formErrors.password}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 font-semibold"
                  style={{ color: colors.primary }}>
                  <Lock className="h-4 w-4" style={{ color: colors.secondary }} />
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Shield className="h-5 w-5" style={{ color: colors.bgLight + '40' }} />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirmez votre mot de passe"
                    required
                    className="w-full pl-11 pr-11 py-6 transition-all duration-200 focus:scale-[1.01]"
                    disabled={isLoading || registrationSuccess}
                    style={{ 
                      borderColor: colors.secondary + '30',
                      color: colors.primary
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-200 hover:scale-110"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ color: colors.secondary }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <div className="text-sm px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: colors.danger + '10',
                      color: colors.danger
                    }}>
                    {formErrors.confirmPassword}
                  </div>
                )}
              </div>

              {error && !registrationSuccess && (
                <div className="p-3 rounded-lg text-sm font-medium text-center"
                  style={{ 
                    backgroundColor: colors.danger + '10',
                    color: colors.danger,
                    borderColor: colors.danger + '30'
                  }}>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full mt-2 py-6 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group"
                style={{ 
                  backgroundColor: colors.secondary,
                  color: colors.primary
                }}
                disabled={isLoading || registrationSuccess}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Création du compte...
                  </>
                ) : registrationSuccess ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Redirection...
                  </>
                ) : (
                  'Créer un compte'
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="pt-6 border-t text-center"
              style={{ borderColor: colors.secondary + '20' }}>
              <p className="text-sm mb-4" style={{ color: colors.bgLight }}>
                Vous avez déjà un compte ?{" "}
                <Link
                  to="/login"
                  className="font-bold transition-all duration-200 hover:scale-105 inline-block"
                  style={{ color: colors.accent }}
                >
                  Se connecter
                </Link>
              </p>

              {/* Credit Info - Kept as info box, not modal */}
              <div className="p-4 rounded-xl border"
                style={{ 
                  backgroundColor: colors.secondary + '10',
                  borderColor: colors.secondary + '30',
                  color: colors.primary
                }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.secondary + '20' }}>
                    <Gift className="h-5 w-5" style={{ color: colors.secondary }} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Cadeau de bienvenue ! 🎁</p>
                    <p className="text-sm">
                      Recevez <strong>5 crédits gratuits</strong> pour commencer à discuter avec nos coachs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs" style={{ color: colors.bgLight }}>
            © {new Date().getFullYear()} HecateVoyance. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}