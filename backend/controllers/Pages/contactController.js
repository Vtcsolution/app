const Contact = require('../../models/Pages/contactModel');

// @desc    Get active contact page content
// @route   GET /api/contact
// @access  Public
const getContactContent = async (req, res) => {
  try {
    let contact = await Contact.findOne({ isActive: true });
    
    // If no active contact content exists, create default
    if (!contact) {
      contact = await Contact.create({});
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error fetching contact content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get all contact page versions (admin)
// @route   GET /api/contact/admin/all
// @access  Private/Admin
const getAllContactVersions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const contacts = await Contact.find({})
      .populate('lastPublishedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Contact.countDocuments();

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching contact versions:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get single contact page by ID (admin)
// @route   GET /api/contact/admin/:id
// @access  Private/Admin
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('lastPublishedBy', 'name email');

    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact page configuration not found' 
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error fetching contact by ID:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Create new contact page configuration
// @route   POST /api/contact
// @access  Private/Admin
const createContactContent = async (req, res) => {
  try {
    const contactData = {
      ...req.body,
      lastPublishedBy: req.admin._id,
      lastPublishedAt: new Date()
    };

    const contact = await Contact.create(contactData);

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Contact page configuration created successfully'
    });
  } catch (error) {
    console.error('Error creating contact content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update contact page content
// @route   PUT /api/contact/:id
// @access  Private/Admin
const updateContactContent = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact page configuration not found' 
      });
    }

    const updateData = {
      ...req.body,
      lastPublishedBy: req.admin._id,
      lastPublishedAt: new Date()
    };

    // If setting as active, handle other active versions
    if (updateData.isActive && !contact.isActive) {
      await Contact.updateMany(
        { _id: { $ne: contact._id }, isActive: true },
        { isActive: false }
      );
    }

    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('lastPublishedBy', 'name email');

    res.json({
      success: true,
      data: updatedContact,
      message: 'Contact page configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating contact content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Delete contact page configuration
// @route   DELETE /api/contact/:id
// @access  Private/Admin
const deleteContactContent = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact page configuration not found' 
      });
    }

    // Prevent deletion of active configuration
    if (contact.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete active contact page configuration. Please set another version as active first.' 
      });
    }

    await contact.deleteOne();

    res.json({
      success: true,
      message: 'Contact page configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Duplicate contact page configuration
// @route   POST /api/contact/:id/duplicate
// @access  Private/Admin
const duplicateContactContent = async (req, res) => {
  try {
    const sourceContact = await Contact.findById(req.params.id);

    if (!sourceContact) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact page configuration not found' 
      });
    }

    // Create duplicate (remove _id, timestamps, set isActive false)
    const contactData = sourceContact.toObject();
    delete contactData._id;
    delete contactData.createdAt;
    delete contactData.updatedAt;
    delete contactData.__v;
    
    contactData.isActive = false;
    contactData.version = (sourceContact.version || 1) + 1;
    contactData.lastPublishedBy = req.admin._id;
    contactData.lastPublishedAt = new Date();

    const duplicatedContact = await Contact.create(contactData);

    res.status(201).json({
      success: true,
      data: duplicatedContact,
      message: 'Contact page configuration duplicated successfully'
    });
  } catch (error) {
    console.error('Error duplicating contact content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Preview contact page content
// @route   GET /api/contact/preview/:id
// @access  Private/Admin
const previewContactContent = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact page configuration not found' 
      });
    }

    res.json({
      success: true,
      data: contact,
      isPreview: true
    });
  } catch (error) {
    console.error('Error previewing contact content:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  getContactContent,
  getAllContactVersions,
  getContactById,
  createContactContent,
  updateContactContent,
  deleteContactContent,
  duplicateContactContent,
  previewContactContent
};