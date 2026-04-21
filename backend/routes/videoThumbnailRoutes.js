const express = require('express');
const router = express.Router();
const thumbnailController = require('../controllers/videoThumbnailController');

// Fetch the single thumbnail (GET /api/thumbnail)
router.get('/', thumbnailController.fetchThumbnail);

// Add or update the single thumbnail (POST /api/thumbnail)
router.post('/', thumbnailController.addOrUpdateThumbnail);

module.exports = router;
