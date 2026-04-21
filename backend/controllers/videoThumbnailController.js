const VideoThumbnail = require('../models/VideoThumbnail');

// Fetch the single thumbnail
exports.fetchThumbnail = async (req, res) => {
  try {
    const thumbnail = await VideoThumbnail.findOne({ _id: 'single_thumbnail' });
    if (!thumbnail) {
      return res.status(404).json({ error: 'Thumbnail not found' });
    }

    res.status(200).json({ success: true, data: thumbnail });
  } catch (error) {
    console.error('Fetch thumbnail error:', error);
    res.status(500).json({ error: 'Server error while fetching thumbnail' });
  }
};

// Add or update the single thumbnail
exports.addOrUpdateThumbnail = async (req, res) => {
  try {
    const { thumbnailUrl, metadata } = req.body;

    if (!thumbnailUrl) {
      return res.status(400).json({ error: 'Thumbnail URL is required' });
    }

    const existingThumbnail = await VideoThumbnail.findOne({ _id: 'single_thumbnail' });

    if (existingThumbnail) {
      // Update existing thumbnail
      const updated = await VideoThumbnail.findOneAndUpdate(
        { _id: 'single_thumbnail' },
        { thumbnailUrl, metadata: metadata || {} },
        { new: true }
      );
      return res.status(200).json({ success: true, data: updated, message: 'Thumbnail updated successfully' });
    }

    // Create new thumbnail
    const newThumbnail = new VideoThumbnail({
      _id: 'single_thumbnail',
      thumbnailUrl,
      metadata: metadata || {},
    });

    await newThumbnail.save();
    res.status(201).json({ success: true, data: newThumbnail, message: 'Thumbnail added successfully' });
  } catch (error) {
    console.error('Add/Update thumbnail error:', error);
    res.status(400).json({ error: error.message || 'Server error while adding/updating thumbnail' });
  }
};
