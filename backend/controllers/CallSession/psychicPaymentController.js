// controllers/Admin/psychicPaymentController.js - FIXED VERSION

const PsychicPayment  = require('../../models/CallSession/PsychicPayment');
const ChatRequest = require('../../models/Paidtimer/ChatRequest');
const ActiveCallSession = require('../../models/CallSession/ActiveCallSession');
const Psychic = require('../../models/HumanChat/Psychic');
const mongoose = require('mongoose');

// Helper function to calculate psychic earnings (25% of total)
const calculatePsychicEarnings = (totalAmount) => {
  return totalAmount * 0.25;
};

// Helper function to calculate platform commission (75% of total)
const calculatePlatformCommission = (totalAmount) => {
  return totalAmount * 0.75;
};

// Get all psychics with their earnings summary
exports.getAllPsychicsEarnings = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query for psychics
    let psychicQuery = {};
    if (search) {
      psychicQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get all psychics
    const psychics = await Psychic.find(psychicQuery)
      .select('name email image phone isOnline isAvailable category')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Psychic.countDocuments(psychicQuery);

    // Get earnings for each psychic
    const psychicsWithEarnings = await Promise.all(
      psychics.map(async (psychic) => {
        const earnings = await calculatePsychicTotalEarnings(psychic._id);
        const paymentHistory = await getPsychicPaymentSummary(psychic._id);
        
        return {
          ...psychic,
          earnings: earnings.summary,
          paymentSummary: paymentHistory
        };
      })
    );

    res.json({
      success: true,
      data: psychicsWithEarnings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all psychics earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// controllers/Psychic/psychicPaymentController.js


// Helper function to format currency
const formatCurrency = (amount) => {
  return amount || 0;
};

// Get psychic's own payment history

// Get detailed earnings for a specific psychic
exports.getPsychicEarningsDetails = async (req, res) => {
  try {
    const { psychicId } = req.params;

    // Check if psychic exists
    const psychic = await Psychic.findById(psychicId)
      .select('name email image phone isOnline isAvailable category');
    
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    // Get earnings calculation with paid status
    const earnings = await calculatePsychicTotalEarnings(psychicId);
    
    // Get payment history
    const paymentHistory = await PsychicPayment.find({ psychicId })
      .sort({ paymentDate: -1 })
      .populate('processedBy', 'name email');

    // Calculate pending amount (total unpaid)
    const totalPaid = paymentHistory
      .filter(p => p.status === 'processed')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingAmount = earnings.summary.totalPsychicEarnings - totalPaid;

    // Get unpaid sessions
    const unpaidSessions = earnings.sessions.filter(session => !session.isPaid);

    res.json({
      success: true,
      data: {
        psychic: {
          _id: psychic._id,
          name: psychic.name,
          email: psychic.email,
          image: psychic.image,
          phone: psychic.phone,
          isOnline: psychic.isOnline,
          isAvailable: psychic.isAvailable,
          category: psychic.category
        },
        earnings: {
          ...earnings.summary,
          totalPaid,
          pendingAmount: Math.max(0, pendingAmount),
          totalUnpaidSessions: unpaidSessions.length
        },
        sessions: earnings.sessions,
        paymentHistory,
        splitRatio: {
          psychic: 0.25,
          platform: 0.75
        }
      }
    });
  } catch (error) {
    console.error('Get psychic earnings details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Process payment for psychic - WITH session payment tracking
exports.processPsychicPayment = async (req, res) => {
  try {
    const { psychicId } = req.params;
    const { 
      amount, 
      paymentId, 
      paymentMethod = 'bank_transfer',
      notes = '',
      paymentScreenshot = '' 
    } = req.body;

    const adminId = req.admin._id;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    // Check if psychic exists
    const psychic = await Psychic.findById(psychicId);
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    // Check if payment ID already exists
    const existingPayment = await PsychicPayment.findOne({ paymentId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID already exists'
      });
    }

    // Get current earnings with unpaid sessions
    const earnings = await calculatePsychicTotalEarnings(psychicId);
    
    // Get previous payments
    const previousPayments = await PsychicPayment.find({ 
      psychicId,
      status: 'processed'
    });
    
    const totalPaidSoFar = previousPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = earnings.summary.totalPsychicEarnings - totalPaidSoFar;

    // Check if payment amount is valid
    if (amount > pendingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${amount}) exceeds pending amount (${pendingAmount.toFixed(2)})`
      });
    }

    // Calculate which sessions are being paid for (FIFO - pay oldest sessions first)
    const unpaidSessions = earnings.sessions
      .filter(s => !s.isPaid)
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Oldest first

    let remainingAmount = amount;
    const paidSessions = [];
    const sessionsToMark = [];

    // Mark sessions as paid until we've used up the payment amount
    for (const session of unpaidSessions) {
      if (remainingAmount <= 0) break;
      
      const sessionAmount = session.amount;
      if (sessionAmount <= remainingAmount) {
        // Pay full session
        paidSessions.push({
          sessionId: session._id,
          sessionType: session.type === 'chat' ? 'ChatRequest' : 'ActiveCallSession',
          amount: sessionAmount,
          date: session.date,
          duration: session.duration,
          fullyPaid: true
        });
        sessionsToMark.push({
          id: session._id,
          type: session.type === 'chat' ? 'ChatRequest' : 'ActiveCallSession',
          amount: sessionAmount
        });
        remainingAmount -= sessionAmount;
      } else {
        // Partial payment (rare, but possible)
        paidSessions.push({
          sessionId: session._id,
          sessionType: session.type === 'chat' ? 'ChatRequest' : 'ActiveCallSession',
          amount: remainingAmount,
          date: session.date,
          duration: session.duration,
          fullyPaid: false
        });
        // For partial payments, we don't mark as fully paid
        remainingAmount = 0;
      }
    }

    // Calculate platform commission
    const totalEarnings = earnings.summary.totalEarnings;
    const platformCommission = calculatePlatformCommission(totalEarnings);
    const psychicPayout = calculatePsychicEarnings(totalEarnings);

    // Create payment record
    const payment = new PsychicPayment({
      psychicId,
      amount,
      paymentId,
      paymentMethod,
      paymentScreenshot,
      totalEarnings,
      platformCommission,
      psychicPayout,
      earningsBreakdown: {
        chatEarnings: earnings.summary.chatEarnings,
        callEarnings: earnings.summary.callEarnings,
        sessionsBreakdown: paidSessions
      },
      beforePaymentStats: {
        totalEarnings: earnings.summary.totalEarnings,
        paidAmount: totalPaidSoFar,
        pendingAmount
      },
      afterPaymentStats: {
        totalEarnings: earnings.summary.totalEarnings,
        paidAmount: totalPaidSoFar + amount,
        pendingAmount: pendingAmount - amount
      },
      processedBy: adminId,
      notes,
      paymentDate: new Date(),
      status: 'processed'
    });

    // Save payment record
    await payment.save();

    // OPTIONAL: Mark sessions as paid in the original collections
    // You can add a field 'paymentStatus' or 'isPaid' to your session models
    // This is optional and depends on your requirements
    
    // Example: Add a 'paymentStatus' field to your models
    // For ActiveCallSession and ChatRequest, you could add:
    // paymentStatus: { type: String, enum: ['pending', 'paid', 'partial'], default: 'pending' }
    // paymentHistory: [{ paymentId: ObjectId, amount: Number, date: Date }]

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        payment,
        summary: {
          totalEarnings,
          platformCommission,
          psychicPayout,
          amountPaid: amount,
          remainingBalance: pendingAmount - amount,
          sessionsPaid: paidSessions.length
        },
        paidSessions
      }
    });

  } catch (error) {
    console.error('Process psychic payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get payment history for a psychic
exports.getPsychicPaymentHistory = async (req, res) => {
  try {
    const { psychicId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const payments = await PsychicPayment.find({ psychicId })
      .populate('processedBy', 'name email')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PsychicPayment.countDocuments({ psychicId });

    // Calculate totals
    const totalPaid = payments
      .filter(p => p.status === 'processed')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      data: {
        payments,
        summary: {
          totalPayments: payments.length,
          totalPaid,
          averagePayment: payments.length > 0 ? totalPaid / payments.length : 0
        }
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get psychic payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all payments (admin dashboard)
exports.getAllPayments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      startDate, 
      endDate,
      psychicId 
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    if (psychicId) {
      query.psychicId = psychicId;
    }

    const payments = await PsychicPayment.find(query)
      .populate('psychicId', 'name email image')
      .populate('processedBy', 'name email')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PsychicPayment.countDocuments(query);

    // Calculate summary statistics
    const allPayments = await PsychicPayment.find(query);
    const totalAmount = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPlatformCommission = allPayments.reduce((sum, p) => sum + p.platformCommission, 0);
    const totalPsychicPayout = allPayments.reduce((sum, p) => sum + p.psychicPayout, 0);

    res.json({
      success: true,
      data: {
        payments,
        summary: {
          totalPayments: allPayments.length,
          totalAmount,
          totalPlatformCommission,
          totalPsychicPayout,
          averagePayment: allPayments.length > 0 ? totalAmount / allPayments.length : 0
        }
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to calculate total earnings for a psychic
async function calculatePsychicTotalEarnings(psychicId) {
  // Get all completed chat sessions
  const chatSessions = await ChatRequest.find({
    psychic: psychicId,
    status: 'completed'
  }).populate('user', 'username email image').lean();

  // Get all ended call sessions
  const callSessions = await ActiveCallSession.find({
    psychicId: psychicId,
    status: 'ended'
  }).populate('userId', 'username email image').lean();

  // Get all payments to check which sessions are paid
  const payments = await PsychicPayment.find({ 
    psychicId,
    status: 'processed'
  }).lean();

  // Create a map of paid sessions
  const paidSessionsMap = new Map();
  payments.forEach(payment => {
    if (payment.earningsBreakdown?.sessionsBreakdown) {
      payment.earningsBreakdown.sessionsBreakdown.forEach(session => {
        if (session.fullyPaid) {
          paidSessionsMap.set(session.sessionId.toString(), true);
        }
      });
    }
  });

  // Calculate chat earnings
  const chatEarnings = chatSessions.reduce((total, session) => {
    return total + (session.totalAmountPaid || 0);
  }, 0);

  // Calculate call earnings (1 credit = $1)
  const callEarnings = callSessions.reduce((total, session) => {
    return total + (session.totalCreditsUsed || 0);
  }, 0);

  const totalEarnings = chatEarnings + callEarnings;

  // Format sessions for breakdown with paid status
  const formattedChatSessions = chatSessions.map(session => {
    const sessionId = session._id.toString();
    const isPaid = paidSessionsMap.has(sessionId);
    
    return {
      _id: session._id,
      type: 'chat',
      user: session.user,
      amount: session.totalAmountPaid || 0,
      psychicEarnings: calculatePsychicEarnings(session.totalAmountPaid || 0),
      platformCommission: calculatePlatformCommission(session.totalAmountPaid || 0),
      date: session.endedAt,
      duration: Math.floor(((session.totalSecondsAllowed || 0) - 
        (session.paidSession?.remainingSeconds || 0)) / 60),
      isPaid
    };
  });

  const formattedCallSessions = callSessions.map(session => {
    const sessionId = session._id.toString();
    const isPaid = paidSessionsMap.has(sessionId);
    const durationSeconds = session.startTime && session.endTime 
      ? (new Date(session.endTime) - new Date(session.startTime)) / 1000 
      : 0;
    
    return {
      _id: session._id,
      type: 'call',
      user: session.userId,
      amount: session.totalCreditsUsed || 0,
      psychicEarnings: calculatePsychicEarnings(session.totalCreditsUsed || 0),
      platformCommission: calculatePlatformCommission(session.totalCreditsUsed || 0),
      date: session.endTime,
      duration: Math.floor(durationSeconds / 60),
      isPaid
    };
  });

  // Combine and sort all sessions
  const allSessions = [...formattedChatSessions, ...formattedCallSessions]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    summary: {
      totalEarnings,
      chatEarnings,
      callEarnings,
      totalPsychicEarnings: calculatePsychicEarnings(totalEarnings),
      totalPlatformCommission: calculatePlatformCommission(totalEarnings),
      totalSessions: chatSessions.length + callSessions.length,
      chatSessions: chatSessions.length,
      callSessions: callSessions.length
    },
    sessions: allSessions
  };
}

// Helper function to get payment summary for a psychic
async function getPsychicPaymentSummary(psychicId) {
  const payments = await PsychicPayment.find({ 
    psychicId,
    status: 'processed'
  }).sort({ paymentDate: -1 });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const lastPayment = payments.length > 0 ? payments[0] : null;

  return {
    totalPayments: payments.length,
    totalPaid,
    lastPaymentDate: lastPayment?.paymentDate,
    lastPaymentAmount: lastPayment?.amount
  };
}