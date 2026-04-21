const express = require('express');
const router = express.Router();
const {
  getFooterContent,
  getAllFooterVersions,
  getFooterById,
  createFooterContent,
  updateFooterContent,
  deleteFooterContent,
  duplicateFooterContent,
  previewFooterContent
} = require('../../controllers/Pages/footerController');
const { adminProtect } = require('../../middleware/adminProtect');

// Public route
router.get('/', getFooterContent);

// Admin routes
router.get('/admin/all', adminProtect, getAllFooterVersions);
router.get('/admin/:id', adminProtect, getFooterById);
router.post('/', adminProtect, createFooterContent);
router.put('/:id', adminProtect, updateFooterContent);
router.delete('/:id', adminProtect, deleteFooterContent);
router.post('/:id/duplicate', adminProtect, duplicateFooterContent);
router.get('/preview/:id', adminProtect, previewFooterContent);

module.exports = router;