const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  creditsPurchased: {
    type: Number,
    required: true
  },
  totalCredits: {
    type: Number,
    required: true
  },
  bonusCredits: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["stripe", "stripe_checkout", "card"]
  },
  stripePaymentId: {
    type: String,
    required: true
    // REMOVED: unique: true - defined in schema.index() below
  },
  paymentIntentId: {
    type: String
    // REMOVED: sparse: true - defined in schema.index() below
  },
  checkoutSessionId: {
    type: String
    // REMOVED: sparse: true - defined in schema.index() below
  },
  clientSecret: {
    type: String,
    sparse: true // Keep this one as it's only defined here
  },
  status: {
    type: String,
    enum: ["pending", "paid", "failed", "canceled", "processing"],
    default: "pending"
  },
  creditsAdded: {
    type: Number,
    default: 0
  },
  redirectUrl: {
    type: String
  },
  webhookUrl: {
    type: String
  },
  paidAt: {
    type: Date
  },
  errorMessage: {
    type: String
  }
}, { 
  timestamps: true,
  autoIndex: true
});

// Define indexes explicitly (removing duplicates from field definitions)
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ stripePaymentId: 1 }, { unique: true });
paymentSchema.index({ paymentIntentId: 1 }, { sparse: true });
paymentSchema.index({ checkoutSessionId: 1 }, { sparse: true });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);