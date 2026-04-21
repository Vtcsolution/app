// src/pages/psychic/PsychicLogin.jsx
import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { usePsychicAuth } from '@/context/PsychicAuthContext';
import { Loader2, Lock, Mail, Sparkles, User, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

// Define the color scheme
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

export default function PsychicLogin() {
  const { login, loading } = usePsychicAuth();
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!credentials.email || !credentials.password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const result = await login(credentials);

    if (result?.success) {
      toast.success("Bon retour ! Redirection vers le tableau de bord...");
      setTimeout(() => {
        navigate('/psychic/dashboard', { replace: true });
      }, 1000);
    }
  };

  const handleDemoLogin = () => {
    // Demo credentials for testing
    setCredentials({
      email: "demo@psychic.com",
      password: "demopassword123"
    });
    toast.info("Identifiants de démo chargés. Cliquez sur Se connecter pour continuer.");
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden"
      style={{ backgroundColor: colors.background }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 h-60 w-60 rounded-full" 
          style={{ backgroundColor: colors.accent, filter: 'blur(80px)' }}></div>
        <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full" 
          style={{ backgroundColor: colors.secondary, filter: 'blur(100px)' }}></div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 hidden lg:block">
        <div className="h-32 w-32 rounded-full border-8 opacity-20"
          style={{ borderColor: colors.secondary }}></div>
      </div>
      
      <div className="absolute bottom-10 right-10 hidden lg:block">
        <div className="h-24 w-24 rounded-full border-6 opacity-20"
          style={{ borderColor: colors.accent }}></div>
      </div>

      <div className="w-full max-w-5xl z-10">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full flex items-center justify-center border-4"
                style={{ 
                  backgroundColor: colors.primary,
                  borderColor: colors.secondary,
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.bgLight} 100%)`
                }}>
                <Sparkles className="h-10 w-10" style={{ color: colors.secondary }} />
              </div>
              <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full flex items-center justify-center border-2"
                style={{ 
                  backgroundColor: colors.success,
                  borderColor: colors.background,
                  color: 'white'
                }}>
                <Shield className="h-4 w-4" />
              </div>
            </div>
            
            <div>
              <h1 className="text-4xl font-bold" style={{ color: colors.primary }}>
                Portail Médium
              </h1>
              <p className="text-xl mt-2" style={{ color: colors.bgLight }}>
                Accédez à votre Pratique Spirituelle
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-1 gap-8">
          {/* Left Column - Welcome & Features */}
         

          {/* Right Column - Login Form */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="pb-6 border-b"
              style={{ borderColor: colors.secondary + '20' }}>
              <CardTitle className="text-2xl font-bold flex items-center gap-3"
                style={{ color: colors.primary }}>
                <Lock className="h-6 w-6" style={{ color: colors.secondary }} />
                Connexion Sécurisée
              </CardTitle>
              <CardDescription>
                Entrez vos identifiants pour accéder au portail médium
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="flex items-center gap-2 font-bold"
                    style={{ color: colors.primary }}>
                    <Mail className="h-4 w-4" style={{ color: colors.secondary }} />
                    Adresse Email
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Mail className="h-5 w-5" style={{ color: colors.bgLight + '50' }} />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={credentials.email}
                      onChange={handleChange}
                      required
                      className="pl-11 text-base py-6 transition-all duration-200 focus:scale-[1.01]"
                      style={{ 
                        borderColor: colors.secondary + '30',
                        color: colors.primary,
                        backgroundColor: colors.background
                      }}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-3">
                  <Label htmlFor="password" className="flex items-center gap-2 font-bold"
                    style={{ color: colors.primary }}>
                    <Lock className="h-4 w-4" style={{ color: colors.secondary }} />
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Lock className="h-5 w-5" style={{ color: colors.bgLight + '50' }} />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={credentials.password}
                      onChange={handleChange}
                      required
                      className="pl-11 pr-11 text-base py-6 transition-all duration-200 focus:scale-[1.01]"
                      style={{ 
                        borderColor: colors.secondary + '30',
                        color: colors.primary,
                        backgroundColor: colors.background
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
                  
                  <div className="flex justify-between items-center">
                    <Link
                      to="/psychic/forgot-password"
                      className="text-sm font-medium transition-all duration-200 hover:scale-105"
                      style={{ color: colors.accent }}
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                    >
                      <span className="flex items-center gap-1">
                        Mot de passe oublié ?
                        <ArrowRight className={`h-3 w-3 transition-transform duration-200 ${isHovered ? 'translate-x-1' : ''}`} />
                      </span>
                    </Link>
                    
                    <div className="text-xs" style={{ color: colors.bgLight }}>
                      {credentials.password.length > 0 && (
                        <span className={`font-medium ${credentials.password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                          {credentials.password.length >= 8 ? '✓ Fort' : 'Trop court'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full font-bold text-lg py-6 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group"
                  style={{ 
                    backgroundColor: colors.secondary,
                    color: colors.primary
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Authentification...
                    </>
                  ) : (
                    <>
                      <span className="flex items-center justify-center gap-2">
                        Accéder au Portail
                        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
                      </span>
                    </>
                  )}
                </Button>
              </form>

              {/* Security Note */}
              <div className="pt-6 border-t text-center"
                style={{ borderColor: colors.secondary + '20' }}>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Shield className="h-5 w-5" style={{ color: colors.success }} />
                  <p className="text-sm font-medium" style={{ color: colors.bgLight }}>
                    Votre connexion est sécurisée et cryptée
                  </p>
                </div>
                
                {/* Demo Credentials Note */}
                <div className="mt-4 p-3 rounded-lg border text-left"
                  style={{ 
                    backgroundColor: colors.primary + '05',
                    borderColor: colors.accent + '30',
                    color: colors.bgLight
                  }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: colors.primary }}>
                    🚀 Accès Rapide de Test
                  </p>
                  <p className="text-xs">
                    Cliquez sur "Essayer l'accès démo" pour remplir automatiquement les identifiants de test
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-6 border-t"
              style={{ borderColor: colors.secondary + '20' }}>
              <div className="text-center w-full">
                <p className="text-sm" style={{ color: colors.bgLight }}>
                  Vous avez déjà un compte ?{" "}
                  <Link 
                    to="/psychic/register"
                    className="font-bold hover:underline transition-all duration-200 hover:scale-105 inline-block"
                    style={{ color: colors.secondary }}
                  >
                    Se connecter
                  </Link>
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-1 w-1 rounded-full animate-pulse"
                style={{ 
                  backgroundColor: colors.secondary,
                  animationDelay: `${i * 0.2}s`
                }}></div>
            ))}
          </div>
          <p className="text-sm" style={{ color: colors.bgLight }}>
            © {new Date().getFullYear()} HecateVoyance. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}