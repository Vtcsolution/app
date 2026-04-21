const ActiveCallSession = require('../../models/CallSession/ActiveCallSession');
const ChatRequest = require('../../models/Paidtimer/ChatRequest');
const Payment = require('../../models/Payment'); // Payment model
const mongoose = require('mongoose');

// Existing function
const getUserSessionsSummary = async (req, res) => {
  try {
    // Get userId from params or from authenticated user
    const userId = req.params.userId || req.user._id;
    
    // Verify that the requested user ID matches the authenticated user
    if (req.params.userId && req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user\'s data'
      });
    }

    console.log('Fetching sessions for user:', userId);

    // Get all chat sessions
    const chatSessions = await ChatRequest.find({
      user: userId
    })
    .populate('psychic', 'name email profileImage displayName specialty')
    .sort({ updatedAt: -1 })
    .lean();

    // Get all call sessions
    const callSessions = await ActiveCallSession.find({
      userId: userId
    })
    .populate('psychicId', 'name email profileImage displayName specialty')
    .sort({ updatedAt: -1 })
    .lean();

    console.log(`Found ${chatSessions.length} chat sessions and ${callSessions.length} call sessions`);

    // Process chat sessions
    const processedChats = chatSessions.map(chat => ({
      _id: chat._id,
      psychicId: chat.psychic,
      status: chat.status,
      startedAt: chat.startedAt,
      endedAt: chat.endedAt,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      recentMessages: [],
      messageStats: {
        total: 0,
        unread: 0
      }
    }));

    // Process call sessions
    const processedCalls = callSessions.map(call => ({
      _id: call._id,
      psychicId: call.psychicId,
      status: call.status,
      startTime: call.startTime,
      endTime: call.endTime,
      createdAt: call.createdAt,
      updatedAt: call.updatedAt,
      totalCreditsUsed: call.totalCreditsUsed || 0,
      recordingUrl: call.recordingUrl
    }));

    // Calculate summary statistics
    const summary = {
      totalCalls: processedCalls.length,
      totalChats: processedChats.length,
      totalMessages: processedChats.reduce((sum, chat) => sum + (chat.messageStats?.total || 0), 0),
      totalCallDuration: formatTotalDuration(processedCalls.reduce((total, call) => {
        if (call.startTime && call.endTime) {
          return total + (new Date(call.endTime) - new Date(call.startTime));
        }
        return total;
      }, 0)),
      totalPsychicsInteracted: new Set([
        ...processedChats.map(c => c.psychicId?._id?.toString()).filter(Boolean),
        ...processedCalls.map(c => c.psychicId?._id?.toString()).filter(Boolean)
      ]).size,
      totalCreditsUsed: processedCalls.reduce((sum, call) => sum + (call.totalCreditsUsed || 0), 0)
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        chats: {
          sessions: processedChats
        },
        calls: {
          sessions: processedCalls
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user sessions summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions summary',
      error: error.message
    });
  }
};

// NEW FUNCTION: Get user transactions from Payment model
const getUserTransactions = async (req, res) => {
  try {
    // Get userId from params or from authenticated user
    const userId = req.params.userId || req.user._id;
    
    // Verify that the requested user ID matches the authenticated user
    if (req.params.userId && req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user\'s transactions'
      });
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    console.log('Fetching payment transactions for user:', userId);

    // Get query parameters for pagination and filtering
    const { 
      limit = 50, 
      page = 1,
      status,
      startDate,
      endDate
    } = req.query;

    // Build filter object
    const filter = { userId };
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch payments from Payment model
    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await Payment.countDocuments(filter);

    // Calculate payment summary using Payment model aggregation
    const summary = await Payment.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalCreditsPurchased: { $sum: '$creditsPurchased' },
        totalBonusCredits: { $sum: '$bonusCredits' },
        totalPayments: { $sum: 1 },
        successfulPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        pendingPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        averageAmount: { $avg: '$amount' }
      }}
    ]);

    // Format payments for frontend
    const formattedTransactions = payments.map(payment => ({
      id: payment._id,
      transactionId: payment.stripePaymentId || payment.paymentIntentId || payment._id,
      type: 'purchase',
      amount: payment.amount,
      credits: payment.creditsPurchased || 0,
      bonusCredits: payment.bonusCredits || 0,
      totalCredits: payment.totalCredits || (payment.creditsPurchased + (payment.bonusCredits || 0)),
      description: `Purchase: ${payment.planName || 'Credit Package'}`,
      planName: payment.planName,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      stripePaymentId: payment.stripePaymentId,
      paymentIntentId: payment.paymentIntentId,
      checkoutSessionId: payment.checkoutSessionId,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      formattedDate: new Date(payment.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAmount: summary[0]?.totalAmount || 0,
          totalCreditsPurchased: summary[0]?.totalCreditsPurchased || 0,
          totalBonusCredits: summary[0]?.totalBonusCredits || 0,
          totalPayments: summary[0]?.totalPayments || 0,
          successfulPayments: summary[0]?.successfulPayments || 0,
          failedPayments: summary[0]?.failedPayments || 0,
          pendingPayments: summary[0]?.pendingPayments || 0,
          averageAmount: summary[0]?.averageAmount || 0
        },
        transactions: formattedTransactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};

// Helper function to format total duration
const formatTotalDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return '< 1m';
  }
};

module.exports = {
  getUserSessionsSummary,
  getUserTransactions // Export the new function
};