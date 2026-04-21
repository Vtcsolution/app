// routes/psychicsPageRoutes.js
const express = require('express');
const router = express.Router();
const {
  getPsychicsPageContent,
  getAllPsychicsPageVersions,
  getPsychicsPageById,
  createPsychicsPageContent,
  updatePsychicsPageContent,
  deletePsychicsPageContent,
  duplicatePsychicsPageContent,
  previewPsychicsPageContent
} = require('../../controllers/Pages/psychicsPageController');
const { adminProtect } = require('../../middleware/adminProtect');

// Public route
router.get('/', getPsychicsPageContent);

// Admin routes
router.get('/admin/all', adminProtect, getAllPsychicsPageVersions);
router.get('/admin/:id', adminProtect, getPsychicsPageById);
router.post('/', adminProtect, createPsychicsPageContent);
router.put('/:id', adminProtect, updatePsychicsPageContent);
router.delete('/:id', adminProtect, deletePsychicsPageContent);
router.post('/:id/duplicate', adminProtect, duplicatePsychicsPageContent);
router.get('/preview/:id', adminProtect, previewPsychicsPageContent);

module.exports = router;