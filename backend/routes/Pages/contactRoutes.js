const express = require('express');
const router = express.Router();
const {
  getContactContent,
  getAllContactVersions,
  getContactById,
  createContactContent,
  updateContactContent,
  deleteContactContent,
  duplicateContactContent,
  previewContactContent
} = require('../../controllers/Pages/contactController');
const { adminProtect } = require('../../middleware/adminProtect');

// Public route
router.get('/', getContactContent);

// Admin routes
router.get('/admin/all', adminProtect, getAllContactVersions);
router.get('/admin/:id', adminProtect, getContactById);
router.post('/', adminProtect, createContactContent);
router.put('/:id', adminProtect, updateContactContent);
router.delete('/:id', adminProtect, deleteContactContent);
router.post('/:id/duplicate', adminProtect, duplicateContactContent);
router.get('/preview/:id', adminProtect, previewContactContent);

module.exports = router;