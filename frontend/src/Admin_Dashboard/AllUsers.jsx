import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Dashboard_Navbar from './Admin_Navbar';
import Doctor_Side_Bar from './SideBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Edit, Trash, DollarSign, ChevronLeft, ChevronRight, User, Sparkles, Crown, Users, Eye } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from 'axios';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { useAdminAuth } from "@/context/AdminAuthContext";

// Color scheme matching psychic dashboard
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

const AllUsers = () => {
  const { admin } = useAdminAuth();
  const [side, setSide] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [psychics, setPsychics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bio, setBio] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [creditsToAdd, setCreditsToAdd] = useState("");
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
  });

  const handleBio = (bioo) => setBio(bioo);

  const fetchPsychics = async (page = 1, limit = 10) => {
    try {
      console.log('Admin token:', admin.token);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/users/all?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${admin.token}` },
        withCredentials: true,
      });

      console.log('API Response:', response.data);
      setPsychics(response.data.users || []);
      setPagination(response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        limit: 10,
      });
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err.response ? err.response.data : err.message);
      setError(err.message);
      setLoading(false);
      toast.error("Failed to fetch users");
    }
  };

  useEffect(() => {
    setIsLoaded(true);
    fetchPsychics();
  }, []);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );
      return response.data.secure_url;
    } catch (error) {
      toast.error('Failed to upload image');
      return null;
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${admin.token}` },
        withCredentials: true,
      });
      toast.success("User deleted successfully");
      fetchPsychics(pagination.currentPage, pagination.limit);
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteUserId(null);
    }
  };

  const handleUpdate = async (id, updatedData) => {
    try {
      setIsUploading(true);
      if (imageFile) {
        const imageUrl = await uploadImage(imageFile);
        if (imageUrl) updatedData.image = imageUrl;
      }
      await axios.put(`${import.meta.env.VITE_BASE_URL}/api/users/update-user/${id}`, updatedData, {
        headers: { Authorization: `Bearer ${admin.token}` },
        withCredentials: true,
      });
      toast.success("Updated successfully");
      fetchPsychics(pagination.currentPage, pagination.limit);
      setImageFile(null);
      setImagePreview("");
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddCredits = async (userId) => {
    try {
      setIsAddingCredits(true);
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/wallet/add-credits`, {
        userId,
        credits: parseFloat(creditsToAdd)
      }, {
        headers: { Authorization: `Bearer ${admin.token}` },
        withCredentials: true,
      });
      toast.success(`Successfully added ${creditsToAdd} credits`);
      setCreditsToAdd("");
      fetchPsychics(pagination.currentPage, pagination.limit);
    } catch (err) {
      toast.error("Failed to add credits");
    } finally {
      setIsAddingCredits(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openDeleteDialog = (id) => {
    setDeleteUserId(id);
    setDeleteDialogOpen(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchPsychics(newPage, pagination.limit);
    }
  };

  if (loading || error) {
    return (
      <div style={{ backgroundColor: colors.background }}>
        <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
        <div className="flex pt-16">
          <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />
          <div className="flex-1 min-h-screen p-4 md:p-6 lg:p-8 ml-0 lg:ml-64 flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.secondary }}></div>
                <p style={{ color: colors.primary + '70' }}>Loading users...</p>
              </div>
            ) : (
              <p className="text-red-500">Error: {error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.background }}>
      <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
      <div className="flex pt-16">
        <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />
        <div className="flex-1 min-h-screen p-4 md:p-6 lg:p-8 ml-0 lg:ml-64">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-6 w-6" style={{ color: colors.secondary }} />
                <h2 className='text-2xl sm:text-3xl font-bold' style={{ color: colors.primary }}>
                  All Users
                </h2>
              </div>
              <p className="text-muted-foreground mt-1" style={{ color: colors.primary + '80' }}>
                Manage all registered users on the platform
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fetchPsychics(pagination.currentPage, pagination.limit)}
                style={{
                  borderColor: colors.secondary,
                  color: colors.secondary,
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="mx-4">
            <Card 
              className="border-none shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, white 0%, ${colors.primary}03 100%)`,
                borderColor: colors.primary + '10',
              }}
            >
              <CardHeader 
                className="pb-3" 
                style={{ borderBottomColor: colors.primary + '10' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                      <Users className="h-5 w-5" />
                      Users Data
                    </CardTitle>
                    <CardDescription style={{ color: colors.primary + '70' }}>
                      {pagination.totalUsers} users found
                    </CardDescription>
                  </div>
                  <div className="text-sm" style={{ color: colors.primary + '70' }}>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border" style={{ borderColor: colors.primary + '20' }}>
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: colors.primary + '05' }}>
                        <TableHead style={{ color: colors.primary }}>User</TableHead>
                        <TableHead style={{ color: colors.primary }}>Name</TableHead>
                        <TableHead style={{ color: colors.primary }}>Bio</TableHead>
                        <TableHead style={{ color: colors.primary }}>Credits</TableHead>
                        <TableHead style={{ color: colors.primary }}>Details</TableHead>
                        <TableHead style={{ color: colors.primary, textAlign: 'right' }}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {psychics.map((psychic, index) => (
                        <TableRow 
                          key={psychic._id}
                          style={{ 
                            backgroundColor: index % 2 === 0 ? colors.primary + '02' : 'white',
                          }}
                        >
                          <TableCell>
                            <div 
                              className="w-10 h-10 rounded-full overflow-hidden border-2 shadow-sm"
                              style={{ borderColor: colors.secondary + '30' }}
                            >
                              <img 
                                src={psychic.image || "/images/default-profile.jpg"} 
                                alt="profile" 
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-8 w-8 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: colors.primary + '05' }}
                              >
                                <User className="h-4 w-4" style={{ color: colors.primary }} />
                              </div>
                              <span className="font-medium" style={{ color: colors.primary }}>
                                {psychic.username}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span style={{ color: colors.primary + '80' }}>
                                {psychic.bio?.slice(0, 20)}...
                              </span>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <span
                                    onClick={() => handleBio(psychic.bio)}
                                    className="font-medium hover:underline cursor-pointer ml-1"
                                    style={{ color: colors.secondary }}
                                  >
                                    See More
                                  </span>
                                </DialogTrigger>
                                <DialogContent 
                                  style={{ 
                                    backgroundColor: colors.background,
                                    borderColor: colors.primary + '20',
                                  }}
                                >
                                  <DialogHeader>
                                    <DialogTitle style={{ color: colors.primary }}>User Bio</DialogTitle>
                                    <DialogDescription style={{ color: colors.primary + '70' }}>
                                      {bio}
                                    </DialogDescription>
                                  </DialogHeader>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" style={{ color: colors.secondary }} />
                              <span className="font-bold" style={{ color: colors.primary }}>
                                {psychic.credits || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link
                              to={`/admin/dashboard/user-details/${psychic._id}`}
                              className="font-medium hover:underline cursor-pointer flex items-center gap-1"
                              style={{ color: colors.accent }}
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Link>
                          </TableCell>
                          <TableCell className="flex gap-2 justify-end">
                            {/* Edit Dialog */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  className="hover:scale-105 transition-transform duration-200"
                                  style={{
                                    backgroundColor: colors.accent + '10',
                                    color: colors.accent,
                                    borderColor: colors.accent + '20',
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent 
                                style={{ 
                                  backgroundColor: colors.background,
                                  borderColor: colors.primary + '20',
                                }}
                              >
                                <DialogHeader>
                                  <DialogTitle style={{ color: colors.primary }}>Edit User</DialogTitle>
                                  <DialogDescription style={{ color: colors.primary + '70' }}>
                                    Update user details
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  {/* Image Upload */}
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="image" className="text-right" style={{ color: colors.primary }}>
                                      Image
                                    </Label>
                                    <div className="col-span-3 flex items-center gap-4">
                                      <div 
                                        className="w-16 h-16 rounded-full overflow-hidden border-2"
                                        style={{ borderColor: colors.secondary + '30' }}
                                      >
                                        <img 
                                          src={imagePreview || psychic.image || "/images/default-profile.jpg"} 
                                          alt="Preview" 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <Input 
                                        id="image" 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageChange}
                                        style={{ borderColor: colors.primary + '20' }}
                                      />
                                    </div>
                                  </div>
                                  {/* Name Field */}
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right" style={{ color: colors.primary }}>
                                      Name
                                    </Label>
                                    <Input 
                                      id="name" 
                                      defaultValue={psychic.username} 
                                      className="col-span-3"
                                      style={{ borderColor: colors.primary + '20' }}
                                    />
                                  </div>
                                  {/* Bio Field */}
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="bio" className="text-right" style={{ color: colors.primary }}>
                                      Bio
                                    </Label>
                                    <Textarea 
                                      id="bio" 
                                      defaultValue={psychic.bio} 
                                      className="col-span-3"
                                      style={{ borderColor: colors.primary + '20' }}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    className="hover:scale-105 transition-transform duration-200"
                                    onClick={() => {
                                      const updatedData = {
                                        name: document.getElementById('name').value,
                                        bio: document.getElementById('bio').value
                                      };
                                      handleUpdate(psychic._id, updatedData);
                                    }}
                                    disabled={isUploading}
                                    style={{
                                      backgroundColor: colors.secondary,
                                      color: colors.primary,
                                    }}
                                  >
                                    {isUploading ? "Saving..." : "Save Changes"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Add Credits Dialog */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm"
                                  className="hover:scale-105 transition-transform duration-200"
                                  style={{
                                    backgroundColor: colors.warning + '10',
                                    color: colors.warning,
                                    borderColor: colors.warning + '20',
                                  }}
                                >
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent 
                                style={{ 
                                  backgroundColor: colors.background,
                                  borderColor: colors.primary + '20',
                                }}
                              >
                                <DialogHeader>
                                  <DialogTitle style={{ color: colors.primary }}>Add Credits</DialogTitle>
                                  <DialogDescription style={{ color: colors.primary + '70' }}>
                                    Enter the amount of credits to add to {psychic.username}'s account
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="credits" className="text-right" style={{ color: colors.primary }}>
                                      Credits
                                    </Label>
                                    <Input
                                      id="credits"
                                      type="number"
                                      value={creditsToAdd}
                                      onChange={(e) => setCreditsToAdd(e.target.value)}
                                      className="col-span-3"
                                      min="0"
                                      step="0.01"
                                      style={{ borderColor: colors.primary + '20' }}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    className="hover:scale-105 transition-transform duration-200"
                                    onClick={() => handleAddCredits(psychic._id)}
                                    disabled={isAddingCredits || !creditsToAdd || creditsToAdd <= 0}
                                    style={{
                                      backgroundColor: colors.secondary,
                                      color: colors.primary,
                                    }}
                                  >
                                    {isAddingCredits ? "Adding..." : "Add Credits"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Delete Button */}
                            <Button 
                              size="sm"
                              className="hover:scale-105 transition-transform duration-200"
                              onClick={() => openDeleteDialog(psychic._id)}
                              style={{
                                backgroundColor: colors.danger + '10',
                                color: colors.danger,
                                borderColor: colors.danger + '20',
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4" style={{ borderTopColor: colors.primary + '10' }}>
                  <div className="text-sm" style={{ color: colors.primary + '70' }}>
                    Showing {psychics.length} of {pagination.totalUsers} users
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="hover:scale-105 transition-transform duration-200"
                      style={{
                        borderColor: colors.secondary,
                        color: pagination.currentPage === 1 ? colors.primary + '40' : colors.secondary,
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="self-center px-3 py-1 rounded-md" style={{ 
                      backgroundColor: colors.primary + '05',
                      color: colors.primary,
                    }}>
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="hover:scale-105 transition-transform duration-200"
                      style={{
                        borderColor: colors.secondary,
                        color: pagination.currentPage === pagination.totalPages ? colors.primary + '40' : colors.secondary,
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent 
                style={{ 
                  backgroundColor: colors.background,
                  borderColor: colors.primary + '20',
                }}
              >
                <DialogHeader>
                  <DialogTitle style={{ color: colors.primary }}>Confirm Deletion</DialogTitle>
                  <DialogDescription style={{ color: colors.primary + '70' }}>
                    Are you sure you want to delete this user? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setDeleteDialogOpen(false)}
                    style={{
                      borderColor: colors.primary + '20',
                      color: colors.primary,
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleDelete(deleteUserId)}
                    style={{
                      backgroundColor: colors.danger,
                    }}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllUsers;