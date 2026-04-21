const Footer = require('../../models/Pages/footerModel');

// @desc    Get active footer content
// @route   GET /api/footer
// @access  Public
const getFooterContent = async (req, res) => {
  try {
    let footer = await Footer.findOne({ isActive: true });
    
    // If no active footer content exists, create default
    if (!footer) {
      footer = await Footer.create({});
    }

    res.json({
      success: true,
      data: footer
    });
  } catch (error) {
    console.error('Error fetching footer content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get all footer versions (admin)
// @route   GET /api/footer/admin/all
// @access  Private/Admin
const getAllFooterVersions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const footers = await Footer.find({})
      .populate('lastPublishedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Footer.countDocuments();

    res.json({
      success: true,
      data: footers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching footer versions:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get single footer by ID (admin)
// @route   GET /api/footer/admin/:id
// @access  Private/Admin
const getFooterById = async (req, res) => {
  try {
    const footer = await Footer.findById(req.params.id)
      .populate('lastPublishedBy', 'name email');

    if (!footer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Footer configuration not found' 
      });
    }

    res.json({
      success: true,
      data: footer
    });
  } catch (error) {
    console.error('Error fetching footer by ID:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Create new footer configuration
// @route   POST /api/footer
// @access  Private/Admin
const createFooterContent = async (req, res) => {
  try {
    const footerData = {
      ...req.body,
      lastPublishedBy: req.admin._id,
      lastPublishedAt: new Date()
    };

    const footer = await Footer.create(footerData);

    res.status(201).json({
      success: true,
      data: footer,
      message: 'Footer configuration created successfully'
    });
  } catch (error) {
    console.error('Error creating footer content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update footer content
// @route   PUT /api/footer/:id
// @access  Private/Admin
const updateFooterContent = async (req, res) => {
  try {
    const footer = await Footer.findById(req.params.id);

    if (!footer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Footer configuration not found' 
      });
    }

    const updateData = {
      ...req.body,
      lastPublishedBy: req.admin._id,
      lastPublishedAt: new Date()
    };

    // If setting as active, handle other active versions
    if (updateData.isActive && !footer.isActive) {
      await Footer.updateMany(
        { _id: { $ne: footer._id }, isActive: true },
        { isActive: false }
      );
    }

    const updatedFooter = await Footer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('lastPublishedBy', 'name email');

    res.json({
      success: true,
      data: updatedFooter,
      message: 'Footer configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating footer content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Delete footer configuration
// @route   DELETE /api/footer/:id
// @access  Private/Admin
const deleteFooterContent = async (req, res) => {
  try {
    const footer = await Footer.findById(req.params.id);

    if (!footer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Footer configuration not found' 
      });
    }

    // Prevent deletion of active configuration
    if (footer.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete active footer configuration. Please set another version as active first.' 
      });
    }

    await footer.deleteOne();

    res.json({
      success: true,
      message: 'Footer configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting footer content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Duplicate footer configuration
// @route   POST /api/footer/:id/duplicate
// @access  Private/Admin
const duplicateFooterContent = async (req, res) => {
  try {
    const sourceFooter = await Footer.findById(req.params.id);

    if (!sourceFooter) {
      return res.status(404).json({ 
        success: false, 
        message: 'Footer configuration not found' 
      });
    }

    // Create duplicate (remove _id, timestamps, set isActive false)
    const footerData = sourceFooter.toObject();
    delete footerData._id;
    delete footerData.createdAt;
    delete footerData.updatedAt;
    delete footerData.__v;
    
    footerData.isActive = false;
    footerData.version = (sourceFooter.version || 1) + 1;
    footerData.lastPublishedBy = req.admin._id;
    footerData.lastPublishedAt = new Date();

    const duplicatedFooter = await Footer.create(footerData);

    res.status(201).json({
      success: true,
      data: duplicatedFooter,
      message: 'Footer configuration duplicated successfully'
    });
  } catch (error) {
    console.error('Error duplicating footer content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Preview footer content
// @route   GET /api/footer/preview/:id
// @access  Private/Admin
const previewFooterContent = async (req, res) => {
  try {
    const footer = await Footer.findById(req.params.id);

    if (!footer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Footer configuration not found' 
      });
    }

    res.json({
      success: true,
      data: footer,
      isPreview: true
    });
  } catch (error) {
    console.error('Error previewing footer content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  getFooterContent,
  getAllFooterVersions,
  getFooterById,
  createFooterContent,
  updateFooterContent,
  deleteFooterContent,
  duplicateFooterContent,
  previewFooterContent
};