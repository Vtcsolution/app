// routes/Psychic/psychicPaymentRoutes.js

const express = require('express');
const router = express.Router();
const { protectPsychic } = require('../../middleware/PsychicMiddleware');
const {
  getMyPaymentHistory,
  getMyPaymentSummary
} = require('../../controllers/CallSession/psychicpaidController'); // Make sure this path is correct

// All routes are protected by psychic middleware
router.use(protectPsychic);

// Get psychic's own payment history
router.get('/history', getMyPaymentHistory);

// Get psychic's payment summary
router.get('/summary', getMyPaymentSummary);

module.exports = router;