const Terms = require('../../models/Pages/termsModel');

// @desc    Get active terms page content
// @route   GET /api/terms
// @access  Public
const getTermsContent = async (req, res) => {
  try {
    let terms = await Terms.findOne({ isActive: true });
    
    // If no active terms content exists, create default
    if (!terms) {
      terms = await Terms.create({});
    }

    res.json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Error fetching terms content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get all terms page versions (admin)
// @route   GET /api/terms/admin/all
// @access  Private/Admin
const getAllTermsVersions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const terms = await Terms.find({})
      .populate('lastPublishedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Terms.countDocuments();

    res.json({
      success: true,
      data: terms,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching terms versions:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get single terms page by ID (admin)
// @route   GET /api/terms/admin/:id
// @access  Private/Admin
const getTermsById = async (req, res) => {
  try {
    const terms = await Terms.findById(req.params.id)
      .populate('lastPublishedBy', 'name email');

    if (!terms) {
      return res.status(404).json({ 
        success: false, 
        message: 'Terms page configuration not found' 
      });
    }

    res.json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Error fetching terms by ID:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Create new terms page configuration
// @route   POST /api/terms
// @access  Private/Admin
const createTermsContent = async (req, res) => {
  try {
    const termsData = {
      ...req.body,
      lastPublishedBy: req.admin._id,
      lastPublishedAt: new Date()
    };

    const terms = await Terms.create(termsData);

    res.status(201).json({
      success: true,
      data: terms,
      message: 'Terms page configuration created successfully'
    });
  } catch (error) {
    console.error('Error creating terms content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update terms page content
// @route   PUT /api/terms/:id
// @access  Private/Admin
const updateTermsContent = async (req, res) => {
  try {
    const terms = await Terms.findById(req.params.id);

    if (!terms) {
      return res.status(404).json({ 
        success: false, 
        message: 'Terms page configuration not found' 
      });
    }

    const updateData = {
      ...req.body,
      lastPublishedBy: req.admin._id,
      lastPublishedAt: new Date()
    };

    // If setting as active, handle other active versions
    if (updateData.isActive && !terms.isActive) {
      await Terms.updateMany(
        { _id: { $ne: terms._id }, isActive: true },
        { isActive: false }
      );
    }

    const updatedTerms = await Terms.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('lastPublishedBy', 'name email');

    res.json({
      success: true,
      data: updatedTerms,
      message: 'Terms page configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating terms content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Delete terms page configuration
// @route   DELETE /api/terms/:id
// @access  Private/Admin
const deleteTermsContent = async (req, res) => {
  try {
    const terms = await Terms.findById(req.params.id);

    if (!terms) {
      return res.status(404).json({ 
        success: false, 
        message: 'Terms page configuration not found' 
      });
    }

    // Prevent deletion of active configuration
    if (terms.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete active terms page configuration. Please set another version as active first.' 
      });
    }

    await terms.deleteOne();

    res.json({
      success: true,
      message: 'Terms page configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting terms content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Duplicate terms page configuration
// @route   POST /api/terms/:id/duplicate
// @access  Private/Admin
const duplicateTermsContent = async (req, res) => {
  try {
    const sourceTerms = await Terms.findById(req.params.id);

    if (!sourceTerms) {
      return res.status(404).json({ 
        success: false, 
        message: 'Terms page configuration not found' 
      });
    }

    // Create duplicate (remove _id, timestamps, set isActive false)
    const termsData = sourceTerms.toObject();
    delete termsData._id;
    delete termsData.createdAt;
    delete termsData.updatedAt;
    delete termsData.__v;
    
    termsData.isActive = false;
    termsData.version = (sourceTerms.version || 1) + 1;
    termsData.lastPublishedBy = req.admin._id;
    termsData.lastPublishedAt = new Date();

    const duplicatedTerms = await Terms.create(termsData);

    res.status(201).json({
      success: true,
      data: duplicatedTerms,
      message: 'Terms page configuration duplicated successfully'
    });
  } catch (error) {
    console.error('Error duplicating terms content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Preview terms page content
// @route   GET /api/terms/preview/:id
// @access  Private/Admin
const previewTermsContent = async (req, res) => {
  try {
    const terms = await Terms.findById(req.params.id);

    if (!terms) {
      return res.status(404).json({ 
        success: false, 
        message: 'Terms page configuration not found' 
      });
    }

    res.json({
      success: true,
      data: terms,
      isPreview: true
    });
  } catch (error) {
    console.error('Error previewing terms content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  getTermsContent,
  getAllTermsVersions,
  getTermsById,
  createTermsContent,
  updateTermsContent,
  deleteTermsContent,
  duplicateTermsContent,
  previewTermsContent
};