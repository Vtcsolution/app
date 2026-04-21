const express = require('express');
const router = express.Router();
const {
  getAboutContent,
  getAllAboutVersions,
  getAboutById,
  createAboutContent,
  updateAboutContent,
  deleteAboutContent,
  duplicateAboutContent,
  previewAboutContent
} = require('../../controllers/Pages/aboutController');
const { adminProtect } = require('../../middleware/adminProtect');

// Public route
router.get('/', getAboutContent);

// Admin routes
router.get('/admin/all', adminProtect, getAllAboutVersions);
router.get('/admin/:id', adminProtect, getAboutById);
router.post('/', adminProtect, createAboutContent);
router.put('/:id', adminProtect, updateAboutContent);
router.delete('/:id', adminProtect, deleteAboutContent);
router.post('/:id/duplicate', adminProtect, duplicateAboutContent);
router.get('/preview/:id', adminProtect, previewAboutContent);

module.exports = router;