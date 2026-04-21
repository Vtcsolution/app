import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Upload, X, Loader2, CheckCircle, AlertCircle, Plus, Trash2, ArrowLeft, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import Dashboard_Navbar from '../Admin_Navbar';
import Doctor_Side_Bar from '../SideBar';

const colors = {
  primary: "#2B1B3F",
  secondary: "#C9A24D",
  accent: "#9B7EDE",
  bgLight: "#3A2B4F",
  textLight: "#E8D9B0",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  background: "#F5F3EB",
};

// Cloudinary upload function (same as AdminUpdateProfile)
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

// Template content that admins can copy
const BLOG_TEMPLATES = {
  tarot: `<h1>Unlocking the Mysteries of Tarot: A Comprehensive Guide to Tarot Reading</h1>

<p>For centuries, the Tarot has served as a powerful tool for self-discovery, spiritual guidance, and divination. With 78 cards rich in symbolism and meaning, the Tarot offers profound insights into our past, present, and potential futures. Whether you're a curious beginner or seeking to deepen your practice, this comprehensive guide will illuminate the path to mastering the ancient art of Tarot reading.</p>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin: 40px 0;">
    <div style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center;">
        <span style="font-size: 3rem;">🃏</span>
        <h3 style="color: #2B1B3F; margin-top: 10px;">The Major Arcana</h3>
        <p style="color: #666;">22 cards representing life's major spiritual lessons and archetypal energies</p>
    </div>
    <div style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center;">
        <span style="font-size: 3rem;">🎴</span>
        <h3 style="color: #2B1B3F; margin-top: 10px;">The Minor Arcana</h3>
        <p style="color: #666;">56 cards reflecting everyday experiences across four suits</p>
    </div>
    <div style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center;">
        <span style="font-size: 3rem;">🔮</span>
        <h3 style="color: #2B1B3F; margin-top: 10px;">Intuitive Reading</h3>
        <p style="color: #666;">Developing your unique connection with the cards</p>
    </div>
</div>

<h2>The Journey Through the Major Arcana</h2>

<p>The Major Arcana represents the Fool's Journey—the spiritual path each soul walks through life. From The Fool's innocent beginnings to The World's ultimate completion, these 22 cards tell the story of human experience and spiritual evolution.</p>

<h3>The Fool (0): New Beginnings</h3>
<p>Represents innocence, spontaneity, and the leap of faith into unknown territory. When The Fool appears, it signals a new adventure is about to begin. Trust in the universe's guidance as you step onto your path.</p>

<h3>The Magician (I): Manifestation Power</h3>
<p>Symbolizes the power to manifest your desires using all available resources—mind, body, spirit, and material world. You have everything you need to succeed; now take action.</p>

<div style="background: linear-gradient(135deg, #2B1B3F 0%, #4A2F6E 100%); color: white; padding: 40px; border-radius: 20px; margin: 40px 0;">
    <h3 style="color: #E8D9B0; margin-top: 0; text-align: center;">The Four Suits of the Minor Arcana</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
        <div style="text-align: center;">
            <div style="font-size: 2.5rem;">🔥</div>
            <div style="font-weight: bold;">Wands</div>
            <div style="font-size: 0.9rem;">Inspiration, Action, Passion</div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 2.5rem;">💧</div>
            <div style="font-weight: bold;">Cups</div>
            <div style="font-size: 0.9rem;">Emotions, Love, Relationships</div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 2.5rem;">⚔️</div>
            <div style="font-weight: bold;">Swords</div>
            <div style="font-size: 0.9rem;">Intellect, Conflict, Decisions</div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 2.5rem;">💰</div>
            <div style="font-weight: bold;">Pentacles</div>
            <div style="font-size: 0.9rem;">Material World, Work, Health</div>
        </div>
    </div>
</div>

<h2>How to Prepare for a Tarot Reading</h2>

<h3>Creating Sacred Space</h3>
<p>Before a reading, create an environment conducive to spiritual work. Cleanse your space with sage, palo santo, or incense. Light a candle to represent the element of fire and your connection to spirit.</p>

<h3>Cleansing Your Deck</h3>
<p>Regular deck cleansing maintains clear energy for accurate readings. Methods include:</p>
<ul>
    <li>Moonlight cleansing under the full moon</li>
    <li>Selenite or clear quartz placed on top of the deck</li>
    <li>Smudging with sage or palo santo</li>
    <li>Knocking three times on the deck to clear energy</li>
</ul>

<details class="toggle-section" style="background: #F5F3EB; border: 1px solid #E8D9B0; border-radius: 12px; margin: 30px 0;">
    <summary class="toggle-summary" style="background: #E8D9B0; color: #2B1B3F; font-weight: bold; padding: 15px 20px; border-radius: 10px; cursor: pointer;">
        📖 Case Study: How Tarot Guided a Career Transition
    </summary>
    <div class="toggle-content" style="padding: 20px;">
        <p><strong>Client:</strong> Sarah, a corporate executive feeling unfulfilled in her career</p>
        <p><strong>Outcome:</strong> Within six months, Sarah launched her own wellness coaching business.</p>
        <p><em>"The tarot didn't just predict my future—it helped me recognize the truth I already carried within me." - Sarah</em></p>
    </div>
</details>

<h2>Ready to Begin Your Tarot Journey?</h2>

<p>The Tarot is a lifelong companion on your spiritual path, offering wisdom, guidance, and reflection whenever you seek it.</p>`,
  
  astrology: `<h1>Understanding Your Birth Chart: A Complete Guide to Astrological Self-Discovery</h1>

<p>Your birth chart is a cosmic fingerprint—a unique map of the sky at the exact moment you were born. This celestial blueprint holds profound insights into your personality, life purpose, relationships, and soul's journey.</p>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; margin: 40px 0;">
    <div style="background: linear-gradient(135deg, #2B1B3F, #4A2F6E); color: white; padding: 25px; border-radius: 15px; text-align: center;">
        <span style="font-size: 3rem;">☀️</span>
        <h3 style="color: #E8D9B0; margin: 10px 0;">Sun Sign</h3>
        <p>Your core essence, ego, and life purpose</p>
    </div>
    <div style="background: linear-gradient(135deg, #2B1B3F, #4A2F6E); color: white; padding: 25px; border-radius: 15px; text-align: center;">
        <span style="font-size: 3rem;">🌙</span>
        <h3 style="color: #E8D9B0; margin: 10px 0;">Moon Sign</h3>
        <p>Emotions, intuition, and inner world</p>
    </div>
    <div style="background: linear-gradient(135deg, #2B1B3F, #4A2F6E); color: white; padding: 25px; border-radius: 15px; text-align: center;">
        <span style="font-size: 3rem;">⬆️</span>
        <h3 style="color: #E8D9B0; margin: 10px 0;">Rising Sign</h3>
        <p>Your outer personality and how others see you</p>
    </div>
</div>

<h2>The Cosmic Trio: Sun, Moon, and Rising Signs</h2>

<p>These three core components form the foundation of your astrological identity. Together, they create a complete picture of who you are, how you feel, and how you present yourself to the world.</p>

<h3>The Sun: Your Soul's Purpose</h3>
<p>The Sun represents your core identity, vitality, and life's purpose. It's the conscious self—who you're becoming and what brings you alive.</p>

<h3>The Moon: Your Emotional Landscape</h3>
<p>The Moon governs your emotional nature, instincts, and subconscious patterns. It reveals what you need to feel safe and nurtured.</p>

<div style="background: #F5F3EB; padding: 30px; border-radius: 20px; margin: 40px 0;">
    <h3 style="color: #2B1B3F; margin-top: 0;">Calculating Your Birth Chart</h3>
    <p>To generate an accurate birth chart, you need three pieces of information:</p>
    <ul>
        <li><strong>Birth Date:</strong> Month, day, and year</li>
        <li><strong>Birth Time:</strong> The exact hour and minute (crucial for Rising sign)</li>
        <li><strong>Birth Location:</strong> City, state, and country</li>
    </ul>
</div>

<h2>Ready to Explore Your Cosmic Blueprint?</h2>

<p>Your birth chart is a lifetime companion, revealing deeper layers of meaning as you evolve and grow.</p>`,
  
  love: `<h1>Sacred Love: Navigating Relationships Through Spiritual Wisdom</h1>

<p>Love is the most profound force in human experience—a sacred journey of connection, growth, and soul recognition. Whether you're seeking your twin flame, navigating partnership challenges, or healing from past wounds, spiritual wisdom offers guidance for creating authentic, lasting love.</p>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin: 40px 0;">
    <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center;">
        <span style="font-size: 2.5rem;">💕</span>
        <h3 style="color: #2B1B3F; margin-top: 10px;">Self-Love</h3>
        <p>The foundation for all healthy relationships</p>
    </div>
    <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center;">
        <span style="font-size: 2.5rem;">🔥</span>
        <h3 style="color: #2B1B3F; margin-top: 10px;">Sacred Sexuality</h3>
        <p>Honoring intimacy as spiritual practice</p>
    </div>
    <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center;">
        <span style="font-size: 2.5rem;">🕊️</span>
        <h3 style="color: #2B1B3F; margin-top: 10px;">Conscious Communication</h3>
        <p>Deepening connection through authentic expression</p>
    </div>
</div>

<h2>Understanding the Seven Stages of Conscious Relationships</h2>

<p>Conscious relationships evolve through stages, each offering unique opportunities for growth and deepening connection.</p>

<h3>Stage 1: The Soul Recognition</h3>
<p>The initial spark—an energetic recognition that transcends logic. You feel you've known this person before, even if you've just met.</p>

<h3>Stage 2: The Romantic Illusion</h3>
<p>Falling in love with potential—seeing your partner through rose-colored glasses. This stage is beautiful but temporary.</p>

<h3>Stage 3: The Mirror Awakening</h3>
<p>Challenges arise as your partner reflects your unhealed wounds, fears, and patterns. This is where the real work begins.</p>

<div style="background: linear-gradient(135deg, #F5F3EB, #E8D9B0); padding: 35px; border-radius: 20px; margin: 40px 0;">
    <h3 style="color: #2B1B3F; margin-top: 0; text-align: center;">The Five Love Languages</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-top: 20px;">
        <div style="background: white; padding: 15px; border-radius: 10px; text-align: center;">
            <span style="font-size: 1.8rem;">💬</span>
            <div><strong>Words of Affirmation</strong></div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 10px; text-align: center;">
            <span style="font-size: 1.8rem;">⏰</span>
            <div><strong>Quality Time</strong></div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 10px; text-align: center;">
            <span style="font-size: 1.8rem;">🎁</span>
            <div><strong>Receiving Gifts</strong></div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 10px; text-align: center;">
            <span style="font-size: 1.8rem;">🤝</span>
            <div><strong>Acts of Service</strong></div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 10px; text-align: center;">
            <span style="font-size: 1.8rem;">❤️</span>
            <div><strong>Physical Touch</strong></div>
        </div>
    </div>
</div>

<h2>Ready to Deepen Your Sacred Connection?</h2>

<p>Love is not something we find—it's something we become. The healthiest relationships are built on self-awareness, emotional intelligence, and a shared commitment to growth.</p>`
};

const AddBlog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [side, setSide] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentTextareaRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    fullContent: '',
    category: '',
    author: '',
    authorBio: '',
    readTime: '',
    featured: false,
    trending: false,
  });
  
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  
  const [authorImage, setAuthorImage] = useState(null);
  const [authorImagePreview, setAuthorImagePreview] = useState(null);
  const [authorImageUploading, setAuthorImageUploading] = useState(false);
  const [authorImageUrl, setAuthorImageUrl] = useState('');
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [characterCount, setCharacterCount] = useState({
    excerpt: 0,
    fullContent: 0,
    authorBio: 0
  });

  // Load categories from backend
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/blogs/categories/all`);
        setCategories(response.data.data);
      } catch (err) {
        console.error('Error loading categories:', err);
        setCategories([
          'Tarot', 'Astrology', 'Numerology', 'Palmistry', 'Love & Relationships',
          'Career Guidance', 'Spiritual Growth', 'Dream Interpretation',
          'Meditation & Mindfulness', 'Crystal Healing', 'Aura Reading',
          'Past Life Regression', 'Chakra Healing', 'Angel Numbers', 'Psychic Development'
        ]);
      }
    };
    loadCategories();
  }, []);

  // Update character count
  useEffect(() => {
    setCharacterCount({
      excerpt: formData.excerpt.length,
      fullContent: formData.fullContent.length,
      authorBio: formData.authorBio.length
    });
  }, [formData.excerpt, formData.fullContent, formData.authorBio]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'excerpt' && value.length > 200) return;
    if (name === 'authorBio' && value.length > 500) return;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle blog image upload to Cloudinary
  const handleBlogImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File Type", description: "Please select a valid image file", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File Too Large", description: "Image size should be less than 5MB", variant: "destructive" });
        return;
      }
      
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
      
      // Upload to Cloudinary
      setImageUploading(true);
      try {
        const url = await uploadToCloudinary(file);
        setImageUrl(url);
        toast({ title: "Success", description: "Image uploaded successfully", variant: "default" });
      } catch (error) {
        console.error('Upload error:', error);
        toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        setImagePreview(null);
        setImage(null);
      } finally {
        setImageUploading(false);
      }
    }
  };

  // Handle author image upload to Cloudinary
  const handleAuthorImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File Type", description: "Please select a valid image file", variant: "destructive" });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File Too Large", description: "Image size should be less than 2MB", variant: "destructive" });
        return;
      }
      
      setAuthorImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setAuthorImagePreview(reader.result);
      reader.readAsDataURL(file);
      
      // Upload to Cloudinary
      setAuthorImageUploading(true);
      try {
        const url = await uploadToCloudinary(file);
        setAuthorImageUrl(url);
        toast({ title: "Success", description: "Author image uploaded successfully", variant: "default" });
      } catch (error) {
        console.error('Upload error:', error);
        toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        setAuthorImagePreview(null);
        setAuthorImage(null);
      } finally {
        setAuthorImageUploading(false);
      }
    }
  };

  const removeBlogImage = () => {
    setImage(null);
    setImagePreview(null);
    setImageUrl('');
    const fileInput = document.getElementById('blogImage');
    if (fileInput) fileInput.value = '';
  };

  const removeAuthorImage = () => {
    setAuthorImage(null);
    setAuthorImagePreview(null);
    setAuthorImageUrl('');
    const fileInput = document.getElementById('authorImage');
    if (fileInput) fileInput.value = '';
  };

  const copyTemplateToClipboard = async (templateKey) => {
    const template = BLOG_TEMPLATES[templateKey];
    if (template) {
      try {
        await navigator.clipboard.writeText(template);
        setCopied(true);
        toast({ 
          title: "Copied!", 
          description: "Template copied to clipboard", 
          variant: "default" 
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast({ 
          title: "Error", 
          description: "Failed to copy text", 
          variant: "destructive" 
        });
      }
    }
  };

  const insertTemplate = (templateKey) => {
    const template = BLOG_TEMPLATES[templateKey];
    if (template) {
      setFormData(prev => ({ ...prev, fullContent: template }));
      setShowTemplateSelector(false);
      toast({ 
        title: "Template Inserted", 
        description: "Template content added to editor", 
        variant: "default" 
      });
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return false;
    }
    if (!formData.excerpt.trim()) {
      toast({ title: "Error", description: "Excerpt is required", variant: "destructive" });
      return false;
    }
    if (formData.excerpt.length > 200) {
      toast({ title: "Error", description: "Excerpt should be less than 200 characters", variant: "destructive" });
      return false;
    }
    if (!formData.fullContent.trim()) {
      toast({ title: "Error", description: "Full content is required", variant: "destructive" });
      return false;
    }
    if (!formData.category) {
      toast({ title: "Error", description: "Please select a category", variant: "destructive" });
      return false;
    }
    if (!formData.author.trim()) {
      toast({ title: "Error", description: "Author name is required", variant: "destructive" });
      return false;
    }
    if (!formData.readTime.trim()) {
      toast({ title: "Error", description: "Read time is required", variant: "destructive" });
      return false;
    }
    if (!imageUrl && !imagePreview) {
      toast({ title: "Error", description: "Please upload a blog image", variant: "destructive" });
      return false;
    }
    if (formData.authorBio && formData.authorBio.length > 500) {
      toast({ title: "Error", description: "Author bio should be less than 500 characters", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Prepare data with Cloudinary URLs
      const blogData = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.fullContent.trim(),
        category: formData.category,
        author: formData.author.trim(),
        authorBio: formData.authorBio.trim(),
        readTime: formData.readTime.trim(),
        featured: formData.featured,
        trending: formData.trending,
        image: imageUrl, // Cloudinary URL
        authorImage: authorImageUrl || '', // Cloudinary URL
      };
      
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/blogs`, blogData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      toast({ title: "Success!", description: "Blog published successfully! 🎉" });
      
      // Reset form
      setFormData({
        title: '', excerpt: '', fullContent: '', category: '', author: '',
        authorBio: '', readTime: '', featured: false, trending: false,
      });
      setImage(null);
      setImagePreview(null);
      setImageUrl('');
      setAuthorImage(null);
      setAuthorImagePreview(null);
      setAuthorImageUrl('');
      
      setTimeout(() => navigate('/admin/dashboard/blogs'), 1500);
      
    } catch (err) {
      console.error('Error adding blog:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to publish blog. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <Dashboard_Navbar side={side} setSide={setSide} />
      <div className="flex pt-16">
        <Doctor_Side_Bar side={side} setSide={setSide} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 ml-0 lg:ml-64 transition-all duration-300"> 
          {/* Header */}
          <div>
            <button
              onClick={() => navigate('/admin/dashboard/blogs')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Articles
            </button>
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: colors.primary }}>
              Create New Article
            </h1>
            <p className="text-gray-600 text-sm md:text-base mb-6">
              Create and publish engaging spiritual and psychic content
            </p>
          </div>

          {/* Blog Form */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: colors.secondary + '30' }}>
            <form onSubmit={handleSubmit} className="p-5 md:p-6 lg:p-8 space-y-5 md:space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.primary }}>
                  Article Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: colors.secondary + '50' }}
                  placeholder="Enter a captivating title..."
                />
              </div>

              {/* Excerpt */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-sm font-semibold" style={{ color: colors.primary }}>
                    Excerpt <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs ${characterCount.excerpt > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                    {characterCount.excerpt}/200
                  </span>
                </div>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all resize-none"
                  style={{ borderColor: colors.secondary + '50' }}
                  placeholder="Captivating summary of the article..."
                />
              </div>

              {/* Full Content with Template Selector */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold" style={{ color: colors.primary }}>
                    Full Content <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{characterCount.fullContent} characters</span>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors"
                        style={{ backgroundColor: colors.secondary + '20', color: colors.primary }}
                      >
                        <Copy className="h-3 w-3" />
                        Templates
                      </button>
                      {showTemplateSelector && (
                        <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border z-10 w-48 py-1"
                             style={{ borderColor: colors.secondary + '30' }}>
                          <div className="px-3 py-2 text-xs font-semibold border-b" style={{ borderColor: colors.secondary + '20' }}>
                            Choose Template
                          </div>
                          <button
                            type="button"
                            onClick={() => insertTemplate('tarot')}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                          >
                            🔮 Tarot Template
                          </button>
                          <button
                            type="button"
                            onClick={() => insertTemplate('astrology')}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                          >
                            ⭐ Astrology Template
                          </button>
                          <button
                            type="button"
                            onClick={() => insertTemplate('love')}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                          >
                            💕 Love Template
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <textarea
                  ref={contentTextareaRef}
                  name="fullContent"
                  value={formData.fullContent}
                  onChange={handleChange}
                  rows="15"
                  className="w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all resize-vertical font-mono text-sm"
                  style={{ borderColor: colors.secondary + '50' }}
                  placeholder="Write your blog content here..."
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                  <span>Tip: Use HTML tags for rich content. Supports headings, paragraphs, lists, links, and expandable sections.</span>
                  <button
                    type="button"
                    onClick={() => copyTemplateToClipboard('tarot')}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
                    style={{ color: colors.secondary }}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copied!' : 'Copy Tarot Template'}
                  </button>
                </p>
              </div>

              {/* Category, Author, Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.primary }}>
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{ borderColor: colors.secondary + '50' }}
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.primary }}>
                    Author <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{ borderColor: colors.secondary + '50' }}
                    placeholder="Author name"
                  />
                </div>
              
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.primary }}>
                    Read Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="readTime"
                    value={formData.readTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{ borderColor: colors.secondary + '50' }}
                    placeholder='e.g., "5 min read"'
                  />
                </div>
              </div>

              {/* Author Bio */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-sm font-semibold" style={{ color: colors.primary }}>
                    Author Bio
                  </label>
                  <span className={`text-xs ${characterCount.authorBio > 500 ? 'text-red-500' : 'text-gray-500'}`}>
                    {characterCount.authorBio}/500
                  </span>
                </div>
                <textarea
                  name="authorBio"
                  value={formData.authorBio}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all resize-none"
                  style={{ borderColor: colors.secondary + '50' }}
                  placeholder="Add a brief author biography..."
                />
              </div>

              {/* Blog Image with Cloudinary Upload */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.primary }}>
                  Article Image <span className="text-red-500">*</span>
                </label>
                {!imagePreview ? (
                  <div className="border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-colors bg-gray-50"
                       style={{ borderColor: colors.secondary + '50' }}>
                    <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: colors.secondary }} />
                    <p className="text-gray-600 mb-2">Click to upload image</p>
                    <p className="text-sm text-gray-500 mb-4">PNG, JPG up to 5MB</p>
                    <label className="cursor-pointer">
                      <span className="px-6 py-3 rounded-lg font-medium transition-colors inline-block"
                            style={{ backgroundColor: colors.secondary, color: colors.primary }}>
                        Browse
                      </span>
                      <input
                        type="file"
                        id="blogImage"
                        onChange={handleBlogImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="border rounded-xl p-4 bg-gray-50" style={{ borderColor: colors.secondary + '30' }}>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">
                          {image?.name} ({(image?.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                        {imageUploading && (
                          <p className="text-sm" style={{ color: colors.secondary }}>
                            <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
                            Uploading to Cloudinary...
                          </p>
                        )}
                        {imageUrl && (
                          <p className="text-xs text-green-600 mb-2">✓ Uploaded to Cloudinary</p>
                        )}
                        <button
                          type="button"
                          onClick={removeBlogImage}
                          className="flex items-center gap-2 text-sm hover:text-red-800"
                          style={{ color: colors.danger }}
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Author Image with Cloudinary Upload */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.primary }}>
                  Author Profile Photo <span className="text-gray-500">(Optional)</span>
                </label>
                {!authorImagePreview ? (
                  <div className="border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-colors bg-gray-50"
                       style={{ borderColor: colors.secondary + '50' }}>
                    <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: colors.secondary }} />
                    <p className="text-gray-600 mb-2">Click to upload photo</p>
                    <p className="text-sm text-gray-500 mb-4">PNG, JPG up to 2MB</p>
                    <label className="cursor-pointer">
                      <span className="px-6 py-3 rounded-lg font-medium transition-colors inline-block"
                            style={{ backgroundColor: colors.bgLight, color: colors.textLight }}>
                        Browse
                      </span>
                      <input
                        type="file"
                        id="authorImage"
                        onChange={handleAuthorImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="border rounded-xl p-4 bg-gray-50" style={{ borderColor: colors.secondary + '30' }}>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <img src={authorImagePreview} alt="Author Preview" className="w-20 h-20 object-cover rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">
                          {authorImage?.name} ({(authorImage?.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                        {authorImageUploading && (
                          <p className="text-sm" style={{ color: colors.secondary }}>
                            <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
                            Uploading to Cloudinary...
                          </p>
                        )}
                        {authorImageUrl && (
                          <p className="text-xs text-green-600 mb-2">✓ Uploaded to Cloudinary</p>
                        )}
                        <button
                          type="button"
                          onClick={removeAuthorImage}
                          className="flex items-center gap-2 text-sm hover:text-red-800"
                          style={{ color: colors.danger }}
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Featured & Trending Toggles */}
              <div className="flex flex-wrap gap-6 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="w-5 h-5 rounded focus:ring-2"
                    style={{ accentColor: colors.secondary }}
                  />
                  <span className="text-sm font-medium text-gray-700">Featured Article</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="trending"
                    checked={formData.trending}
                    onChange={handleChange}
                    className="w-5 h-5 rounded focus:ring-2"
                    style={{ accentColor: colors.secondary }}
                  />
                  <span className="text-sm font-medium text-gray-700">Trending Article</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t" style={{ borderColor: colors.secondary + '30' }}>
                <button
                  type="submit"
                  disabled={loading || imageUploading || authorImageUploading}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: colors.secondary, color: colors.primary }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Publish Article
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddBlog;