const express = require('express');
const router = express.Router();
const {
  getHomeContent,
  getAllHomeVersions,
  getHomeById,
  createHomeContent,
  updateHomeContent,
  deleteHomeContent,
  duplicateHomeContent,
  previewHomeContent
} = require('../../controllers/Pages/homeController');
const { adminProtect } = require('../../middleware/adminProtect');

// Public route
router.get('/', getHomeContent);

// Admin routes
router.get('/admin/all', adminProtect, getAllHomeVersions);
router.get('/admin/:id', adminProtect, getHomeById);
router.post('/', adminProtect, createHomeContent);
router.put('/:id', adminProtect, updateHomeContent);
router.delete('/:id', adminProtect, deleteHomeContent);
router.post('/:id/duplicate', adminProtect, duplicateHomeContent);
router.get('/preview/:id', adminProtect, previewHomeContent);

module.exports = router;