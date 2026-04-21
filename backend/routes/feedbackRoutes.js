const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { submitFeedback, getFeedbackByPsychicId, getAllFeedback, fetchAllRatings, deleteRatingById } = require("../controllers/feedbackController");

// Submit feedback for a psychic
router.post("/feedback/:psychicId", protect, submitFeedback);

// Fetch feedback for a specific psychic
router.get("/feedback/psychic/:psychicId", protect, getFeedbackByPsychicId);

// Fetch all feedback across all psychics (grouped by psychic)
router.get("/feedback/all", protect, getAllFeedback);

// Fetch all feedback ratings with pagination
router.get("/ratings", fetchAllRatings);

// Delete feedback by ID
router.delete("/feedback/:feedbackId", deleteRatingById);

module.exports = router;
