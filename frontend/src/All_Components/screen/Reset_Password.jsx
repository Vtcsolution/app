import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Shield, Loader2, Check, Key, ArrowLeft } from "lucide-react";

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

export default function ResetPassword() {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/users/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Password reset successful. You can now log in.");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(data.message || "An error occurred. Please try again.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError("Failed to connect to the server. Please try again later.");
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full flex items-center justify-center border-3"
              style={{ 
                backgroundColor: colors.primary,
                borderColor: colors.secondary,
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.bgLight} 100%)`
              }}>
              <Key className="h-6 w-6" style={{ color: colors.secondary }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
              New Password
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
              <Shield className="h-6 w-6" style={{ color: colors.secondary }} />
              Reset Password
            </CardTitle>
            <CardDescription className="text-center text-base">
              Create a new secure password for your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password Field */}
              <div className="space-y-3">
                <Label htmlFor="newPassword" className="flex items-center gap-2 font-semibold"
                  style={{ color: colors.primary }}>
                  <Lock className="h-4 w-4" style={{ color: colors.secondary }} />
                  New Password
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Lock className="h-5 w-5" style={{ color: colors.bgLight + '40' }} />
                  </div>
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full pl-11 pr-11 py-6 transition-all duration-200 focus:scale-[1.01]"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{ 
                      borderColor: colors.secondary + '30',
                      color: colors.primary
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-200 hover:scale-110"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ color: colors.secondary }}
                  >
                    {showNewPassword ? (
                      <span className="text-sm font-medium">Hide</span>
                    ) : (
                      <span className="text-sm font-medium">Show</span>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs"
                  style={{ color: newPassword.length >= 6 ? colors.success : colors.warning }}>
                  <div className={`h-1.5 w-1.5 rounded-full ${newPassword.length >= 6 ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: newPassword.length >= 6 ? colors.success : colors.warning }}></div>
                  <span>{newPassword.length >= 6 ? '✓ Password strength: Good' : 'Password must be at least 6 characters'}</span>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 font-semibold"
                  style={{ color: colors.primary }}>
                  <Lock className="h-4 w-4" style={{ color: colors.secondary }} />
                  Confirm Password
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Check className="h-5 w-5" style={{ color: colors.bgLight + '40' }} />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="w-full pl-11 pr-11 py-6 transition-all duration-200 focus:scale-[1.01]"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{ 
                      borderColor: confirmPassword && newPassword === confirmPassword ? colors.success + '50' : colors.secondary + '30',
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
                      <span className="text-sm font-medium">Hide</span>
                    ) : (
                      <span className="text-sm font-medium">Show</span>
                    )}
                  </button>
                </div>
                {confirmPassword && newPassword === confirmPassword && (
                  <div className="flex items-center gap-2 text-xs"
                    style={{ color: colors.success }}>
                    <div className="h-1.5 w-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: colors.success }}></div>
                    <span>✓ Passwords match</span>
                  </div>
                )}
              </div>

              {/* Display Success Message */}
              {message && (
                <div className="mt-2 p-4 rounded-xl border text-center animate-in fade-in-50 duration-300"
                  style={{ 
                    backgroundColor: colors.success + '10',
                    borderColor: colors.success + '30',
                    color: colors.success
                  }}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: colors.success }}></div>
                    <Check className="h-5 w-5" />
                  </div>
                  <p className="font-medium">{message}</p>
                  <p className="text-sm mt-2" style={{ color: colors.bgLight }}>
                    Redirecting to login in 3 seconds...
                  </p>
                </div>
              )}

              {/* Display Error Message */}
              {error && (
                <div className="mt-2 p-4 rounded-xl border text-center animate-in fade-in-50 duration-300"
                  style={{ 
                    backgroundColor: colors.danger + '10',
                    borderColor: colors.danger + '30',
                    color: colors.danger
                  }}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: colors.danger }}></div>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full mt-2 py-6 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                style={{ 
                  backgroundColor: colors.secondary,
                  color: colors.primary
                }}
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <Key className="h-5 w-5 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: colors.secondary + '20' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white font-medium"
                  style={{ color: colors.bgLight }}>
                  Remember your password?
                </span>
              </div>
            </div>

            {/* Back to Login Link */}
            <div className="text-center">
              <Link to="/login">
                <Button
                  variant="outline"
                  className="w-full font-bold transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                  style={{ 
                    borderColor: colors.secondary,
                    color: colors.secondary,
                    backgroundColor: colors.secondary + '10'
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>

            {/* Security Note */}
            <div className="text-center pt-4 border-t"
              style={{ borderColor: colors.secondary + '20' }}>
              <div className="flex items-center justify-center gap-3 mb-3">
                <Shield className="h-5 w-5" style={{ color: colors.success }} />
                <p className="text-sm font-medium" style={{ color: colors.bgLight }}>
                  Your new password is securely encrypted
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
       
      </div>
    </div>
  );
}