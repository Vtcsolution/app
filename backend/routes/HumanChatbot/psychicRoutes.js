const express = require('express');
const {
  registerPsychic,
  loginPsychic,
  logoutPsychic,
  getPsychicProfile,
  updatePsychicProfile,
  deletePsychicAccount,
  verifyPsychic,
  getAllPsychics,
  getPsychicById,
  unverifyPsychic,
  getPsychicChatAnalytics,
  getPsychicChatStats,
  getPsychicDetailedProfile,
  getAllPsychicsForAdmin, 
  adminDeletePsychic,
  getMyStatus,
  getPsychicStatus,
  adminCreatePsychic,
  getPsychicCategories,
  getPsychicStatuses,
  forgotPasswordPsychic,

  adminToggleVerifyPsychic,
  getPsychicStatusesFast,
  resetPasswordPsychic,
  verifyResetTokenPsychic,
  updatePasswordPsychic,
  updatePsychicStatus
} = require('../../controllers/HumanChatbot/psychicController');
const { protectPsychic } = require('../../middleware/PsychicMiddleware');
const { adminProtect } = require('../../middleware/adminProtect');

const router = express.Router();

// ========== PUBLIC ROUTES ==========
router.post('/register', registerPsychic);
router.post('/login', loginPsychic);
router.get('/', getAllPsychics); // Public: Get all verified psychics
router.get('/categories', getPsychicCategories);
router.post('/forgot-password', forgotPasswordPsychic);
router.put('/reset-password/:resetToken', resetPasswordPsychic);
router.get('/verify-reset-token/:resetToken', verifyResetTokenPsychic);

// Private route (requires auth)
router.put('/update-password', protectPsychic, updatePasswordPsychic);
// ========== PSYCHIC PROTECTED ROUTES ==========
router.get('/analytics', protectPsychic, getPsychicChatAnalytics);
router.get('/stats', protectPsychic, getPsychicChatStats);
router.post('/logout', protectPsychic, logoutPsychic);
router.get('/profile/me', protectPsychic, getPsychicProfile);
router.put('/profile/me', protectPsychic, updatePsychicProfile);
router.delete('/profile/me', protectPsychic, deletePsychicAccount);

router.put('/status', protectPsychic, updatePsychicStatus);

// Get psychic's own status
router.get('/my-status', protectPsychic, getMyStatus);

// Get single psychic status (public)
router.post('/status', getPsychicStatus);

// Get multiple psychic statuses (public) - optimized
router.post('/statuses', getPsychicStatuses);

// ========== ADD THIS: ULTRA-FAST STATUS ENDPOINT ==========
router.post('/statuses-fast', getPsychicStatusesFast);
// ========== PROFILE ROUTES ==========
router.get('/profile/:psychicId', getPsychicDetailedProfile);

router.get('/:id', getPsychicById); // THIS SHOULD BE THE VERY LAST GET ROUTE


router.get('/admin/all', adminProtect, getAllPsychicsForAdmin);
router.post('/admin/create', adminProtect, adminCreatePsychic);

// 2. Admin can verify/unverify psychic
router.put('/admin/:id/toggle-verify', adminProtect, adminToggleVerifyPsychic);
router.delete('/admin/:id', adminProtect, adminDeletePsychic);

// ========== LEGACY ROUTES (Keep for backward compatibility) ==========
router.put('/:id/verify', protectPsychic, verifyPsychic);
router.put('/:id/unverify', protectPsychic, unverifyPsychic);

module.exports = router;