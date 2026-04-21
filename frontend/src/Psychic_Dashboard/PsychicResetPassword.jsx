import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Key, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function PsychicResetPassword() {
  const { resetToken } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [psychicInfo, setPsychicInfo] = useState(null);
  const [checkingToken, setCheckingToken] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/human-psychics/verify-reset-token/${resetToken}`
        );
        const data = await response.json();
        
        if (response.ok) {
          setIsValidToken(true);
          setPsychicInfo(data.psychic);
        } else {
          setError(data.message || "Lien de réinitialisation invalide ou expiré");
        }
      } catch (error) {
        setError("Échec de la vérification du lien de réinitialisation");
      } finally {
        setCheckingToken(false);
      }
    };

    if (resetToken) {
      verifyToken();
    }
  }, [resetToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsLoading(true);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/human-psychics/reset-password/${resetToken}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, confirmPassword }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Réinitialisation du mot de passe réussie ! Redirection vers la connexion...");
        setTimeout(() => navigate("/psychic/login"), 3000);
      } else {
        setError(data.message || "Échec de la réinitialisation du mot de passe");
      }
    } catch (error) {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-red-600 flex items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Lien de réinitialisation invalide
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error || "Ce lien de réinitialisation est invalide ou a expiré."}</p>
            <Link to="/psychic/forgot-password">
              <Button className="bg-purple-700 hover:bg-purple-800">
                Demander un nouveau lien
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-amber-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-purple-900">
            Définir un nouveau mot de passe
          </CardTitle>
          {psychicInfo && (
            <p className="text-center text-gray-600">
              Pour : {psychicInfo.email}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {message}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-purple-700 hover:bg-purple-800"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Réinitialiser le mot de passe
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}