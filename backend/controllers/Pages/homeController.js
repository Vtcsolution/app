const Home = require("../../models/Pages/homeModel");

const getHomeContent = async (req, res) => {
  try {
    let home = await Home.findOne({ isActive: true });
    
    // If no active home content exists, create default
    if (!home) {
      home = await Home.create({});
    }

    res.json({
      success: true,
      data: home
    });
  } catch (error) {
    console.error('Error fetching home content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get all home page versions (admin)
// @route   GET /api/home/admin/all
// @access  Private/Admin
const getAllHomeVersions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const homes = await Home.find({})
      .populate('lastPublishedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Home.countDocuments();

    res.json({
      success: true,
      data: homes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching home versions:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get single home page by ID (admin)
// @route   GET /api/home/admin/:id
// @access  Private/Admin
const getHomeById = async (req, res) => {
  try {
    const home = await Home.findById(req.params.id)
      .populate('lastPublishedBy', 'name email');

    if (!home) {
      return res.status(404).json({ 
        success: false, 
        message: 'Home page configuration not found' 
      });
    }

    res.json({
      success: true,
      data: home
    });
  } catch (error) {
    console.error('Error fetching home by ID:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Create new home page configuration
// @route   POST /api/home
// @access  Private/Admin
const createHomeContent = async (req, res) => {
  try {
    const homeData = {
      ...req.body,
      lastPublishedBy: req.admin._id,
      lastPublishedAt: new Date()
    };

    const home = await Home.create(homeData);

    res.status(201).json({
      success: true,
      data: home,
      message: 'Home page configuration created successfully'
    });
  } catch (error) {
    console.error('Error creating home content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update home page content
// @route   PUT /api/home/:id
// @access  Private/Admin
const updateHomeContent = async (req, res) => {
  try {
    const home = await Home.findById(req.params.id);

    if (!home) {
      return res.status(404).json({ 
        success: false, 
        message: 'Home page configuration not found' 
      });
    }

    const updateData = {
      ...req.body,
      lastPublishedBy: req.admin._id,
      lastPublishedAt: new Date()
    };

    // If setting as active, handle other active versions
    if (updateData.isActive && !home.isActive) {
      await Home.updateMany(
        { _id: { $ne: home._id }, isActive: true },
        { isActive: false }
      );
    }

    const updatedHome = await Home.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('lastPublishedBy', 'name email');

    res.json({
      success: true,
      data: updatedHome,
      message: 'Home page configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating home content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Delete home page configuration
// @route   DELETE /api/home/:id
// @access  Private/Admin
const deleteHomeContent = async (req, res) => {
  try {
    const home = await Home.findById(req.params.id);

    if (!home) {
      return res.status(404).json({ 
        success: false, 
        message: 'Home page configuration not found' 
      });
    }

    // Prevent deletion of active configuration
    if (home.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete active home page configuration. Please set another version as active first.' 
      });
    }

    await home.deleteOne();

    res.json({
      success: true,
      message: 'Home page configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting home content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Duplicate home page configuration
// @route   POST /api/home/:id/duplicate
// @access  Private/Admin
const duplicateHomeContent = async (req, res) => {
  try {
    const sourceHome = await Home.findById(req.params.id);

    if (!sourceHome) {
      return res.status(404).json({ 
        success: false, 
        message: 'Home page configuration not found' 
      });
    }

    // Create duplicate (remove _id, timestamps, set isActive false)
    const homeData = sourceHome.toObject();
    delete homeData._id;
    delete homeData.createdAt;
    delete homeData.updatedAt;
    delete homeData.__v;
    
    homeData.isActive = false;
    homeData.version = (sourceHome.version || 1) + 1;
    homeData.lastPublishedBy = req.admin._id;
    homeData.lastPublishedAt = new Date();

    const duplicatedHome = await Home.create(homeData);

    res.status(201).json({
      success: true,
      data: duplicatedHome,
      message: 'Home page configuration duplicated successfully'
    });
  } catch (error) {
    console.error('Error duplicating home content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Preview home page content
// @route   GET /api/home/preview/:id
// @access  Private/Admin
const previewHomeContent = async (req, res) => {
  try {
    const home = await Home.findById(req.params.id);

    if (!home) {
      return res.status(404).json({ 
        success: false, 
        message: 'Home page configuration not found' 
      });
    }

    res.json({
      success: true,
      data: home,
      isPreview: true
    });
  } catch (error) {
    console.error('Error previewing home content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  getHomeContent,
  getAllHomeVersions,
  getHomeById,
  createHomeContent,
  updateHomeContent,
  deleteHomeContent,
  duplicateHomeContent,
  previewHomeContent
};