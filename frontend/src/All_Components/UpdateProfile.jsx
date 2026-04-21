import React, { useEffect, useState } from "react";
import { Cloudinary } from "@cloudinary/url-gen";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";
import { AdvancedImage } from "@cloudinary/react";
import { toast } from "sonner";
import { Loader2, CameraIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { useAuth } from "./screen/AuthContext";
import Navigation from "./Navigator";

const UpdateProfile = () => {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    dob: "",
    bio: "",
    imageFile: null,
    imagePublicId: null,
  });
  const [credits, setCredits] = useState(0);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const cld = new Cloudinary({ cloud: { cloudName: "dovyqaltq" } });

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
          imageFile: null,
          imagePublicId: extractPublicId(data.image) || null,
        });
        setCredits(data.credits || 0);
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
      let imageUrl = formData.imagePublicId;

      if (formData.imageFile) {
        imageUrl = await uploadToCloudinary(formData.imageFile);
        setFormData((prev) => ({ ...prev, imagePublicId: extractPublicId(imageUrl) }));
        setImagePreviewUrl(null);
      }

      const payload = {
        username: formData.username,
        email: formData.email,
        image: imageUrl || "",
        dob: formData.dob || "",
        bio: formData.bio || "",
      };

      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/users/update-user/${user._id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      toast.success(response.data.message || "Profil mis à jour avec succès");
    } catch (error) {
      toast.error(error.response?.data?.message || "Échec de la mise à jour du profil");
    } finally {
      setIsLoading(false);
    }
  };

  const cldImage = formData.imagePublicId
    ? cld
        .image(formData.imagePublicId)
        .format("auto")
        .quality("auto")
        .resize(auto().gravity(autoGravity()).width(128).height(128))
    : null;

  if (!user || !user._id || (isLoading && !formData.username)) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin h-6 w-6 text-primary" />
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4" >
          <div className="max-w-7xl mx-auto pb-10">
            <Navigation />
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3 space-y-6">

        {/* Profile Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Informations du Profil</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-8">
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-8">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-primary/10">
                    {cldImage ? (
                      <AdvancedImage cldImg={cldImage} />
                    ) : imagePreviewUrl ? (
                      <AvatarImage src={imagePreviewUrl} alt="Aperçu" />
                    ) : (
                      <AvatarFallback className="text-4xl">
                        {formData.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                  >
                    <CameraIcon className="h-5 w-5" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>

                <div className="flex-1 space-y-6 w-full">
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium">Nom d'utilisateur</label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="johndoe"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john.doe@example.com"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="dob" className="text-sm font-medium">Date de Naissance</label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium">Biographie</label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Parlez-nous un peu de vous"
                  className="resize-none min-h-[120px] w-full"
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Reset form to original values
                    window.location.reload();
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer les Modifications
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
    </div></div>
  );
};

export default UpdateProfile;