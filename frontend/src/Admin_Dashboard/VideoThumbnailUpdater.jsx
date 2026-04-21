
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, CameraIcon } from "lucide-react";
import { toast } from "sonner";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";
import axios from "axios";
import Dashboard_Navbar from './Admin_Navbar';
import Doctor_Side_Bar from './SideBar';
import { useAdminAuth } from '@/context/AdminAuthContext';

const VideoThumbnailUpdater = () => {
  const [formData, setFormData] = useState({
    thumbnailFile: null,
    thumbnailPublicId: null,
    currentThumbnailUrl: null,
    metadata: {},
  });
  const [isLoading, setIsLoading] = useState(false);
    const [side, setSide] = useState(false);
  const { admin } = useAdminAuth();

  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState(null);
  const cld = new Cloudinary({ cloud: { cloudName: "dovyqaltq" } }); // Replace with your Cloudinary cloud name

  const extractPublicId = (url) => {
    if (!url) return null;
    const match = url.match(/\/v\d+\/([^/]+)\.\w+$/);
    return match ? match[1] : null;
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "ml_default"); // Replace with your upload preset

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/dovyqaltq/image/upload`, {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Upload failed");
      return { secure_url: json.secure_url, public_id: json.public_id };
    } catch (err) {
      throw new Error(`Image upload failed: ${err.message}`);
    }
  };

  // Fetch the single thumbnail on mount
  useEffect(() => {
    setIsLoading(true);
    axios
      .get(`${import.meta.env.VITE_BASE_URL}/api/thumbnails`)
      .then((res) => {
        const data = res.data.data;
        setFormData({
          thumbnailFile: null,
          thumbnailPublicId: extractPublicId(data.thumbnailUrl) || null,
          currentThumbnailUrl: data.thumbnailUrl || null,
          metadata: data.metadata || {},
        });
        setThumbnailPreviewUrl(null);
      })
      .catch((error) => {
        if (error.response?.status !== 404) {
          toast.error(error.response?.data?.error || "Failed to fetch thumbnail");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, thumbnailFile: file, thumbnailPublicId: null });
      setThumbnailPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!formData.thumbnailFile) {
      toast.error("Please select a thumbnail image to upload");
      return;
    }

    setIsLoading(true);

    try {
      const thumbnailData = await uploadToCloudinary(formData.thumbnailFile);
      const thumbnailUrl = thumbnailData.secure_url;

      const payload = {
        thumbnailUrl,
        metadata: { description: 'Uploaded from frontend' },
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/thumbnails`,
        payload
      );

      setFormData({
        thumbnailFile: null,
        thumbnailPublicId: thumbnailData.public_id,
        currentThumbnailUrl: thumbnailUrl,
        metadata: payload.metadata,
      });
      setThumbnailPreviewUrl(null);
      toast.success(response.data.message || "Thumbnail processed successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || "Failed to process thumbnail");
    } finally {
      setIsLoading(false);
    }
  };

  let cldThumbnail = null;
  if (formData.thumbnailPublicId) {
    cldThumbnail = cld
      .image(formData.thumbnailPublicId)
      .format("auto")
      .quality("auto")
      .resize(auto().gravity(autoGravity()).width(300).height(169));
  }

  return (
     <div>
      <Dashboard_Navbar side={side} setSide={setSide} user={admin} />

      <div className="dashboard-wrapper">
        <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />

        <div className="dashboard-side min-h-screen">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-extrabold text-center my-6">
            Users Chat
          </h2>

    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Upload/Update Thumbnail</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="relative flex justify-center">
          {cldThumbnail ? (
            <AdvancedImage cldImg={cldThumbnail} className="w-full h-auto rounded" />
          ) : thumbnailPreviewUrl ? (
            <img src={thumbnailPreviewUrl} alt="Thumbnail Preview" className="w-full h-auto rounded" />
          ) : (
            <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded">
              <span>No Thumbnail</span>
            </div>
          )}
          <label
            htmlFor="thumbnail-upload"
            className="absolute bottom-2 right-2 bg-primary text-white rounded-full p-2 cursor-pointer"
          >
            <CameraIcon className="h-5 w-5" />
            <input
              id="thumbnail-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailChange}
            />
          </label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#3B5EB7] text-white hover:bg-[#334fa1] transition-colors duration-200"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4" />}
          Upload/Update Thumbnail
        </Button>
      </form>
    </div>
    </div>
    </div></div>
  );
};

export default VideoThumbnailUpdater;
