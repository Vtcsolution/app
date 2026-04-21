const Blog = require('../models/blogModel');
const Comment = require('../models/commentModel');

// Add a new blog (receives Cloudinary URLs from frontend)
const addBlog = async (req, res) => {
  try {
    const { 
      title, 
      excerpt, 
      content,
      category, 
      author, 
      authorBio, 
      readTime, 
      featured, 
      trending,
      image,
      authorImage
    } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du blog est requis'
      });
    }

    // Validate category
    const validCategories = [
      'Tarot', 'Astrology', 'Numerology', 'Palmistry', 'Love & Relationships',
      'Career Guidance', 'Spiritual Growth', 'Dream Interpretation',
      'Meditation & Mindfulness', 'Crystal Healing', 'Aura Reading',
      'Past Life Regression', 'Chakra Healing', 'Angel Numbers', 'Psychic Development'
    ];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Catégorie invalide'
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'L\'image du blog est requise'
      });
    }

    // Create blog with Cloudinary URLs
    const newBlog = new Blog({
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content,
      category,
      author: author.trim(),
      authorBio: authorBio ? authorBio.trim() : '',
      readTime,
      image: image, // Cloudinary URL from frontend
      authorImage: authorImage || '', // Cloudinary URL from frontend
      featured: featured === true || featured === 'true',
      trending: trending === true || trending === 'true',
      metaTitle: title.trim().substring(0, 60),
      metaDescription: excerpt.trim().substring(0, 160)
    });

    const savedBlog = await newBlog.save();
    
    res.status(201).json({
      success: true,
      message: 'Blog créé avec succès',
      data: savedBlog,
    });
  } catch (error) {
    console.error('Erreur lors de la création du blog:', error);
    
    if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
      return res.status(400).json({
        success: false,
        message: 'Un blog avec un titre similaire existe déjà. Veuillez modifier le titre.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Get all blogs (public)
const getBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      tag,
      search,
      featured,
      trending,
      sort = '-createdAt'
    } = req.query;

    const query = { isPublished: true };
    
    if (category) query.category = category;
    if (featured === 'true') query.featured = true;
    if (trending === 'true') query.trending = true;
    if (tag) query.tags = tag;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .select('-content')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Blog.countDocuments(query)
    ]);

    const categories = await Blog.distinct('category', { isPublished: true });
    const tags = await Blog.distinct('tags', { isPublished: true });

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      categories,
      tags
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single blog by ID
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const relatedBlogs = await Blog.find({
      _id: { $ne: id },
      category: blog.category,
      isPublished: true
    })
    .select('title excerpt image readTime createdAt')
    .limit(3)
    .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: blog,
      related: relatedBlogs
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update blog
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Convert string booleans
    if (updateData.featured === 'true' || updateData.featured === 'false') {
      updateData.featured = updateData.featured === 'true';
    }
    if (updateData.trending === 'true' || updateData.trending === 'false') {
      updateData.trending = updateData.trending === 'true';
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: updatedBlog
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete blog
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    await Comment.deleteMany({ blogId: id });
    await Blog.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Like blog
const likeBlog = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    blog.likes = (blog.likes || 0) + 1;
    await blog.save();

    res.status(200).json({
      success: true,
      message: 'Blog liked successfully',
      likes: blog.likes
    });
  } catch (error) {
    console.error('Error liking blog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Toggle featured status
const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    blog.featured = !blog.featured;
    await blog.save();

    res.status(200).json({
      success: true,
      message: `Blog ${blog.featured ? 'featured' : 'unfeatured'} successfully`,
      featured: blog.featured
    });
  } catch (error) {
    console.error('Error toggling featured:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get blog statistics
const getBlogStats = async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments();
    const publishedBlogs = await Blog.countDocuments({ isPublished: true });
    const totalViews = await Blog.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]);
    const totalLikes = await Blog.aggregate([{ $group: { _id: null, total: { $sum: '$likes' } } }]);
    
    const categoryStats = await Blog.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentBlogs = await Blog.find()
      .select('title views likes createdAt category')
      .sort('-createdAt')
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalBlogs,
        publishedBlogs,
        totalViews: totalViews[0]?.total || 0,
        totalLikes: totalLikes[0]?.total || 0,
        categoryStats,
        recentBlogs
      }
    });
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    const isAllEndpoint = req.originalUrl.includes('/all');
    
    if (isAllEndpoint) {
      const categoriesList = [
        'Tarot',
        'Astrology',
        'Numerology',
        'Palmistry',
        'Love & Relationships',
        'Career Guidance',
        'Spiritual Growth',
        'Dream Interpretation',
        'Meditation & Mindfulness',
        'Crystal Healing',
        'Aura Reading',
        'Past Life Regression',
        'Chakra Healing',
        'Angel Numbers',
        'Psychic Development'
      ];
      
      return res.status(200).json({
        success: true,
        data: categoriesList
      });
    }
    
    const categories = [
      { id: 'tarot', name: 'Tarot', description: 'Tarot readings and interpretations', icon: '🔮', color: '#9B7EDE' },
      { id: 'astrology', name: 'Astrology', description: 'Astrological insights and horoscopes', icon: '⭐', color: '#F59E0B' },
      { id: 'numerology', name: 'Numerology', description: 'Numbers and their spiritual significance', icon: '🔢', color: '#EC4899' },
      { id: 'palmistry', name: 'Palmistry', description: 'Palm reading and life path insights', icon: '✋', color: '#8B5CF6' },
      { id: 'love', name: 'Love & Relationships', description: 'Love guidance and relationship advice', icon: '❤️', color: '#EF4444' },
      { id: 'career', name: 'Career Guidance', description: 'Professional development and career insights', icon: '💼', color: '#3B82F6' },
      { id: 'spiritual', name: 'Spiritual Growth', description: 'Spiritual development and enlightenment', icon: '🧘', color: '#A855F7' },
      { id: 'dreams', name: 'Dream Interpretation', description: 'Understanding your dreams and their meanings', icon: '🌙', color: '#6366F1' },
      { id: 'meditation', name: 'Meditation & Mindfulness', description: 'Practices for inner peace and clarity', icon: '🧘‍♀️', color: '#10B981' },
      { id: 'crystals', name: 'Crystal Healing', description: 'Crystal properties and healing practices', icon: '💎', color: '#F43F5E' },
      { id: 'aura', name: 'Aura Reading', description: 'Understanding energy fields and auras', icon: '✨', color: '#D946EF' },
      { id: 'pastlife', name: 'Past Life Regression', description: 'Exploring past lives and karmic patterns', icon: '🔄', color: '#0EA5E9' },
      { id: 'chakra', name: 'Chakra Healing', description: 'Balancing and healing chakras', icon: '🌀', color: '#06B6D4' },
      { id: 'angels', name: 'Angel Numbers', description: 'Messages from angels through numbers', icon: '👼', color: '#FBBF24' },
      { id: 'psychic', name: 'Psychic Development', description: 'Developing your psychic abilities', icon: '🔮', color: '#8B5CF6' }
    ];
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  addBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  likeBlog,
  toggleFeatured,
  getBlogStats,
  getCategories
};