
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

const VideoSection = () => {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the single thumbnail on mount
  useEffect(() => {
    setIsLoading(true);
    axios
      .get(`${import.meta.env.VITE_BASE_URL}/api/thumbnails`)
      .then((res) => {
        const data = res.data.data;
        setThumbnailUrl(data.thumbnailUrl || null);
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

  return (
    <div className="mt-12 max-w-4xl mx-auto px-4 py-8">
      {/* Responsive & Centered Video with Thumbnail as Poster */}
      <div className="w-full flex justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-center mb-8">Bekijk video hier</h2>

          {isLoading ? (
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg h-40 bg-gray-200 flex items-center justify-center rounded-lg shadow-md md:w-[600px] md:h-[337px]">
              <span>Loading thumbnail...</span>
            </div>
          ) : (
            <video
              className="w-full max-w-sm sm:max-w-md md:max-w-lg h-auto aspect-video rounded-lg object-cover shadow-md
                   md:w-[600px] md:h-[500px]"
        controls
        preload="metadata"
              poster={thumbnailUrl || undefined} // Use thumbnailUrl as poster, fallback to no poster if null
            >
              <source src="/Spiritueelchatten.mov" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          <div className="bg-green-600 text-white py-3 rounded-b-lg -mt-1">
            <span className="text-lg font-semibold">Watch video</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSection;
