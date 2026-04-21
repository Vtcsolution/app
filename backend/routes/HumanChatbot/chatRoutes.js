// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const messageController = require('../../controllers/HumanChatbot/messageController');
const chatSessionController = require('../../controllers/HumanChatbot/chatSessionController');
const { protect } = require('../../middleware/auth');
const { protectPsychic } = require('../../middleware/PsychicMiddleware');

// ===== CHAT SESSION ROUTES =====
router.post('/sessions', protect, chatSessionController.createChatSession);
router.get('/sessions', protect, chatSessionController.getUserChats);
router.get('/sessions/search', protect, chatSessionController.searchParticipants);
router.get('/sessions/:chatSessionId', protect, chatSessionController.getChatSession);
router.put('/sessions/:chatSessionId/status', protect, chatSessionController.updateChatStatus);
router.get("/sessions/check/:psychicId", protect, chatSessionController.checkChatSession);
router.get("/psychic/sessions", protectPsychic, chatSessionController.getPsychicChats);

// ===== MESSAGE ROUTES =====
// User message routes
router.post('/messages', protect, messageController.sendMessage);
router.get('/messages/:chatSessionId', protect, messageController.getMessages);
router.post('/messages/:messageId/react', protect, messageController.reactToMessage);
router.delete('/messages/:messageId', protect, messageController.deleteMessage);
router.put('/messages/:chatSessionId/read', protect, messageController.markAsRead);
router.get('/messages/unread/count', protect, messageController.getUnreadCount);
router.post('/test/detection', protect, messageController.testDetection);

// Psychic message routes
router.post('/psychic/messages', protectPsychic, messageController.sendMessage);
router.get('/psychic/messages/:chatSessionId', protectPsychic, messageController.getMessages);
router.put('/psychic/messages/:chatSessionId/read', protectPsychic, messageController.markAsRead);
router.post('/test/psychic-warning', protect, messageController.testPsychicWarning);

// ===== WARNING SYSTEM ROUTES =====

// Psychic warning routes
router.get('/warnings/psychic', protectPsychic, messageController.getPsychicWarnings);
router.get('/warnings/psychic/:psychicId/status', protectPsychic, messageController.checkPsychicStatus);
router.get('/warnings/psychic/history', protectPsychic, messageController.getPsychicWarnings);

// User warning routes
router.get('/warnings/user', protect, messageController.getUserWarnings);
router.get('/warnings/user/:warningId', protect, messageController.getWarningDetails);
router.get('/warnings/user/status/:userId', protect, messageController.checkUserStatus);

// Admin warning routes
router.get('/warnings/admin/stats', protect, messageController.getWarningStats);
router.put('/warnings/admin/:warningId/dismiss', protect, messageController.dismissWarning);
router.put('/warnings/admin/psychic/:psychicId/reactivate', protect, messageController.reactivatePsychic);
router.put('/warnings/admin/user/:userId/reactivate', protect, messageController.reactivateUser);

// ===== NEW: TEST/DEBUG WARNING ROUTES =====
// Generate test warning for psychic (development only - should be protected in production)
router.post('/warnings/test/generate-psychic-warning', protect, messageController.generateTestPsychicWarning);

// Generate multiple warnings at once (for testing deactivation)
router.post('/warnings/test/generate-multiple-psychic-warnings', protect, messageController.generateMultiplePsychicWarnings);

// Reset psychic warnings (admin only)
router.post('/warnings/admin/reset-psychic-warnings/:psychicId', protect, messageController.resetPsychicWarnings);

// Get all psychics with warning status (admin)
router.get('/warnings/admin/all-psychics', protect, messageController.getAllPsychicsWithWarnings);

// Get detailed warning history for a specific psychic (admin)
router.get('/warnings/admin/psychic/:psychicId', protect, messageController.getPsychicWarningDetails);

// ===== DEBUG ROUTES (keep existing) =====
router.get('/debug/psychic-warnings/:psychicId', protect, messageController.debugPsychicWarnings);
router.post('/test/add-warning', protect, messageController.testAddWarning);

module.exports = router;