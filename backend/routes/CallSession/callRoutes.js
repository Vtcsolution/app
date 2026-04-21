// routes/callRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { protectPsychic } = require('../../middleware/PsychicMiddleware');
const {
  initiateCall,
  acceptCall,
  rejectCall,
  cancelCall,
  endCall,
  getCallStatus,
  getCallRequestById,
  getCallWithDetails,
  getUserCallHistory,
  getPsychicCallHistory,
  getPsychicActiveCall,
  getActiveCall,
  getPsychicPendingCalls,
  syncCallTimer
} = require('../../controllers/CallSession/callController');

// ===== USER ROUTES (protected by user auth) =====
router.post('/initiate/:psychicId', protect, initiateCall);
router.post('/cancel/:callRequestId', protect, cancelCall);
router.post('/end/:callSessionId', protect, endCall); // User can end call
router.get('/status/:callSessionId', protect, getCallStatus);
router.get('/active', protect, getActiveCall);
router.get('/history', protect, getUserCallHistory);
router.get('/sync-timer/:callSessionId', protect, syncCallTimer);

// ===== PSYCHIC ROUTES (protected by psychic auth) =====
router.get('/pending', protectPsychic, getPsychicPendingCalls);
router.get('/request/:callRequestId', protectPsychic, getCallRequestById);
router.get('/details/:callRequestId', protectPsychic, getCallWithDetails);
router.post('/accept/:callRequestId', protectPsychic, acceptCall);
router.post('/reject/:callRequestId', protectPsychic, rejectCall);
router.post('/psychic/end/:callSessionId', protectPsychic, endCall); // Psychic can end call
router.get('/psychic/active', protectPsychic, getPsychicActiveCall);
router.get('/psychic/history', protectPsychic, getPsychicCallHistory);
router.get('/psychic/sync-timer/:callSessionId', protectPsychic, syncCallTimer);

module.exports = router;