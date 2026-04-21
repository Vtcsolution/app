import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User, Mail, Lock, Shield } from "lucide-react";
import Dashboard_Navbar from "./Admin_Navbar";
import Doctor_Side_Bar from "./SideBar";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { toast } from "sonner";
import axios from "axios";

export default function AdminUpdateProfile() {
  const [profileImage, setProfileImage] = useState("");
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [side, setSide] = useState(false);
  const { admin, setAdmin } = useAdminAuth();

  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name || "",
        email: admin.email || "",
        password: "",
        role: "admin",
      });
      setProfileImage(admin.image || "");
    }
  }, [admin]);

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

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let imageUrl = profileImage;

      if (file) {
        toast("Uploading image...");
        imageUrl = await uploadToCloudinary(file);
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        image: imageUrl,
      };

      if (formData.password.trim() !== "") {
        payload.password = formData.password;
      }

      const res = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/admin/profile`,
        payload,
        { withCredentials: true }
      );

      toast.success("Profile updated successfully");
      setAdmin(res.data);
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update profile");
    }
  };

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">
        Loading admin...
      </div>
    );
  }

  return (
    <div>
      <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
      <div className="dashboard-wrapper">
        <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />
        <div className="dashboard-side min-h-screen">
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
            <Card className="w-full max-w-2xl shadow-xl border-0" style={{ 
               
              backdropFilter: 'blur(10px)',
              borderColor: 'rgb(201, 162, 77)',
              borderWidth: '1px'
            }}>
              <CardHeader className="text-center pb-8">
                <div className="mx-auto mb-4 relative">
                  <Avatar className="w-24 h-24 border-4 shadow-lg" style={{ borderColor: 'rgb(201, 162, 77)' }}>
                    <AvatarImage src={profileImage || "/placeholder.svg"} alt="Profile" />
                    <AvatarFallback style={{ backgroundColor: 'rgb(201, 162, 77)' }} className="text-white text-2xl">
                      <User className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="profile-upload"
                    className="absolute -bottom-2 -right-2 rounded-full p-2 cursor-pointer transition-colors shadow-lg"
                    style={{ backgroundColor: 'rgb(201, 162, 77)' }}
                  >
                    <Upload className="w-4 h-4 text-white" />
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <CardTitle className="text-3xl font-bold" style={{ color: 'rgb(201, 162, 77)' }}>
                  Update Profile
                </CardTitle>
                <CardDescription style={{ color: 'rgba(201, 162, 77, 0.8)' }}>
                  Manage your administrative account settings
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2" style={{ color: 'rgb(201, 162, 77)' }}>
                        <User className="w-4 h-4" style={{ color: 'rgb(201, 162, 77)' }} />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                        style={{
                          backgroundColor: 'rgba(201, 162, 77, 0.1)',
                          borderColor: 'rgb(201, 162, 77)',
                          color: 'rgb(201, 162, 77)'
                        }}
                        className="focus:ring-0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2" style={{ color: 'rgb(201, 162, 77)' }}>
                        <Mail className="w-4 h-4" style={{ color: 'rgb(201, 162, 77)' }} />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                        style={{
                          backgroundColor: 'rgba(201, 162, 77, 0.1)',
                          borderColor: 'rgb(201, 162, 77)',
                          color: 'rgb(201, 162, 77)'
                        }}
                        className="focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2" style={{ color: 'rgb(201, 162, 77)' }}>
                        <Lock className="w-4 h-4" style={{ color: 'rgb(201, 162, 77)' }} />
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder="Leave blank to keep current"
                        style={{
                          backgroundColor: 'rgba(201, 162, 77, 0.1)',
                          borderColor: 'rgb(201, 162, 77)',
                          color: 'rgb(201, 162, 77)'
                        }}
                        className="focus:ring-0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-semibold flex items-center gap-2" style={{ color: 'rgb(201, 162, 77)' }}>
                        <Shield className="w-4 h-4" style={{ color: 'rgb(201, 162, 77)' }} />
                        Role
                      </Label>
                      <Input 
                        value="Admin" 
                        disabled 
                        style={{
                          backgroundColor: 'rgba(201, 162, 77, 0.05)',
                          borderColor: 'rgb(201, 162, 77)',
                          color: 'rgba(201, 162, 77, 0.6)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-6" style={{ borderTopColor: 'rgb(201, 162, 77)' }}>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1"
                        style={{
                          borderColor: 'rgb(201, 162, 77)',
                          color: 'rgb(201, 162, 77)',
                          backgroundColor: 'transparent'
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 text-white"
                        style={{ backgroundColor: 'rgb(201, 162, 77)' }}
                      >
                        Save Profile
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}