// routes/Admin/psychicPaymentRoutes.js

const express = require('express');
const router = express.Router();
const { adminProtect } = require('../../middleware/adminProtect');
const {
  getAllPsychicsEarnings,
  getPsychicEarningsDetails,
  processPsychicPayment,
  getPsychicPaymentHistory,
 
  getAllPayments
} = require('../../controllers/CallSession/psychicPaymentController');

// All routes are protected by admin middleware
router.use(adminProtect);

// Get all psychics with earnings summary
router.get('/psychics', getAllPsychicsEarnings);

// Get all payments (admin dashboard)
router.get('/payments', getAllPayments);

// Get specific psychic earnings details
router.get('/psychic/:psychicId', getPsychicEarningsDetails);


// Get payment history for a specific psychic
router.get('/psychic/:psychicId/payments', getPsychicPaymentHistory);

// Process payment for a psychic
router.post('/psychic/:psychicId/pay', processPsychicPayment);

module.exports = router;