// controllers/HumanChatbot/admindataController.js

const Psychic = require('../../models/HumanChat/Psychic');
const MessageBox = require('../../models/HumanChat/MessageBox');
const HumanChatSession = require('../../models/HumanChat/HumanChatSession');
const ChatRequest = require('../../models/Paidtimer/ChatRequest');
const User = require('../../models/User');
const ActiveCallSession = require('../../models/CallSession/ActiveCallSession'); // Import ActiveCallSession
const mongoose = require('mongoose');


const getAllChatData = async (req, res) => {
  try {
    const COMMISSION_RATE = 0.25; // 25% to psychics, 75% to platform

    // Run all count queries in parallel for better performance
    const [
      totalPsychics,
      totalSessions,
      totalPaidTimers,
      totalChatRequests,
      totalUsers,
      activeSessions,
      activePaidTimers,
      pendingRequests,
      recentPsychics,
      recentSessions,
      // Active Call Sessions
      totalCallSessions,
      activeCallSessions,
      completedCallSessions,
      totalCallCredits
    ] = await Promise.all([
      // 1. Total Psychics
      Psychic.countDocuments(),
      
      // 2. Total Sessions (only completed/ended)
      HumanChatSession.countDocuments({ 
        status: { $in: ['ended', 'completed'] } 
      }),
      
      // 3. Total Paid Timers (completed)
      ChatRequest.countDocuments({ 
        status: 'completed',
        totalAmountPaid: { $gt: 0 }
      }),
      
      // 4. Total Chat Requests (all statuses)
      ChatRequest.countDocuments(),
      
      // 5. Total Users
      User.countDocuments(),
      
      // 6. Active Chat Sessions
      HumanChatSession.countDocuments({ status: 'active' }),
      
      // 7. Active Paid Timers
      ChatRequest.countDocuments({ 
        'paidSession.isActive': true,
        status: 'active'
      }),
      
      // 8. Pending Requests
      ChatRequest.countDocuments({ status: 'pending' }),
      
      // 9. Recent Psychics (last 30 days)
      Psychic.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      
      // 10. Recent Sessions (last 7 days)
      HumanChatSession.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      
      // 11. Total Call Sessions
      ActiveCallSession.countDocuments(),
      
      // 12. Active Call Sessions
      ActiveCallSession.countDocuments({ status: 'in-progress' }),
      
      // 13. Completed Call Sessions
      ActiveCallSession.countDocuments({ status: 'ended' }),
      
      // 14. Total Call Credits (converted to dollars - 1 credit = $1)
      ActiveCallSession.aggregate([
        {
          $match: {
            status: 'ended',
            totalCreditsUsed: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            totalCredits: { $sum: '$totalCreditsUsed' },
            totalSessions: { $sum: 1 }
          }
        }
      ])
    ]);

    // Get total revenue from paid timers
    const revenueStats = await ChatRequest.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'active'] },
          totalAmountPaid: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalPaidByUsers: { $sum: '$totalAmountPaid' },
          psychicEarnings: { $sum: { $multiply: ['$totalAmountPaid', COMMISSION_RATE] } },
          platformEarnings: { $sum: { $multiply: ['$totalAmountPaid', 0.75] } },
          totalSeconds: { $sum: '$paidSession.totalSeconds' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get call revenue stats with split
    const callRevenueStats = await ActiveCallSession.aggregate([
      {
        $match: {
          status: 'ended',
          totalCreditsUsed: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalPaidByUsers: { $sum: '$totalCreditsUsed' },
          psychicEarnings: { $sum: { $multiply: ['$totalCreditsUsed', COMMISSION_RATE] } },
          platformEarnings: { $sum: { $multiply: ['$totalCreditsUsed', 0.75] } },
          totalSessions: { $sum: 1 },
          averageCredits: { $avg: '$totalCreditsUsed' },
          totalDuration: { 
            $sum: { 
              $divide: [
                { $subtract: ['$endTime', '$startTime'] },
                60000 // Convert to minutes
              ]
            }
          }
        }
      }
    ]);

    const chatRevenue = revenueStats[0] || {
      totalPaidByUsers: 0,
      psychicEarnings: 0,
      platformEarnings: 0,
      totalSeconds: 0,
      count: 0
    };

    const callRevenue = callRevenueStats[0] || {
      totalPaidByUsers: 0,
      psychicEarnings: 0,
      platformEarnings: 0,
      totalSessions: 0,
      averageCredits: 0,
      totalDuration: 0
    };

    // Get psychic list with basic info
    const psychicList = await Psychic.find()
      .select('name email isVerified averageRating totalRatings ratePerMin createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent paid timers with split
    const recentPaidTimers = await ChatRequest.find({
      status: 'completed',
      totalAmountPaid: { $gt: 0 }
    })
    .populate('user', 'name email')
    .populate('psychic', 'name email ratePerMin')
    .sort({ endedAt: -1 })
    .limit(10);

    // Get recent sessions
    const recentSessionList = await HumanChatSession.find({
      status: { $in: ['active', 'ended'] }
    })
    .populate('user', 'name email')
    .populate('psychic', 'name email')
    .sort({ lastMessageAt: -1 })
    .limit(10);

    // Get recent call sessions with split
    const recentCallSessions = await ActiveCallSession.find({
      status: { $in: ['in-progress', 'ended'] }
    })
    .populate('userId', 'name email')
    .populate('psychicId', 'name email ratePerMin')
    .sort({ updatedAt: -1 })
    .limit(10);

    // Prepare response data
    const dashboardData = {
      totals: {
        psychics: totalPsychics,
        sessions: totalSessions,
        paidTimers: totalPaidTimers,
        chatRequests: totalChatRequests,
        users: totalUsers,
        callSessions: totalCallSessions
      },
      currentStatus: {
        activeSessions,
        activePaidTimers,
        pendingRequests,
        activeCallSessions,
        completedCallSessions
      },
      recentActivity: {
        psychics: recentPsychics,
        sessions: recentSessions
      },
      financials: {
        // Chat revenue
        chatTotalPaidByUsers: chatRevenue.totalPaidByUsers,
        chatPsychicEarnings: chatRevenue.psychicEarnings,
        chatPlatformEarnings: chatRevenue.platformEarnings,
        totalPaidTime: Math.round((chatRevenue.totalSeconds || 0) / 3600 * 100) / 100, // in hours
        avgChatSessionValue: chatRevenue.count > 0 ? 
          Math.round((chatRevenue.totalPaidByUsers / chatRevenue.count) * 100) / 100 : 0,
        
        // Call revenue
        callTotalPaidByUsers: callRevenue.totalPaidByUsers,
        callPsychicEarnings: callRevenue.psychicEarnings,
        callPlatformEarnings: callRevenue.platformEarnings,
        averageCallValue: callRevenue.averageCredits || 0,
        totalCallMinutes: Math.round(callRevenue.totalDuration || 0),
        
        // Combined totals
        totalPaidByUsers: chatRevenue.totalPaidByUsers + callRevenue.totalPaidByUsers,
        totalPsychicEarnings: chatRevenue.psychicEarnings + callRevenue.psychicEarnings,
        totalPlatformEarnings: chatRevenue.platformEarnings + callRevenue.platformEarnings,
        totalSessions: chatRevenue.count + callRevenue.totalSessions
      },
      callStatistics: {
        totalSessions: totalCallSessions,
        activeSessions: activeCallSessions,
        completedSessions: completedCallSessions,
        totalCreditsUsed: callRevenue.totalPaidByUsers,
        totalPaidByUsers: callRevenue.totalPaidByUsers,
        psychicEarnings: callRevenue.psychicEarnings,
        platformEarnings: callRevenue.platformEarnings,
        averageCallDuration: Math.round(callRevenue.averageCredits || 0) // minutes
      },
      splitInfo: {
        psychicRate: COMMISSION_RATE * 100 + '%',
        platformRate: '75%',
        description: 'Psychics receive 25% of all payments, platform retains 75%'
      },
      lists: {
        psychics: psychicList,
        recentPaidTimers: recentPaidTimers.map(timer => ({
          _id: timer._id,
          user: timer.user?.name || 'Unknown User',
          psychic: timer.psychic?.name || 'Unknown Psychic',
          amount: timer.totalAmountPaid, // Total paid by user
          psychicEarnings: timer.totalAmountPaid * COMMISSION_RATE, // Psychic's 25%
          platformEarnings: timer.totalAmountPaid * 0.75, // Platform's 75%
          duration: timer.paidSession?.totalSeconds ? 
            Math.round(timer.paidSession.totalSeconds / 60 * 100) / 100 : 0, // in minutes
          endedAt: timer.endedAt
        })),
        recentSessions: recentSessionList.map(session => ({
          _id: session._id,
          user: session.user?.name || 'Unknown User',
          psychic: session.psychic?.name || 'Unknown Psychic',
          status: session.status,
          duration: session.sessionDuration || 0,
          lastMessageAt: session.lastMessageAt
        })),
        recentCallSessions: recentCallSessions.map(call => ({
          _id: call._id,
          user: call.userId?.name || 'Unknown User',
          psychic: call.psychicId?.name || 'Unknown Psychic',
          status: call.status,
          duration: call.startTime && call.endTime ? 
            Math.round((new Date(call.endTime) - new Date(call.startTime)) / 60000) : 0, // in minutes
          creditsUsed: call.totalCreditsUsed || 0,
          totalPaidByUsers: call.totalCreditsUsed || 0,
          psychicEarnings: (call.totalCreditsUsed || 0) * COMMISSION_RATE,
          platformEarnings: (call.totalCreditsUsed || 0) * 0.75,
          startTime: call.startTime,
          endTime: call.endTime,
          isFreeSession: call.isFreeSession
        }))
      },
      timestamp: new Date().toISOString(),
      lastUpdated: Date.now()
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
      message: 'Dashboard statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const getPsychicDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid psychic ID format'
      });
    }

    console.log(`🔍 Fetching psychic details for ID: ${id}`);

    // 1. Get psychic basic information
    const psychic = await Psychic.findById(id)
      .select('name email image ratePerMin abilities averageRating totalRatings bio gender isVerified type status createdAt updatedAt commissionRate')
      .lean();

    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    console.log(`✅ Found psychic: ${psychic.name}`);

    // 2. Get all chat sessions for this psychic
    const chatSessions = await HumanChatSession.find({ psychic: id })
      .populate('user', 'name email')
      .sort({ lastMessageAt: -1 })
      .limit(20);

    // 3. Get paid timer sessions for this psychic
    const paidTimers = await ChatRequest.find({ psychic: id })
      .populate('user', 'name email')
      .sort({ endedAt: -1 })
      .limit(20);

    // 4. Get call sessions for this psychic
    const callSessions = await ActiveCallSession.find({ psychicId: id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    // 5. Calculate statistics with 75/25 split
    const totalSessions = chatSessions.length;
    const totalPaidTimers = paidTimers.length;
    const totalCallSessions = callSessions.length;
    
    // Calculate total earnings from paid timers (total amount paid by users)
    const earningsStats = await ChatRequest.aggregate([
      {
        $match: {
          psychic: new mongoose.Types.ObjectId(id),
          status: { $in: ['completed', 'active'] },
          totalAmountPaid: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$psychic',
          totalPaidByUsers: { $sum: '$totalAmountPaid' }, // Total amount users paid
          totalSessions: { $sum: 1 },
          totalTime: { $sum: '$paidSession.totalSeconds' }
        }
      }
    ]);

    // Calculate total earnings from call sessions (1 credit = $1) - total amount paid by users
    const callEarningsStats = await ActiveCallSession.aggregate([
      {
        $match: {
          psychicId: new mongoose.Types.ObjectId(id),
          status: 'ended',
          totalCreditsUsed: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$psychicId',
          totalPaidByUsers: { $sum: '$totalCreditsUsed' }, // Total amount users paid (credits = dollars)
          totalSessions: { $sum: 1 },
          totalDuration: { 
            $sum: { 
              $divide: [
                { $subtract: ['$endTime', '$startTime'] },
                60000 // Convert to minutes
              ]
            }
          }
        }
      }
    ]);

    const earningsData = earningsStats[0] || {
      totalPaidByUsers: 0,
      totalSessions: 0,
      totalTime: 0
    };

    const callEarningsData = callEarningsStats[0] || {
      totalPaidByUsers: 0,
      totalSessions: 0,
      totalDuration: 0
    };

    // Calculate psychic commission (25% of total paid by users)
    const psychicCommissionRate = 0.25; // 25%
    
    const totalPaidByUsers = earningsData.totalPaidByUsers + callEarningsData.totalPaidByUsers;
    const psychicEarnings = totalPaidByUsers * psychicCommissionRate; // 25% to psychic
    const platformEarnings = totalPaidByUsers * 0.75; // 75% to platform

    const chatPsychicEarnings = earningsData.totalPaidByUsers * psychicCommissionRate;
    const callPsychicEarnings = callEarningsData.totalPaidByUsers * psychicCommissionRate;

    // 6. Get recent reviews/ratings (if available in your model)
    const recentReviews = psychic.reviews || [];

    // 7. Calculate performance metrics
    const activeChats = chatSessions.filter(session => session.status === 'active').length;
    const activeCalls = callSessions.filter(call => call.status === 'in-progress').length;
    const completedChats = chatSessions.filter(session => session.status === 'ended' || session.status === 'completed').length;
    const completedCalls = callSessions.filter(call => call.status === 'ended').length;
    
    // Calculate average session duration for chats
    const totalChatDuration = chatSessions.reduce((sum, session) => sum + (session.sessionDuration || 0), 0);
    const avgChatDuration = totalSessions > 0 ? Math.round(totalChatDuration / totalSessions / 60) : 0; // in minutes
    
    // Calculate average call duration
    const avgCallDuration = totalCallSessions > 0 ? 
      Math.round(callEarningsData.totalDuration / totalCallSessions) : 0; // in minutes

    // 8. Get popular user interactions (most frequent users) from both chats and calls
    const chatUserInteractions = await ChatRequest.aggregate([
      {
        $match: { psychic: new mongoose.Types.ObjectId(id) }
      },
      {
        $group: {
          _id: '$user',
          totalSessions: { $sum: 1 },
          totalSpentByUser: { $sum: '$totalAmountPaid' }, // Total user paid
          psychicEarnings: { $sum: { $multiply: ['$totalAmountPaid', psychicCommissionRate] } }, // Psychic's 25%
          lastSession: { $max: '$endedAt' },
          type: { $first: 'chat' }
        }
      },
      {
        $limit: 10
      }
    ]);

    const callUserInteractions = await ActiveCallSession.aggregate([
      {
        $match: { 
          psychicId: new mongoose.Types.ObjectId(id),
          status: 'ended'
        }
      },
      {
        $group: {
          _id: '$userId',
          totalSessions: { $sum: 1 },
          totalSpentByUser: { $sum: '$totalCreditsUsed' }, // Total user paid (credits = dollars)
          psychicEarnings: { $sum: { $multiply: ['$totalCreditsUsed', psychicCommissionRate] } }, // Psychic's 25%
          lastSession: { $max: '$endTime' },
          type: { $first: 'call' }
        }
      },
      {
        $limit: 10
      }
    ]);

    // Combine and sort user interactions
    const allUserInteractions = [...chatUserInteractions, ...callUserInteractions];
    
    // Get user details for all interactions
    const userInteractions = await Promise.all(
      allUserInteractions.map(async (interaction) => {
        const user = await User.findById(interaction._id).select('name email');
        return {
          userId: interaction._id,
          userName: user?.name || 'Unknown User',
          userEmail: user?.email || '',
          totalSessions: interaction.totalSessions,
          totalSpentByUser: interaction.totalSpentByUser, // What user paid
          psychicEarnings: interaction.psychicEarnings, // Psychic's 25%
          lastSession: interaction.lastSession,
          type: interaction.type
        };
      })
    );

    // Sort by psychic earnings descending
    userInteractions.sort((a, b) => b.psychicEarnings - a.psychicEarnings);

    // 9. Get monthly earnings (last 6 months) - with split
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const chatMonthlyEarnings = await ChatRequest.aggregate([
      {
        $match: {
          psychic: new mongoose.Types.ObjectId(id),
          endedAt: { $gte: sixMonthsAgo },
          totalAmountPaid: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$endedAt' },
            month: { $month: '$endedAt' }
          },
          totalPaidByUsers: { $sum: '$totalAmountPaid' },
          psychicEarnings: { $sum: { $multiply: ['$totalAmountPaid', psychicCommissionRate] } },
          platformEarnings: { $sum: { $multiply: ['$totalAmountPaid', 0.75] } },
          sessionCount: { $sum: 1 },
          totalMinutes: { 
            $sum: { 
              $divide: ['$paidSession.totalSeconds', 60] 
            } 
          },
          type: { $first: 'chat' }
        }
      }
    ]);

    const callMonthlyEarnings = await ActiveCallSession.aggregate([
      {
        $match: {
          psychicId: new mongoose.Types.ObjectId(id),
          endTime: { $gte: sixMonthsAgo },
          status: 'ended',
          totalCreditsUsed: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$endTime' },
            month: { $month: '$endTime' }
          },
          totalPaidByUsers: { $sum: '$totalCreditsUsed' },
          psychicEarnings: { $sum: { $multiply: ['$totalCreditsUsed', psychicCommissionRate] } },
          platformEarnings: { $sum: { $multiply: ['$totalCreditsUsed', 0.75] } },
          sessionCount: { $sum: 1 },
          totalMinutes: { 
            $sum: { 
              $divide: [
                { $subtract: ['$endTime', '$startTime'] },
                60000
              ]
            } 
          },
          type: { $first: 'call' }
        }
      }
    ]);

    // Combine monthly earnings
    const monthlyEarningsMap = new Map();
    
    [...chatMonthlyEarnings, ...callMonthlyEarnings].forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      if (monthlyEarningsMap.has(key)) {
        const existing = monthlyEarningsMap.get(key);
        existing.totalPaidByUsers += item.totalPaidByUsers;
        existing.psychicEarnings += item.psychicEarnings;
        existing.platformEarnings += item.platformEarnings;
        existing.sessionCount += item.sessionCount;
        existing.totalMinutes += item.totalMinutes;
      } else {
        monthlyEarningsMap.set(key, {
          ...item,
          _id: item._id
        });
      }
    });

    const monthlyEarnings = Array.from(monthlyEarningsMap.values())
      .sort((a, b) => {
        if (a._id.year !== b._id.year) return a._id.year - b._id.year;
        return a._id.month - b._id.month;
      })
      .map(item => ({
        month: item._id.month,
        year: item._id.year,
        totalPaidByUsers: item.totalPaidByUsers,
        psychicEarnings: Math.round(item.psychicEarnings * 100) / 100,
        platformEarnings: Math.round(item.platformEarnings * 100) / 100,
        sessionCount: item.sessionCount,
        totalMinutes: Math.round(item.totalMinutes),
        period: getMonthName(item._id.month) + ' ' + item._id.year
      }));

    // Calculate earnings per hour (psychic's share)
    const totalHoursWorked = (earningsData.totalTime / 3600) + (callEarningsData.totalDuration / 60);
    const earningsPerHour = totalHoursWorked > 0 ? psychicEarnings / totalHoursWorked : 0;

    // 10. Prepare the response data
    const psychicDetails = {
      profile: {
        ...psychic,
        joinDate: psychic.createdAt,
        isActive: psychic.status === 'active',
        commissionRate: psychicCommissionRate // 25%
      },
      statistics: {
        totals: {
          chatSessions: totalSessions,
          paidTimers: totalPaidTimers,
          callSessions: totalCallSessions,
          totalPaidByUsers: totalPaidByUsers, // Total amount users paid
          psychicEarnings: psychicEarnings, // Psychic's 25% share
          platformEarnings: platformEarnings, // Platform's 75% share
          chatPaidByUsers: earningsData.totalPaidByUsers,
          callPaidByUsers: callEarningsData.totalPaidByUsers,
          chatPsychicEarnings: chatPsychicEarnings,
          callPsychicEarnings: callPsychicEarnings,
          hoursWorked: Math.round(totalHoursWorked * 100) / 100,
          ratings: psychic.totalRatings || 0,
          averageRating: psychic.averageRating || 0
        },
        current: {
          activeChats: activeChats,
          activeCalls: activeCalls,
          pendingRequests: await ChatRequest.countDocuments({ psychic: id, status: 'pending' }),
          avgChatDuration: avgChatDuration,
          avgCallDuration: avgCallDuration
        },
        performance: {
          chatCompletionRate: totalSessions > 0 ? Math.round((completedChats / totalSessions) * 100) : 0,
          callCompletionRate: totalCallSessions > 0 ? Math.round((completedCalls / totalCallSessions) * 100) : 0,
          avgEarningsPerChat: earningsData.totalSessions > 0 ? 
            Math.round((chatPsychicEarnings / earningsData.totalSessions) * 100) / 100 : 0,
          avgEarningsPerCall: callEarningsData.totalSessions > 0 ? 
            Math.round((callPsychicEarnings / callEarningsData.totalSessions) * 100) / 100 : 0,
          earningsPerHour: Math.round(earningsPerHour * 100) / 100
        }
      },
      financials: {
        totalPaidByUsers: totalPaidByUsers,
        psychicEarnings: psychicEarnings,
        platformEarnings: platformEarnings,
        chatPaidByUsers: earningsData.totalPaidByUsers,
        callPaidByUsers: callEarningsData.totalPaidByUsers,
        chatPsychicEarnings: chatPsychicEarnings,
        callPsychicEarnings: callPsychicEarnings,
        avgEarningsPerMonth: monthlyEarnings.length > 0 ? 
          Math.round(monthlyEarnings.reduce((sum, month) => sum + month.psychicEarnings, 0) / monthlyEarnings.length * 100) / 100 : 0,
        monthlyBreakdown: monthlyEarnings,
        chatRatePerMinute: psychic.ratePerMin,
        callRatePerMinute: 1, // 1 credit = $1 per minute for calls
        commissionSplit: {
          psychic: psychicCommissionRate * 100 + '%',
          platform: '75%'
        }
      },
      recentActivity: {
        chatSessions: chatSessions.map(session => ({
          _id: session._id,
          user: session.user?.name || 'Unknown User',
          status: session.status,
          duration: session.sessionDuration || 0,
          lastMessageAt: session.lastMessageAt,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          type: 'chat'
        })),
        paidTimers: paidTimers.map(timer => ({
          _id: timer._id,
          user: timer.user?.name || 'Unknown User',
          amount: timer.totalAmountPaid || 0, // Total paid by user
          psychicEarnings: (timer.totalAmountPaid || 0) * psychicCommissionRate, // Psychic's 25%
          duration: timer.paidSession?.totalSeconds ? Math.round(timer.paidSession.totalSeconds / 60 * 100) / 100 : 0,
          status: timer.status,
          endedAt: timer.endedAt,
          isActive: timer.paidSession?.isActive || false,
          type: 'paid_timer'
        })),
        callSessions: callSessions.map(call => ({
          _id: call._id,
          user: call.userId?.name || 'Unknown User',
          amount: call.totalCreditsUsed || 0, // Total paid by user
          psychicEarnings: (call.totalCreditsUsed || 0) * psychicCommissionRate, // Psychic's 25%
          duration: call.startTime && call.endTime ? 
            Math.round((new Date(call.endTime) - new Date(call.startTime)) / 60000) : 0,
          status: call.status,
          startTime: call.startTime,
          endTime: call.endTime,
          isFreeSession: call.isFreeSession,
          type: 'call'
        })),
        recentReviews: recentReviews.slice(0, 5)
      },
      userInteractions: userInteractions.slice(0, 10),
      timeline: {
        createdAt: psychic.createdAt,
        lastActive: getLastActiveTime(chatSessions, callSessions),
        totalOnlineTime: Math.round(totalHoursWorked * 100) / 100
      },
      metadata: {
        lastUpdated: new Date(),
        dataPoints: {
          chatSessionsAnalyzed: totalSessions,
          paidTimersAnalyzed: totalPaidTimers,
          callSessionsAnalyzed: totalCallSessions,
          monthsAnalyzed: monthlyEarnings.length
        },
        commissionRate: psychicCommissionRate
      }
    };

    res.status(200).json({
      success: true,
      data: psychicDetails,
      message: 'Psychic details retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get psychic details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching psychic details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Update Psychic Details
// controllers/HumanChatbot/admindataController.js

const updatePsychicDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Allowed fields to update (add all fields from schema)
    const allowedUpdates = [
      'name', 'email', 'image', 'ratePerMin', 'abilities', 
      'averageRating', 'totalRatings', 'bio', 'gender', 
      'isVerified', 'type', 'status', 'commissionRate',
      // Add new fields from schema
      'category', 'location', 'languages', 'experience', 
      'specialization', 'availability', 'responseTime', 'maxSessions',
      'isActive', 'warningCount', 'warnings'
    ];
    
    // Filter only allowed fields
    const filteredUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key) && updateData[key] !== undefined) {
        // Handle special field transformations
        if (key === 'gender') {
          // Ensure gender is lowercase and valid
          const validGenders = ['male', 'female', 'other'];
          filteredUpdateData[key] = validGenders.includes(updateData[key]?.toLowerCase()) 
            ? updateData[key].toLowerCase() 
            : 'other';
        } 
        else if (key === 'status') {
          // Handle status mapping (online/offline/away/busy)
          const validStatuses = ['online', 'offline', 'away', 'busy'];
          filteredUpdateData[key] = validStatuses.includes(updateData[key]) 
            ? updateData[key] 
            : 'offline';
        }
        else if (key === 'languages') {
          // Ensure languages is an array
          filteredUpdateData[key] = Array.isArray(updateData[key]) 
            ? updateData[key] 
            : (updateData[key] ? [updateData[key]] : ['English']);
        }
        else if (key === 'abilities') {
          // Ensure abilities is an array
          filteredUpdateData[key] = Array.isArray(updateData[key]) 
            ? updateData[key] 
            : [];
        }
        else if (key === 'bio') {
          // Ensure bio is not empty
          filteredUpdateData[key] = updateData[key] || 'No bio provided';
        }
        else if (key === 'availability') {
          // Convert to boolean
          filteredUpdateData[key] = Boolean(updateData[key]);
        }
        else if (key === 'maxSessions') {
          // Ensure positive number
          filteredUpdateData[key] = Math.max(1, parseInt(updateData[key]) || 1);
        }
        else {
          filteredUpdateData[key] = updateData[key];
        }
      }
    });
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid psychic ID format'
      });
    }
    
    console.log(`🔍 Updating psychic details for ID: ${id}`);
    console.log('Update data:', filteredUpdateData);
    
    // Find and update psychic
    const psychic = await Psychic.findByIdAndUpdate(
      id,
      { 
        $set: {
          ...filteredUpdateData,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-password'); // Exclude password from response
    
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }
    
    console.log(`✅ Psychic updated successfully: ${psychic.name}`);
    
    res.status(200).json({
      success: true,
      data: psychic,
      message: 'Psychic details updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Update psychic details error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating psychic details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Toggle Psychic Verification Status
const togglePsychicVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid psychic ID format'
      });
    }
    
    const psychic = await Psychic.findByIdAndUpdate(
      id,
      { 
        isVerified: isVerified,
        updatedAt: new Date()
      },
      { new: true }
    ).select('name email isVerified');
    
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: psychic,
      message: `Psychic ${isVerified ? 'verified' : 'unverified'} successfully`
    });
    
  } catch (error) {
    console.error('❌ Toggle verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating verification status'
    });
  }
};

// Update Psychic Status (active/inactive)
const updatePsychicStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid psychic ID format'
      });
    }
    
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed: active, inactive, suspended'
      });
    }
    
    const psychic = await Psychic.findByIdAndUpdate(
      id,
      { 
        status: status,
        updatedAt: new Date()
      },
      { new: true }
    ).select('name email status');
    
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: psychic,
      message: `Psychic status updated to ${status}`
    });
    
  } catch (error) {
    console.error('❌ Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating psychic status'
    });
  }
};

// Update Psychic Rate
const updatePsychicRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { ratePerMin } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid psychic ID format'
      });
    }
    
    if (ratePerMin === undefined || ratePerMin < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid rate per minute is required'
      });
    }
    
    const psychic = await Psychic.findByIdAndUpdate(
      id,
      { 
        ratePerMin: ratePerMin,
        updatedAt: new Date()
      },
      { new: true }
    ).select('name email ratePerMin');
    
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: psychic,
      message: `Psychic rate updated to $${ratePerMin}/min`
    });
    
  } catch (error) {
    console.error('❌ Update rate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating psychic rate'
    });
  }
};

const getAllPsychics = async (req, res) => {
  try {
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    console.log(`📊 Fetching psychics - Page: ${page}, Limit: ${limit}, Skip: ${skip}`);

    // Get all psychics with pagination
    const psychics = await Psychic.find()
      .select('name email image ratePerMin averageRating totalRatings isVerified status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(`✅ Found ${psychics.length} psychics in database`);

    // Get total count for pagination
    const totalPsychics = await Psychic.countDocuments();
    console.log(`📈 Total psychics in DB: ${totalPsychics}`);

    const psychicCommissionRate = 0.25; // 25% commission for psychics

    // Get earnings and session counts for each psychic in parallel
    const psychicsWithStats = await Promise.all(
      psychics.map(async (psychic) => {
        // Get chat earnings stats
        const chatEarningsStats = await ChatRequest.aggregate([
          {
            $match: {
              psychic: psychic._id,
              status: { $in: ['completed', 'active'] },
              totalAmountPaid: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: '$psychic',
              totalPaidByUsers: { $sum: '$totalAmountPaid' },
              totalSessions: { $sum: 1 },
              totalTime: { $sum: '$paidSession.totalSeconds' }
            }
          }
        ]);

        // Get call earnings stats
        const callEarningsStats = await ActiveCallSession.aggregate([
          {
            $match: {
              psychicId: psychic._id,
              status: 'ended',
              totalCreditsUsed: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: '$psychicId',
              totalPaidByUsers: { $sum: '$totalCreditsUsed' },
              totalSessions: { $sum: 1 },
              totalDuration: { 
                $sum: { 
                  $divide: [
                    { $subtract: ['$endTime', '$startTime'] },
                    60000
                  ]
                } 
              }
            }
          }
        ]);

        const chatData = chatEarningsStats[0] || {
          totalPaidByUsers: 0,
          totalSessions: 0,
          totalTime: 0
        };

        const callData = callEarningsStats[0] || {
          totalPaidByUsers: 0,
          totalSessions: 0,
          totalDuration: 0
        };

        // Get active sessions counts
        const [activeChats, activeCalls] = await Promise.all([
          HumanChatSession.countDocuments({
            psychic: psychic._id,
            status: 'active'
          }),
          ActiveCallSession.countDocuments({
            psychicId: psychic._id,
            status: 'in-progress'
          })
        ]);

        const totalPaidByUsers = chatData.totalPaidByUsers + callData.totalPaidByUsers;
        const psychicEarnings = totalPaidByUsers * psychicCommissionRate; // 25% to psychic
        const platformEarnings = totalPaidByUsers * 0.75; // 75% to platform
        
        const totalSessions = chatData.totalSessions + callData.totalSessions;
        const totalHours = (chatData.totalTime / 3600) + (callData.totalDuration / 60);
        
        const avgEarningsPerSession = totalSessions > 0 ? psychicEarnings / totalSessions : 0;
        const earningsPerHour = totalHours > 0 ? psychicEarnings / totalHours : 0;

        return {
          ...psychic,
          statistics: {
            totalPaidByUsers: totalPaidByUsers, // Total users paid
            psychicEarnings: psychicEarnings, // Psychic's 25% share
            platformEarnings: platformEarnings, // Platform's 75% share
            chatPaidByUsers: chatData.totalPaidByUsers,
            callPaidByUsers: callData.totalPaidByUsers,
            chatPsychicEarnings: chatData.totalPaidByUsers * psychicCommissionRate,
            callPsychicEarnings: callData.totalPaidByUsers * psychicCommissionRate,
            totalSessions: totalSessions,
            chatSessions: chatData.totalSessions,
            callSessions: callData.totalSessions,
            totalHours: Math.round(totalHours * 100) / 100,
            activeChats: activeChats,
            activeCalls: activeCalls,
            avgEarningsPerSession: Math.round(avgEarningsPerSession * 100) / 100,
            earningsPerHour: Math.round(earningsPerHour * 100) / 100,
            commissionRate: psychicCommissionRate
          }
        };
      })
    );

    // Calculate overall statistics including calls with split
    const [chatOverallStats, callOverallStats] = await Promise.all([
      ChatRequest.aggregate([
        {
          $match: {
            status: { $in: ['completed', 'active'] },
            totalAmountPaid: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            totalPaidByUsers: { $sum: '$totalAmountPaid' },
            totalSessions: { $sum: 1 },
            avgEarningsPerSession: { $avg: '$totalAmountPaid' }
          }
        }
      ]),
      ActiveCallSession.aggregate([
        {
          $match: {
            status: 'ended',
            totalCreditsUsed: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            totalPaidByUsers: { $sum: '$totalCreditsUsed' },
            totalSessions: { $sum: 1 },
            avgEarningsPerSession: { $avg: '$totalCreditsUsed' }
          }
        }
      ])
    ]);

    const chatOverall = chatOverallStats[0] || { totalPaidByUsers: 0, totalSessions: 0, avgEarningsPerSession: 0 };
    const callOverall = callOverallStats[0] || { totalPaidByUsers: 0, totalSessions: 0, avgEarningsPerSession: 0 };

    const totalPaidByUsersOverall = chatOverall.totalPaidByUsers + callOverall.totalPaidByUsers;
    const totalPsychicEarningsOverall = totalPaidByUsersOverall * psychicCommissionRate;
    const totalPlatformEarningsOverall = totalPaidByUsersOverall * 0.75;
    const totalSessionsOverall = chatOverall.totalSessions + callOverall.totalSessions;
    const avgEarningsOverall = totalSessionsOverall > 0 ? totalPsychicEarningsOverall / totalSessionsOverall : 0;

    const response = {
      success: true,
      data: {
        psychics: psychicsWithStats,
        pagination: {
          page,
          limit,
          total: totalPsychics,
          pages: Math.ceil(totalPsychics / limit)
        },
        summary: {
          totalPsychics: totalPsychics,
          totalPaidByUsers: totalPaidByUsersOverall, // Total users paid across all psychics
          totalPsychicEarnings: totalPsychicEarningsOverall, // Total psychic earnings (25% share)
          totalPlatformEarnings: totalPlatformEarningsOverall, // Total platform earnings (75% share)
          chatPaidByUsers: chatOverall.totalPaidByUsers,
          callPaidByUsers: callOverall.totalPaidByUsers,
          chatPsychicEarnings: chatOverall.totalPaidByUsers * psychicCommissionRate,
          callPsychicEarnings: callOverall.totalPaidByUsers * psychicCommissionRate,
          totalSessions: totalSessionsOverall,
          chatSessions: chatOverall.totalSessions,
          callSessions: callOverall.totalSessions,
          avgEarningsPerSession: Math.round(avgEarningsOverall * 100) / 100,
          commissionRate: psychicCommissionRate
        }
      },
      message: 'Psychics list retrieved successfully'
    };

    console.log('✅ Sending response with', psychicsWithStats.length, 'psychics');
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Get all psychics error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching psychics list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const getChatById = async (req, res) => {
  try {
    const { id } = req.params;
    const COMMISSION_RATE = 0.25; // 25% to psychic

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }

    console.log(`🔍 Fetching chat session with ID: ${id}`);

    // 1. Get the HumanChatSession by ID
    const chatSession = await HumanChatSession.findById(id)
      .populate('user', 'firstName lastName email avatar fullName phone country')
      .populate('psychic', 'name email image ratePerMin abilities averageRating totalRatings bio gender isVerified type')
      .populate('lastMessage');

    if (!chatSession) {
      console.log(`❌ HumanChatSession not found: ${id}`);
      
      // Try to find as ChatRequest
      const chatRequest = await ChatRequest.findById(id)
        .populate('user', 'firstName lastName email avatar')
        .populate('psychic', 'name email image ratePerMin');
      
      if (chatRequest) {
        const relatedSession = await HumanChatSession.findOne({
          user: chatRequest.user,
          psychic: chatRequest.psychic
        })
        .populate('user', 'firstName lastName email avatar')
        .populate('psychic', 'name email image ratePerMin');
        
        if (relatedSession) {
          return res.status(200).json({
            success: true,
            message: 'Found related session for this chat request',
            redirect: `/api/admin/chats/${relatedSession._id}`,
            chatRequest: {
              _id: chatRequest._id,
              status: chatRequest.status,
              amount: chatRequest.totalAmountPaid
            },
            sessionId: relatedSession._id
          });
        }
      }
      
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    console.log(`✅ Found HumanChatSession: ${id}`);

    // 2. Get all messages for this chat session
    const messages = await MessageBox.find({ 
      chatSession: id 
    })
    .populate('sender', 'firstName lastName name email avatar')
    .populate('receiver', 'firstName lastName name email avatar')
    .populate('replyTo')
    .sort({ createdAt: 1 })
    .lean();

    // 3. Get related ChatRequest (paid timer)
    const chatRequest = await ChatRequest.findOne({
      user: chatSession.user?._id || chatSession.user,
      psychic: chatSession.psychic?._id || chatSession.psychic
    })
    .sort({ createdAt: -1 })
    .lean();

    // 4. Get related CallSession if any
    const callSession = await ActiveCallSession.findOne({
      $or: [
        { 
          userId: chatSession.user?._id || chatSession.user,
          psychicId: chatSession.psychic?._id || chatSession.psychic
        },
        { callRequestId: chatRequest?._id }
      ]
    })
    .sort({ createdAt: -1 })
    .lean();

    // 5. Calculate session statistics
    const sessionStats = await MessageBox.aggregate([
      { $match: { chatSession: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          userMessages: { 
            $sum: { $cond: [{ $eq: ['$senderModel', 'User'] }, 1, 0] } 
          },
          psychicMessages: { 
            $sum: { $cond: [{ $eq: ['$senderModel', 'Psychic'] }, 1, 0] } 
          },
          readMessages: { 
            $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] } 
          },
          mediaMessages: { 
            $sum: { 
              $cond: [{ $in: ['$messageType', ['image', 'file']] }, 1, 0] 
            } 
          },
          firstMessageTime: { $min: '$createdAt' },
          lastMessageTime: { $max: '$createdAt' }
        }
      }
    ]);

    const stats = sessionStats[0] || {
      totalMessages: 0,
      userMessages: 0,
      psychicMessages: 0,
      readMessages: 0,
      mediaMessages: 0
    };

    // 6. Calculate duration
    let duration = 0;
    if (stats.firstMessageTime && stats.lastMessageTime) {
      duration = new Date(stats.lastMessageTime) - new Date(stats.firstMessageTime);
      duration = Math.round(duration / 1000);
    } else if (chatSession.startedAt && chatSession.endedAt) {
      duration = Math.round((new Date(chatSession.endedAt) - new Date(chatSession.startedAt)) / 1000);
    } else if (chatSession.sessionDuration) {
      duration = chatSession.sessionDuration;
    }

    // 7. Prepare participant information
    const participants = {
      user: {
        _id: chatSession.user?._id || chatSession.user,
        name: formatUserName(chatSession.user),
        email: chatSession.user?.email || '',
        avatar: chatSession.user?.avatar || '',
        firstName: chatSession.user?.firstName || '',
        lastName: chatSession.user?.lastName || '',
        fullName: chatSession.user?.fullName || '',
        type: 'user'
      },
      psychic: {
        _id: chatSession.psychic?._id || chatSession.psychic,
        name: chatSession.psychic?.name || 'Unknown Psychic',
        email: chatSession.psychic?.email || '',
        image: chatSession.psychic?.image || '',
        ratePerMin: chatSession.psychic?.ratePerMin || 0,
        averageRating: chatSession.psychic?.averageRating || 0,
        totalRatings: chatSession.psychic?.totalRatings || 0,
        type: 'psychic'
      }
    };

    // 8. Prepare message history with formatted data
    const formattedMessages = messages.map(msg => {
      const senderId = msg.sender?._id?.toString() || msg.sender?.toString();
      const isUser = senderId === participants.user._id.toString();
      
      let senderInfo = {
        _id: msg.sender?._id || msg.sender,
        type: isUser ? 'user' : 'psychic'
      };
      
      if (isUser) {
        senderInfo.name = participants.user.name;
        senderInfo.avatar = participants.user.avatar;
      } else {
        senderInfo.name = participants.psychic.name;
        senderInfo.avatar = participants.psychic.image;
      }
      
      let receiverInfo = {
        _id: msg.receiver?._id || msg.receiver,
        type: isUser ? 'psychic' : 'user'
      };
      
      if (isUser) {
        receiverInfo.name = participants.psychic.name;
      } else {
        receiverInfo.name = participants.user.name;
      }
      
      if (msg.sender) {
        const senderName = formatUserName(msg.sender);
        if (senderName && senderName !== 'Unknown User') {
          senderInfo.name = senderName;
        }
      }
      if (msg.receiver) {
        const receiverName = formatUserName(msg.receiver);
        if (receiverName && receiverName !== 'Unknown User') {
          receiverInfo.name = receiverName;
        }
      }
      if (msg.sender?.avatar) {
        senderInfo.avatar = msg.sender.avatar;
      }
      
      return {
        _id: msg._id,
        content: msg.content,
        messageType: msg.messageType,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        isRead: msg.isRead,
        readAt: msg.readAt,
        status: msg.status,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        sender: senderInfo,
        receiver: receiverInfo,
        replyTo: msg.replyTo,
        reactions: msg.reactions || []
      };
    });

    // 9. Prepare chat request/payment info with split
    const paymentInfo = chatRequest ? {
      _id: chatRequest._id,
      status: chatRequest.status,
      totalPaidByUser: chatRequest.totalAmountPaid || 0, // Total user paid
      psychicEarnings: (chatRequest.totalAmountPaid || 0) * COMMISSION_RATE, // Psychic's 25%
      platformEarnings: (chatRequest.totalAmountPaid || 0) * 0.75, // Platform's 75%
      remainingBalance: chatRequest.remainingBalance || 0,
      ratePerMin: chatRequest.ratePerMin || participants.psychic.ratePerMin,
      initialBalance: chatRequest.initialBalance || 0,
      hasPaidTimer: !!(chatRequest.paidSession?.isActive),
      paidSession: chatRequest.paidSession ? {
        isActive: chatRequest.paidSession.isActive,
        isPaused: chatRequest.paidSession.isPaused,
        remainingSeconds: chatRequest.paidSession.remainingSeconds,
        totalSeconds: chatRequest.paidSession.totalSeconds,
        startTime: chatRequest.paidSession.startTime,
        lastSyncTime: chatRequest.paidSession.lastSyncTime
      } : null,
      deductions: chatRequest.deductions || []
    } : null;

    // 10. Prepare call session info if exists with split
    const callInfo = callSession ? {
      _id: callSession._id,
      roomName: callSession.roomName,
      status: callSession.status,
      startTime: callSession.startTime,
      endTime: callSession.endTime,
      creditsUsed: callSession.totalCreditsUsed || 0,
      totalPaidByUser: callSession.totalCreditsUsed || 0, // 1 credit = $1
      psychicEarnings: (callSession.totalCreditsUsed || 0) * COMMISSION_RATE,
      platformEarnings: (callSession.totalCreditsUsed || 0) * 0.75,
      duration: callSession.startTime && callSession.endTime ? 
        Math.round((new Date(callSession.endTime) - new Date(callSession.startTime)) / 60000) : 0, // minutes
      isFreeSession: callSession.isFreeSession,
      recordingUrl: callSession.recordingUrl,
      endReason: callSession.endReason
    } : null;

    // 11. Prepare response data
    const chatData = {
      session: {
        _id: chatSession._id,
        status: chatSession.status,
        startedAt: chatSession.startedAt,
        endedAt: chatSession.endedAt,
        lastMessageAt: chatSession.lastMessageAt,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt,
        unreadCounts: chatSession.unreadCounts || {
          user: 0,
          psychic: 0
        },
        lastMessage: chatSession.lastMessage
      },
      participants,
      messages: {
        total: stats.totalMessages,
        userMessages: stats.userMessages,
        psychicMessages: stats.psychicMessages,
        readMessages: stats.readMessages,
        unreadMessages: stats.totalMessages - stats.readMessages,
        mediaMessages: stats.mediaMessages,
        history: formattedMessages
      },
      statistics: {
        duration: {
          seconds: duration,
          minutes: Math.round(duration / 60 * 100) / 100,
          hours: Math.round(duration / 3600 * 100) / 100,
          formatted: formatDuration(duration)
        },
        conversationTimeline: {
          firstMessage: stats.firstMessageTime,
          lastMessage: stats.lastMessageTime,
          messageFrequency: stats.totalMessages > 0 && duration > 0 ? 
            Math.round((stats.totalMessages / duration) * 60 * 100) / 100 : 0
        },
        userEngagement: {
          messageRatio: stats.totalMessages > 0 ? 
            Math.round((stats.userMessages / stats.totalMessages) * 100) : 0,
          averageResponseTime: calculateAverageResponseTime(formattedMessages)
        }
      },
      payment: paymentInfo,
      call: callInfo,
      metadata: {
        sessionType: paymentInfo?.hasPaidTimer ? 'paid' : 'free',
        hasMedia: stats.mediaMessages > 0,
        isActive: chatSession.status === 'active',
        chatStarted: chatSession.startedAt ? true : false,
        chatEnded: chatSession.endedAt ? true : false,
        hasCall: !!callInfo,
        splitInfo: {
          psychicRate: COMMISSION_RATE * 100 + '%',
          platformRate: '75%',
          description: 'Psychic receives 25% of payments, platform retains 75%'
        }
      }
    };

    console.log(`✅ Successfully retrieved chat data for session: ${id}`);

    res.status(200).json({
      success: true,
      data: chatData,
      message: 'Chat session retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get chat by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const formatUserName = (user) => {
  if (!user) return 'Unknown User';
  
  // Check different possible name fields
  if (user.name) return user.name;
  if (user.fullName) return user.fullName;
  if (user.firstName || user.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  if (user.email) return user.email.split('@')[0]; // Use email prefix as fallback
  
  return 'Unknown User';
};

const calculateAverageResponseTime = (messages) => {
  if (messages.length < 2) return 0;
  
  let totalResponseTime = 0;
  let responseCount = 0;
  
  for (let i = 1; i < messages.length; i++) {
    const currentMsg = messages[i];
    const previousMsg = messages[i - 1];
    
    // Only calculate if messages are from different participants
    if (currentMsg.sender.type !== previousMsg.sender.type) {
      const responseTime = new Date(currentMsg.createdAt) - new Date(previousMsg.createdAt);
      totalResponseTime += responseTime;
      responseCount++;
    }
  }
  
  return responseCount > 0 ? 
    Math.round(totalResponseTime / responseCount / 1000) : 0; // in seconds
};

const formatDuration = (seconds) => {
  if (!seconds) return '0 seconds';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} second${secs > 1 ? 's' : ''}`);
  
  return parts.join(', ');
};






const getMonthName = (monthNumber) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthNumber - 1] || 'Unknown';
};


const calculateEarningsPerHour = (chatData, callData) => {
  const totalHours = (chatData.totalTime / 3600) + (callData.totalDuration / 60);
  const totalEarnings = chatData.totalEarnings + callData.totalEarnings;
  
  if (totalHours === 0) return 0;
  return Math.round((totalEarnings / totalHours) * 100) / 100;
};


const getLastActiveTime = (chatSessions, callSessions) => {
  const allActivities = [
    ...chatSessions.map(s => s.lastMessageAt || s.updatedAt),
    ...callSessions.map(c => c.endTime || c.updatedAt)
  ].filter(Boolean);
  
  if (allActivities.length === 0) return null;
  return new Date(Math.max(...allActivities.map(d => new Date(d))));
};


const calculateEstimatedMonthlyEarnings = (chatRatePerMin) => {
  // Estimate: 40 min/session, 20 sessions/week, 4 weeks/month for chats
  const chatEstimate = chatRatePerMin * 40 * 20 * 4;
  // Estimate: 30 min/call, 15 calls/week, 4 weeks/month for calls (1 credit/min = $1/min)
  const callEstimate = 1 * 30 * 15 * 4;
  
  return chatEstimate + callEstimate;
};


const getUserChats = (req, res) => res.status(200).json({ 
  success: true, 
  message: 'This endpoint is no longer available' 
});

/**
 * @desc    Legacy endpoint for psychic chats (no longer available)
 */
const getPsychicChats = (req, res) => res.status(200).json({ 
  success: true, 
  message: 'This endpoint is no longer available' 
});

/**
 * @desc    Legacy endpoint for chat requests (no longer available)
 */
const getChatRequests = (req, res) => res.status(200).json({ 
  success: true, 
  message: 'This endpoint is no longer available' 
});

// Export controllers
module.exports = {
  getAllChatData,
  getChatById,
  getPsychicDetails,
  getAllPsychics,
  getUserChats,
  getPsychicChats,
  updatePsychicDetails,      // Add this
  togglePsychicVerification,  // Add this
  updatePsychicStatus,        // Add this
  updatePsychicRate,
  getChatRequests
};