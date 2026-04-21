const express = require('express');
const router = express.Router();
const {
  addRating,
  getRatingsByPsychic,
  getRatingsByUser,
  getAllRatings,
  getRatingById,
  updateRating,
  deleteRating,
  getPsychicRatingSummary,
  checkRatingExists,
  getAllRatingsAdmin,
  deleteRatingAdmin,
  updateRatingAdmin,
  getRatingStatistics,
  getPsychicMyRatings,
  getPsychicMySummary,
  checkPsychicHasRatings,
  getPsychicMonthlyStats,
  getPsychicRatingById
} = require('../../controllers/HumanChatbot/ratingController');
const { protect } = require('../../middleware/auth');
const { protectPsychic } = require('../../middleware/PsychicMiddleware');
const { adminProtect } = require("../../middleware/adminProtect");

// Public routes
router.get('/psychic/:psychicId', getRatingsByPsychic);
router.get('/psychic/:psychicId/summary', getPsychicRatingSummary);
router.get('/:id', getRatingById);
router.get('/check-rating', protect, checkRatingExists);

// User routes (require user authentication)
router.post('/', protect, addRating);
router.get('/user/my-ratings', protect, getRatingsByUser);
router.put('/:id', protect, updateRating);
router.delete('/:id', protect, deleteRating);
router.get('/admin/all', adminProtect, getAllRatingsAdmin);
router.get('/admin/statistics', adminProtect, getRatingStatistics);
router.delete('/admin/:id', adminProtect, deleteRatingAdmin);
router.put('/admin/:id', adminProtect, updateRatingAdmin);
router.get('/psychic-reviews/my-ratings', protectPsychic, getPsychicMyRatings);
router.get('/psychic-reviews/my-summary', protectPsychic, getPsychicMySummary);
router.get('/psychic-reviews/has-ratings', protectPsychic, checkPsychicHasRatings);
router.get('/psychic-reviews/monthly-stats', protectPsychic, getPsychicMonthlyStats);
router.get('/psychic-reviews/rating/:id', protectPsychic, getPsychicRatingById);

// Admin routes (optional - add admin middleware if needed)
router.get('/', protect, getAllRatings); // Could add admin check

module.exports = router;