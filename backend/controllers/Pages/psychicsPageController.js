// controllers/Pages/psychicsPageController.js
const PsychicsPage = require('../../models/Pages/psychicsModel');

// @desc    Get active psychics page content
// @route   GET /api/psychics-page
// @access  Public
const getPsychicsPageContent = async (req, res) => {
  try {
    let psychicsPage = await PsychicsPage.findOne({ isActive: true });
    
    // If no active content exists, create default
    if (!psychicsPage) {
      psychicsPage = await PsychicsPage.create({});
    }

    res.json({
      success: true,
      data: psychicsPage
    });
  } catch (error) {
    console.error('Error fetching psychics page content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get all psychics page versions (admin)
// @route   GET /api/psychics-page/admin/all
// @access  Private/Admin
const getAllPsychicsPageVersions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const versions = await PsychicsPage.find({})
      .populate('lastPublishedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await PsychicsPage.countDocuments();

    res.json({
      success: true,
      data: versions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching psychics page versions:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get single psychics page by ID (admin)
// @route   GET /api/psychics-page/admin/:id
// @access  Private/Admin
const getPsychicsPageById = async (req, res) => {
  try {
    const psychicsPage = await PsychicsPage.findById(req.params.id)
      .populate('lastPublishedBy', 'name email');

    if (!psychicsPage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Psychics page configuration not found' 
      });
    }

    res.json({
      success: true,
      data: psychicsPage
    });
  } catch (error) {
    console.error('Error fetching psychics page by ID:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Create new psychics page configuration
// @route   POST /api/psychics-page
// @access  Private/Admin
const createPsychicsPageContent = async (req, res) => {
  try {
    const psychicsPageData = {
      ...req.body,
      lastPublishedBy: req.admin._id,
      lastPublishedAt: new Date()
    };

    const psychicsPage = await PsychicsPage.create(psychicsPageData);

    res.status(201).json({
      success: true,
      data: psychicsPage,
      message: 'Psychics page configuration created successfully'
    });
  } catch (error) {
    console.error('Error creating psychics page content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update psychics page content
// @route   PUT /api/psychics-page/:id
// @access  Private/Admin
const updatePsychicsPageContent = async (req, res) => {
  try {
    const psychicsPage = await PsychicsPage.findById(req.params.id);

    if (!psychicsPage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Psychics page configuration not found' 
      });
    }

    const updateData = {
      ...req.body,
      lastPublishedBy: req.admin._id,
      lastPublishedAt: new Date()
    };

    // If setting as active, handle other active versions
    if (updateData.isActive && !psychicsPage.isActive) {
      await PsychicsPage.updateMany(
        { _id: { $ne: psychicsPage._id }, isActive: true },
        { isActive: false }
      );
    }

    const updatedPsychicsPage = await PsychicsPage.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('lastPublishedBy', 'name email');

    res.json({
      success: true,
      data: updatedPsychicsPage,
      message: 'Psychics page configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating psychics page content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Delete psychics page configuration
// @route   DELETE /api/psychics-page/:id
// @access  Private/Admin
const deletePsychicsPageContent = async (req, res) => {
  try {
    const psychicsPage = await PsychicsPage.findById(req.params.id);

    if (!psychicsPage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Psychics page configuration not found' 
      });
    }

    // Prevent deletion of active configuration
    if (psychicsPage.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete active psychics page configuration. Please set another version as active first.' 
      });
    }

    await psychicsPage.deleteOne();

    res.json({
      success: true,
      message: 'Psychics page configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting psychics page content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Duplicate psychics page configuration
// @route   POST /api/psychics-page/:id/duplicate
// @access  Private/Admin
const duplicatePsychicsPageContent = async (req, res) => {
  try {
    const sourcePsychicsPage = await PsychicsPage.findById(req.params.id);

    if (!sourcePsychicsPage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Psychics page configuration not found' 
      });
    }

    // Create duplicate
    const psychicsPageData = sourcePsychicsPage.toObject();
    delete psychicsPageData._id;
    delete psychicsPageData.createdAt;
    delete psychicsPageData.updatedAt;
    delete psychicsPageData.__v;
    
    psychicsPageData.isActive = false;
    psychicsPageData.version = (sourcePsychicsPage.version || 1) + 1;
    psychicsPageData.lastPublishedBy = req.admin._id;
    psychicsPageData.lastPublishedAt = new Date();

    const duplicatedPsychicsPage = await PsychicsPage.create(psychicsPageData);

    res.status(201).json({
      success: true,
      data: duplicatedPsychicsPage,
      message: 'Psychics page configuration duplicated successfully'
    });
  } catch (error) {
    console.error('Error duplicating psychics page content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Preview psychics page content
// @route   GET /api/psychics-page/preview/:id
// @access  Private/Admin
const previewPsychicsPageContent = async (req, res) => {
  try {
    const psychicsPage = await PsychicsPage.findById(req.params.id);

    if (!psychicsPage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Psychics page configuration not found' 
      });
    }

    res.json({
      success: true,
      data: psychicsPage,
      isPreview: true
    });
  } catch (error) {
    console.error('Error previewing psychics page content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  getPsychicsPageContent,
  getAllPsychicsPageVersions,
  getPsychicsPageById,
  createPsychicsPageContent,
  updatePsychicsPageContent,
  deletePsychicsPageContent,
  duplicatePsychicsPageContent,
  previewPsychicsPageContent
};