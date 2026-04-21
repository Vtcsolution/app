// controllers/Psychic/psychicPaymentController.js

const PsychicPayment = require('../../models/CallSession/PsychicPayment');
const ChatRequest = require('../../models/Paidtimer/ChatRequest');
const ActiveCallSession = require('../../models/CallSession/ActiveCallSession');


// Helper function to format currency
const formatCurrency = (amount) => {
  return amount || 0;
};

// Get psychic's own payment history
exports.getMyPaymentHistory = async (req, res) => {
  try {
    const psychicId = req.user._id; // From psychic auth middleware
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    console.log(`🔍 Fetching payment history for psychic: ${psychicId}`);

    // Find all payments for this psychic
    const payments = await PsychicPayment.find({ 
      psychicId,
      status: 'processed'
    })
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PsychicPayment.countDocuments({ 
      psychicId,
      status: 'processed'
    });

    console.log(`✅ Found ${payments.length} payments for psychic ${psychicId}`);

    // Get total earnings from sessions
    const chatSessions = await ChatRequest.find({
      psychic: psychicId,
      status: 'completed'
    });

    const callSessions = await ActiveCallSession.find({
      psychicId: psychicId,
      status: 'ended'
    });

    // Calculate total earnings (psychic's 25% share)
    const chatEarnings = chatSessions.reduce((sum, s) => sum + (s.totalAmountPaid || 0), 0) * 0.25;
    const callEarnings = callSessions.reduce((sum, s) => sum + (s.totalCreditsUsed || 0), 0) * 0.25;
    const totalEarnings = chatEarnings + callEarnings;

    // Calculate total paid
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingAmount = totalEarnings - totalPaid;

    res.json({
      success: true,
      data: {
        payments: payments.map(p => ({
          _id: p._id,
          amount: p.amount,
          paymentId: p.paymentId,
          paymentMethod: p.paymentMethod,
          paymentDate: p.paymentDate,
          notes: p.notes,
          paymentScreenshot: p.paymentScreenshot,
          status: p.status,
          earningsBreakdown: p.earningsBreakdown,
          beforePaymentStats: p.beforePaymentStats,
          afterPaymentStats: p.afterPaymentStats
        })),
        summary: {
          totalEarnings,
          totalPaid,
          pendingAmount: Math.max(0, pendingAmount),
          totalPayments: payments.length,
          chatEarnings,
          callEarnings
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
    console.error('❌ Error fetching psychic payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get psychic's payment summary (for dashboard)
exports.getMyPaymentSummary = async (req, res) => {
  try {
    const psychicId = req.user._id;

    console.log(`🔍 Fetching payment summary for psychic: ${psychicId}`);

    // Get all payments
    const payments = await PsychicPayment.find({ 
      psychicId,
      status: 'processed'
    });

    // Get all completed sessions
    const chatSessions = await ChatRequest.find({
      psychic: psychicId,
      status: 'completed'
    });

    const callSessions = await ActiveCallSession.find({
      psychicId: psychicId,
      status: 'ended'
    });

    // Calculate earnings
    const chatEarnings = chatSessions.reduce((sum, s) => sum + (s.totalAmountPaid || 0), 0) * 0.25;
    const callEarnings = callSessions.reduce((sum, s) => sum + (s.totalCreditsUsed || 0), 0) * 0.25;
    const totalEarnings = chatEarnings + callEarnings;
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Group payments by month for chart data
    const monthlyPayments = {};
    payments.forEach(payment => {
      const month = new Date(payment.paymentDate).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyPayments[month]) {
        monthlyPayments[month] = 0;
      }
      monthlyPayments[month] += payment.amount;
    });

    const paymentChartData = Object.entries(monthlyPayments).map(([month, amount]) => ({
      month,
      amount
    }));

    console.log(`✅ Payment summary for psychic ${psychicId}: Total Paid: ${totalPaid}, Pending: ${totalEarnings - totalPaid}`);

    res.json({
      success: true,
      data: {
        summary: {
          totalEarnings,
          totalPaid,
          pendingAmount: Math.max(0, totalEarnings - totalPaid),
          totalPayments: payments.length,
          chatEarnings,
          callEarnings,
          totalSessions: chatSessions.length + callSessions.length
        },
        paymentChartData,
        recentPayments: payments.slice(0, 5).map(p => ({
          amount: p.amount,
          date: p.paymentDate,
          method: p.paymentMethod
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching payment summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};