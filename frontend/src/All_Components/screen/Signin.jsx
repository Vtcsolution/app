import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Mail, Lock, Sparkles, Eye, EyeOff } from "lucide-react";

// Color scheme to match psychic pages
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

export default function Signin() {
  const { login, user, loading, error } = useAuth();
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form with:", credentials);
    try {
      const result = await login(credentials);
      console.log("Login result:", result);
      if (result?.success) {
        toast.success("Connexion réussie");
        console.log("Navigating to / after successful login");
        navigate("/", { replace: true });
      } else {
        toast.error(result?.message || "Échec de la connexion");
      }
    } catch (err) {
      console.error("Form submission error:", err);
      toast.error("Une erreur inattendue s'est produite");
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
              Bon Retour
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
              <Lock className="h-6 w-6" style={{ color: colors.secondary }} />
              Connexion
            </CardTitle>
            <CardDescription className="text-center text-base">
              Entrez vos identifiants pour vous connecter
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-3">
                <Label htmlFor="email" className="flex items-center gap-2 font-semibold"
                  style={{ color: colors.primary }}>
                  <Mail className="h-4 w-4" style={{ color: colors.secondary }} />
                  Email
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Mail className="h-5 w-5" style={{ color: colors.bgLight + '40' }} />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Entrez votre email"
                    className="w-full pl-11 py-6 transition-all duration-200 focus:scale-[1.01]"
                    value={credentials.email}
                    onChange={handleChange}
                    style={{ 
                      borderColor: colors.secondary + '30',
                      color: colors.primary
                    }}
                  />
                </div>
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
                    placeholder="Entrez votre mot de passe"
                    className="w-full pl-11 pr-11 py-6 transition-all duration-200 focus:scale-[1.01]"
                    value={credentials.password}
                    onChange={handleChange}
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
              </div>

              {/* Error Display */}
              {error && (
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
                variant="brand"
                className="w-full mt-2 py-6 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                style={{ 
                  backgroundColor: colors.secondary,
                  color: colors.primary
                }}
                disabled={loading}
              >
                {loading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>

            {/* Forgot Password Link */}
            <div className="text-end pt-2">
              <Link
                to="/forgot-password"
                className="text-sm font-medium transition-all duration-200 hover:scale-105 inline-block"
                style={{ color: colors.accent }}
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: colors.secondary + '20' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white font-medium"
                  style={{ color: colors.bgLight }}>
                  Nouveau sur la plateforme ?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <Link to="/register">
                <Button
                  variant="outline"
                  className="w-full font-bold transition-all duration-300 hover:scale-[1.02]"
                  style={{ 
                    borderColor: colors.secondary,
                    color: colors.secondary,
                    backgroundColor: colors.secondary + '10'
                  }}
                >
                  S'inscrire
                </Button>
              </Link>
            </div>

            {/* Security Note */}
            <div className="text-center pt-4 border-t"
              style={{ borderColor: colors.secondary + '20' }}>
              <p className="text-xs flex items-center justify-center gap-2"
                style={{ color: colors.bgLight }}>
                <Lock className="h-3 w-3" style={{ color: colors.success }} />
                Connexion sécurisée et chiffrée
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
       
      </div>
    </div>
  );
}