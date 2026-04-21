const About = require('../../models/Pages/aboutModel');

// @desc    Get active about page content
// @route   GET /api/about
// @access  Public
const getAboutContent = async (req, res) => {
  try {
    let about = await About.findOne({ isActive: true });
    
    // If no active about content exists, create default
    if (!about) {
      about = await About.create({});
    }

    res.json({
      success: true,
      data: about
    });
  } catch (error) {
    console.error('Error fetching about content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get all about page versions (admin)
// @route   GET /api/about/admin/all
// @access  Private/Admin
const getAllAboutVersions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const abouts = await About.find({})
      .populate('lastPublishedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await About.countDocuments();

    res.json({
      success: true,
      data: abouts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching about versions:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get single about page by ID (admin)
// @route   GET /api/about/admin/:id
// @access  Private/Admin
const getAboutById = async (req, res) => {
  try {
    const about = await About.findById(req.params.id)
      .populate('lastPublishedBy', 'name email');

    if (!about) {
      return res.status(404).json({ 
        success: false, 
        message: 'About page configuration not found' 
      });
    }

    res.json({
      success: true,
      data: about
    });
  } catch (error) {
    console.error('Error fetching about by ID:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Create new about page configuration
// @route   POST /api/about
// @access  Private/Admin
const createAboutContent = async (req, res) => {
  try {
    const aboutData = {
      ...req.body,
      lastPublishedBy: req.admin._id,
      lastPublishedAt: new Date()
    };

    const about = await About.create(aboutData);

    res.status(201).json({
      success: true,
      data: about,
      message: 'About page configuration created successfully'
    });
  } catch (error) {
    console.error('Error creating about content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update about page content
// @route   PUT /api/about/:id
// @access  Private/Admin
const updateAboutContent = async (req, res) => {
  try {
    const about = await About.findById(req.params.id);

    if (!about) {
      return res.status(404).json({ 
        success: false, 
        message: 'About page configuration not found' 
      });
    }

    const updateData = {
      ...req.body,
      lastPublishedBy: req.admin._id,
      lastPublishedAt: new Date()
    };

    // If setting as active, handle other active versions
    if (updateData.isActive && !about.isActive) {
      await About.updateMany(
        { _id: { $ne: about._id }, isActive: true },
        { isActive: false }
      );
    }

    const updatedAbout = await About.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('lastPublishedBy', 'name email');

    res.json({
      success: true,
      data: updatedAbout,
      message: 'About page configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating about content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Delete about page configuration
// @route   DELETE /api/about/:id
// @access  Private/Admin
const deleteAboutContent = async (req, res) => {
  try {
    const about = await About.findById(req.params.id);

    if (!about) {
      return res.status(404).json({ 
        success: false, 
        message: 'About page configuration not found' 
      });
    }

    // Prevent deletion of active configuration
    if (about.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete active about page configuration. Please set another version as active first.' 
      });
    }

    await about.deleteOne();

    res.json({
      success: true,
      message: 'About page configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting about content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Duplicate about page configuration
// @route   POST /api/about/:id/duplicate
// @access  Private/Admin
const duplicateAboutContent = async (req, res) => {
  try {
    const sourceAbout = await About.findById(req.params.id);

    if (!sourceAbout) {
      return res.status(404).json({ 
        success: false, 
        message: 'About page configuration not found' 
      });
    }

    // Create duplicate (remove _id, timestamps, set isActive false)
    const aboutData = sourceAbout.toObject();
    delete aboutData._id;
    delete aboutData.createdAt;
    delete aboutData.updatedAt;
    delete aboutData.__v;
    
    aboutData.isActive = false;
    aboutData.version = (sourceAbout.version || 1) + 1;
    aboutData.lastPublishedBy = req.admin._id;
    aboutData.lastPublishedAt = new Date();

    const duplicatedAbout = await About.create(aboutData);

    res.status(201).json({
      success: true,
      data: duplicatedAbout,
      message: 'About page configuration duplicated successfully'
    });
  } catch (error) {
    console.error('Error duplicating about content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Preview about page content
// @route   GET /api/about/preview/:id
// @access  Private/Admin
const previewAboutContent = async (req, res) => {
  try {
    const about = await About.findById(req.params.id);

    if (!about) {
      return res.status(404).json({ 
        success: false, 
        message: 'About page configuration not found' 
      });
    }

    res.json({
      success: true,
      data: about,
      isPreview: true
    });
  } catch (error) {
    console.error('Error previewing about content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  getAboutContent,
  getAllAboutVersions,
  getAboutById,
  createAboutContent,
  updateAboutContent,
  deleteAboutContent,
  duplicateAboutContent,
  previewAboutContent
};