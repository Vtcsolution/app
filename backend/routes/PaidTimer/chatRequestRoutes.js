
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { protectPsychic } = require('../../middleware/PsychicMiddleware');
const {
  sendChatRequest,
  acceptChatRequest,
  rejectChatRequest,
  startPaidSession,
  pauseTimer,
  resumeTimer,
  stopTimer,
  getActiveSession,
  getChatHistory,
  getUserWalletBalance,  // Add this
  checkAffordability, 
  checkPendingRequest,
  checkActiveRequest,
  cancelChatRequest,
  getPsychicPendingRequests,
  getPsychicActiveSession,
  getPsychicEarnings,
  getPsychicSessionDetails,
  getPsychicEarningsByUserId,
  getPsychicEarningsStats,
  getTimerData
} = require('../../controllers/PaidTimer/chatRequestController');

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../../controllers/PaidTimer/notificationController');

// User routes
router.post('/send-request', protect, sendChatRequest);
router.post('/start-session', protect, startPaidSession);
router.post('/pause-timer', protect, pauseTimer);
router.post('/resume-timer', protect, resumeTimer);
router.post('/stop-timer', protect, stopTimer);
router.get('/active-session', protect, getActiveSession);
router.get('/history', protect, getChatHistory);
router.get('/pending/:psychicId', protect, checkPendingRequest);
router.get('/active/:psychicId', protect, checkActiveRequest);
router.delete('/requests/:requestId', protect, cancelChatRequest);
// Psychic routes
router.get('/timer/:requestId', protect,getTimerData  )
router.post('/accept-request', protectPsychic, acceptChatRequest);
router.post('/reject-request', protectPsychic, rejectChatRequest);
router.post('/pause-timer-psychic', protectPsychic, pauseTimer);
router.post('/resume-timer-psychic', protectPsychic, resumeTimer);
router.post('/stop-timer-psychic', protectPsychic, stopTimer);
router.get('/active-session-psychic', protectPsychic, getActiveSession);
router.get('/history-psychic', protectPsychic, getChatHistory);
router.get('/wallet/balance', protect, getUserWalletBalance);
router.post('/wallet/check-affordability', protect, checkAffordability);
// Notification routes (shared)
router.get('/notifications', protect, getNotifications);
router.post('/notifications/read', protect, markAsRead);
router.post('/notifications/read-all', protect, markAllAsRead);
router.delete('/notifications/:notificationId', protect, deleteNotification);

// Psychic notification routes
router.get('/psychic/pending-requests', protectPsychic, getPsychicPendingRequests);
router.get('/psychic/active-session', protectPsychic, getPsychicActiveSession);
router.get('/psychic/earnings', protectPsychic, getPsychicEarnings);
router.get('/psychic/earnings/user/:userId', protectPsychic, getPsychicEarningsByUserId);
router.get('/earnings/stats', protectPsychic, getPsychicEarningsStats);

router.get('/psychic/session/:requestId', protectPsychic, getPsychicSessionDetails);
router.get('/notifications/psychic', protectPsychic, getNotifications);
router.post('/notifications/psychic/read', protectPsychic, markAsRead);
router.post('/notifications/psychic/read-all', protectPsychic, markAllAsRead);
router.delete('/notifications/psychic/:notificationId', protectPsychic, deleteNotification);

module.exports = router;