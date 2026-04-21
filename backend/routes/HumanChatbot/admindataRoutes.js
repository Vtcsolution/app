// routes/admin/adminRoutes.js

const express = require('express');
const router = express.Router();
const { adminProtect } = require('../../middleware/adminProtect');

const {
  getAllChatData,
  getChatById,
  getPsychicDetails,
  getAllPsychics,
  updatePsychicDetails,      // Add this
  togglePsychicVerification,  // Add this
  updatePsychicStatus,        // Add this
  updatePsychicRate          // Add this
} = require('../../controllers/HumanChatbot/admindataController');

// ✅ Psychics routes
router.get('/chats/psychics', adminProtect, getAllPsychics);
router.get('/chats/psychics/:id', adminProtect, getPsychicDetails);
router.put('/chats/psychics/:id', adminProtect, updatePsychicDetails);           // Add this
router.patch('/chats/psychics/:id/verify', adminProtect, togglePsychicVerification); // Add this
router.patch('/chats/psychics/:id/status', adminProtect, updatePsychicStatus);   // Add this
router.patch('/chats/psychics/:id/rate', adminProtect, updatePsychicRate);       // Add this

// Chats routes
router.get('/chats/:id', adminProtect, getChatById);
router.get('/chats', adminProtect, getAllChatData);

module.exports = router;