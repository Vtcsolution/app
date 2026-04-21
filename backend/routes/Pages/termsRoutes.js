const express = require('express');
const router = express.Router();
const {
  getTermsContent,
  getAllTermsVersions,
  getTermsById,
  createTermsContent,
  updateTermsContent,
  deleteTermsContent,
  duplicateTermsContent,
  previewTermsContent
} = require('../../controllers/Pages/termsController');
const { adminProtect } = require('../../middleware/adminProtect');

// Public route
router.get('/', getTermsContent);

// Admin routes
router.get('/admin/all', adminProtect, getAllTermsVersions);
router.get('/admin/:id', adminProtect, getTermsById);
router.post('/', adminProtect, createTermsContent);
router.put('/:id', adminProtect, updateTermsContent);
router.delete('/:id', adminProtect, deleteTermsContent);
router.post('/:id/duplicate', adminProtect, duplicateTermsContent);
router.get('/preview/:id', adminProtect, previewTermsContent);

module.exports = router;