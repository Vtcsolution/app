// controllers/messageController.js

const HumanChatSession = require('../../models/HumanChat/HumanChatSession');
const User = require('../../models/User');
const Psychic = require('../../models/HumanChat/Psychic');
const MessageBox = require('../../models/HumanChat/MessageBox');
const Warning = require('../../models/HumanChat/Warning');

// Import detection utilities
const { 
  detectProhibitedContent, 
  generateRedactedContent,
  shouldBlockMessage,
  WARNING_TYPES,
  getWarningMessage
} = require('../../utils/detectionUtils');

// Socket.IO instance
// At the top of messageController.js, after imports
let io;

// Set socket instance
exports.setSocketIO = (socketIO) => {
  io = socketIO;
  global.io = socketIO; // Set global for backward compatibility
};

// Helper function to emit socket messages with retry
const emitToSocket = (room, event, data, retryCount = 0) => {
  try {
    // Use io instead of global.io
    if (!io) {
      console.warn(`⚠️ Socket.io not available for ${event} to ${room}`);
      return false;
    }

    const maxRetries = 3;
    
    const roomSockets = io.sockets.adapter.rooms.get(room);
    if (!roomSockets || roomSockets.size === 0) {
      console.log(`📭 No one in room ${room} for event ${event}`);
    }

    console.log(`📤 Emitting ${event} to ${room}`, {
      messageId: data.message?._id,
      roomSize: roomSockets?.size || 0
    });

    io.to(room).emit(event, data);
    return true;

  } catch (error) {
    console.error(`❌ Failed to emit ${event} to ${room}:`, error);
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying ${event} (${retryCount + 1}/${maxRetries})...`);
      setTimeout(() => emitToSocket(room, event, data, retryCount + 1), 1000);
    }
    
    return false;
  }
};
// ===== Check if sender is active =====
const checkSenderActive = async (senderId, senderModel) => {
  const Model = senderModel === 'User' ? User : Psychic;
  const sender = await Model.findById(senderId);
  
  if (!sender) {
    return { active: false, reason: 'not_found' };
  }
  
  if (!sender.isActive) {
    return { 
      active: false, 
      reason: 'deactivated',
      warningCount: sender.warningCount,
      deactivatedAt: sender.deactivatedAt
    };
  }
  
  return { active: true, sender };
};

// controllers/messageController.js - FIXED issueWarningToPsychic function

// ===== Issue warning to Psychic - COMPLETELY FIXED VERSION =====
const issueWarningToPsychic = async (psychicId, userId, chatSessionId, messageId, detectedTypes, content) => {
  try {
    console.log(`⚠️⚠️⚠️ ISSUING WARNING TO PSYCHIC ${psychicId} for types:`, detectedTypes);
    
    // First, get the psychic to check current warning count
    const psychic = await Psychic.findById(psychicId);
    if (!psychic) {
      console.error(`❌ Psychic not found: ${psychicId}`);
      return null;
    }
    
    // Get current warning count
    const currentWarningCount = psychic.warningCount || 0;
    const warningNumber = currentWarningCount + 1;
    
    console.log(`📊 Psychic ${psychic.name} current warnings: ${currentWarningCount}, new warning #${warningNumber}`);
    
    // Create warning record
    const warning = new Warning({
      psychicId,
      userId,
      chatSessionId,
      messageId,
      warningType: detectedTypes[0] || 'other',
      detectedContent: content.substring(0, 200),
      fullMessage: content,
      warningNumber,
      status: 'active',
      createdAt: new Date(),
      targetModel: 'Psychic'
    });
    
    await warning.save();
    console.log(`✅ Warning #${warningNumber} saved with ID: ${warning._id}`);
    
    // Prepare update object
    const updateObj = {
      $inc: { warningCount: 1 },
      $push: {
        warnings: {
          warningId: warning._id,
          type: warning.warningType,
          message: `Warning #${warningNumber}: ${warning.warningType} content detected`,
          createdAt: new Date(),
          chatSessionId,
          userId,
          content: content.substring(0, 100),
          resolved: false
        }
      }
    };
    
    // If this is the 3rd warning, deactivate the psychic
    if (warningNumber >= 3) {
      updateObj.$set = {
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: 'warning_limit'
      };
      console.log(`🔴🔴🔴 PSYCHIC ${psychic.name} (${psychicId}) WILL BE DEACTIVATED due to 3 warnings!`);
    }
    
    // CRITICAL: Use findByIdAndUpdate with the update object
    const updatedPsychic = await Psychic.findByIdAndUpdate(
      psychicId,
      updateObj,
      { new: true } // Return the updated document
    );
    
    if (!updatedPsychic) {
      console.error(`❌ Failed to update psychic ${psychicId}`);
      return null;
    }
    
    console.log(`✅ Psychic record updated: warningCount=${updatedPsychic.warningCount}, isActive=${updatedPsychic.isActive}`);
    console.log(`✅ Psychic warnings array length: ${updatedPsychic.warnings.length}`);
    
    // Also add to user's warnings array for reference
    await User.findByIdAndUpdate(userId, {
      $push: {
        warnings: {
          warningId: warning._id,
          type: warning.warningType,
          message: `Warning issued to psychic`,
          createdAt: new Date(),
          chatSessionId,
          psychicId,
          content: content.substring(0, 100),
          resolved: false
        }
      }
    });
    
    return {
      warning,
      warningNumber,
      deactivated: warningNumber >= 3,
      targetType: 'psychic',
      updatedPsychic
    };
    
  } catch (error) {
    console.error('❌ Error issuing warning to psychic:', error);
    return null;
  }
};
// ===== Issue warning to User - COMPLETELY FIXED VERSION =====
const issueWarningToUser = async (userId, psychicId, chatSessionId, messageId, detectedTypes, content) => {
  try {
    console.log(`⚠️⚠️⚠️ ISSUING WARNING TO USER ${userId} for types:`, detectedTypes);
    
    // First, get the user to check current warning count
    const user = await User.findById(userId);
    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      return null;
    }
    
    // Get current warning count from user model
    const currentWarningCount = user.warningCount || 0;
    const warningNumber = currentWarningCount + 1;
    
    console.log(`📊 User ${user.username} - Current warningCount: ${currentWarningCount}, New warning #${warningNumber}`);
    console.log(`📊 User isActive: ${user.isActive}, warnings array length: ${user.warnings.length}`);
    
    // Create warning record
    const warning = new Warning({
      psychicId,
      userId,
      chatSessionId,
      messageId,
      warningType: detectedTypes[0] || 'other',
      detectedContent: content.substring(0, 200),
      fullMessage: content,
      warningNumber,
      status: 'active',
      createdAt: new Date(),
      targetModel: 'User'
    });
    
    await warning.save();
    console.log(`✅ Warning #${warningNumber} saved with ID: ${warning._id}`);
    
    // Prepare update object
    const updateObj = {
      $inc: { warningCount: 1 },
      $push: {
        warnings: {
          warningId: warning._id,
          type: warning.warningType,
          message: `Warning #${warningNumber}: ${warning.warningType} content detected`,
          createdAt: new Date(),
          chatSessionId,
          psychicId,
          content: content.substring(0, 100),
          resolved: false
        }
      }
    };
    
    // If this is the 3rd warning, deactivate the user
    if (warningNumber >= 3) {
      updateObj.$set = {
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: 'warning_limit'
      };
      console.log(`🔴🔴🔴 USER ${user.username} (${userId}) WILL BE DEACTIVATED due to 3 warnings!`);
    }
    
    // CRITICAL: Use findByIdAndUpdate with the update object
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateObj,
      { new: true } // Return the updated document
    );
    
    if (!updatedUser) {
      console.error(`❌ Failed to update user ${userId}`);
      return null;
    }
    
    console.log(`✅ User record updated: warningCount=${updatedUser.warningCount}, isActive=${updatedUser.isActive}`);
    console.log(`✅ User warnings array length: ${updatedUser.warnings.length}`);
    
    // Also add to psychic's warnings array for reference
    await Psychic.findByIdAndUpdate(psychicId, {
      $push: {
        warnings: {
          warningId: warning._id,
          type: warning.warningType,
          message: `Warning issued to user`,
          createdAt: new Date(),
          chatSessionId,
          userId,
          content: content.substring(0, 100),
          resolved: false
        }
      }
    });
    
    return {
      warning,
      warningNumber,
      deactivated: warningNumber >= 3,
      targetType: 'user',
      updatedUser
    };
    
  } catch (error) {
    console.error('❌ Error issuing warning to user:', error);
    return null;
  }
};

// ===== Send warning alert for psychic - COMPLETE FIXED VERSION =====
const sendPsychicWarningAlert = async (psychicId, userId, chatSessionId, warning, deactivated) => {
  // Use the io instance that was set at the top of the file
  if (!io) {
    console.error('❌ Socket.io not available for sending psychic warning');
    return;
  }
  
  console.log(`🔔 Sending warning alert for psychic ${psychicId}, warning #${warning.warningNumber}, deactivated: ${deactivated}`);
  
  const warningData = {
    warningId: warning._id,
    warningType: warning.warningType,
    warningNumber: warning.warningNumber,
    message: getWarningMessage(warning.warningNumber),
    chatSessionId,
    timestamp: new Date(),
    deactivated
  };
  
  // CRITICAL: Send to psychic's personal room
  io.to(`psychic_${psychicId}`).emit('warning_issued', warningData);
  console.log(`📤 Sent warning_issued to psychic_${psychicId}`);
  
  // CRITICAL: Send to user so they know the psychic got a warning
  io.to(`user_${userId}`).emit('warning_issued_to_psychic', {
    ...warningData,
    message: `⚠️ Psychic received warning #${warning.warningNumber} for sharing contact information.`
  });
  
  // CRITICAL: Send to chat room so both see a system message
  io.to(`chat_${chatSessionId}`).emit('warning_in_chat', {
    ...warningData,
    systemMessage: true,
    content: `⚠️ System Warning: Psychic received warning #${warning.warningNumber} for sharing prohibited content.`
  });
  
  // If deactivated, send additional events
  if (deactivated) {
    // Get psychic name for user notification
    const psychic = await Psychic.findById(psychicId).select('name');
    
    io.to(`psychic_${psychicId}`).emit('account_deactivated', {
      reason: 'warning_limit',
      message: 'Your account has been deactivated due to multiple warnings.',
      deactivatedAt: new Date()
    });
    
    io.to(`user_${userId}`).emit('psychic_deactivated', {
      psychicId,
      psychicName: psychic?.name || 'Psychic',
      message: 'This psychic has been deactivated due to policy violations.',
      chatSessionId
    });
    
    io.to(`chat_${chatSessionId}`).emit('session_ended', {
      reason: 'psychic_deactivated',
      message: 'Chat session ended because the psychic was deactivated.'
    });
  }
};
// ===== Send warning alert for user =====
// ===== Send warning alert for user - COMPLETE FIXED VERSION =====
const sendUserWarningAlert = async (userId, psychicId, chatSessionId, warning, deactivated) => {
  if (!global.io) {
    console.error('❌ Socket.io not available for sending user warning');
    return;
  }
  
  console.log(`🔔 Sending warning alert for USER ${userId}, warning #${warning.warningNumber}, deactivated: ${deactivated}`);
  
  const warningData = {
    warningId: warning._id,
    warningType: warning.warningType,
    warningNumber: warning.warningNumber,
    message: getWarningMessage(warning.warningNumber),
    chatSessionId,
    timestamp: new Date(),
    deactivated
  };
  
  // Send to user's personal room
  global.io.to(`user_${userId}`).emit('warning_issued', warningData);
  console.log(`📤 Sent warning_issued to user_${userId}`);
  
  // Send to psychic so they know the user got a warning
  global.io.to(`psychic_${psychicId}`).emit('warning_issued_to_user', {
    ...warningData,
    message: `⚠️ User received warning #${warning.warningNumber} for sharing contact information.`
  });
  
  // Send to chat room so both see a system message
  global.io.to(`chat_${chatSessionId}`).emit('warning_in_chat', {
    ...warningData,
    systemMessage: true,
    content: `⚠️ System Warning: User received warning #${warning.warningNumber} for sharing prohibited content.`
  });
  
  // If deactivated, send additional events
  if (deactivated) {
    const user = await User.findById(userId).select('username firstName lastName');
    
    global.io.to(`user_${userId}`).emit('account_deactivated', {
      reason: 'warning_limit',
      message: 'Your account has been deactivated due to multiple warnings.',
      deactivatedAt: new Date()
    });
    
    global.io.to(`psychic_${psychicId}`).emit('user_deactivated', {
      userId,
      userName: user?.username || user?.firstName || 'User',
      message: 'This user has been deactivated due to policy violations.',
      chatSessionId
    });
    
    global.io.to(`chat_${chatSessionId}`).emit('session_ended', {
      reason: 'user_deactivated',
      message: 'Chat session ended because the user was deactivated.'
    });
  }
};

// CRITICAL: Get or create chat session
const getOrCreateChatSession = async (userId, psychicId, senderModel) => {
  try {
    console.log(`🔍 Looking for chat session: user=${userId}, psychic=${psychicId}`);
    
    const existingSession = await HumanChatSession.findOne({
      user: userId,
      psychic: psychicId,
      status: { $in: ['active', 'waiting'] }
    })
    .populate('user', 'firstName lastName username image email isActive warningCount')
    .populate('psychic', 'name email image ratePerMin bio isActive warningCount');

    if (existingSession) {
      console.log(`✅ Found existing chat session: ${existingSession._id}`);
      return { session: existingSession, isNew: false };
    }

    const psychic = await Psychic.findById(psychicId);
    if (!psychic || !psychic.isActive) {
      throw new Error('Psychic is not available or has been deactivated');
    }

    console.log(`🆕 Creating new chat session for user ${userId} with psychic ${psychicId}`);
    
    const newSession = new HumanChatSession({
      user: userId,
      psychic: psychicId,
      status: 'active',
      unreadCounts: {
        user: 0,
        psychic: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newSession.save();

    const populatedSession = await HumanChatSession.findById(newSession._id)
      .populate('user', 'firstName lastName username image email isActive')
      .populate('psychic', 'name email image ratePerMin bio isActive');

    console.log(`✅ Created new chat session: ${populatedSession._id}`);
    
    if (global.io) {
      const psychicRoom = `psychic_${psychicId}`;
      const sessionData = {
        _id: populatedSession._id,
        user: {
          _id: populatedSession.user._id,
          firstName: populatedSession.user.firstName,
          lastName: populatedSession.user.lastName,
          username: populatedSession.user.username,
          image: populatedSession.user.image
        },
        psychic: populatedSession.psychic._id,
        status: populatedSession.status,
        unreadCounts: populatedSession.unreadCounts,
        createdAt: populatedSession.createdAt,
        updatedAt: populatedSession.updatedAt
      };
      
      emitToSocket(psychicRoom, 'new_chat_session', {
        chatSession: sessionData,
        message: 'New chat session created'
      });
    }

    return { session: populatedSession, isNew: true };

  } catch (error) {
    console.error('❌ Error in getOrCreateChatSession:', error);
    throw error;
  }
};
// Test endpoint to manually add a warning to psychic
// Debug endpoint to manually add a warning to psychic
exports.testAddWarning = async (req, res) => {
  try {
    const { psychicId, userId, chatSessionId, messageId } = req.body;
    
    const psychic = await Psychic.findById(psychicId);
    if (!psychic) {
      return res.status(404).json({ success: false, message: 'Psychic not found' });
    }
    
    const warningNumber = (psychic.warningCount || 0) + 1;
    
    // Create warning
    const warning = new Warning({
      psychicId,
      userId,
      chatSessionId,
      messageId: messageId || new mongoose.Types.ObjectId(),
      warningType: 'phone',
      detectedContent: 'Test content',
      fullMessage: 'Test message',
      warningNumber,
      status: 'active',
      createdAt: new Date(),
      targetModel: 'Psychic'
    });
    
    await warning.save();
    
    // Update psychic
    const updatedPsychic = await Psychic.findByIdAndUpdate(
      psychicId,
      {
        $inc: { warningCount: 1 },
        $push: {
          warnings: {
            warningId: warning._id,
            type: 'phone',
            message: `Warning #${warningNumber}: phone content detected`,
            createdAt: new Date(),
            chatSessionId,
            userId,
            content: 'Test content',
            resolved: false
          }
        }
      },
      { new: true }
    );
    
    res.json({
      success: true,
      warning,
      psychic: {
        warningCount: updatedPsychic.warningCount,
        warningsLength: updatedPsychic.warnings.length
      }
    });
    
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Debug endpoint to check psychic warnings
// Debug endpoint to check psychic warnings
// Debug endpoint to check psychic warnings
exports.debugPsychicWarnings = async (req, res) => {
  try {
    const { psychicId } = req.params;
    
    const psychic = await Psychic.findById(psychicId)
      .select('name email warningCount warnings isActive deactivatedAt');
    
    if (!psychic) {
      return res.status(404).json({ success: false, message: 'Psychic not found' });
    }
    
    const warnings = await Warning.find({ 
      psychicId, 
      targetModel: 'Psychic' 
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      psychic: {
        id: psychic._id,
        name: psychic.name,
        email: psychic.email,
        warningCount: psychic.warningCount,
        isActive: psychic.isActive,
        deactivatedAt: psychic.deactivatedAt,
        warningsArrayLength: psychic.warnings.length,
        warnings: psychic.warnings.map(w => ({
          warningId: w.warningId,
          type: w.type,
          message: w.message,
          createdAt: w.createdAt
        }))
      },
      warningDocuments: warnings.map(w => ({
        id: w._id,
        type: w.warningType,
        number: w.warningNumber,
        createdAt: w.createdAt,
        status: w.status
      }))
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// ===== NEW TEST/ADMIN WARNING FUNCTIONS =====

/**
 * Generate a test warning for a psychic (for testing/debugging)
 */
exports.generateTestPsychicWarning = async (req, res) => {
  try {
    const { psychicId, userId, chatSessionId, warningType } = req.body;
    
    // Import mongoose if needed
    const mongoose = require('mongoose');
    
    // Validate psychic exists
    const psychic = await Psychic.findById(psychicId);
    if (!psychic) {
      return res.status(404).json({ success: false, message: 'Psychic not found' });
    }
    
    // Get or create a test user if not provided
    let targetUserId = userId;
    if (!targetUserId) {
      // Find or create a test user
      const testUser = await User.findOne({ email: 'test@example.com' });
      if (testUser) {
        targetUserId = testUser._id;
      } else {
        // Create a test user
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Test@123', salt);
        
        const newUser = new User({
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
          email: 'test@example.com',
          password: hashedPassword,
          isActive: true
        });
        await newUser.save();
        targetUserId = newUser._id;
      }
    }
    
    // Get or create a test chat session
    let sessionId = chatSessionId;
    if (!sessionId) {
      const existingSession = await HumanChatSession.findOne({
        user: targetUserId,
        psychic: psychicId,
        status: 'active'
      });
      
      if (existingSession) {
        sessionId = existingSession._id;
      } else {
        const newSession = new HumanChatSession({
          user: targetUserId,
          psychic: psychicId,
          status: 'active',
          unreadCounts: { user: 0, psychic: 0 },
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await newSession.save();
        sessionId = newSession._id;
      }
    }
    
    // Create a test message with appropriate content based on warning type
    let testContent = '';
    switch(warningType) {
      case 'email':
        testContent = 'Contact me at test@example.com';
        break;
      case 'phone':
        testContent = 'Call me at 123-456-7890';
        break;
      case 'link':
        testContent = 'Check out https://example.com';
        break;
      default:
        testContent = 'Test message with contact info 123-456-7890';
    }
    
    const MessageBox = require('../models/HumanChat/MessageBox');
    const testMessage = new MessageBox({
      chatSession: sessionId,
      sender: psychicId,
      senderModel: 'Psychic',
      receiver: targetUserId,
      receiverModel: 'User',
      content: testContent,
      messageType: 'text',
      status: 'sent',
      containsProhibitedContent: true,
      prohibitedContentTypes: [warningType || 'phone'],
      isBlocked: true,
      redactedContent: `[${warningType?.toUpperCase() || 'PHONE'} REDACTED]`,
      createdAt: new Date()
    });
    await testMessage.save();
    
    // Get current warning count
    const currentWarningCount = psychic.warningCount || 0;
    const warningNumber = currentWarningCount + 1;
    
    // Create warning record
    const warning = new Warning({
      psychicId,
      userId: targetUserId,
      chatSessionId: sessionId,
      messageId: testMessage._id,
      warningType: warningType || 'phone',
      detectedContent: testMessage.content,
      fullMessage: testMessage.content,
      warningNumber,
      status: 'active',
      createdAt: new Date(),
      targetModel: 'Psychic',
      ledToDeactivation: warningNumber >= 3
    });
    
    await warning.save();
    
    // Update psychic
    const updateObj = {
      $inc: { warningCount: 1 },
      $push: {
        warnings: {
          warningId: warning._id,
          type: warning.warningType,
          message: `Warning #${warningNumber}: ${warning.warningType} content detected`,
          createdAt: new Date(),
          chatSessionId: sessionId,
          userId: targetUserId,
          content: testMessage.content.substring(0, 100),
          resolved: false
        }
      }
    };
    
    // Deactivate if 3rd warning
    if (warningNumber >= 3) {
      updateObj.$set = {
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: 'warning_limit'
      };
    }
    
    const updatedPsychic = await Psychic.findByIdAndUpdate(
      psychicId,
      updateObj,
      { new: true }
    );
    
    // Also add to user's warnings array
    await User.findByIdAndUpdate(targetUserId, {
      $push: {
        warnings: {
          warningId: warning._id,
          type: warning.warningType,
          message: `Warning issued to psychic`,
          createdAt: new Date(),
          chatSessionId: sessionId,
          psychicId,
          content: testMessage.content.substring(0, 100),
          resolved: false
        }
      }
    });
    
    // Emit socket events if io is available
    if (global.io) {
      const warningData = {
        warningId: warning._id,
        warningType: warning.warningType,
        warningNumber: warning.warningNumber,
        message: getWarningMessage(warningNumber),
        chatSessionId: sessionId,
        timestamp: new Date(),
        deactivated: warningNumber >= 3
      };
      
      // Emit to psychic
      global.io.to(`psychic_${psychicId}`).emit('warning_issued', warningData);
      
      // Emit to user
      global.io.to(`user_${targetUserId}`).emit('warning_issued_to_psychic', {
        ...warningData,
        message: `⚠️ Psychic received warning #${warning.warningNumber} for sharing contact information.`
      });
      
      // Emit to chat room
      global.io.to(`chat_${sessionId}`).emit('warning_in_chat', {
        ...warningData,
        systemMessage: true,
        content: `⚠️ System Warning: Psychic received warning #${warning.warningNumber} for sharing prohibited content.`
      });
      
      // If deactivated, emit additional events
      if (warningNumber >= 3) {
        global.io.to(`psychic_${psychicId}`).emit('account_deactivated', {
          reason: 'warning_limit',
          message: 'Your account has been deactivated due to multiple warnings.',
          deactivatedAt: new Date()
        });
        
        global.io.to(`user_${targetUserId}`).emit('psychic_deactivated', {
          psychicId,
          psychicName: psychic.name,
          message: 'This psychic has been deactivated due to policy violations.',
          chatSessionId: sessionId
        });
        
        global.io.to(`chat_${sessionId}`).emit('session_ended', {
          reason: 'psychic_deactivated',
          message: 'Chat session ended because the psychic was deactivated.'
        });
      }
    }
    
    res.json({
      success: true,
      message: `Warning #${warningNumber} generated successfully for psychic ${psychic.name}`,
      data: {
        warning,
        psychic: {
          id: updatedPsychic._id,
          name: updatedPsychic.name,
          warningCount: updatedPsychic.warningCount,
          isActive: updatedPsychic.isActive,
          deactivatedAt: updatedPsychic.deactivatedAt
        },
        user: targetUserId,
        chatSession: sessionId,
        message: testMessage._id
      }
    });
    
  } catch (error) {
    console.error('Error generating psychic warning:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate warning',
      error: error.message 
    });
  }
};

/**
 * Generate multiple warnings at once (for testing deactivation)
 */
exports.generateMultiplePsychicWarnings = async (req, res) => {
  try {
    const { psychicId, userId, count = 3 } = req.body;
    
    const results = [];
    
    for (let i = 0; i < count; i++) {
      // Create a test message with different content
      const warningTypes = ['email', 'phone', 'link'];
      const type = warningTypes[i % 3];
      
      // Create a test message with appropriate content
      const mongoose = require('mongoose');
      const psychic = await Psychic.findById(psychicId);
      
      if (!psychic) {
        return res.status(404).json({ success: false, message: `Psychic not found at iteration ${i}` });
      }
      
      // Get or create a test user if not provided
      let targetUserId = userId;
      if (!targetUserId) {
        const testUser = await User.findOne({ email: 'test@example.com' });
        if (testUser) {
          targetUserId = testUser._id;
        } else {
          const bcrypt = require('bcryptjs');
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('Test@123', salt);
          
          const newUser = new User({
            firstName: 'Test',
            lastName: 'User',
            username: 'testuser',
            email: 'test@example.com',
            password: hashedPassword,
            isActive: true
          });
          await newUser.save();
          targetUserId = newUser._id;
        }
      }
      
      // Get or create a test chat session
      let sessionId;
      const existingSession = await HumanChatSession.findOne({
        user: targetUserId,
        psychic: psychicId,
        status: 'active'
      });
      
      if (existingSession) {
        sessionId = existingSession._id;
      } else {
        const newSession = new HumanChatSession({
          user: targetUserId,
          psychic: psychicId,
          status: 'active',
          unreadCounts: { user: 0, psychic: 0 },
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await newSession.save();
        sessionId = newSession._id;
      }
      
      // Create test content based on type
      let testContent = '';
      switch(type) {
        case 'email':
          testContent = `Contact me at test${i}@example.com`;
          break;
        case 'phone':
          testContent = `Call me at 123-456-${7890 + i}`;
          break;
        case 'link':
          testContent = `Check out https://example${i}.com`;
          break;
        default:
          testContent = `Test message ${i} with contact info`;
      }
      
      const MessageBox = require('../models/HumanChat/MessageBox');
      const testMessage = new MessageBox({
        chatSession: sessionId,
        sender: psychicId,
        senderModel: 'Psychic',
        receiver: targetUserId,
        receiverModel: 'User',
        content: testContent,
        messageType: 'text',
        status: 'sent',
        containsProhibitedContent: true,
        prohibitedContentTypes: [type],
        isBlocked: true,
        redactedContent: `[${type.toUpperCase()} REDACTED]`,
        createdAt: new Date()
      });
      await testMessage.save();
      
      // Get current warning count
      const currentWarningCount = psychic.warningCount || 0;
      const warningNumber = currentWarningCount + 1;
      
      // Create warning record
      const warning = new Warning({
        psychicId,
        userId: targetUserId,
        chatSessionId: sessionId,
        messageId: testMessage._id,
        warningType: type,
        detectedContent: testMessage.content,
        fullMessage: testMessage.content,
        warningNumber,
        status: 'active',
        createdAt: new Date(),
        targetModel: 'Psychic',
        ledToDeactivation: warningNumber >= 3
      });
      
      await warning.save();
      
      // Update psychic
      const updateObj = {
        $inc: { warningCount: 1 },
        $push: {
          warnings: {
            warningId: warning._id,
            type: warning.warningType,
            message: `Warning #${warningNumber}: ${warning.warningType} content detected`,
            createdAt: new Date(),
            chatSessionId: sessionId,
            userId: targetUserId,
            content: testMessage.content.substring(0, 100),
            resolved: false
          }
        }
      };
      
      // Deactivate if 3rd warning
      if (warningNumber >= 3) {
        updateObj.$set = {
          isActive: false,
          deactivatedAt: new Date(),
          deactivationReason: 'warning_limit'
        };
      }
      
      const updatedPsychic = await Psychic.findByIdAndUpdate(
        psychicId,
        updateObj,
        { new: true }
      );
      
      // Update psychic variable for next iteration
      psychic.warningCount = updatedPsychic.warningCount;
      psychic.isActive = updatedPsychic.isActive;
      
      results.push({
        iteration: i + 1,
        warningNumber,
        type,
        warningId: warning._id,
        deactivated: warningNumber >= 3
      });
      
      // Small delay to avoid race conditions
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Get final psychic status
    const finalPsychic = await Psychic.findById(psychicId).select('name email warningCount isActive deactivatedAt warnings');
    
    res.json({
      success: true,
      message: `Generated ${count} warnings for psychic`,
      results,
      finalStatus: {
        psychic: {
          id: finalPsychic._id,
          name: finalPsychic.name,
          email: finalPsychic.email,
          warningCount: finalPsychic.warningCount,
          isActive: finalPsychic.isActive,
          deactivatedAt: finalPsychic.deactivatedAt
        },
        totalWarnings: finalPsychic.warnings.length
      }
    });
    
  } catch (error) {
    console.error('Error generating multiple warnings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate multiple warnings',
      error: error.message 
    });
  }
};

/**
 * Reset psychic warnings (admin only)
 */
exports.resetPsychicWarnings = async (req, res) => {
  try {
    const { psychicId } = req.params;
    const adminId = req.user._id;
    
    // Update all active warnings to expired
    await Warning.updateMany(
      { psychicId, targetModel: 'Psychic', status: 'active' },
      { 
        status: 'expired', 
        reviewedBy: adminId, 
        reviewedAt: new Date(),
        adminNotes: 'Reset by admin'
      }
    );
    
    // Reset psychic warning count and reactivate
    const updatedPsychic = await Psychic.findByIdAndUpdate(
      psychicId,
      {
        $set: {
          warningCount: 0,
          isActive: true,
          deactivatedAt: null,
          deactivationReason: null,
          warnings: [] // Clear warnings array
        }
      },
      { new: true }
    );
    
    if (!updatedPsychic) {
      return res.status(404).json({ success: false, message: 'Psychic not found' });
    }
    
    // Notify psychic via socket if connected
    if (global.io) {
      global.io.to(`psychic_${psychicId}`).emit('warnings_reset', {
        message: 'Your warnings have been reset by an administrator.',
        timestamp: new Date()
      });
      
      global.io.to(`psychic_${psychicId}`).emit('account_reactivated', {
        message: 'Your account has been reactivated.',
        reactivatedAt: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Psychic warnings reset successfully',
      psychic: {
        id: updatedPsychic._id,
        name: updatedPsychic.name,
        warningCount: updatedPsychic.warningCount,
        isActive: updatedPsychic.isActive
      }
    });
    
  } catch (error) {
    console.error('Error resetting psychic warnings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get all psychics with warning status (admin)
 */
exports.getAllPsychicsWithWarnings = async (req, res) => {
  try {
    const psychics = await Psychic.find({})
      .select('name email warningCount isActive deactivatedAt createdAt')
      .sort({ createdAt: -1 });
    
    // Get active warning counts for each psychic
    const psychicsWithWarnings = await Promise.all(
      psychics.map(async (psychic) => {
        const activeWarnings = await Warning.countDocuments({
          psychicId: psychic._id,
          targetModel: 'Psychic',
          status: 'active'
        });
        
        return {
          ...psychic.toObject(),
          activeWarningCount: activeWarnings,
          warningLevel: activeWarnings === 0 ? 'clean' :
                       activeWarnings === 1 ? 'first_warning' :
                       activeWarnings === 2 ? 'second_warning' : 'critical'
        };
      })
    );
    
    res.json({
      success: true,
      count: psychicsWithWarnings.length,
      psychics: psychicsWithWarnings
    });
    
  } catch (error) {
    console.error('Error fetching psychics with warnings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get detailed warning history for a specific psychic (admin)
 */
exports.getPsychicWarningDetails = async (req, res) => {
  try {
    const { psychicId } = req.params;
    
    const psychic = await Psychic.findById(psychicId)
      .select('name email warningCount isActive deactivatedAt deactivationReason warnings');
    
    if (!psychic) {
      return res.status(404).json({ success: false, message: 'Psychic not found' });
    }
    
    const warnings = await Warning.find({ 
      psychicId, 
      targetModel: 'Psychic' 
    })
    .populate('userId', 'username firstName lastName email')
    .populate('chatSessionId', 'createdAt')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      psychic: {
        id: psychic._id,
        name: psychic.name,
        email: psychic.email,
        warningCount: psychic.warningCount,
        isActive: psychic.isActive,
        deactivatedAt: psychic.deactivatedAt,
        deactivationReason: psychic.deactivationReason,
        warningsArray: psychic.warnings
      },
      warnings: warnings.map(w => ({
        id: w._id,
        type: w.warningType,
        number: w.warningNumber,
        status: w.status,
        createdAt: w.createdAt,
        user: w.userId,
        chatSession: w.chatSessionId,
        detectedContent: w.detectedContent,
        ledToDeactivation: w.ledToDeactivation
      }))
    });
    
  } catch (error) {
    console.error('Error fetching psychic warning details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
// controllers/messageController.js - COMPLETE FIXED VERSION

// controllers/messageController.js - FIXED sendMessage function
// Debug endpoint to test detection
exports.testDetection = async (req, res) => {
  try {
    const { content } = req.body;
    
    console.log('🔍 Testing detection for:', content);
    
    const detectedTypes = detectProhibitedContent(content);
    const containsProhibited = detectedTypes.length > 0;
    const redactedContent = containsProhibited ? generateRedactedContent(content, detectedTypes) : content;
    
    res.json({
      success: true,
      content,
      detectedTypes,
      containsProhibited,
      redactedContent,
      shouldBlock: shouldBlockMessage(detectedTypes)
    });
  } catch (error) {
    console.error('Test detection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// MAIN: Send message with content detection - COMPLETE FIXED VERSION
exports.sendMessage = async (req, res) => {
  try {
    const { chatSessionId, content, messageType, mediaUrl, replyTo, psychicId } = req.body;
    const senderId = req.user._id;
    const senderModel = req.user.role || 'User';
    
    console.log(`📝 sendMessage called:`, {
      chatSessionId,
      psychicId,
      senderId,
      senderModel,
      contentLength: content?.length
    });

    // STEP 0: Check if sender is active
    const senderCheck = await checkSenderActive(senderId, senderModel);
    if (!senderCheck.active) {
      if (senderCheck.reason === 'deactivated') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. You cannot send messages.',
          deactivated: true,
          deactivatedAt: senderCheck.deactivatedAt
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Sender account not found'
      });
    }

    let chatSession;
    let isNewSession = false;

    // STEP 1: GET OR CREATE CHAT SESSION
    if (!chatSessionId && psychicId && senderModel === 'User') {
      const result = await getOrCreateChatSession(senderId, psychicId, senderModel);
      chatSession = result.session;
      isNewSession = result.isNew;
    } else {
      chatSession = await HumanChatSession.findById(chatSessionId)
        .populate('user', 'firstName lastName username image email isActive warningCount')
        .populate('psychic', 'name email image ratePerMin bio isActive warningCount');
      
      if (!chatSession) {
        console.error('❌ Chat session not found:', chatSessionId);
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }
    }

    // Verify sender is a participant
    const isSender =
      (senderModel === 'User' && chatSession.user._id.toString() === senderId.toString()) ||
      (senderModel === 'Psychic' && chatSession.psychic._id.toString() === senderId.toString());
    
    if (!isSender) {
      console.error('❌ Sender not authorized:', { senderId, senderModel });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send message in this chat'
      });
    }

    console.log(`✅ Sender authorized for session: ${chatSession._id}`);

    // STEP 2: DETECT PROHIBITED CONTENT
    let detectedTypes = [];
    let containsProhibited = false;
    let shouldBlock = false;
    let redactedContent = content;
    let warningIssued = false;
    let warningResult = null;

    // Only check text messages
    if (messageType === 'text' && content) {
      detectedTypes = detectProhibitedContent(content);
      containsProhibited = detectedTypes.length > 0;
      
      if (containsProhibited) {
        redactedContent = generateRedactedContent(content, detectedTypes);
        shouldBlock = shouldBlockMessage(detectedTypes);
      }
    }

    // STEP 3: CREATE MESSAGE (ALWAYS CREATE)
    const receiverId = senderModel === 'User' ? chatSession.psychic._id : chatSession.user._id;
    const receiverModel = senderModel === 'User' ? 'Psychic' : 'User';
    
    const message = new MessageBox({
      chatSession: chatSession._id,
      sender: senderId,
      senderModel,
      receiver: receiverId,
      receiverModel,
      content: content || '',
      messageType: messageType || 'text',
      mediaUrl,
      replyTo,
      status: shouldBlock ? 'blocked' : 'sent',
      containsProhibitedContent: containsProhibited,
      prohibitedContentTypes: detectedTypes,
      isBlocked: shouldBlock,
      redactedContent: shouldBlock ? redactedContent : null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await message.save();
    console.log(`✅ Message saved: ${message._id}`);

    // STEP 4: ISSUE WARNING IF PROHIBITED CONTENT DETECTED
    // CRITICAL: Check senderModel correctly
    if (containsProhibited) {
      console.log(`⚠️ Prohibited content detected from ${senderModel}: ${detectedTypes.join(', ')}`);
      
      if (senderModel === 'Psychic') {
        // Psychic sent prohibited content - issue warning to psychic
        console.log(`🔴 PSYCHIC ${senderId} sent prohibited content - ISSUING WARNING TO PSYCHIC`);
        
        warningResult = await issueWarningToPsychic(
          senderId,  // psychicId
          chatSession.user._id,  // userId
          chatSession._id,
          message._id,
          detectedTypes,
          content
        );
        
        if (warningResult) {
          warningIssued = true;
          message.warningId = warningResult.warning._id;
          message.warningIssuedAt = new Date();
          message.warningNumber = warningResult.warningNumber;
          await message.save();
          
          await sendPsychicWarningAlert(
            senderId,
            chatSession.user._id,
            chatSession._id,
            warningResult.warning,
            warningResult.deactivated
          );
          
          console.log(`⚠️ Warning #${warningResult.warningNumber} issued to PSYCHIC`);
        }
      } else if (senderModel === 'User') {
        // User sent prohibited content - issue warning to USER
        console.log(`🔴 USER ${senderId} sent prohibited content - ISSUING WARNING TO USER`);
        
        warningResult = await issueWarningToUser(
          senderId,  // userId
          chatSession.psychic._id,  // psychicId
          chatSession._id,
          message._id,
          detectedTypes,
          content
        );
        
        if (warningResult) {
          warningIssued = true;
          
          message.warningId = warningResult.warning._id;
          message.warningIssuedAt = new Date();
          message.warningNumber = warningResult.warningNumber;
          await message.save();
          
          await sendUserWarningAlert(
            senderId,
            chatSession.psychic._id,
            chatSession._id,
            warningResult.warning,
            warningResult.deactivated
          );
          
          console.log(`⚠️ Warning #${warningResult.warningNumber} issued to USER`);
          console.log(`📊 User warning count: ${warningResult.warningNumber}, Deactivated: ${warningResult.deactivated}`);
        }
      }
    }

    // Populate message for response
    const populatedMessage = await MessageBox.findById(message._id)
      .populate('sender', 'name username email image isActive warningCount')
      .populate('receiver', 'name username email image isActive warningCount');

    // STEP 5: UPDATE CHAT SESSION
    chatSession.lastMessage = message._id;
    chatSession.lastMessageAt = new Date();
    
    if (!shouldBlock) {
      if (senderModel === 'User') {
        chatSession.unreadCounts.psychic = (chatSession.unreadCounts.psychic || 0) + 1;
      } else {
        chatSession.unreadCounts.user = (chatSession.unreadCounts.user || 0) + 1;
      }
    }
    
    chatSession.updatedAt = new Date();
    await chatSession.save();

    // STEP 6: EMIT SOCKET EVENTS
    if (global.io) {
      const chatRoom = `chat_${chatSession._id}`;
      const senderName = senderModel === 'User'
        ? `${chatSession.user.firstName} ${chatSession.user.lastName || ''}`.trim()
        : chatSession.psychic.name;
      
      const socketContent = shouldBlock ? redactedContent : content;
      
      const socketMessageData = {
        _id: message._id,
        chatSession: chatSession._id,
        sender: {
          _id: senderId,
          name: senderName,
          model: senderModel,
          isActive: senderModel === 'User' ? chatSession.user.isActive : chatSession.psychic.isActive
        },
        senderModel,
        content: socketContent,
        messageType: messageType || 'text',
        status: shouldBlock ? 'blocked' : 'sent',
        createdAt: message.createdAt,
        isBlocked: shouldBlock,
        containsProhibitedContent: containsProhibited,
        prohibitedContentTypes: detectedTypes,
        warningIssued: warningIssued,
        warningNumber: warningResult?.warningNumber,
        warningTarget: warningResult?.targetType,
        redactedContent: redactedContent
      };

      emitToSocket(chatRoom, 'new_message', socketMessageData);

      const receiverRoom = receiverModel === 'User' ? `user_${receiverId}` : `psychic_${receiverId}`;
      emitToSocket(receiverRoom, 'new_message', socketMessageData);
    }

    // STEP 7: PREPARE RESPONSE
    const response = {
      success: true,
      message: populatedMessage,
      chatSession: {
        _id: chatSession._id,
        status: chatSession.status,
        unreadCounts: chatSession.unreadCounts,
        lastMessageAt: chatSession.lastMessageAt
      }
    };

    if (warningIssued) {
      response.warning = {
        issued: true,
        warningNumber: warningResult?.warningNumber,
        deactivated: warningResult?.deactivated,
        type: detectedTypes[0],
        targetType: warningResult?.targetType
      };
    }

    if (shouldBlock) {
      response.blocked = true;
      response.blockReason = `Message contained prohibited content: ${detectedTypes.join(', ')}`;
      response.redactedContent = redactedContent;
    }

    if (warningResult?.deactivated && senderModel === 'User') {
      response.userDeactivated = true;
      response.deactivationMessage = 'Your account has been deactivated due to multiple warnings.';
    }

    if (isNewSession) {
      response.newSession = true;
      response.fullChatSession = chatSession;
    }

    console.log(`🎉 Message processed: ${message._id}`);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(200).json({
      success: false,
      message: error.message || 'Failed to send message',
      temporaryError: true
    });
  }
};
exports.getPsychicStatusForUser = async (req, res) => {
  try {
    const { psychicId } = req.params;
    
    const psychic = await Psychic.findById(psychicId)
      .select('isActive status lastSeen lastActive name image rating warningCount deactivatedAt');
    
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    // Get active warning count
    const warningCount = await Warning.countDocuments({
      psychicId,
      status: 'active'
    });

    res.status(200).json({
      success: true,
      isActive: psychic.isActive,
      status: psychic.status,
      lastSeen: psychic.lastSeen,
      lastActive: psychic.lastActive,
      name: psychic.name,
      image: psychic.image,
      rating: psychic.rating,
      hasWarnings: warningCount > 0,
      warningCount: warningCount,
      deactivatedAt: psychic.deactivatedAt
    });

  } catch (error) {
    console.error('Error in getPsychicStatusForUser:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get status for multiple psychics (for users)
 */
exports.getMultiplePsychicStatusForUser = async (req, res) => {
  try {
    const { psychicIds } = req.body;
    
    if (!psychicIds || !Array.isArray(psychicIds)) {
      return res.status(400).json({
        success: false,
        message: 'psychicIds array is required'
      });
    }

    const psychics = await Psychic.find({
      _id: { $in: psychicIds }
    }).select('_id isActive status lastSeen lastActive name image rating warningCount deactivatedAt');

    // Get warning counts for each psychic
    const warnings = await Warning.aggregate([
      { $match: { psychicId: { $in: psychicIds }, status: 'active' } },
      { $group: { _id: '$psychicId', count: { $sum: 1 } } }
    ]);

    const warningMap = {};
    warnings.forEach(w => {
      warningMap[w._id.toString()] = w.count;
    });

    const statuses = {};
    psychics.forEach(psychic => {
      statuses[psychic._id.toString()] = {
        isActive: psychic.isActive,
        status: psychic.status,
        lastSeen: psychic.lastSeen,
        lastActive: psychic.lastActive,
        name: psychic.name,
        image: psychic.image,
        rating: psychic.rating,
        hasWarnings: warningMap[psychic._id.toString()] > 0,
        warningCount: warningMap[psychic._id.toString()] || 0,
        deactivatedAt: psychic.deactivatedAt
      };
    });

    res.status(200).json({
      success: true,
      statuses
    });

  } catch (error) {
    console.error('Error in getMultiplePsychicStatusForUser:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
// Add this debug endpoint to test psychic warnings directly
exports.testPsychicWarning = async (req, res) => {
  try {
    const { psychicId, userId, chatSessionId } = req.body;
    
    if (!psychicId) {
      return res.status(400).json({ success: false, message: 'Psychic ID required' });
    }
    
    // Create a test message with prohibited content
    const testContent = "Contact me at test@example.com or 123-456-7890";
    
    const detectedTypes = detectProhibitedContent(testContent);
    
    if (detectedTypes.length === 0) {
      return res.status(400).json({ success: false, message: 'Test content not detected as prohibited' });
    }
    
    // Issue warning to psychic
    const warningResult = await issueWarningToPsychic(
      psychicId,
      userId || new mongoose.Types.ObjectId(),
      chatSessionId || new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      detectedTypes,
      testContent
    );
    
    if (!warningResult) {
      return res.status(500).json({ success: false, message: 'Failed to issue warning' });
    }
    
    // Get updated psychic
    const updatedPsychic = await Psychic.findById(psychicId)
      .select('name email warningCount isActive deactivatedAt warnings');
    
    res.json({
      success: true,
      message: 'Test warning issued successfully',
      warning: {
        id: warningResult.warning._id,
        number: warningResult.warningNumber,
        deactivated: warningResult.deactivated,
        types: detectedTypes
      },
      psychic: updatedPsychic
    });
    
  } catch (error) {
    console.error('Test psychic warning error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get messages for a chat session
exports.getMessages = async (req, res) => {
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
    }).populate('user', 'isActive warningCount')
      .populate('psychic', 'isActive warningCount');

    if (!chatSession) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await MessageBox.find({
      chatSession: chatSessionId,
      $or: [
        { isDeleted: false },
        { 
          isDeleted: true,
          deletedFor: { 
            $not: { 
              $elemMatch: { 
                userId: userId,
                userModel: userModel 
              } 
            } 
          }
        }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name username email image isActive')
    .populate('receiver', 'name username email image isActive')
    .populate({
      path: 'replyTo',
      select: 'content sender senderModel createdAt isBlocked containsProhibitedContent'
    });

    // Transform messages for frontend
    const transformedMessages = messages.map(msg => {
      const msgObj = msg.toObject();
      
      // CRITICAL: For blocked messages, show redacted content to receiver
      if (msg.isBlocked && msg.receiver.toString() === userId.toString()) {
        msgObj.content = msg.redactedContent || '[Message blocked - contains prohibited content]';
        msgObj.isBlockedForUser = true;
        msgObj.isBlocked = true;
        msgObj.blockReason = `Message contained prohibited content: ${msg.prohibitedContentTypes?.join(', ')}`;
      }
      
      // Add warning info
      if (msg.warningId) {
        msgObj.warningIssued = true;
        msgObj.warningNumber = msg.warningNumber;
      }
      
      return msgObj;
    });

    if (userModel === 'User') {
      await MessageBox.updateMany(
        {
          chatSession: chatSessionId,
          receiver: userId,
          receiverModel: 'User',
          isRead: false,
          isBlocked: false
        },
        { 
          isRead: true,
          readAt: Date.now(),
          status: 'read'
        }
      );
      
      chatSession.unreadCounts.user = 0;
    } else {
      await MessageBox.updateMany(
        {
          chatSession: chatSessionId,
          receiver: userId,
          receiverModel: 'Psychic',
          isRead: false,
          isBlocked: false
        },
        { 
          isRead: true,
          readAt: Date.now(),
          status: 'read'
        }
      );
      
      chatSession.unreadCounts.psychic = 0;
    }
    
    await chatSession.save();

    if (global.io) {
      const roomName = `chat_${chatSessionId}`;
      emitToSocket(roomName, 'messages_read', {
        chatSessionId,
        readerId: userId,
        readerModel: userModel,
        timestamp: Date.now()
      });
    }

    const warnings = await Warning.find({
      chatSessionId,
      status: 'active'
    }).sort({ createdAt: -1 }).limit(5);

    res.status(200).json({
      success: true,
      messages: transformedMessages.reverse(),
      page,
      limit,
      total: await MessageBox.countDocuments({ chatSession: chatSessionId }),
      warnings: warnings.map(w => ({
        id: w._id,
        type: w.warningType,
        number: w.warningNumber,
        createdAt: w.createdAt,
        deactivated: w.ledToDeactivation,
        targetModel: w.targetModel
      })),
      psychicDeactivated: chatSession.psychic && !chatSession.psychic.isActive,
      userDeactivated: chatSession.user && !chatSession.user.isActive
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// React to a message with emoji
exports.reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    const message = await MessageBox.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const chatSession = await HumanChatSession.findById(message.chatSession);
    if (!chatSession) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }

    const isParticipant = 
      (userModel === 'User' && chatSession.user.toString() === userId.toString()) ||
      (userModel === 'Psychic' && chatSession.psychic.toString() === userId.toString());
    
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    message.reactions = message.reactions.filter(
      reaction => !(reaction.userId.toString() === userId.toString() && reaction.userModel === userModel)
    );

    message.reactions.push({
      userId,
      userModel,
      emoji,
      reactedAt: Date.now()
    });

    await message.save();

    if (global.io) {
      const roomName = `chat_${message.chatSession}`;
      emitToSocket(roomName, 'message_reaction', {
        messageId: message._id,
        reaction: {
          userId,
          userModel,
          emoji
        }
      });
    }

    res.status(200).json({
      success: true,
      reactions: message.reactions
    });

  } catch (error) {
    console.error('React to message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a message (soft delete)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    const message = await MessageBox.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const isSender = message.sender.toString() === userId.toString() && message.senderModel === userModel;
    
    if (!isSender) {
      return res.status(403).json({ success: false, message: 'Only sender can delete message' });
    }

    if (req.query.for === 'me') {
      message.deletedFor.push({
        userId,
        userModel
      });
    } else {
      message.isDeleted = true;
    }

    await message.save();

    if (global.io) {
      const roomName = `chat_${message.chatSession}`;
      emitToSocket(roomName, 'message_deleted', {
        messageId: message._id,
        deletedForEveryone: !(req.query.for === 'me')
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { chatSessionId } = req.params;
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    const chatSession = await HumanChatSession.findById(chatSessionId);
    if (!chatSession) {
      return res.status(404).json({ 
        success: false, 
        message: 'Chat session not found' 
      });
    }

    const hasAccess = userModel === 'User' 
      ? chatSession.user.toString() === userId.toString()
      : chatSession.psychic.toString() === userId.toString();
    
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const updateQuery = {
      chatSession: chatSessionId,
      receiver: userId,
      receiverModel: userModel,
      isRead: false
    };

    const updateData = {
      isRead: true,
      readAt: Date.now(),
      status: 'read'
    };

    const result = await MessageBox.updateMany(updateQuery, updateData);

    if (userModel === 'User') {
      chatSession.unreadCounts.user = 0;
    } else {
      chatSession.unreadCounts.psychic = 0;
    }
    
    await chatSession.save();

    if (global.io) {
      const roomName = `chat_${chatSessionId}`;
      emitToSocket(roomName, 'messages_read', {
        chatSessionId,
        readerId: userId,
        readerModel: userModel,
        timestamp: Date.now()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      updatedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    const chatSessions = await HumanChatSession.find(
      userModel === 'User' 
        ? { user: userId }
        : { psychic: userId }
    ).select('unreadCounts');

    const totalUnread = chatSessions.reduce((total, session) => {
      return total + (userModel === 'User' ? session.unreadCounts.user : session.unreadCounts.psychic);
    }, 0);

    res.status(200).json({
      success: true,
      totalUnread,
      byChat: chatSessions.map(session => ({
        chatSessionId: session._id,
        unreadCount: userModel === 'User' ? session.unreadCounts.user : session.unreadCounts.psychic
      }))
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get warning history for a psychic
// Get warning history for a psychic (already in your code)
exports.getPsychicWarnings = async (req, res) => {
  try {
    const psychicId = req.user._id;
    
    const warnings = await Warning.find({ 
      psychicId,
      targetModel: 'Psychic' 
    })
      .populate('userId', 'username email image')
      .populate('chatSessionId', 'createdAt')
      .sort({ createdAt: -1 });
    
    const activeCount = warnings.filter(w => w.status === 'active').length;
    
    res.json({
      success: true,
      warnings,
      summary: {
        total: warnings.length,
        active: activeCount,
        remainingBeforeDeactivation: Math.max(0, 3 - activeCount),
        deactivated: activeCount >= 3
      }
    });
    
  } catch (error) {
    console.error('Get psychic warnings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check if psychic is active


// Get warning history for a user
exports.getUserWarnings = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const warnings = await Warning.find({ 
      userId,
      targetModel: 'User' 
    })
      .populate('psychicId', 'name email image')
      .populate('chatSessionId', 'createdAt')
      .sort({ createdAt: -1 });
    
    const activeCount = warnings.filter(w => w.status === 'active').length;
    
    // Get user's current status
    const user = await User.findById(userId).select('warningCount isActive deactivatedAt');
    
    res.json({
      success: true,
      warnings,
      summary: {
        total: warnings.length,
        active: activeCount,
        remainingBeforeDeactivation: Math.max(0, 3 - activeCount),
        deactivated: !user?.isActive || false
      },
      user: {
        warningCount: user?.warningCount || 0,
        isActive: user?.isActive !== false,
        deactivatedAt: user?.deactivatedAt
      }
    });
    
  } catch (error) {
    console.error('Get user warnings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check if psychic is active
exports.checkPsychicStatus = async (req, res) => {
  try {
    const { psychicId } = req.params;
    
    const psychic = await Psychic.findById(psychicId).select('isActive warningCount deactivatedAt');
    
    if (!psychic) {
      return res.status(404).json({ success: false, message: 'Psychic not found' });
    }
    
    res.json({
      success: true,
      isActive: psychic.isActive,
      warningCount: psychic.warningCount,
      deactivatedAt: psychic.deactivatedAt,
      remainingWarnings: psychic.isActive ? Math.max(0, 3 - psychic.warningCount) : 0
    });
    
  } catch (error) {
    console.error('Check psychic status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check if user is active
exports.checkUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('isActive warningCount deactivatedAt');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const activeWarnings = await Warning.countDocuments({
      userId,
      targetModel: 'User',
      status: 'active'
    });
    
    res.json({
      success: true,
      isActive: user.isActive,
      warningCount: activeWarnings,
      totalWarnings: user.warningCount || 0,
      deactivatedAt: user.deactivatedAt,
      remainingWarnings: user.isActive ? Math.max(0, 3 - activeWarnings) : 0
    });
    
  } catch (error) {
    console.error('Check user status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get specific warning details
exports.getWarningDetails = async (req, res) => {
  try {
    const { warningId } = req.params;
    const userId = req.user._id;
    
    const warning = await Warning.findOne({
      _id: warningId,
      userId,
      targetModel: 'User'
    }).populate('psychicId', 'name email image');
    
    if (!warning) {
      return res.status(404).json({ success: false, message: 'Warning not found' });
    }
    
    res.json({
      success: true,
      warning
    });
    
  } catch (error) {
    console.error('Get warning details error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin function to reactivate psychic
exports.reactivatePsychic = async (req, res) => {
  try {
    const { psychicId } = req.params;
    const adminId = req.user._id;
    
    const psychic = await Psychic.findById(psychicId);
    
    if (!psychic) {
      return res.status(404).json({ success: false, message: 'Psychic not found' });
    }
    
    psychic.isActive = true;
    psychic.deactivatedAt = null;
    psychic.deactivationReason = null;
    
    await psychic.save();
    
    await Warning.updateMany(
      { psychicId, targetModel: 'Psychic', status: 'active' },
      { status: 'expired', reviewedBy: adminId, reviewedAt: new Date() }
    );
    
    if (global.io) {
      global.io.to(`psychic_${psychicId}`).emit('account_reactivated', {
        message: 'Your account has been reactivated by admin.',
        reactivatedAt: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Psychic reactivated successfully'
    });
    
  } catch (error) {
    console.error('Reactivate psychic error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin function to reactivate user
exports.reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user._id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.isActive = true;
    user.deactivatedAt = null;
    user.deactivationReason = null;
    
    await user.save();
    
    await Warning.updateMany(
      { userId, targetModel: 'User', status: 'active' },
      { status: 'expired', reviewedBy: adminId, reviewedAt: new Date() }
    );
    
    if (global.io) {
      global.io.to(`user_${userId}`).emit('account_reactivated', {
        message: 'Your account has been reactivated by admin.',
        reactivatedAt: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'User reactivated successfully'
    });
    
  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get warning statistics for admin
exports.getWarningStats = async (req, res) => {
  try {
    const totalWarnings = await Warning.countDocuments();
    const activeWarnings = await Warning.countDocuments({ status: 'active' });
    const deactivatedPsychics = await Psychic.countDocuments({ 
      isActive: false, 
      deactivationReason: 'warning_limit' 
    });
    const deactivatedUsers = await User.countDocuments({ 
      isActive: false, 
      deactivationReason: 'warning_limit' 
    });
    
    const warningsByType = await Warning.aggregate([
      { $group: { _id: '$warningType', count: { $sum: 1 } } }
    ]);
    
    const warningsByTarget = await Warning.aggregate([
      { $group: { _id: '$targetModel', count: { $sum: 1 } } }
    ]);
    
    const recentWarnings = await Warning.find()
      .populate('psychicId', 'name email')
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      success: true,
      stats: {
        total: totalWarnings,
        active: activeWarnings,
        deactivatedPsychics,
        deactivatedUsers,
        byType: warningsByType,
        byTarget: warningsByTarget
      },
      recentWarnings
    });
    
  } catch (error) {
    console.error('Get warning stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Dismiss/expire a warning (admin)
exports.dismissWarning = async (req, res) => {
  try {
    const { warningId } = req.params;
    const adminId = req.user._id;
    
    const warning = await Warning.findById(warningId);
    if (!warning) {
      return res.status(404).json({ success: false, message: 'Warning not found' });
    }
    
    warning.status = 'expired';
    warning.reviewedBy = adminId;
    warning.reviewedAt = new Date();
    warning.adminNotes = req.body.notes || 'Dismissed by admin';
    
    await warning.save();
    
    const activeCount = await Warning.countDocuments({
      [warning.targetModel === 'Psychic' ? 'psychicId' : 'userId']: 
        warning.targetModel === 'Psychic' ? warning.psychicId : warning.userId,
      status: 'active'
    });
    
    if (warning.targetModel === 'Psychic') {
      const psychic = await Psychic.findById(warning.psychicId);
      if (psychic && activeCount < 3 && !psychic.isActive) {
        psychic.isActive = true;
        psychic.deactivatedAt = null;
        await psychic.save();
        
        if (global.io) {
          global.io.to(`psychic_${warning.psychicId}`).emit('account_reactivated', {
            message: 'Your account has been reactivated due to warning expiration.',
            reactivatedAt: new Date()
          });
        }
      }
    } else {
      const user = await User.findById(warning.userId);
      if (user && activeCount < 3 && !user.isActive) {
        user.isActive = true;
        user.deactivatedAt = null;
        await user.save();
        
        if (global.io) {
          global.io.to(`user_${warning.userId}`).emit('account_reactivated', {
            message: 'Your account has been reactivated due to warning expiration.',
            reactivatedAt: new Date()
          });
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Warning dismissed successfully'
    });
    
  } catch (error) {
    console.error('Dismiss warning error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};