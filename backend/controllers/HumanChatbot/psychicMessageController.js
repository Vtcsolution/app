// controllers/psychicMessageController.js
const HumanChatSession = require('../../models/HumanChat/HumanChatSession');
const User = require('../../models/User');
const Psychic = require('../../models/HumanChat/Psychic');
const MessageBox = require('../../models/HumanChat/MessageBox');
const Warning = require('../../models/HumanChat/Warning'); // Add this

// Import detection utilities
const { 
  detectProhibitedContent, 
  generateRedactedContent,
  shouldBlockMessage,
  WARNING_TYPES,
  getWarningMessage
} = require('../../utils/detectionUtils');

// Set socket instance
let io;
exports.setSocketIO = (socketIO) => {
  io = socketIO;
  global.io = socketIO; // Set global for consistency
};

// Helper function to emit socket messages
const emitToSocket = (room, event, data, retryCount = 0) => {
  try {
    if (!global.io) {
      console.warn(`⚠️ Socket.io not available for ${event} to ${room}`);
      return false;
    }

    console.log(`📤 Emitting ${event} to ${room}`);
    global.io.to(room).emit(event, data);
    return true;
  } catch (error) {
    console.error(`❌ Failed to emit ${event} to ${room}:`, error);
    return false;
  }
};

// ===== Issue warning to Psychic - Same as in messageController.js =====
const issueWarningToPsychic = async (psychicId, userId, chatSessionId, messageId, detectedTypes, content) => {
  try {
    console.log(`⚠️⚠️⚠️ ISSUING WARNING TO PSYCHIC ${psychicId} for types:`, detectedTypes);
    
    const psychic = await Psychic.findById(psychicId);
    if (!psychic) {
      console.error(`❌ Psychic not found: ${psychicId}`);
      return null;
    }
    
    const currentWarningCount = psychic.warningCount || 0;
    const warningNumber = currentWarningCount + 1;
    
    console.log(`📊 Psychic ${psychic.name} current warnings: ${currentWarningCount}, new warning #${warningNumber}`);
    
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
    
    if (warningNumber >= 3) {
      updateObj.$set = {
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: 'warning_limit'
      };
      console.log(`🔴🔴🔴 PSYCHIC ${psychic.name} (${psychicId}) WILL BE DEACTIVATED due to 3 warnings!`);
    }
    
    const updatedPsychic = await Psychic.findByIdAndUpdate(
      psychicId,
      updateObj,
      { new: true }
    );
    
    if (!updatedPsychic) {
      console.error(`❌ Failed to update psychic ${psychicId}`);
      return null;
    }
    
    console.log(`✅ Psychic record updated: warningCount=${updatedPsychic.warningCount}, isActive=${updatedPsychic.isActive}`);
    
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

// ===== Send warning alert for psychic =====
const sendPsychicWarningAlert = async (psychicId, userId, chatSessionId, warning, deactivated) => {
  if (!global.io) {
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
  
  // Send to psychic's personal room
  global.io.to(`psychic_${psychicId}`).emit('warning_issued', warningData);
  console.log(`📤 Sent warning_issued to psychic_${psychicId}`);
  
  // Send to user
  global.io.to(`user_${userId}`).emit('warning_issued_to_psychic', {
    ...warningData,
    message: `⚠️ Psychic received warning #${warning.warningNumber} for sharing contact information.`
  });
  
  // Send to chat room
  global.io.to(`chat_${chatSessionId}`).emit('warning_in_chat', {
    ...warningData,
    systemMessage: true,
    content: `⚠️ System Warning: Psychic received warning #${warning.warningNumber} for sharing prohibited content.`
  });
  
  if (deactivated) {
    const psychic = await Psychic.findById(psychicId).select('name');
    
    global.io.to(`psychic_${psychicId}`).emit('account_deactivated', {
      reason: 'warning_limit',
      message: 'Your account has been deactivated due to multiple warnings.',
      deactivatedAt: new Date()
    });
    
    global.io.to(`user_${userId}`).emit('psychic_deactivated', {
      psychicId,
      psychicName: psychic?.name || 'Psychic',
      message: 'This psychic has been deactivated due to policy violations.',
      chatSessionId
    });
    
    global.io.to(`chat_${chatSessionId}`).emit('session_ended', {
      reason: 'psychic_deactivated',
      message: 'Chat session ended because the psychic was deactivated.'
    });
  }
};

// ===== Check if sender is active =====
const checkPsychicActive = async (psychicId) => {
  const psychic = await Psychic.findById(psychicId);
  
  if (!psychic) {
    return { active: false, reason: 'not_found' };
  }
  
  if (!psychic.isActive) {
    return { 
      active: false, 
      reason: 'deactivated',
      warningCount: psychic.warningCount,
      deactivatedAt: psychic.deactivatedAt
    };
  }
  
  return { active: true, psychic };
};

// ===== MAIN SEND MESSAGE FUNCTION WITH WARNING SYSTEM =====
exports.sendMessageAsPsychic = async (req, res) => {
  try {
    const { chatSessionId, content, messageType, mediaUrl, replyTo } = req.body;
    const senderId = req.user._id; // Psychic ID

    console.log(`📝 Psychic sendMessage called:`, {
      chatSessionId,
      senderId,
      contentLength: content?.length
    });

    // STEP 0: Check if psychic is active
    const senderCheck = await checkPsychicActive(senderId);
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
        message: 'Psychic account not found'
      });
    }

    // Find chat session
    const chatSession = await HumanChatSession.findById(chatSessionId)
      .populate('user', 'firstName lastName username image email isActive warningCount')
      .populate('psychic', 'name email image isActive warningCount');

    if (!chatSession) {
      return res.status(404).json({ 
        success: false, 
        message: 'Chat session not found' 
      });
    }

    // Verify psychic is the psychic in this chat
    if (chatSession.psychic._id.toString() !== senderId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

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

    // Create message
    const message = new MessageBox({
      chatSession: chatSessionId,
      sender: senderId,
      senderModel: 'Psychic',
      receiver: chatSession.user._id,
      receiverModel: 'User',
      content: content || '',
      messageType: messageType || 'text',
      mediaUrl,
      replyTo,
      status: 'sent',
      containsProhibitedContent: containsProhibited,
      prohibitedContentTypes: detectedTypes,
      isBlocked: shouldBlock,
      redactedContent: shouldBlock ? redactedContent : null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await message.save();

    // STEP 4: ISSUE WARNING IF PROHIBITED CONTENT DETECTED
    if (containsProhibited) {
      console.log(`⚠️ Prohibited content detected from Psychic: ${detectedTypes.join(', ')}`);
      
      // Psychic sent prohibited content - issue warning to psychic
      console.log(`🔴 PSYCHIC ${senderId} sent prohibited content - ISSUING WARNING`);
      
      warningResult = await issueWarningToPsychic(
        senderId, // psychicId
        chatSession.user._id, // userId
        chatSession._id,
        message._id,
        detectedTypes,
        content
      );
      
      if (warningResult) {
        warningIssued = true;
        
        // Update message with warning info
        message.warningId = warningResult.warning._id;
        message.warningIssuedAt = new Date();
        message.warningNumber = warningResult.warningNumber;
        await message.save();
        
        // CRITICAL: Send warning alerts via socket
        console.log(`🔔 Sending psychic warning alert for warning #${warningResult.warningNumber}`);
        await sendPsychicWarningAlert(
          senderId,
          chatSession.user._id,
          chatSession._id,
          warningResult.warning,
          warningResult.deactivated
        );
        
        console.log(`⚠️ Warning #${warningResult.warningNumber} issued to psychic ${senderId}`);
        console.log(`📊 Psychic warning count: ${warningResult.warningNumber}, Deactivated: ${warningResult.deactivated}`);
        
        if (warningResult.deactivated) {
          message.warningLedToDeactivation = true;
          await message.save();
        }
      }
    }

    // Populate message for response
    const populatedMessage = await MessageBox.findById(message._id)
      .populate('sender', 'name email image isActive warningCount')
      .populate('receiver', 'firstName lastName email image isActive warningCount')
      .populate({
        path: 'replyTo',
        select: 'content sender senderModel createdAt'
      });

    // ========== UPDATE CHAT SESSION ==========
    chatSession.lastMessage = message._id;
    chatSession.lastMessageAt = Date.now();
    
    if (!shouldBlock) {
      chatSession.unreadCounts.user += 1; // Increment user's unread count
    }
    
    chatSession.updatedAt = Date.now();
    await chatSession.save();

    // ========== EMIT SOCKET EVENTS ==========
    if (global.io) {
      const senderName = chatSession.psychic.name;
      const displayContent = shouldBlock ? redactedContent : content;
      
      // Prepare socket message data
      const socketMessageData = {
        _id: message._id,
        chatSession: chatSession._id,
        sender: {
          _id: senderId,
          name: senderName,
          email: chatSession.psychic.email,
          image: chatSession.psychic.image,
          model: 'Psychic',
          isActive: chatSession.psychic.isActive
        },
        senderModel: 'Psychic',
        receiver: {
          _id: chatSession.user._id,
          model: 'User'
        },
        receiverModel: 'User',
        content: displayContent,
        messageType: messageType || 'text',
        status: shouldBlock ? 'blocked' : 'sent',
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        isBlocked: shouldBlock,
        containsProhibitedContent: containsProhibited,
        prohibitedContentTypes: detectedTypes,
        warningIssued: warningIssued,
        warningNumber: warningResult?.warningNumber,
        warningTarget: warningResult?.targetType,
        redactedContent: redactedContent,
        blockReason: shouldBlock ? `Message contained prohibited content: ${detectedTypes.join(', ')}` : null,
        warningLedToDeactivation: warningResult?.deactivated || false
      };

      // 1. Emit to chat room
      const chatRoom = `chat_${chatSessionId}`;
      emitToSocket(chatRoom, 'new_message', {
        message: socketMessageData,
        chatSessionId,
        senderId,
        senderRole: 'psychic',
        timestamp: Date.now(),
        isPsychicMessage: true,
        warningIssued
      });

      // 2. Emit to user's personal room
      const userRoom = `user_${chatSession.user._id}`;
      emitToSocket(userRoom, 'new_message', {
        message: socketMessageData,
        chatSessionId,
        senderId,
        senderRole: 'psychic',
        timestamp: Date.now(),
        isPsychicMessage: true,
        warningIssued
      });

      // 3. If message is blocked, send blocked message event
      if (shouldBlock) {
        const blockedData = {
          messageId: message._id,
          chatSessionId: chatSession._id,
          reason: `Message contained prohibited content: ${detectedTypes.join(', ')}`,
          redactedContent: redactedContent,
          senderModel: 'Psychic',
          warningIssued: warningIssued,
          warningNumber: warningResult?.warningNumber,
          warningTarget: warningResult?.targetType,
          deactivated: warningResult?.deactivated || false
        };
        
        emitToSocket(userRoom, 'message_blocked', blockedData);
        emitToSocket(chatRoom, 'message_blocked', blockedData);
      } else {
        // 4. Update unread count for user
        emitToSocket(userRoom, 'unread_count_updated', {
          chatSessionId,
          unreadCount: chatSession.unreadCounts.user
        });
      }
    }

    // Prepare response
    const response = {
      success: true,
      message: populatedMessage,
      warning: warningIssued ? {
        issued: true,
        warningNumber: warningResult?.warningNumber,
        deactivated: warningResult?.deactivated,
        type: detectedTypes[0],
        targetType: warningResult?.targetType
      } : undefined
    };

    if (shouldBlock) {
      response.blocked = true;
      response.blockReason = `Message contained prohibited content: ${detectedTypes.join(', ')}`;
      response.redactedContent = redactedContent;
      response.warningIssued = warningIssued;
      response.warningNumber = warningResult?.warningNumber;
      response.warningTarget = warningResult?.targetType;
    }

    if (warningResult?.deactivated) {
      response.psychicDeactivated = true;
      response.deactivationMessage = 'Psychic account has been deactivated due to multiple warnings.';
    }

    res.status(201).json(response);

  } catch (error) {
    console.error('Send message as psychic error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get messages for psychic - WITH WARNING HANDLING
exports.getMessagesAsPsychic = async (req, res) => {
  try {
    const { chatSessionId } = req.params;
    const psychicId = req.user._id;

    // Verify psychic has access to this chat
    const chatSession = await HumanChatSession.findOne({
      _id: chatSessionId,
      psychic: psychicId
    })
    .populate({
      path: 'user',
      select: 'firstName lastName username email image isActive warningCount'
    });

    if (!chatSession) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get messages
    const messages = await MessageBox.find({
      chatSession: chatSessionId,
      $or: [
        { isDeleted: false },
        { 
          isDeleted: true,
          deletedFor: { 
            $not: { 
              $elemMatch: { 
                userId: psychicId,
                userModel: 'Psychic' 
              } 
            } 
          }
        }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'sender',
      select: 'name email image username isActive warningCount'
    })
    .populate({
      path: 'receiver',
      select: 'firstName lastName username email image isActive warningCount'
    })
    .populate({
      path: 'replyTo',
      select: 'content sender senderModel createdAt isBlocked containsProhibitedContent'
    });

    // Transform messages for frontend
    const formattedMessages = messages.map(message => {
      const messageObj = message.toObject();
      
      // Format sender info
      if (message.sender) {
        if (message.senderModel === 'User') {
          messageObj.sender = {
            ...message.sender,
            name: `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || message.sender.username,
            username: message.sender.username || 'user'
          };
        } else if (message.senderModel === 'Psychic') {
          messageObj.sender = {
            ...message.sender,
            name: message.sender.name || 'Psychic',
            username: message.sender.username || message.sender.name?.toLowerCase()?.replace(/\s+/g, '')
          };
        }
      }
      
      // Format receiver info
      if (message.receiver) {
        messageObj.receiver = {
          ...message.receiver,
          name: message.receiverModel === 'User' 
            ? `${message.receiver.firstName || ''} ${message.receiver.lastName || ''}`.trim() || message.receiver.username
            : message.receiver.name,
          username: message.receiver.username || 'user'
        };
      }
      
      // For blocked messages sent by user, show to psychic
      if (message.isBlocked && message.senderModel === 'User') {
        messageObj.content = message.redactedContent || '[Message blocked - contains prohibited content]';
        messageObj.isBlockedForPsychic = true;
      }
      
      // Add warning info
      if (message.warningId && message.senderModel === 'Psychic') {
        messageObj.warningIssued = true;
        messageObj.warningNumber = message.warningNumber;
      }
      
      return messageObj;
    });

    // Mark psychic's unread messages as read
    await MessageBox.updateMany(
      {
        chatSession: chatSessionId,
        receiver: psychicId,
        receiverModel: 'Psychic',
        isRead: false
      },
      { 
        isRead: true,
        readAt: Date.now(),
        status: 'read'
      }
    );
    
    // Reset psychic's unread count
    chatSession.unreadCounts.psychic = 0;
    await chatSession.save();

    // Get active warnings for this psychic in this chat
    const warnings = await Warning.find({
      chatSessionId,
      psychicId,
      status: 'active'
    }).sort({ createdAt: -1 }).limit(5);

    res.status(200).json({
      success: true,
      messages: formattedMessages.reverse(), // Return in chronological order
      chatSessionInfo: {
        user: chatSession.user,
        psychic: chatSession.psychic
      },
      page,
      limit,
      total: await MessageBox.countDocuments({ chatSession: chatSessionId }),
      warnings: warnings.map(w => ({
        id: w._id,
        type: w.warningType,
        number: w.warningNumber,
        createdAt: w.createdAt,
        deactivated: w.ledToDeactivation
      }))
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Psychic-specific: Get active chat sessions
exports.getPsychicActiveChats = async (req, res) => {
  try {
    const psychicId = req.user._id;

    const chatSessions = await HumanChatSession.find({
      psychic: psychicId,
      status: { $in: ['active', 'waiting'] }
    })
    .populate('user', 'firstName lastName username image email isActive warningCount')
    .populate({
      path: 'lastMessage',
      select: 'content sender senderModel createdAt messageType isBlocked containsProhibitedContent'
    })
    .sort({ lastMessageAt: -1, updatedAt: -1 });

    res.status(200).json({
      success: true,
      chatSessions,
      total: chatSessions.length
    });

  } catch (error) {
    console.error('Get psychic active chats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};



exports.getPsychicWarningStatus = async (req, res) => {
  try {
    const psychicId = req.user._id; // Get from authenticated user

    const psychic = await Psychic.findById(psychicId)
      .select('isActive warningCount deactivatedAt warnings');
    
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    // Get active warnings
    const warnings = await Warning.find({ 
      psychicId, 
      status: 'active' 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      summary: {
        isActive: psychic.isActive,
        warningCount: psychic.warningCount || 0,
        deactivatedAt: psychic.deactivatedAt,
        activeWarnings: warnings.length
      },
      warnings: warnings.map(w => ({
        id: w._id,
        type: w.warningType,
        number: w.warningNumber,
        message: w.message,
        createdAt: w.createdAt,
        acknowledgedAt: w.acknowledgedAt
      }))
    });

  } catch (error) {
    console.error('Error in getPsychicWarningStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get warning status for a specific user (for psychics to see)
 */
exports.getUserWarningStatusForPsychic = async (req, res) => {
  try {
    const { userId } = req.params;
    const psychicId = req.user._id;

    // Verify this psychic has a chat with this user
    const chatSession = await HumanChatSession.findOne({
      psychic: psychicId,
      user: userId
    });

    if (!chatSession) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user\'s warnings'
      });
    }

    // Get user warnings
    const warnings = await Warning.find({ 
      userId, 
      status: 'active' 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      isActive: true, // You might want to check user's isActive status
      warningCount: warnings.length,
      deactivatedAt: null,
      warnings: warnings.map(w => ({
        id: w._id,
        type: w.warningType,
        number: w.warningNumber,
        createdAt: w.createdAt
      }))
    });

  } catch (error) {
    console.error('Error in getUserWarningStatusForPsychic:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
// Update chat status as psychic
exports.updateChatStatusAsPsychic = async (req, res) => {
  try {
    const { chatSessionId } = req.params;
    const { status } = req.body;
    const psychicId = req.user._id;

    const chatSession = await HumanChatSession.findOne({
      _id: chatSessionId,
      psychic: psychicId
    });

    if (!chatSession) {
      return res.status(404).json({ 
        success: false, 
        message: 'Chat session not found' 
      });
    }

    // Update status
    chatSession.status = status;
    
    if (status === 'ended' || status === 'completed') {
      chatSession.endedAt = Date.now();
    } else if (status === 'active') {
      chatSession.startedAt = Date.now();
    }

    await chatSession.save();

    // Emit status change if socket available
    if (global.io) {
      const roomName = `chat_${chatSessionId}`;
      global.io.to(roomName).emit('chat_status_changed', {
        chatSessionId,
        status,
        updatedBy: psychicId,
        updatedAt: chatSession.updatedAt
      });
    }

    res.status(200).json({
      success: true,
      chatSession
    });

  } catch (error) {
    console.error('Update chat status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Get psychic's unread message count
exports.getPsychicUnreadCount = async (req, res) => {
  try {
    const psychicId = req.user._id;

    const chatSessions = await HumanChatSession.find({ psychic: psychicId })
      .select('unreadCounts');

    const totalUnread = chatSessions.reduce((total, session) => {
      return total + session.unreadCounts.psychic;
    }, 0);

    res.status(200).json({
      success: true,
      totalUnread,
      byChat: chatSessions.map(session => ({
        chatSessionId: session._id,
        unreadCount: session.unreadCounts.psychic
      }))
    });

  } catch (error) {
    console.error('Get psychic unread count error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};