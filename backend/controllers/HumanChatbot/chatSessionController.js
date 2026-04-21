// controllers/chatSessionController.js
const HumanChatSession = require('../../models/HumanChat/HumanChatSession');
const User = require('../../models/User');
const Psychic = require('../../models/HumanChat/Psychic');
const MessageBox = require('../../models/HumanChat/MessageBox');
const Warning = require('../../models/HumanChat/Warning'); // NEW

// Socket.IO instance (will be set from server.js)
let io;

// Set socket instance
exports.setSocketIO = (socketIO) => {
  io = socketIO;
};

// Helper function to emit socket messages
const emitToSocket = (room, event, data) => {
  try {
    if (!global.io) {
      console.warn(`⚠️ Socket.io not available for ${event} to ${room}`);
      return false;
    }
    global.io.to(room).emit(event, data);
    return true;
  } catch (error) {
    console.error(`❌ Failed to emit ${event} to ${room}:`, error);
    return false;
  }
};

// Create a new chat session
exports.createChatSession = async (req, res) => {
  try {
    const { psychicId } = req.body;
    const userId = req.user._id;

    // Check if psychic exists and is verified
    const psychic = await Psychic.findOne({ _id: psychicId, isVerified: true })
      .select('isActive warningCount deactivatedAt'); // Include warning status
    
    if (!psychic) {
      return res.status(404).json({ success: false, message: 'Psychic not found or not verified' });
    }

    // Check if psychic is active (not deactivated due to warnings)
    if (!psychic.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'This psychic is currently unavailable due to policy violations.',
        deactivated: true,
        deactivatedAt: psychic.deactivatedAt
      });
    }

    // Check for existing active chat session
    const existingSession = await HumanChatSession.findOne({
      user: userId,
      psychic: psychicId,
      status: { $in: ['active', 'waiting'] }
    });

    if (existingSession) {
      return res.status(400).json({ 
        success: false, 
        message: 'Chat session already exists',
        chatSessionId: existingSession._id 
      });
    }

    // Create new chat session with warning tracking
    const chatSession = new HumanChatSession({
      user: userId,
      psychic: psychicId,
      status: 'waiting',
      warningCount: 0, // Track warnings in this session
      warnings: [] // Store warnings related to this session
    });

    await chatSession.save();

    // Populate for response
    const populatedSession = await HumanChatSession.findById(chatSession._id)
      .populate('user', 'firstName lastName username image isActive')
      .populate('psychic', 'name email image ratePerMin bio isActive warningCount');

    // Emit socket events
    if (global.io) {
      const psychicRoom = `psychic_${psychicId}`;
      global.io.to(psychicRoom).emit('new_chat_session', {
        chatSession: populatedSession,
        createdAt: Date.now()
      });
      
      const chatRoom = `chat_${chatSession._id}`;
      global.io.to(chatRoom).emit('session_created', {
        chatSession: populatedSession
      });
      
      console.log(`📢 Emitted new_chat_session to psychic ${psychicId}`);
    }

    res.status(201).json({
      success: true,
      chatSession: populatedSession
    });

  } catch (error) {
    console.error('Create chat session error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get user's chat sessions (updated to include warning info)
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    const query = userModel === 'User' 
      ? { user: userId }
      : { psychic: userId };

    const chatSessions = await HumanChatSession.find(query)
      .populate('user', 'firstName lastName username image isActive warningCount')
      .populate('psychic', 'name email image ratePerMin bio isActive warningCount')
      .populate({
        path: 'lastMessage',
        select: 'content sender senderModel createdAt messageType isBlocked containsProhibitedContent'
      })
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    // For each session, check if psychic is deactivated
    const sessionsWithStatus = await Promise.all(chatSessions.map(async (session) => {
      const sessionObj = session.toObject();
      
      // Check if psychic is deactivated
      if (session.psychic && !session.psychic.isActive) {
        sessionObj.psychicDeactivated = true;
        sessionObj.psychicDeactivatedAt = session.psychic.deactivatedAt;
      }
      
      // Get recent warnings for this session
      const recentWarnings = await Warning.find({
        chatSessionId: session._id,
        status: 'active'
      })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('warningType warningNumber createdAt');
      
      sessionObj.recentWarnings = recentWarnings;
      
      return sessionObj;
    }));

    res.status(200).json({
      success: true,
      chatSessions: sessionsWithStatus,
      total: sessionsWithStatus.length
    });

  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get specific chat session details (updated)
exports.getChatSession = async (req, res) => {
  try {
    const { chatSessionId } = req.params;
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    const chatSession = await HumanChatSession.findOne({
      _id: chatSessionId,
      $or: [
        { user: userId },
        { psychic: userId }
      ]
    })
    .populate('user', 'firstName lastName username image isActive')
    .populate('psychic', 'name email image ratePerMin bio isActive warningCount')
    .populate({
      path: 'lastMessage',
      select: 'content sender senderModel createdAt messageType isBlocked'
    });

    if (!chatSession) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }

    // Get warning history for this session
    const warnings = await Warning.find({
      chatSessionId,
      status: 'active'
    })
    .populate('psychicId', 'name email')
    .populate('userId', 'username email')
    .sort({ createdAt: -1 });

    // Check if psychic is deactivated
    const psychicDeactivated = chatSession.psychic && !chatSession.psychic.isActive;

    res.status(200).json({
      success: true,
      chatSession,
      warnings: warnings.map(w => ({
        id: w._id,
        type: w.warningType,
        number: w.warningNumber,
        createdAt: w.createdAt,
        content: w.detectedContent
      })),
      psychicDeactivated,
      warningSummary: {
        totalWarnings: warnings.length,
        hasActiveWarnings: warnings.length > 0,
        psychicWarningCount: chatSession.psychic?.warningCount || 0
      }
    });

  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update chat session status (updated)
exports.updateChatStatus = async (req, res) => {
  try {
    const { chatSessionId } = req.params;
    const { status, blockReason } = req.body;
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    const chatSession = await HumanChatSession.findById(chatSessionId);
    if (!chatSession) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }

    // Check authorization
    const isParticipant = 
      (userModel === 'User' && chatSession.user.toString() === userId.toString()) ||
      (userModel === 'Psychic' && chatSession.psychic.toString() === userId.toString());
    
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // If psychic is trying to start chat but is deactivated
    if (userModel === 'Psychic' && status === 'active') {
      const psychic = await Psychic.findById(userId);
      if (!psychic || !psychic.isActive) {
        return res.status(403).json({ 
          success: false, 
          message: 'Your account has been deactivated. You cannot start chat sessions.',
          deactivated: true
        });
      }
    }

    // Update status
    chatSession.status = status;
    
    if (status === 'ended') {
      chatSession.endedAt = Date.now();
    } else if (status === 'blocked') {
      chatSession.blockedBy = userId;
      chatSession.blockedByModel = userModel;
      chatSession.blockReason = blockReason || null;
    } else if (status === 'active') {
      chatSession.startedAt = Date.now();
    }

    await chatSession.save();

    // Emit status change
    const roomName = `chat_${chatSessionId}`;
    if (global.io) {
      global.io.to(roomName).emit('chat_status_changed', {
        chatSessionId,
        status,
        updatedBy: userId,
        updatedAt: chatSession.updatedAt
      });
    }

    res.status(200).json({
      success: true,
      chatSession
    });

  } catch (error) {
    console.error('Update chat status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Search chat participants (updated to filter out deactivated psychics)
exports.searchParticipants = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    let participants = [];

    if (userModel === 'User') {
      // Users search for psychics - exclude deactivated ones
      participants = await Psychic.find({
        $and: [
          { isVerified: true },
          { isActive: true }, // Only show active psychics
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { email: { $regex: query, $options: 'i' } },
              { bio: { $regex: query, $options: 'i' } }
            ]
          }
        ]
      })
      .select('name email image ratePerMin bio gender isActive warningCount')
      .limit(10);
    } else {
      // Psychics search for users
      participants = await User.find({
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      })
      .select('firstName lastName username email image gender isActive')
      .limit(10);
    }

    res.status(200).json({
      success: true,
      participants
    });

  } catch (error) {
    console.error('Search participants error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check chat session (updated)
exports.checkChatSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const psychicId = req.params.psychicId;

    // Check if psychic exists, is verified, and is active
    const psychic = await Psychic.findOne({ 
      _id: psychicId, 
      isVerified: true 
    }).select('isActive warningCount deactivatedAt');
    
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: "Psychic not found or not verified"
      });
    }

    // Check if psychic is deactivated
    if (!psychic.isActive) {
      return res.json({ 
        exists: false, 
        deactivated: true,
        message: "This psychic is currently unavailable"
      });
    }

    const session = await HumanChatSession.findOne({
      user: userId,
      psychic: psychicId,
      status: { $in: ["active", "waiting"] }
    })
      .populate("user", "firstName lastName username image isActive")
      .populate("psychic", "name email image ratePerMin bio isActive warningCount")
      .populate({
        path: "lastMessage",
        select: "content sender senderModel createdAt messageType isBlocked"
      });

    if (!session) {
      return res.json({ 
        exists: false,
        psychicStatus: {
          isActive: psychic.isActive,
          warningCount: psychic.warningCount
        }
      });
    }

    // Get recent warnings for this session
    const warnings = await Warning.find({
      chatSessionId: session._id,
      status: 'active'
    }).limit(3);

    return res.json({
      exists: true,
      session,
      warnings: warnings.map(w => ({
        type: w.warningType,
        number: w.warningNumber,
        createdAt: w.createdAt
      }))
    });

  } catch (error) {
    console.error("Check chat session error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get psychic's chat sessions (updated)
exports.getPsychicChats = async (req, res) => {
  try {
    const psychicId = req.user._id;

    // Get psychic's own status
    const psychic = await Psychic.findById(psychicId).select('isActive warningCount deactivatedAt');
    
    const chatSessions = await HumanChatSession.find({ psychic: psychicId })
      .populate("user", "firstName lastName username image email isActive")
      .populate("psychic", "name email image ratePerMin bio isActive warningCount")
      .populate({
        path: "lastMessage",
        select: "content sender senderModel createdAt messageType status isBlocked containsProhibitedContent"
      })
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    // Format sessions with warning info
    const formattedSessions = await Promise.all(chatSessions.map(async (session) => {
      // Check if user exists
      let userData = null;
      if (session.user) {
        userData = {
          _id: session.user._id,
          firstName: session.user.firstName || 'User',
          lastName: session.user.lastName || '',
          username: session.user.username || 'user',
          image: session.user.image,
          email: session.user.email,
          isActive: session.user.isActive
        };
      } else {
        userData = {
          _id: 'deleted_user',
          firstName: 'Deleted',
          lastName: 'User',
          username: 'deleted_user',
          image: null,
          email: null,
          isActive: false
        };
      }

      // Get warning count for this session
      const warningCount = await Warning.countDocuments({
        chatSessionId: session._id,
        psychicId,
        status: 'active'
      });

      return {
        _id: session._id,
        user: userData,
        psychic: psychicId,
        psychicData: {
          _id: psychicId,
          isActive: psychic?.isActive,
          warningCount: psychic?.warningCount,
          deactivatedAt: psychic?.deactivatedAt
        },
        status: session.status || 'waiting',
        unreadCounts: session.unreadCounts || { user: 0, psychic: 0 },
        lastMessage: session.lastMessage || null,
        lastMessageAt: session.lastMessageAt || session.updatedAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        sessionWarningCount: warningCount,
        accountDeactivated: psychic && !psychic.isActive
      };
    }));

    res.status(200).json({
      success: true,
      chatSessions: formattedSessions,
      total: formattedSessions.length,
      accountStatus: {
        isActive: psychic?.isActive,
        warningCount: psychic?.warningCount,
        deactivatedAt: psychic?.deactivatedAt,
        remainingWarnings: psychic?.isActive ? Math.max(0, 3 - (psychic?.warningCount || 0)) : 0
      }
    });

  } catch (error) {
    console.error("Get psychic chats error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
};

// NEW: Get session warning history
exports.getSessionWarnings = async (req, res) => {
  try {
    const { chatSessionId } = req.params;
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    // Verify access
    const session = await HumanChatSession.findOne({
      _id: chatSessionId,
      $or: [
        { user: userId },
        { psychic: userId }
      ]
    });

    if (!session) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const warnings = await Warning.find({ chatSessionId })
      .populate('psychicId', 'name email')
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      warnings,
      total: warnings.length
    });

  } catch (error) {
    console.error('Get session warnings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// NEW: Block chat session due to warning
exports.blockSessionDueToWarning = async (req, res) => {
  try {
    const { chatSessionId } = req.params;
    const { warningId } = req.body;

    const chatSession = await HumanChatSession.findById(chatSessionId);
    if (!chatSession) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const warning = await Warning.findById(warningId);
    if (!warning) {
      return res.status(404).json({ success: false, message: 'Warning not found' });
    }

    chatSession.status = 'blocked';
    chatSession.blockedBy = warning.psychicId;
    chatSession.blockedByModel = 'Psychic';
    chatSession.blockReason = `Session blocked due to warning #${warning.warningNumber}`;
    chatSession.endedAt = new Date();

    await chatSession.save();

    // Notify user
    if (global.io) {
      global.io.to(`user_${chatSession.user}`).emit('session_blocked', {
        chatSessionId,
        reason: 'warning_violation',
        warningNumber: warning.warningNumber
      });
    }

    res.json({
      success: true,
      message: 'Session blocked due to warning',
      chatSession
    });

  } catch (error) {
    console.error('Block session due to warning error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};