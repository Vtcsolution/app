import Navigation from "./Navigator";
import { Eye, Lock, CreditCard, Calendar, CameraIcon, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "./screen/AuthContext";
import { toast } from "sonner";
import { Cloudinary } from "@cloudinary/url-gen";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from "axios";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";
import { AdvancedImage } from "@cloudinary/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const Account = () => {
  // Color scheme - same as first file
  const colors = {
    deepPurple: "#2B1B3F",
    antiqueGold: "#C9A24D",
    softIvory: "#F5F3EB",
    lightGold: "#E8D9B0",
    darkPurple: "#1A1129",
  };

  const { user } = useAuth();
  const [amount, setAmount] = useState(0);
  const fee = 0.5;
  const total = amount + fee;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    dob: "",
    bio: "",
    birthTime: "",
    birthPlace: "",
    imageFile: null,
    imagePublicId: null,
    currentImage: null,
  });
  const [credits, setCredits] = useState(0);
  const [payments, setPayments] = useState([]);
  const cld = new Cloudinary({ cloud: { cloudName: "dovyqaltq" } });
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const formatDateOnly = (dobObj) => {
    if (!dobObj) return "";
    if (typeof dobObj === "string") return dobObj.slice(0, 10);
    if (dobObj.$date) return dobObj.$date.slice(0, 10);
    if (dobObj instanceof Date) return dobObj.toISOString().slice(0, 10);
    return "";
  };

  const extractPublicId = (url) => {
    if (!url) return null;
    const match = url.match(/\/v\d+\/([^/]+)\.\w+$/);
    return match ? match[1] : null;
  };

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
    } catch (err) {
      throw new Error("Image upload failed: " + err.message);
    }
  };

  useEffect(() => {
    if (!user || !user._id) return;

    setIsLoading(true);
    axios
      .get(`${import.meta.env.VITE_BASE_URL}/api/users/user/${user._id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      .then((res) => {
        const data = res.data.user;
        setFormData({
          username: data.username || "",
          email: data.email || "",
          dob: formatDateOnly(data.dob) || "",
          bio: data.bio || "",
          birthTime: data.birthTime || "",
          birthPlace: data.birthPlace || "",
          imageFile: null,
          imagePublicId: extractPublicId(data.image) || null,
          currentImage: data.image || null,
        });
        setCredits(data.credits || 0);
        setPayments(data.payments || []);
        setImagePreviewUrl(data.image || null);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Échec du chargement du profil utilisateur");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user?._id, user?.token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, imageFile: file, imagePublicId: null });
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let publicId = formData.imagePublicId;

      if (formData.imageFile) {
        publicId = await uploadToCloudinary(formData.imageFile);
        setFormData((prev) => ({ ...prev, imagePublicId: extractPublicId(publicId) }));
        setImagePreviewUrl(null);
      }

      const payload = {
        username: formData.username || undefined,
        email: formData.email || undefined,
        dob: formData.dob || undefined,
        birthTime: formData.birthTime || undefined,
        birthPlace: formData.birthPlace || undefined,
        bio: formData.bio || undefined,
      };

      if (formData.imageFile && publicId) {
        payload.image = publicId;
      } else if (formData.currentImage) {
        payload.image = formData.currentImage;
      }

      Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/users/update-user/${user._id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      
      toast.success(response.data.message || "Profil mis à jour avec succès");
      
      if (user?._id && user?.token) {
        const refreshResponse = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/users/user/${user._id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        const updatedData = refreshResponse.data.user;
        setFormData(prev => ({
          ...prev,
          birthPlace: updatedData.birthPlace || "",
        }));
      }
      
    } catch (error) {
      console.error('❌ Update error:', error.response?.data || error);
      toast.error(error.response?.data?.message || "Échec de la mise à jour du profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!user?._id) {
      return toast.error("Utilisateur non connecté");
    }

    if (newPassword !== confirmPassword) {
      return toast.error("Les nouveaux mots de passe ne correspondent pas");
    }

    if (newPassword.length < 6) {
      return toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères");
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/users/update-password/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Échec de la mise à jour du mot de passe");
      }

      toast.success("Mot de passe mis à jour avec succès");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cldImage = formData.imagePublicId
    ? cld
        .image(formData.imagePublicId)
        .format("auto")
        .quality("auto")
        .resize(auto().gravity(autoGravity()).width(128).height(128))
    : null;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "succeeded":
        return <span className="mr-1">✓</span>;
      case "pending":
      case "processing":
        return <span className="mr-1">⏳</span>;
      case "failed":
        return <span className="mr-1">✗</span>;
      default:
        return null;
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "succeeded":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Truncate payment ID for display
  const truncateId = (id) => {
    if (!id) return "N/A";
    if (id.length <= 16) return id;
    return `${id.substring(0, 8)}...${id.substring(id.length - 8)}`;
  };

  if (!user || !user._id || (isLoading && !formData.username)) {
    return (
      <div className="flex justify-center items-center h-40" style={{ backgroundColor: colors.softIvory }}>
        <Loader2 className="animate-spin h-6 w-6" style={{ color: colors.antiqueGold }} />
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4" style={{ backgroundColor: colors.softIvory }}>
      <div className="max-w-7xl mx-auto pb-10">
        <Navigation />
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Settings Card */}
            <Card className="shadow-lg rounded-xl border-0 overflow-hidden" style={{ backgroundColor: "white" }}>
              <CardHeader className="pb-4" style={{ backgroundColor: colors.deepPurple }}>
                <CardTitle className="text-xl font-bold text-white">Paramètres du Profil</CardTitle>
                <CardDescription className="text-gray-200">Gérez les paramètres de votre compte et vos informations personnelles</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={onSubmit} className="space-y-8">
                  <div className="flex flex-col items-center sm:flex-row sm:items-start gap-8">
                    <div className="relative">
                      <div className="relative">
                        <Avatar className="h-32 w-32 border-4" style={{ borderColor: colors.antiqueGold }}>
                          {cldImage ? (
                            <AdvancedImage cldImg={cldImage} />
                          ) : imagePreviewUrl ? (
                            <AvatarImage src={imagePreviewUrl} alt="Aperçu" className="object-cover" />
                          ) : (
                            <AvatarFallback className="text-2xl" 
                              style={{ backgroundColor: colors.deepPurple, color: colors.softIvory }}>
                              {formData.username?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <label
                          htmlFor="avatar-upload"
                          className="absolute bottom-0 right-0 rounded-full p-2 cursor-pointer shadow-lg"
                          style={{ backgroundColor: colors.antiqueGold }}
                        >
                          <CameraIcon className="h-5 w-5" style={{ color: colors.deepPurple }} />
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-center mt-2" style={{ color: colors.deepPurple + "CC" }}>
                        Cliquez pour changer la photo
                      </p>
                    </div>

                    <div className="flex-1 space-y-6 w-full">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="font-medium" style={{ color: colors.deepPurple }}>
                          Nom d'utilisateur
                        </Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={handleChange}
                          placeholder="johndoe"
                          className="border-gray-300 focus:border-[#C9A24D] focus:ring-[#C9A24D]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="font-medium" style={{ color: colors.deepPurple }}>
                          Email
                        </Label>
                        <Input
                          id="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john.doe@example.com"
                          className="border-gray-300 focus:border-[#C9A24D] focus:ring-[#C9A24D]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="dob" className="font-medium" style={{ color: colors.deepPurple }}>
                        Date de Naissance
                      </Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dob}
                        onChange={handleChange}
                        className="border-gray-300 focus:border-[#C9A24D] focus:ring-[#C9A24D]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="birthTime" className="font-medium" style={{ color: colors.deepPurple }}>
                        Heure de Naissance
                      </Label>
                      <Input
                        id="birthTime"
                        type="time"
                        value={formData.birthTime}
                        onChange={handleChange}
                        className="border-gray-300 focus:border-[#C9A24D] focus:ring-[#C9A24D]"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="birthPlace" className="font-medium flex items-center gap-2" style={{ color: colors.deepPurple }}>
                        <MapPin className="h-4 w-4" />
                        Lieu de Naissance
                      </Label>
                      <Input
                        id="birthPlace"
                        value={formData.birthPlace}
                        onChange={handleChange}
                        placeholder="Ville, Pays (ex: Paris, France)"
                        className="border-gray-300 focus:border-[#C9A24D] focus:ring-[#C9A24D]"
                      />
                      <p className="text-sm" style={{ color: colors.deepPurple + "CC" }}>
                        Requis pour des lectures astrologiques précises. Format : Ville, Pays
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="font-medium" style={{ color: colors.deepPurple }}>
                      Biographie
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Parlez-nous un peu de vous"
                      className="resize-none min-h-[120px] border-gray-300 focus:border-[#C9A24D] focus:ring-[#C9A24D]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="rounded-lg px-8"
                      style={{ 
                        backgroundColor: colors.antiqueGold,
                        color: colors.deepPurple
                      }}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enregistrer les Modifications
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="shadow-lg rounded-xl border-0 overflow-hidden" style={{ backgroundColor: "white" }}>
              <CardHeader className="pb-4" style={{ backgroundColor: colors.deepPurple }}>
                <CardTitle className="text-xl font-bold text-white">Changer le Mot de Passe</CardTitle>
                <CardDescription className="text-gray-200">Entrez votre mot de passe actuel et choisissez un nouveau mot de passe</CardDescription>
              </CardHeader>
              <form onSubmit={handleChangePassword}>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="font-medium" style={{ color: colors.deepPurple }}>
                      Mot de Passe Actuel
                    </Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        className="pr-10 border-gray-300 focus:border-[#C9A24D] focus:ring-[#C9A24D]"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: colors.antiqueGold }}
                      >
                        <Eye />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="font-medium" style={{ color: colors.deepPurple }}>
                      Nouveau Mot de Passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        className="pr-10 border-gray-300 focus:border-[#C9A24D] focus:ring-[#C9A24D]"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: colors.antiqueGold }}
                      >
                        <Eye />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="font-medium" style={{ color: colors.deepPurple }}>
                      Confirmer le Nouveau Mot de Passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        className="pr-10 border-gray-300 focus:border-[#C9A24D] focus:ring-[#C9A24D]"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: colors.antiqueGold }}
                      >
                        <Eye />
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="mt-2">
                  <Button 
                    type="submit" 
                    className="w-full rounded-lg py-3"
                    disabled={loading}
                    style={{ 
                      backgroundColor: colors.deepPurple,
                      color: colors.softIvory
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mise à jour...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Changer le Mot de Passe
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Credits & Payment History Card */}
            <Card className="shadow-lg rounded-xl border-0 overflow-hidden" style={{ backgroundColor: "white" }}>
              <Accordion type="single" collapsible className="w-full" defaultValue="credits">
                {/* Credits Accordion Item */}
                <AccordionItem value="credits" className="border-0">
                  <AccordionTrigger 
                    className="px-6 py-4 hover:no-underline transition-colors duration-200"
                    style={{ 
                      backgroundColor: colors.deepPurple,
                      color: colors.softIvory
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">Solde des Crédits</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-4">
                    <div className="space-y-4">
                      <div className="p-6 rounded-lg text-center"
                        style={{ backgroundColor: colors.lightGold }}>
                        <div className="text-4xl font-bold mb-2" style={{ color: colors.deepPurple }}>
                          {credits}
                        </div>
                        <div className="text-lg font-medium mb-4" style={{ color: colors.deepPurple }}>
                          Crédits Disponibles
                        </div>
                        <p className="text-sm mb-6" style={{ color: colors.deepPurple + "CC" }}>
                          Utilisez vos crédits pour des consultations premium et services.
                        </p>
                        <Button 
                          className="rounded-lg px-6"
                          style={{ 
                            backgroundColor: colors.antiqueGold,
                            color: colors.deepPurple
                          }}
                        >
                          Ajouter des Crédits
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Payment History Accordion Item */}
                <AccordionItem value="payments" className="border-0">
                  <AccordionTrigger 
                    className="px-6 py-4 hover:no-underline transition-colors duration-200"
                    style={{ 
                      backgroundColor: colors.deepPurple,
                      color: colors.softIvory
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5" />
                      <span className="text-lg font-bold">Historique des Paiements</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-4">
                    {payments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow style={{ backgroundColor: colors.lightGold }}>
                              <TableHead className="font-bold" style={{ color: colors.deepPurple }}>Date et Heure</TableHead>
                              <TableHead className="font-bold" style={{ color: colors.deepPurple }}>ID de Paiement</TableHead>
                              <TableHead className="font-bold" style={{ color: colors.deepPurple }}>Description du Forfait</TableHead>
                              <TableHead className="font-bold" style={{ color: colors.deepPurple }}>Montant</TableHead>
                              <TableHead className="font-bold" style={{ color: colors.deepPurple }}>Crédits</TableHead>
                              <TableHead className="font-bold" style={{ color: colors.deepPurple }}>Méthode</TableHead>
                              <TableHead className="font-bold" style={{ color: colors.deepPurple }}>Statut</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payments.map((payment, index) => (
                              <TableRow 
                                key={payment.molliePaymentId || index}
                                className="hover:bg-opacity-50 transition-colors duration-150"
                                style={{ 
                                  backgroundColor: index % 2 === 0 ? "white" : colors.softIvory,
                                  borderBottomColor: colors.antiqueGold + "30"
                                }}
                              >
                                <TableCell className="font-medium" style={{ color: colors.deepPurple }}>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" style={{ color: colors.antiqueGold }} />
                                    {formatDate(payment.createdAt)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm font-mono" style={{ color: colors.deepPurple + "CC" }}>
                                  {truncateId(payment.molliePaymentId)}
                                </TableCell>
                                <TableCell style={{ color: colors.deepPurple }}>
                                  {payment.planName || "N/A"}
                                </TableCell>
                                <TableCell className="font-bold" style={{ color: colors.deepPurple }}>
                                  <div className="flex items-center gap-1">
                                    €{payment.amount?.toFixed(2) || "0.00"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    className="px-2 py-1"
                                    style={{ 
                                      backgroundColor: colors.deepPurple,
                                      color: colors.softIvory
                                    }}
                                  >
                                    {payment.creditsPurchased || 0}
                                  </Badge>
                                </TableCell>
                                <TableCell className="capitalize" style={{ color: colors.deepPurple }}>
                                  {payment.paymentMethod?.replace("_", " ") || "N/A"}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={`px-2 py-1 text-xs border rounded-full flex items-center justify-center w-24 ${getStatusColor(payment.status)}`}
                                  >
                                    {getStatusIcon(payment.status)}
                                    {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1) || "Inconnu"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        {/* Payment Summary */}
                        <div className="mt-6 p-4 rounded-lg"
                          style={{ backgroundColor: colors.lightGold }}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-3 rounded bg-white">
                              <div className="text-2xl font-bold" style={{ color: colors.deepPurple }}>
                                €{payments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                              </div>
                              <div className="text-sm" style={{ color: colors.deepPurple + "CC" }}>Total Dépensé</div>
                            </div>
                            <div className="text-center p-3 rounded bg-white">
                              <div className="text-2xl font-bold" style={{ color: colors.deepPurple }}>
                                {payments.filter(p => p.status?.toLowerCase() === 'completed' || p.status?.toLowerCase() === 'succeeded').length}
                              </div>
                              <div className="text-sm" style={{ color: colors.deepPurple + "CC" }}>Paiements Réussis</div>
                            </div>
                            <div className="text-center p-3 rounded bg-white">
                              <div className="text-2xl font-bold" style={{ color: colors.deepPurple }}>
                                {payments.reduce((sum, p) => sum + (p.creditsPurchased || 0), 0)}
                              </div>
                              <div className="text-sm" style={{ color: colors.deepPurple + "CC" }}>Crédits Achetés au Total</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                          style={{ backgroundColor: colors.lightGold }}>
                          <CreditCard className="h-8 w-8" style={{ color: colors.antiqueGold }} />
                        </div>
                        <h4 className="font-bold text-lg mb-2" style={{ color: colors.deepPurple }}>
                          Aucun Historique de Paiement
                        </h4>
                        <p className="text-sm mb-4 max-w-md mx-auto" style={{ color: colors.deepPurple + "CC" }}>
                          Vous n'avez encore effectué aucun achat. Commencez votre voyage avec nos services.
                        </p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;