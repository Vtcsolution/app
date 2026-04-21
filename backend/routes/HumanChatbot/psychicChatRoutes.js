// routes/psychicChatRoutes.js
const express = require('express');
const router = express.Router();
const psychicMessageController = require('../../controllers/HumanChatbot/psychicMessageController');
const chatSessionController = require('../../controllers/HumanChatbot/chatSessionController');
const { protectPsychic } = require('../../middleware/PsychicMiddleware');
const messageController = require ('../../controllers/HumanChatbot/messageController')
// Psychic Chat Session Routes
router.get('/sessions', protectPsychic, chatSessionController.getPsychicChats);
router.get('/sessions/active', protectPsychic, psychicMessageController.getPsychicActiveChats);
router.get('/sessions/:chatSessionId', protectPsychic, chatSessionController.getChatSession);
router.put('/sessions/:chatSessionId/status', protectPsychic, psychicMessageController.updateChatStatusAsPsychic);

// Psychic Message Routes
router.post('/messages', protectPsychic, psychicMessageController.sendMessageAsPsychic);
router.get('/messages/:chatSessionId', protectPsychic, psychicMessageController.getMessagesAsPsychic);
router.get('/messages/unread/count', protectPsychic, psychicMessageController.getPsychicUnreadCount);

// Reuse existing controllers with psychic auth
router.post('/messages/:messageId/react', protectPsychic, messageController.reactToMessage);
router.delete('/messages/:messageId', protectPsychic, messageController.deleteMessage);
router.put('/messages/:chatSessionId/read', protectPsychic, messageController.markAsRead);

module.exports = router;