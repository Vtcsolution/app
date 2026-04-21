const mongoose = require("mongoose");
const { stripeService, CREDIT_SYSTEM } = require("../config/stripe");
const Wallet = require("../models/Wallet");
const Payment = require("../models/Payment");
const User = require("../models/User");

exports.createWalletTopup = async (req, res) => {
  try {
    const { amount, planId, planName, credits, paymentMethod = 'card' } = req.body;
    const userId = req.user._id;
    const userEmail = req.user.email;

    console.log('Payment creation attempt:', {
      userId,
      planId,
      amount,
      userEmail
    });

    // Validate required fields
    if (!planId) {
      return res.status(400).json({ error: "Plan ID is required" });
    }

    // REMOVED: The check for existing pending payments
    // We now allow multiple pending payments

    let paymentDetails;
    let paymentMethodType = 'stripe_checkout';
    let paymentData = {};

    if (planId === 'custom') {
      // Custom amount payment
      if (!amount || amount < CREDIT_SYSTEM.MINIMUM_TOPUP_AMOUNT) {
        return res.status(400).json({ 
          error: `Amount must be at least $${CREDIT_SYSTEM.MINIMUM_TOPUP_AMOUNT}` 
        });
      }

      // Calculate credits for custom amount
      const baseCredits = CREDIT_SYSTEM.dollarsToCredits(amount);
      const bonusCredits = CREDIT_SYSTEM.calculateBonusCredits(amount);
      const totalCredits = baseCredits + bonusCredits;

      // Create payment intent
      paymentDetails = await stripeService.createPaymentIntent(
        amount, 
        userId, 
        planName || 'Custom Plan',
        {
          baseCredits,
          totalCredits,
          bonusCredits
        }
      );
      paymentMethodType = 'stripe';
      
      // Prepare payment data
      paymentData = {
        userId,
        amount,
        planName: planName || 'Custom Plan',
        creditsPurchased: baseCredits,
        totalCredits,
        bonusCredits,
        paymentMethod: paymentMethodType,
        stripePaymentId: paymentDetails.paymentIntentId,
        paymentIntentId: paymentDetails.paymentIntentId,
        clientSecret: paymentDetails.clientSecret,
        status: "pending",
        redirectUrl: `${process.env.FRONTEND_URL}/payment/result`,
        webhookUrl: `${process.env.BACKEND_URL}/api/payments/webhook`
      };

    } else {
      // Predefined plan - create checkout session
      paymentDetails = await stripeService.createCheckoutSession(planId, userId, userEmail);
      paymentMethodType = 'stripe_checkout';

      const plans = CREDIT_SYSTEM.getPlans();
      const plan = plans.find(p => p.id === planId);

      if (!plan) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      // Prepare payment data
      paymentData = {
        userId,
        amount: plan.amount,
        planName: plan.name,
        creditsPurchased: plan.credits,
        totalCredits: plan.totalCredits,
        bonusCredits: plan.bonusCredits,
        paymentMethod: paymentMethodType,
        stripePaymentId: paymentDetails.sessionId,
        checkoutSessionId: paymentDetails.sessionId,
        status: "pending",
        redirectUrl: `${process.env.FRONTEND_URL}/payment/result`,
        webhookUrl: `${process.env.BACKEND_URL}/api/payments/webhook`
      };
    }

    // 检查是否已存在相同的stripePaymentId
    const existingPayment = await Payment.findOne({
      stripePaymentId: paymentData.stripePaymentId
    });

    if (existingPayment) {
      console.log('Payment with same stripe ID already exists:', existingPayment._id);
      return res.status(400).json({ 
        error: "Payment already exists",
        paymentId: existingPayment._id
      });
    }

    // 创建支付记录
    const payment = new Payment(paymentData);
    await payment.save();

    console.log('Payment record created:', {
      paymentId: payment._id,
      stripeId: paymentData.stripePaymentId,
      amount: paymentData.amount,
      userId: userId.toString()
    });

    // 返回响应
    if (planId === 'custom') {
      return res.json({
        success: true,
        clientSecret: paymentData.clientSecret,
        paymentIntentId: paymentData.paymentIntentId,
        amount: paymentData.amount,
        credits: paymentData.totalCredits,
        bonusCredits: paymentData.bonusCredits,
        paymentId: payment._id
      });
    } else {
      return res.json({
        success: true,
        sessionId: paymentData.checkoutSessionId,
        url: paymentDetails.url,
        amount: paymentData.amount,
        planName: paymentData.planName,
        credits: paymentData.totalCredits,
        paymentId: payment._id
      });
    }

  } catch (error) {
    console.error("Payment creation failed:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      body: req.body
    });
    
    res.status(500).json({ 
      error: "Payment initialization failed",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
exports.emergencyFixIndex = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('payments');
    
    console.log('🔧 Starting emergency fix for payment indexes...');
    
    // Get all indexes first
    const indexes = await collection.listIndexes().toArray();
    console.log('Current indexes before fix:', indexes.map(i => ({
      name: i.name,
      key: i.key,
      unique: i.unique || false
    })));
    
    // Remove ALL mollie-related indexes
    const mollieIndexes = indexes.filter(index => 
      index.name.includes('mollie') || 
      (index.key && index.key.molliePaymentId)
    );
    
    for (const index of mollieIndexes) {
      try {
        await collection.dropIndex(index.name);
        console.log(`✅ Dropped index: ${index.name}`);
      } catch (error) {
        if (error.codeName === 'IndexNotFound') {
          console.log(`Index ${index.name} already removed`);
        } else {
          console.log(`Error dropping ${index.name}:`, error.message);
        }
      }
    }
    
    // Remove molliePaymentId field from all documents
    const updateResult = await collection.updateMany(
      { molliePaymentId: { $exists: true } },
      { $unset: { molliePaymentId: "" } }
    );
    
    console.log(`✅ Removed molliePaymentId field from ${updateResult.modifiedCount} documents`);
    
    // Recreate all necessary indexes for Stripe
    console.log('🔄 Recreating Stripe indexes...');
    
    // Drop all existing non-_id indexes first to start fresh
    const nonIdIndexes = indexes.filter(index => index.name !== '_id_');
    for (const index of nonIdIndexes) {
      try {
        await collection.dropIndex(index.name);
      } catch (error) {
        // Ignore errors for indexes that don't exist
      }
    }
    
    // Create Stripe indexes
    await collection.createIndex({ userId: 1, createdAt: -1 });
    await collection.createIndex({ stripePaymentId: 1 }, { unique: true });
    await collection.createIndex({ paymentIntentId: 1 }, { sparse: true });
    await collection.createIndex({ checkoutSessionId: 1 }, { sparse: true });
    await collection.createIndex({ status: 1 });
    await collection.createIndex({ createdAt: -1 });
    
    console.log('✅ Stripe indexes recreated');
    
    // Verify indexes
    const finalIndexes = await collection.listIndexes().toArray();
    console.log('Final indexes after fix:', finalIndexes.map(i => i.name));
    
    res.json({ 
      success: true, 
      message: 'Emergency fix completed successfully',
      indexes: finalIndexes.map(i => i.name),
      documentsUpdated: updateResult.modifiedCount
    });
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
    res.status(500).json({ 
      success: false,
      error: 'Fix failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
// Handle Stripe webhook
exports.handleWebhook = async (req, res) => {
  let event;

  try {
    const signature = req.headers['stripe-signature'];
    event = stripeService.verifyWebhookSignature(req, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object);
      break;
    case 'checkout.session.expired':
      await handleCheckoutSessionExpired(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).send('Received');
};

// Helper functions for webhook handling
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const { userId, planName, amount, credits, totalCredits, bonusCredits } = paymentIntent.metadata;
    
    // 使用事务确保原子性
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 首先检查是否已存在记录
      let payment = await Payment.findOne({ 
        paymentIntentId: paymentIntent.id
      }).session(session);

      if (!payment) {
        // 如果没有找到，尝试通过stripePaymentId查找
        payment = await Payment.findOne({ 
          stripePaymentId: paymentIntent.id
        }).session(session);
      }

      if (payment) {
        if (payment.status === 'paid') {
          console.log('Payment already processed:', payment._id);
          await session.commitTransaction();
          return;
        }
        
        // 更新现有支付记录
        payment.status = 'paid';
        payment.creditsAdded = parseInt(totalCredits);
        payment.paidAt = new Date();
        await payment.save({ session });
      } else {
        // 创建新支付记录
        payment = new Payment({
          userId,
          amount: parseFloat(amount),
          planName,
          creditsPurchased: parseInt(credits),
          totalCredits: parseInt(totalCredits),
          bonusCredits: parseInt(bonusCredits),
          paymentMethod: 'stripe',
          stripePaymentId: paymentIntent.id,
          paymentIntentId: paymentIntent.id,
          status: 'paid',
          creditsAdded: parseInt(totalCredits),
          paidAt: new Date()
        });
        await payment.save({ session });
      }

      // 更新用户钱包
      const walletUpdate = await Wallet.findOneAndUpdate(
        { userId },
        {
          $inc: {
            balance: parseInt(totalCredits),
            credits: parseInt(totalCredits)
          },
          $set: { lastTopup: new Date() }
        },
        { upsert: true, new: true, session }
      );

      await session.commitTransaction();
      
      console.log('Payment successful - Wallet updated:', {
        userId,
        paymentId: payment._id,
        creditsAdded: totalCredits,
        walletBalance: walletUpdate.balance
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}
async function handleCheckoutSessionCompleted(session) {
  try {
    const { userId, planId, planName, amount, credits, totalCredits, bonusCredits } = session.metadata;
    
    let payment = await Payment.findOne({ 
      checkoutSessionId: session.id,
      status: 'pending'
    });

    if (!payment) {
      // Create new payment record if not exists
      payment = new Payment({
        userId,
        amount: parseFloat(amount),
        planName,
        creditsPurchased: parseInt(credits),
        totalCredits: parseInt(totalCredits),
        bonusCredits: parseInt(bonusCredits),
        paymentMethod: 'stripe_checkout',
        stripePaymentId: session.id,
        checkoutSessionId: session.id,
        status: 'paid',
        creditsAdded: parseInt(totalCredits),
        paidAt: new Date()
      });
      await payment.save();
    } else {
      // Update existing payment
      payment.status = 'paid';
      payment.creditsAdded = parseInt(totalCredits);
      payment.paidAt = new Date();
      await payment.save();
    }

    // Update user wallet
    const walletUpdate = await Wallet.findOneAndUpdate(
      { userId },
      {
        $inc: {
          balance: parseInt(totalCredits),
          credits: parseInt(totalCredits)
        },
        $set: { lastTopup: new Date() }
      },
      { upsert: true, new: true }
    );

    console.log('Checkout session completed - Wallet updated:', {
      userId,
      paymentId: payment._id,
      creditsAdded: totalCredits,
      walletBalance: walletUpdate.balance
    });

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const payment = await Payment.findOneAndUpdate(
      { paymentIntentId: paymentIntent.id },
      {
        status: 'failed',
        errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (payment) {
      console.log('Payment failed:', {
        paymentId: payment._id,
        error: payment.errorMessage
      });
    }
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handleCheckoutSessionExpired(session) {
  try {
    const payment = await Payment.findOneAndUpdate(
      { checkoutSessionId: session.id },
      {
        status: 'canceled',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (payment) {
      console.log('Checkout session expired:', {
        paymentId: payment._id
      });
    }
  } catch (error) {
    console.error('Error handling checkout session expired:', error);
  }
}

exports.checkPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // First try to find by MongoDB ObjectId
    let payment;
    
    // Check if it's a valid MongoDB ObjectId (24 hex chars)
    const isValidObjectId = mongoose.Types.ObjectId.isValid(paymentId);
    
    if (isValidObjectId) {
      // Search by MongoDB _id
      payment = await Payment.findById(paymentId);
    } else {
      // Search by Stripe payment IDs (session ID, payment intent ID, or stripePaymentId)
      payment = await Payment.findOne({
        $or: [
          { stripePaymentId: paymentId },
          { paymentIntentId: paymentId },
          { checkoutSessionId: paymentId }
        ]
      });
    }
    
    if (!payment) {
      console.error('checkPaymentStatus: Payment not found', { paymentId, isValidObjectId });
      return res.status(404).json({ error: "Payment not found" });
    }

    // Check Stripe status for payment intent
    if (payment.paymentIntentId) {
      try {
        const paymentIntent = await stripeService.getPaymentIntent(payment.paymentIntentId);
        payment.status = paymentIntent.status === 'succeeded' ? 'paid' : paymentIntent.status;
        await payment.save();
      } catch (error) {
        console.error('Error checking payment intent status:', error);
      }
    }

    // Check Stripe status for checkout session
    if (payment.checkoutSessionId) {
      try {
        const session = await stripeService.getCheckoutSession(payment.checkoutSessionId);
        payment.status = session.payment_status === 'paid' ? 'paid' : payment.status;
        await payment.save();
      } catch (error) {
        console.error('Error checking checkout session status:', error);
      }
    }

    // If payment is paid but credits not added, add them
    if (payment.status === 'paid' && payment.creditsAdded === 0) {
      try {
        payment.creditsAdded = payment.totalCredits;
        await payment.save();

        const walletUpdate = await Wallet.findOneAndUpdate(
          { userId: payment.userId },
          {
            $inc: {
              balance: payment.totalCredits,
              credits: payment.totalCredits
            },
            $set: { lastTopup: new Date() }
          },
          { upsert: true, new: true }
        );

        console.log('Credits added after status check:', {
          userId: payment.userId.toString(),
          creditsAdded: payment.totalCredits,
          walletBalance: walletUpdate.balance
        });
      } catch (walletError) {
        console.error('Failed to update wallet:', walletError);
      }
    }

    res.json({
      status: payment.status,
      amount: payment.amount,
      credits: payment.totalCredits,
      creditsAdded: payment.creditsAdded,
      paymentMethod: payment.paymentMethod,
      stripePaymentId: payment.stripePaymentId,
      createdAt: payment.createdAt
    });
  } catch (error) {
    console.error("Error checking payment status:", {
      error: error.message,
      stack: error.stack,
      paymentId: req.params.paymentId
    });
    res.status(500).json({ error: "Error checking payment status" });
  }
};

// Get recent user payments (for checking multiple pending payments)
exports.getRecentUserPayments = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const recentPayments = await Payment.find({
      userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    })
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      success: true,
      payments: recentPayments.map(p => ({
        id: p._id,
        amount: p.amount,
        status: p.status,
        planName: p.planName,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    res.status(500).json({ error: 'Failed to fetch recent payments' });
  }
};
// Get credit plans
exports.getCreditPlans = async (req, res) => {
  try {
    const plans = CREDIT_SYSTEM.getPlans();
    
    res.json({
      success: true,
      plans,
      creditRate: CREDIT_SYSTEM.CREDIT_RATE,
      currency: CREDIT_SYSTEM.CURRENCY,
      minimumTopup: CREDIT_SYSTEM.MINIMUM_TOPUP_AMOUNT
    });
  } catch (error) {
    console.error('Error getting credit plans:', error);
    res.status(500).json({ error: 'Failed to get credit plans' });
  }
};

// Calculate custom amount
exports.calculateCustomAmount = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    const numericAmount = parseFloat(amount);
    
    // Validate minimum amount
    if (numericAmount < CREDIT_SYSTEM.MINIMUM_TOPUP_AMOUNT) {
      return res.status(400).json({ 
        error: `Minimum top-up amount is $${CREDIT_SYSTEM.MINIMUM_TOPUP_AMOUNT}` 
      });
    }

    // Calculate credits
    const baseCredits = CREDIT_SYSTEM.dollarsToCredits(numericAmount);
    const bonusCredits = CREDIT_SYSTEM.calculateBonusCredits(numericAmount);
    const totalCredits = baseCredits + bonusCredits;

    res.json({
      success: true,
      amount: numericAmount,
      baseCredits,
      bonusCredits,
      totalCredits,
      bonusPercentage: bonusCredits > 0 ? Math.round((bonusCredits / baseCredits) * 100) : 0,
      currency: CREDIT_SYSTEM.CURRENCY
    });
  } catch (error) {
    console.error('Error calculating custom amount:', error);
    res.status(500).json({ error: 'Failed to calculate credits' });
  }
};

// Get user payments (Updated for Stripe)
exports.getUserPayments = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?._id;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await User.findById(userId).select('username email image firstName lastName');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const pipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          tran_id: "$stripePaymentId",
          user: {
            username: { $ifNull: ["$user.username", user.username] },
            name: { $concat: [ { $ifNull: ["$user.firstName", ""] }, " ", { $ifNull: ["$user.lastName", ""] } ] },
            email: { $ifNull: ["$user.email", user.email] },
            profile: { $ifNull: ["$user.image", user.image || ""] },
            firstName: { $ifNull: ["$user.firstName", user.firstName] },
            lastName: { $ifNull: ["$user.lastName", user.lastName] }
          },
          amount: 1,
          credits: "$totalCredits",
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          planName: 1,
          paymentMethod: 1,
          creditsAdded: 1,
          redirectUrl: 1,
          username: { $ifNull: ["$user.username", user.username] },
          userEmail: { $ifNull: ["$user.email", user.email] },
          userProfile: { $ifNull: ["$user.image", user.image || ""] }
        }
      },
      { $sort: { createdAt: -1 } }
    ];

    const paymentsWithUser = await Payment.aggregate(pipeline);
    const totalCount = await Payment.countDocuments({ userId });

    res.json({
      success: true,
      count: paymentsWithUser.length,
      total: totalCount,
      user: {
        username: user.username,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        profile: user.image || ""
      },
      payments: paymentsWithUser
    });

  } catch (error) {
    console.error("Error fetching user payments:", error);
    res.status(500).json({ error: "Failed to fetch user payments" });
  }
};

// Get all transactions (Updated for Stripe)
exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, sort = 'createdAt', order = 'desc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      const searchFilter = [
        { "planName": { $regex: search, $options: 'i' } },
        { "stripePaymentId": { $regex: search, $options: 'i' } }
      ];
      
      const userSearch = await User.find({
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      if (userSearch.length > 0) {
        const userIds = userSearch.map(u => u._id);
        searchFilter.push({ userId: { $in: userIds } });
      }
      
      filter.$or = searchFilter;
    }

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                username: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                image: 1,
                gender: 1,
                isActive: { $ifNull: [true, true] },
                createdAt: 1
              }
            }
          ]
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          fullName: {
            $cond: {
              if: { $and: [{ $ne: ["$user.firstName", null] }, { $ne: ["$user.firstName", ""] }] },
              then: {
                $concat: [
                  { $ifNull: ["$user.firstName", ""] },
                  " ",
                  { $ifNull: ["$user.lastName", ""] }
                ]
              },
              else: { $ifNull: ["$user.username", "Unknown User"] }
            }
          },
          userDisplayName: { $ifNull: ["$user.username", "Unknown User"] }
        }
      },
      {
        $project: {
          _id: 1,
          tran_id: "$stripePaymentId",
          user: {
            username: "$userDisplayName",
            name: "$fullName",
            email: { $ifNull: ["$user.email", "No email"] },
            profile: { $ifNull: ["$user.image", ""] },
            firstName: { $ifNull: ["$user.firstName", ""] },
            lastName: { $ifNull: ["$user.lastName", ""] },
            gender: { $ifNull: ["$user.gender", ""] },
            isActive: { $ifNull: ["$user.isActive", true] }
          },
          username: "$userDisplayName",
          fullName: "$fullName",
          userEmail: { $ifNull: ["$user.email", "No email"] },
          userProfile: { $ifNull: ["$user.image", ""] },
          userGender: { $ifNull: ["$user.gender", ""] },
          userIsActive: { $ifNull: ["$user.isActive", true] },
          amount: 1,
          credits: "$totalCredits",
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          planName: 1,
          paymentMethod: 1,
          creditsAdded: 1,
          redirectUrl: 1
        }
      },
      { 
        $sort: { 
          [sort]: order === 'desc' ? -1 : 1 
        } 
      },
      { $skip: skip },
      { $limit: limitNum }
    ];

    const transactions = await Payment.aggregate(pipeline);
    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error("Error fetching all transactions:", error);
    res.status(500).json({ 
      error: "Failed to fetch transactions"
    });
  }
};

// Delete transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const transactionWithUser = await Payment.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(transactionId) } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          tran_id: "$stripePaymentId",
          username: { $ifNull: ["$user.username", "Unknown User"] },
          fullName: {
            $cond: {
              if: { $and: [{ $ne: ["$user.firstName", null] }, { $ne: ["$user.firstName", ""] }] },
              then: {
                $concat: [
                  { $ifNull: ["$user.firstName", ""] },
                  " ",
                  { $ifNull: ["$user.lastName", ""] }
                ]
              },
              else: { $ifNull: ["$user.username", "Unknown User"] }
            }
          },
          userEmail: { $ifNull: ["$user.email", "No email"] },
          amount: 1,
          credits: "$totalCredits",
          status: 1,
          planName: 1,
          createdAt: 1,
          userId: 1
        }
      }
    ]);

    if (!transactionWithUser.length) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    await Payment.findByIdAndDelete(transactionId);

    const transactionData = transactionWithUser[0];
    
    console.log('Transaction deleted:', {
      transactionId,
      username: transactionData.username,
      fullName: transactionData.fullName,
      userEmail: transactionData.userEmail,
      stripePaymentId: transactionData.tran_id,
      userId: transactionData.userId,
      amount: transactionData.amount,
      credits: transactionData.credits
    });

    res.json({
      success: true,
      message: "Transaction deleted successfully",
      data: transactionData
    });

  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ 
      error: "Failed to delete transaction"
    });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(transactionId) } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                username: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                image: 1,
                gender: 1,
                bio: 1,
                dob: 1,
                isActive: { $ifNull: [true, true] },
                createdAt: 1
              }
            }
          ]
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          fullName: {
            $cond: {
              if: { $and: [{ $ne: ["$user.firstName", null] }, { $ne: ["$user.firstName", ""] }] },
              then: {
                $concat: [
                  { $ifNull: ["$user.firstName", ""] },
                  " ",
                  { $ifNull: ["$user.lastName", ""] }
                ]
              },
              else: { $ifNull: ["$user.username", "Unknown User"] }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          tran_id: "$stripePaymentId",
          user: {
            username: { $ifNull: ["$user.username", "Unknown User"] },
            name: "$fullName",
            email: { $ifNull: ["$user.email", "No email"] },
            profile: { $ifNull: ["$user.image", ""] },
            firstName: { $ifNull: ["$user.firstName", ""] },
            lastName: { $ifNull: ["$user.lastName", ""] },
            gender: { $ifNull: ["$user.gender", ""] },
            bio: { $ifNull: ["$user.bio", ""] },
            dob: { $ifNull: ["$user.dob", ""] },
            isActive: { $ifNull: ["$user.isActive", true] },
            createdAt: "$user.createdAt"
          },
          username: { $ifNull: ["$user.username", "Unknown User"] },
          fullName: "$fullName",
          userEmail: { $ifNull: ["$user.email", "No email"] },
          userProfile: { $ifNull: ["$user.image", ""] },
          userGender: { $ifNull: ["$user.gender", ""] },
          userBio: { $ifNull: ["$user.bio", ""] },
          userDob: { $ifNull: ["$user.dob", ""] },
          userIsActive: { $ifNull: ["$user.isActive", true] },
          amount: 1,
          credits: "$totalCredits",
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          planName: 1,
          paymentMethod: 1,
          creditsAdded: 1,
          redirectUrl: 1
        }
      }
    ];

    const transaction = await Payment.aggregate(pipeline);

    if (!transaction.length) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({
      success: true,
      data: transaction[0]
    });

  } catch (error) {
    console.error("Error fetching transaction details:", error);
    res.status(500).json({ 
      error: "Failed to fetch transaction details"
    });
  }
};