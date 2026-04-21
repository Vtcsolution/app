import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Loader2, ArrowLeft, Shield, Key, Sparkles } from "lucide-react";

export default function PsychicForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsLoading(true);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Veuillez saisir une adresse email valide");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/human-psychics/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Lien de réinitialisation envoyé à votre email");
      } else {
        setError(data.message || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Échec de la connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-purple-50 to-amber-50">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 h-60 w-60 rounded-full bg-purple-600 blur-[80px]"></div>
        <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-amber-500 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-purple-700 border-2 border-amber-500">
              <Sparkles className="h-6 w-6 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-purple-900">Portail Médium</h1>
          </div>
        </div>

        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="pb-6 border-b border-amber-200 bg-gradient-to-r from-purple-50 to-amber-50">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-3 text-purple-900">
              <Shield className="h-6 w-6 text-amber-600" />
              Réinitialiser le Mot de Passe Médium
            </CardTitle>
            <CardDescription className="text-center text-base">
              Entrez votre email enregistré pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="flex items-center gap-2 font-semibold text-purple-900">
                  <Mail className="h-4 w-4 text-amber-600" />
                  Adresse Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  className="w-full py-6"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {message && (
                <div className="p-4 rounded-xl border text-center bg-green-50 border-green-200">
                  <p className="font-medium text-green-700">{message}</p>
                  <p className="text-sm mt-2 text-gray-600">Vérifiez votre boîte de réception et vos spams</p>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-xl border text-center bg-red-50 border-red-200">
                  <p className="font-medium text-red-700">{error}</p>
                </div>
              )}

              <Button
                className="w-full py-6 text-lg font-bold bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 text-white"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Key className="h-5 w-5 mr-2" />
                    Envoyer le lien de réinitialisation
                  </>
                )}
              </Button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-amber-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white font-medium text-gray-500">
                  Retour à
                </span>
              </div>
            </div>

            <div className="text-center space-y-3">
              <Link to="/psychic/login">
                <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la Connexion Médium
                </Button>
              </Link>
             
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}