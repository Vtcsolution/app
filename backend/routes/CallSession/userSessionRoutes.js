const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth'); // Adjust path as needed
const userSessionController = require('../../controllers/CallSession/userSessionController'); // Adjust path as needed

// All routes are protected
router.use(protect);


router.get('/summary', userSessionController.getUserSessionsSummary);
router.get('/transactions/:userId',userSessionController. getUserTransactions);

module.exports = router;