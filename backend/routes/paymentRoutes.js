const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

// Stripe Payment Routes
router.post("/topup", protect, paymentController.createWalletTopup);
router.post("/webhook", paymentController.handleWebhook); // Stripe webhook
router.get("/status/:paymentId", protect, paymentController.checkPaymentStatus);
router.get("/user/recent", protect, paymentController.getRecentUserPayments);

router.get("/plans", paymentController.getCreditPlans);
router.post("/calculate", protect, paymentController.calculateCustomAmount);
router.get('/emergency-fix', paymentController.emergencyFixIndex);
// User payments
router.get("/user/:userId", protect, paymentController.getUserPayments);

// Admin Routes
router.get("/admin/transactions", paymentController.getAllTransactions);
router.delete("/admin/transactions/:transactionId", paymentController.deleteTransaction);
router.get("/admin/transactions/:transactionId", paymentController.getTransactionById);

module.exports = router;