
const ChatRequest = require('../../models/Paidtimer/ChatRequest');
const PaidTimer = require('../../models/Paidtimer/PaidTimer');
const Notification = require('../../models/Paidtimer/Notification');
const Wallet = require('../../models/Wallet');
const User = require('../../models/User');
const Psychic = require('../../models/HumanChat/Psychic');
const ActiveCallSession = require('../../models/CallSession/ActiveCallSession');

const mongoose = require('mongoose');
// Helper function for wallet locking/unlocking
const handleWalletLock = async (userId, callback) => {
  let wallet = null;
  try {
    // Get and lock wallet
    wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new Error('Wallet not found');
    }
   
    if (wallet.lock) {
      throw new Error('Wallet is currently locked');
    }
   
    wallet.lock = true;
    await wallet.save();
   
    // Execute the callback
    const result = await callback(wallet);
   
    // Unlock wallet
    wallet.lock = false;
    await wallet.save();
   
    return result;
  } catch (error) {
    // Ensure wallet is unlocked on error
    if (wallet && wallet.lock) {
      try {
        wallet.lock = false;
        await wallet.save();
      } catch (unlockError) {
        console.error('Error unlocking wallet:', unlockError);
      }
    }
    throw error;
  }
};
// Send chat request to psychic
exports.sendChatRequest = async (req, res) => {
  try {
    const { psychicId } = req.body;
    const userId = req.user._id;
    
    // Validate input
    if (!psychicId) {
      return res.status(400).json({
        success: false,
        message: 'Psychic ID is required'
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
    
    // Check if user already has active request with this psychic
    const existingRequest = await ChatRequest.findOne({
      user: userId,
      psychic: psychicId,
      status: { $in: ['pending', 'accepted', 'active'] }
    });
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active or pending request with this psychic'
      });
    }
    
    // Get user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    // Check if wallet is locked (without session)
    if (wallet.lock) {
      return res.status(409).json({
        success: false,
        message: 'Wallet is currently being updated. Please try again in a few seconds.'
      });
    }
    
    // Lock the wallet (manual lock without transaction)
    wallet.lock = true;
    await wallet.save();
    
    // Check if user has enough balance (at least 1 minute)
    if (wallet.credits < 1) {
      // Unlock wallet before returning error
      wallet.lock = false;
      await wallet.save();
     
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. Minimum 1 credit required. You have ${wallet.credits} credits.`
      });
    }
    
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      // Unlock wallet
      wallet.lock = false;
      await wallet.save();
     
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Calculate allowed minutes
    const totalMinutesAllowed = wallet.credits;
    
    // Create chat request
    const chatRequest = new ChatRequest({
      user: userId,
      psychic: psychicId,
      ratePerMin: 1,
      initialBalance: wallet.credits,
      remainingBalance: wallet.credits,
      totalMinutesAllowed: totalMinutesAllowed,
      status: 'pending',
      requestedAt: new Date()
    });
    
    // Save chat request
    await chatRequest.save();
    
    // Create notification for psychic
    const notification = new Notification({
      recipient: psychicId,
      recipientModel: 'Psychic',
      sender: userId,
      senderModel: 'User',
      type: 'chat_request',
      title: 'New Chat Request',
      message: `${user.firstName} ${user.lastName} has sent you a chat request`,
      data: {
        chatRequestId: chatRequest._id,
        userName: `${user.firstName} ${user.lastName}`,
        ratePerMin: 1,
        userBalance: wallet.credits,
        allowedMinutes: totalMinutesAllowed,
        userEmail: user.email,
        userImage: user.image
      },
      chatRequestId: chatRequest._id,
      isRead: false
    });

    // Save notification
    await notification.save();

    // ✅ SOCKET EMISSION - FIXED: Added missing closing brace
    if (req.io) {
      // Emit to psychic's personal room
      req.io.to(`psychic_${psychicId}`).emit('new_chat_request', {
        chatRequestId: chatRequest._id,
        userName: `${user.firstName} ${user.lastName}`,
        userImage: user.image,
        userEmail: user.email,
        userBalance: wallet.credits,
        allowedMinutes: totalMinutesAllowed,
        ratePerMin: 1,
        requestedAt: chatRequest.requestedAt,
        message: `${user.firstName} ${user.lastName} has sent you a chat request`,
        // ✅ ADD THIS: Include the full chat request object
        chatRequest: {
          _id: chatRequest._id,
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            image: user.image
          },
          psychic: psychicId,
          status: 'pending',
          ratePerMin: 1,
          initialBalance: wallet.credits,
          totalMinutesAllowed: totalMinutesAllowed,
          requestedAt: chatRequest.requestedAt
        }
      });
      
      // Also emit as notification
      req.io.to(`psychic_${psychicId}`).emit('new_notification', {
        notification: {
          _id: notification._id,
          type: 'chat_request',
          title: notification.title,
          message: notification.message,
          data: notification.data,
          createdAt: notification.createdAt,
          isRead: notification.isRead
        }
      });
      
      console.log(`📢 Socket event emitted: new_chat_request to psychic_${psychicId}`);
    } // ✅ THIS WAS MISSING
    
    // Unlock wallet
    wallet.lock = false;
    await wallet.save();
    
    console.log(`✅ Chat request created for user ${userId} to psychic ${psychicId}`);
    console.log(`💰 User credits: ${wallet.credits}, Rate per min: 1, Allowed minutes: ${totalMinutesAllowed}`);
    
    res.status(201).json({
      success: true,
      message: 'Chat request sent successfully',
      data: {
        _id: chatRequest._id,
        user: userId,
        psychic: psychicId,
        ratePerMin: 1,
        status: 'pending',
        initialBalance: wallet.credits,
        totalMinutesAllowed: totalMinutesAllowed,
        requestedAt: chatRequest.requestedAt,
        psychicName: psychic.name,
        psychicImage: psychic.image
      }
    });
  } catch (error) {
    console.error('❌ Send chat request error:', error);
   
    // Try to unlock wallet if it was locked
    try {
      if (req.user?._id) {
        const wallet = await Wallet.findOne({ userId: req.user._id });
        if (wallet && wallet.lock) {
          wallet.lock = false;
          await wallet.save();
          console.log('✅ Wallet unlocked after error');
        }
      }
    } catch (unlockError) {
      console.error('Error unlocking wallet:', unlockError);
    }
   
    // Handle specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
   
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate request detected'
      });
    }
   
    res.status(500).json({
      success: false,
      message: 'Server error while sending chat request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Psychic accepts chat request
exports.acceptChatRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const psychicId = req.user._id;
    // Validate input
    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }
    // Find the chat request
    const chatRequest = await ChatRequest.findById(requestId).populate('user', 'firstName lastName email');
   
    if (!chatRequest) {
      return res.status(404).json({
        success: false,
        message: 'Chat request not found'
      });
    }
    // Check if psychic owns this request
    if (chatRequest.psychic.toString() !== psychicId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this request'
      });
    }
    // Check request status
    if (chatRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${chatRequest.status}`
      });
    }
    // Update request status
    chatRequest.status = 'accepted';
    chatRequest.acceptedAt = new Date();
    await chatRequest.save();
    // Get psychic details
    const psychic = await Psychic.findById(psychicId);
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }
    // Create notification for user
    const notification = new Notification({
      recipient: chatRequest.user,
      recipientModel: 'User',
      sender: psychicId,
      senderModel: 'Psychic',
      type: 'chat_accepted',
      title: 'Chat Request Accepted',
      message: `${psychic.name} has accepted your chat request`,
      data: {
        chatRequestId: chatRequest._id,
        psychicName: psychic.name,
        ratePerMin: 1,
        allowedMinutes: chatRequest.totalMinutesAllowed,
        psychicImage: psychic.image,
        psychicId: psychic._id
      },
      chatRequestId: chatRequest._id,
      isRead: false
    });
    await notification.save();
    // Send real-time socket events
    if (req.io) {
      // Emit to user
      req.io.to(`user_${chatRequest.user._id}`).emit('chat_request_accepted', {
        requestId: chatRequest._id,
        chatRequest: chatRequest,
        psychicName: psychic.name,
        psychicImage: psychic.image,
        psychicId: psychic._id
      });
      // Send notification via socket
      req.io.to(`user_${chatRequest.user._id}`).emit('new_notification', {
        notification: {
          _id: notification._id,
          type: 'chat_accepted',
          title: notification.title,
          message: notification.message,
          data: notification.data,
          createdAt: notification.createdAt,
          isRead: notification.isRead
        }
      });
      console.log(`📢 Socket event emitted: chat_request_accepted to user_${chatRequest.user._id}`);
    }
    console.log(`✅ Chat request accepted: ${requestId} by psychic: ${psychicId}`);
    // Return success response
    res.json({
      success: true,
      message: 'Chat request accepted successfully',
      data: chatRequest
    });
  } catch (error) {
    console.error('Accept chat request error:', error);
   
    // Handle specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format'
      });
    }
   
    res.status(500).json({
      success: false,
      message: 'Server error while accepting chat request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Psychic rejects chat request
exports.rejectChatRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const psychicId = req.user._id;
    // Validate input
    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }
    // Find the chat request
    const chatRequest = await ChatRequest.findById(requestId);
   
    if (!chatRequest) {
      return res.status(404).json({
        success: false,
        message: 'Chat request not found'
      });
    }
    // Check if psychic owns this request
    if (chatRequest.psychic.toString() !== psychicId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this request'
      });
    }
    // Check request status
    if (chatRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${chatRequest.status}`
      });
    }
    // Update request status
    chatRequest.status = 'rejected';
    chatRequest.rejectedAt = new Date();
    await chatRequest.save();
    // Get psychic details
    const psychic = await Psychic.findById(psychicId);
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }
    // Create notification for user
    const notification = new Notification({
      recipient: chatRequest.user,
      recipientModel: 'User',
      sender: psychicId,
      senderModel: 'Psychic',
      type: 'chat_rejected',
      title: 'Chat Request Rejected',
      message: `${psychic.name} has rejected your chat request`,
      data: {
        chatRequestId: chatRequest._id,
        psychicName: psychic.name
      },
      chatRequestId: chatRequest._id,
      isRead: false
    });
    await notification.save();
    // Emit real-time event via Socket.IO
    if (req.io) {
      req.io.to(`user_${chatRequest.user}`).emit('chat_request_rejected', {
        requestId: chatRequest._id,
        psychicName: psychic.name,
        message: 'Your chat request has been rejected'
      });
    }
    console.log(`❌ Chat request rejected: ${requestId} by psychic: ${psychicId}`);
    // Return success response
    res.json({
      success: true,
      message: 'Chat request rejected successfully',
      data: chatRequest
    });
  } catch (error) {
    console.error('Reject chat request error:', error);
   
    // Handle specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format'
      });
    }
   
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting chat request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Get user wallet balance
// Get real-time timer data
exports.getTimerData = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    
    const chatRequest = await ChatRequest.findById(requestId)
      .populate('user', 'firstName lastName')
      .populate('psychic', 'name');
    
    if (!chatRequest) {
      return res.status(404).json({
        success: false,
        message: 'Chat request not found'
      });
    }
    
    // Check authorization
    if (chatRequest.user._id.toString() !== userId.toString() && 
        chatRequest.psychic._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Get wallet balance
    const wallet = await Wallet.findOne({ userId: chatRequest.user._id });
    
    // Calculate remaining seconds properly
    let remainingSeconds = 0;
    
    if (chatRequest.paidSession && chatRequest.paidSession.isActive) {
      if (chatRequest.paidSession.remainingSeconds) {
        // Use stored remaining seconds
        remainingSeconds = chatRequest.paidSession.remainingSeconds;
      } else if (chatRequest.totalMinutesAllowed) {
        // Calculate from total minutes
        const elapsedTime = Date.now() - new Date(chatRequest.startedAt).getTime();
        const elapsedSeconds = Math.floor(elapsedTime / 1000);
        const totalSeconds = chatRequest.totalMinutesAllowed * 60;
        remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
      }
    }
    
    // Ensure remainingSeconds doesn't go negative
    remainingSeconds = Math.max(0, remainingSeconds);
    
    res.json({
      success: true,
      data: {
        requestId: chatRequest._id,
        status: chatRequest.status,
        remainingSeconds,
        currentBalance: wallet?.credits || 0,
        totalSeconds: chatRequest.totalMinutesAllowed * 60,
        ratePerMin: chatRequest.ratePerMin || 1,
        isActive: chatRequest.paidSession?.isActive || false,
        isPaused: chatRequest.paidSession?.isPaused || false,
        startedAt: chatRequest.startedAt,
        lastUpdated: new Date()
      }
    });
    
  } catch (error) {
    console.error('Get timer data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// In backend - make sure credits field is returned
exports.getUserWalletBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's wallet
    let wallet = await Wallet.findOne({ userId });
   
    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await Wallet.create({
        userId,
        balance: 0,
        credits: 0,
      });
    }
    
    res.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        credits: wallet.credits, // Make sure this is included
        lock: wallet.lock
      }
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// Check if user can afford psychic
exports.checkAffordability = async (req, res) => {
  try {
    const { psychicId } = req.body;
    const userId = req.user._id;
    // Get psychic details
    const psychic = await Psychic.findById(psychicId);
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }
    // Get user's wallet
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        credits: 0,
      });
    }
    const canAfford = wallet.credits >= 1;
    const allowedMinutes = wallet.credits;
    const missingAmount = 1 - wallet.credits;
    res.json({
      success: true,
      canAfford,
      wallet: {
        balance: wallet.balance,
        credits: wallet.credits || wallet.balance
      },
      psychic: {
        ratePerMin: 1,
        name: psychic.name
      },
      allowedMinutes,
      missingAmount: Math.max(0, missingAmount)
    });
  } catch (error) {
    console.error('Check affordability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
exports.startPaidSession = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user._id;
    // Validate input
    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }
    const chatRequest = await ChatRequest.findById(requestId);
   
    if (!chatRequest) {
      return res.status(404).json({
        success: false,
        message: 'Chat request not found'
      });
    }
    if (chatRequest.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start this session'
      });
    }
    if (chatRequest.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: `Session cannot be started. Current status: ${chatRequest.status}`
      });
    }
    // Get user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    if (wallet.lock) {
      return res.status(400).json({
        success: false,
        message: 'Wallet is currently locked. Please try again.'
      });
    }
    // Lock wallet
    wallet.lock = true;
    await wallet.save();
    // Check if user has enough balance
    if (wallet.credits < 1) {
      wallet.lock = false;
      await wallet.save();
     
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits to start session'
      });
    }
    // Calculate total seconds allowed
    const totalSecondsAllowed = wallet.credits * 60;
    // Create paid timer
    const paidTimer = new PaidTimer({
      chatRequestId: chatRequest._id,
      user: userId,
      psychic: chatRequest.psychic,
      totalSeconds: totalSecondsAllowed,
      remainingSeconds: totalSecondsAllowed,
      ratePerMin: 1,
      startTime: new Date(),
      lastDeductionTime: new Date(),
      initialBalance: wallet.credits,
      remainingBalance: wallet.credits,
      status: 'active'
    });
    await paidTimer.save();
    // Update chat request
    chatRequest.status = 'active';
    chatRequest.startedAt = new Date();
    chatRequest.paidTimerId = paidTimer._id;
    chatRequest.paidSession = {
      isActive: true,
      startTime: new Date(),
      totalSeconds: totalSecondsAllowed,
      remainingSeconds: totalSecondsAllowed,
      lastDeductionTime: new Date(),
      isPaused: false
    };
    await chatRequest.save();
    // Unlock wallet
    wallet.lock = false;
    await wallet.save();
    // Get user and psychic details for notifications
    const user = await User.findById(userId);
    const psychic = await Psychic.findById(chatRequest.psychic);
    // Create notifications
    const userNotification = new Notification({
      recipient: userId,
      recipientModel: 'User',
      sender: chatRequest.psychic,
      senderModel: 'Psychic',
      type: 'timer_started',
      title: 'Paid Session Started',
      message: `Paid session with ${psychic?.name || 'Psychic'} has started`,
      data: {
        chatRequestId: chatRequest._id,
        psychicName: psychic?.name,
        totalMinutes: Math.floor(totalSecondsAllowed / 60),
        ratePerMin: 1,
        remainingBalance: wallet.credits
      },
      chatRequestId: chatRequest._id,
      isRead: false
    });
    const psychicNotification = new Notification({
      recipient: chatRequest.psychic,
      recipientModel: 'Psychic',
      sender: userId,
      senderModel: 'User',
      type: 'timer_started',
      title: 'Paid Session Started',
      message: `Paid session with ${user?.firstName || 'User'} has started`,
      data: {
        chatRequestId: chatRequest._id,
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        totalMinutes: Math.floor(totalSecondsAllowed / 60),
        ratePerMin: 1,
        userBalance: wallet.credits
      },
      chatRequestId: chatRequest._id,
      isRead: false
    });
    await Promise.all([
      userNotification.save(),
      psychicNotification.save()
    ]);
    // Send real-time socket events
    if (req.io) {
      // Emit to user
      req.io.to(`user_${userId}`).emit('session_started', {
        requestId: chatRequest._id,
        totalSeconds: totalSecondsAllowed,
        remainingSeconds: totalSecondsAllowed,
        chatRequest: chatRequest,
        paidTimer: paidTimer
      });
      // Emit to psychic
      req.io.to(`psychic_${chatRequest.psychic}`).emit('session_started', {
        requestId: chatRequest._id,
        totalSeconds: totalSecondsAllowed,
        remainingSeconds: totalSecondsAllowed,
        chatRequest: chatRequest,
        paidTimer: paidTimer
      });
      // Send notifications via socket
      req.io.to(`user_${userId}`).emit('new_notification', {
        notification: {
          _id: userNotification._id,
          type: 'timer_started',
          title: userNotification.title,
          message: userNotification.message,
          data: userNotification.data,
          createdAt: userNotification.createdAt,
          isRead: userNotification.isRead
        }
      });
      req.io.to(`psychic_${chatRequest.psychic}`).emit('new_notification', {
        notification: {
          _id: psychicNotification._id,
          type: 'timer_started',
          title: psychicNotification.title,
          message: psychicNotification.message,
          data: psychicNotification.data,
          createdAt: psychicNotification.createdAt,
          isRead: psychicNotification.isRead
        }
      });
      console.log(`📢 Socket events emitted for session ${requestId}`);
    }
    console.log(`🚀 Paid session started: ${requestId} for user: ${userId}`);
    startTimerDeduction(paidTimer._id, chatRequest._id, userId);
    res.json({
      success: true,
      message: 'Paid session started successfully',
      data: {
        chatRequest,
        paidTimer,
        totalMinutes: Math.floor(totalSecondsAllowed / 60)
      }
    });
  } catch (error) {
    console.error('Start paid session error:', error);
   
    // Try to unlock wallet on error
    try {
      if (req.user?._id) {
        const wallet = await Wallet.findOne({ userId: req.user._id });
        if (wallet && wallet.lock) {
          wallet.lock = false;
          await wallet.save();
          console.log('✅ Wallet unlocked after error');
        }
      }
    } catch (unlockError) {
      console.error('Error unlocking wallet:', unlockError);
    }
   
    res.status(500).json({
      success: false,
      message: 'Server error while starting paid session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Pause timer (both user and psychic can pause)
exports.pauseTimer = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role || 'user';
    const chatRequest = await ChatRequest.findById(requestId);
    if (!chatRequest) {
      return res.status(404).json({
        success: false,
        message: 'Chat request not found'
      });
    }
    // Check authorization
    const isAuthorized = userRole === 'psychic'
      ? chatRequest.psychic.toString() === userId.toString()
      : chatRequest.user.toString() === userId.toString();
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pause this session'
      });
    }
    if (!chatRequest.paidSession.isActive || chatRequest.paidSession.isPaused) {
      return res.status(400).json({
        success: false,
        message: 'Session is not active or already paused'
      });
    }
    // Update chat request
    chatRequest.paidSession.isPaused = true;
    chatRequest.paidSession.pausedAt = new Date();
    await chatRequest.save();
    // Update paid timer
    const paidTimer = await PaidTimer.findOne({ chatRequestId: requestId });
    if (paidTimer && paidTimer.status === 'active') {
      paidTimer.isPaused = true;
      paidTimer.pauseStartTime = new Date();
      paidTimer.status = 'paused';
      await paidTimer.save();
    }
    // Create notification
    const actor = userRole === 'psychic'
      ? await Psychic.findById(userId)
      : await User.findById(userId);
   
    const recipientId = userRole === 'psychic' ? chatRequest.user : chatRequest.psychic;
    const recipientModel = userRole === 'psychic' ? 'User' : 'Psychic';
    const actorName = userRole === 'psychic' ? actor.name : `${actor.firstName} ${actor.lastName}`;
    const notification = new Notification({
      recipient: recipientId,
      recipientModel: recipientModel,
      sender: userId,
      senderModel: userRole === 'psychic' ? 'Psychic' : 'User',
      type: 'timer_paused',
      title: 'Session Paused',
      message: `${actorName} has paused the session`,
      data: {
        chatRequestId: chatRequest._id,
        pausedBy: userRole,
        pausedAt: new Date()
      },
      chatRequestId: chatRequest._id,
      isRead: false
    });
    await notification.save();
    // Emit real-time event
    const room = userRole === 'psychic'
      ? `user_${chatRequest.user}`
      : `psychic_${chatRequest.psychic}`;
   
    req.io.to(room).emit('timer_paused', {
      requestId: chatRequest._id,
      pausedBy: userRole,
      pausedAt: new Date()
    });
    res.json({
      success: true,
      message: 'Timer paused successfully',
      data: chatRequest
    });
  } catch (error) {
    console.error('Pause timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// Resume timer
exports.resumeTimer = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role || 'user';
    const chatRequest = await ChatRequest.findById(requestId);
    if (!chatRequest) {
      return res.status(404).json({
        success: false,
        message: 'Chat request not found'
      });
    }
    const isAuthorized = userRole === 'psychic'
      ? chatRequest.psychic.toString() === userId.toString()
      : chatRequest.user.toString() === userId.toString();
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to resume this session'
      });
    }
    if (!chatRequest.paidSession.isActive || !chatRequest.paidSession.isPaused) {
      return res.status(400).json({
        success: false,
        message: 'Session is not active or not paused'
      });
    }
    // Calculate pause duration
    const pauseDuration = Date.now() - chatRequest.paidSession.pausedAt;
    chatRequest.paidSession.isPaused = false;
    chatRequest.paidSession.pauseDuration += pauseDuration;
    await chatRequest.save();
    // Update paid timer
    const paidTimer = await PaidTimer.findOne({ chatRequestId: requestId });
    if (paidTimer && paidTimer.status === 'paused') {
      paidTimer.isPaused = false;
      if (paidTimer.pauseStartTime) {
        const pauseDuration = Date.now() - paidTimer.pauseStartTime;
        paidTimer.totalPauseDuration += pauseDuration;
      }
      paidTimer.status = 'active';
      paidTimer.lastDeductionTime = new Date();
      await paidTimer.save();
    }
    // Create notification
    const actor = userRole === 'psychic'
      ? await Psychic.findById(userId)
      : await User.findById(userId);
   
    const recipientId = userRole === 'psychic' ? chatRequest.user : chatRequest.psychic;
    const recipientModel = userRole === 'psychic' ? 'User' : 'Psychic';
    const actorName = userRole === 'psychic' ? actor.name : `${actor.firstName} ${actor.lastName}`;
    const notification = new Notification({
      recipient: recipientId,
      recipientModel: recipientModel,
      sender: userId,
      senderModel: userRole === 'psychic' ? 'Psychic' : 'User',
      type: 'timer_started',
      title: 'Session Resumed',
      message: `${actorName} has resumed the session`,
      data: {
        chatRequestId: chatRequest._id,
        resumedBy: userRole,
        resumedAt: new Date()
      },
      chatRequestId: chatRequest._id,
      isRead: false
    });
    await notification.save();
    // Emit real-time event
    const room = userRole === 'psychic'
      ? `user_${chatRequest.user}`
      : `psychic_${chatRequest.psychic}`;
   
    req.io.to(room).emit('timer_resumed', {
      requestId: chatRequest._id,
      resumedBy: userRole,
      resumedAt: new Date()
    });
    res.json({
      success: true,
      message: 'Timer resumed successfully',
      data: chatRequest
    });
  } catch (error) {
    console.error('Resume timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// Stop timer (end session)
// Stop timer (end session) - FIXED VERSION
exports.stopTimer = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role || 'user';
    
    const chatRequest = await ChatRequest.findById(requestId);
    if (!chatRequest) {
      return res.status(404).json({
        success: false,
        message: 'Chat request not found'
      });
    }
    
    const isAuthorized = userRole === 'psychic'
      ? chatRequest.psychic.toString() === userId.toString()
      : chatRequest.user.toString() === userId.toString();
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to stop this session'
      });
    }
    
    if (!chatRequest.paidSession.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Session is not active'
      });
    }
    
    // Calculate actual time used
    const totalSeconds = chatRequest.totalSecondsAllowed || 0;
    const remainingSeconds = chatRequest.paidSession.remainingSeconds || 0;
    const secondsUsed = Math.max(0, totalSeconds - remainingSeconds);
    const amountToDeduct = (secondsUsed / 60) * chatRequest.ratePerMin;
    
    await handleWalletLock(chatRequest.user, async (wallet) => {
      // Deduct only for time used
      if (amountToDeduct > 0 && wallet.credits >= amountToDeduct) {
        wallet.credits -= amountToDeduct;
        
        chatRequest.deductions.push({
          amount: amountToDeduct,
          timestamp: new Date(),
          secondsUsed: secondsUsed,
          remainingBalance: wallet.credits
        });
      }
      
      // Update chat request
      chatRequest.status = 'completed';
      chatRequest.endedAt = new Date();
      chatRequest.paidSession.isActive = false;
      chatRequest.paidSession.endTime = new Date();
      chatRequest.totalAmountPaid = amountToDeduct;
      chatRequest.remainingBalance = wallet.credits;
      
      await chatRequest.save();
      
      // Update paid timer if exists
      const paidTimer = await PaidTimer.findOne({ chatRequestId: requestId });
      if (paidTimer) {
        paidTimer.status = 'stopped';
        paidTimer.endTime = new Date();
        paidTimer.remainingSeconds = remainingSeconds;
        paidTimer.remainingBalance = wallet.credits;
        await paidTimer.save();
      }
      
      // Socket emissions
      if (req.io) {
        const endData = {
          requestId: chatRequest._id,
          endedAt: new Date(),
          reason: 'manually_stopped',
          totalAmountPaid: amountToDeduct,
          remainingSeconds: remainingSeconds,
          newBalance: wallet.credits
        };
        
        req.io.to(`user_${chatRequest.user}`).emit('session_ended', endData);
        req.io.to(`psychic_${chatRequest.psychic}`).emit('session_ended', endData);
        req.io.to(`chat_request_${chatRequest._id}`).emit('session_ended', endData);
      }
      
      return { chatRequest, amountToDeduct, remainingSeconds };
    });
    
    console.log(`✅ Session stopped: ${requestId}`);
    
    res.json({
      success: true,
      message: 'Timer stopped successfully',
      data: {
        chatRequest,
        totalAmountPaid: amountToDeduct,
        minutesUsed: Math.floor(secondsUsed / 60),
        remainingMinutes: Math.floor(remainingSeconds / 60)
      }
    });
    
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

exports.cleanupStuckTimers = async () => {
  try {
    const stuckTimers = await PaidTimer.find({
      status: 'active',
      remainingSeconds: { $lte: 0 }
    });
    
    for (const timer of stuckTimers) {
      console.log(`🧹 Cleaning up stuck timer: ${timer._id}`);
      
      timer.status = 'completed';
      timer.endTime = new Date();
      await timer.save();
      
      const chatRequest = await ChatRequest.findById(timer.chatRequestId);
      if (chatRequest) {
        chatRequest.status = 'completed';
        chatRequest.endedAt = new Date();
        chatRequest.paidSession.isActive = false;
        chatRequest.paidSession.endTime = new Date();
        await chatRequest.save();
      }
    }
    
    console.log(`✅ Cleaned up ${stuckTimers.length} stuck timers`);
  } catch (error) {
    console.error('Cleanup stuck timers error:', error);
  }
};
exports.getActiveSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role || 'user';
    
    let query = {};
    if (userRole === 'psychic') {
      query.psychic = userId;
    } else {
      query.user = userId;
    }
    query.status = 'active';
    query['paidSession.isActive'] = true;
    
    const chatRequest = await ChatRequest.findOne(query)
      .populate(userRole === 'psychic' ? 'user' : 'psychic', 'name firstName lastName email image')
      .populate('paidTimerId');
    
    if (!chatRequest) {
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }
    
    // Calculate current remaining seconds
    const remainingSeconds = chatRequest.calculateRemainingSeconds();
    const currentBalance = chatRequest.calculateRemainingBalance();
    
    res.json({
      success: true,
      data: {
        ...chatRequest.toObject(),
        paidSession: {
          ...chatRequest.paidSession,
          remainingSeconds: remainingSeconds
        },
        currentBalance: currentBalance
      }
    });
  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
exports.checkPendingRequest = async (req, res) => {
  try {
    const { psychicId } = req.params;
    const userId = req.user._id;
    const existingRequest = await ChatRequest.findOne({
      user: userId,
      psychic: psychicId,
      status: { $in: ['pending', 'accepted'] }
    });
    res.json({
      success: true,
      data: existingRequest
    });
  } catch (error) {
    console.error('Check pending request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
exports.checkActiveRequest = async (req, res) => {
  try {
    const { psychicId } = req.params;
    const userId = req.user._id;
    const activeRequest = await ChatRequest.findOne({
      user: userId,
      psychic: psychicId,
      status: 'active',
      'paidSession.isActive': true
    });
    res.json({
      success: true,
      data: activeRequest
    });
  } catch (error) {
    console.error('Check active request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
exports.cancelChatRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    const chatRequest = await ChatRequest.findById(requestId);
   
    if (!chatRequest) {
      return res.status(404).json({
        success: false,
        message: 'Chat request not found'
      });
    }
    if (chatRequest.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this request'
      });
    }
    if (chatRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be cancelled'
      });
    }
    chatRequest.status = 'cancelled';
    chatRequest.cancelledAt = new Date();
    await chatRequest.save();
    // Create notification for psychic
    const user = await User.findById(userId);
    const notification = new Notification({
      recipient: chatRequest.psychic,
      recipientModel: 'Psychic',
      sender: userId,
      senderModel: 'User',
      type: 'chat_cancelled',
      title: 'Chat Request Cancelled',
      message: `${user.firstName} ${user.lastName} has cancelled their chat request`,
      data: {
        chatRequestId: chatRequest._id,
        userName: `${user.firstName} ${user.lastName}`
      },
      chatRequestId: chatRequest._id,
      isRead: false
    });
    await notification.save();
    res.json({
      success: true,
      message: 'Chat request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel chat request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// Get chat request history
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role || 'user';
    const { page = 1, limit = 20, status } = req.query;
    let query = {};
    if (userRole === 'psychic') {
      query.psychic = userId;
    } else {
      query.user = userId;
    }
    if (status) {
      query.status = status;
    }
    const skip = (page -  1) * limit;
    const chatRequests = await ChatRequest.find(query)
      .populate(userRole === 'psychic' ? 'user' : 'psychic', 'name firstName lastName email image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await ChatRequest.countDocuments(query);
    res.json({
      success: true,
      data: chatRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// Get psychic's pending chat requests
exports.getPsychicPendingRequests = async (req, res) => {
  try {
    const psychicId = req.user._id;
    const pendingRequests = await ChatRequest.find({
      psychic: psychicId,
      status: 'pending'
    })
    .populate('user', 'firstName lastName email image')
    .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: pendingRequests
    });
  } catch (error) {
    console.error('Get psychic pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// Get psychic's active session
exports.getPsychicActiveSession = async (req, res) => {
  try {
    const psychicId = req.user._id;
    const activeSession = await ChatRequest.findOne({
      psychic: psychicId,
      status: 'active',
      'paidSession.isActive': true
    })
    .populate('user', 'firstName lastName email image')
    .populate('paidTimerId');
    if (!activeSession) {
      return res.json({
        success: true,
        data: null
      });
    }
    res.json({
      success: true,
      data: activeSession
    });
  } catch (error) {
    console.error('Get psychic active session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// Get psychic earnings



// Get psychic earnings from both chat and call sessions
exports.getPsychicEarnings = async (req, res) => {
  try {
    const psychicId = req.user._id;
    const now = new Date();
    
    // Time ranges
    const dailyStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weeklyStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthlyStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Fetch chat sessions for different time periods
    const [dailyChats, weeklyChats, monthlyChats, allTimeChats] = await Promise.all([
      ChatRequest.find({
        psychic: psychicId,
        status: 'completed',
        endedAt: { $gte: dailyStart }
      }).populate('user', 'username email image'),
      
      ChatRequest.find({
        psychic: psychicId,
        status: 'completed',
        endedAt: { $gte: weeklyStart }
      }).populate('user', 'username email image'),
      
      ChatRequest.find({
        psychic: psychicId,
        status: 'completed',
        endedAt: { $gte: monthlyStart }
      }).populate('user', 'username email image'),
      
      ChatRequest.find({
        psychic: psychicId,
        status: 'completed'
      }).populate('user', 'username email image')
    ]);
    
    // Fetch call sessions for different time periods
    const [dailyCalls, weeklyCalls, monthlyCalls, allTimeCalls] = await Promise.all([
      ActiveCallSession.find({
        psychicId: psychicId,
        status: 'ended',
        endTime: { $gte: dailyStart }
      }).populate('userId', 'username email image'),
      
      ActiveCallSession.find({
        psychicId: psychicId,
        status: 'ended',
        endTime: { $gte: weeklyStart }
      }).populate('userId', 'username email image'),
      
      ActiveCallSession.find({
        psychicId: psychicId,
        status: 'ended',
        endTime: { $gte: monthlyStart }
      }).populate('userId', 'username email image'),
      
      ActiveCallSession.find({
        psychicId: psychicId,
        status: 'ended'
      }).populate('userId', 'username email image')
    ]);
    
    // Helper function to calculate psychic earnings (25% of total)
    const calculatePsychicEarnings = (totalAmount) => {
      // Psychic gets 25% (0.25) of the total amount
      // For example: if total is 1.6, psychic gets 0.4 (1.6 * 0.25 = 0.4)
      return totalAmount * 0.25;
    };
    
    // Calculate earnings from both types with 75/25 split
    const calculateEarnings = (chats, calls) => {
      const chatTotal = chats.reduce((total, session) => {
        return total + (session.totalAmountPaid || 0);
      }, 0);
      
      // Convert credits to dollars (1 credit = $1)
      const callTotal = calls.reduce((total, session) => {
        return total + (session.totalCreditsUsed || 0);
      }, 0);
      
      const totalEarnings = chatTotal + callTotal;
      
      return {
        total: totalEarnings, // Total amount paid by users
        psychicEarnings: calculatePsychicEarnings(totalEarnings), // Psychic's 25% share
        platformEarnings: totalEarnings * 0.75, // Platform's 75% share
        chats: chatTotal,
        calls: callTotal
      };
    };
    
    // Calculate time breakdown
    const calculateTimeBreakdown = (chats, calls) => {
      const chatTime = chats.reduce((total, session) => {
        const secondsUsed = session.totalSecondsAllowed - (session.paidSession?.remainingSeconds || 0);
        return total + (secondsUsed || 0);
      }, 0);
      
      const callTime = calls.reduce((total, session) => {
        if (session.startTime && session.endTime) {
          return total + (new Date(session.endTime) - new Date(session.startTime)) / 1000;
        }
        return total;
      }, 0);
      
      return {
        total: chatTime + callTime,
        chats: chatTime,
        calls: callTime
      };
    };
    
    // Get earnings by user (combining chat and call sessions) with 75/25 split
    const userEarningsMap = {};
    
    // Process chat sessions
    allTimeChats.forEach(session => {
      const userId = session.user._id.toString();
      if (!userEarningsMap[userId]) {
        userEarningsMap[userId] = {
          user: {
            _id: session.user._id,
            username: session.user.username || 'Anonymous User',
            email: session.user.email,
            image: session.user.image
          },
          totalPaid: 0, // Total amount user paid
          psychicEarnings: 0, // Psychic's 25% from this user
          platformEarnings: 0, // Platform's 75% from this user
          chatPaid: 0,
          callPaid: 0,
          totalSessions: 0,
          chatSessions: 0,
          callSessions: 0,
          totalTime: 0
        };
      }
      
      const sessionAmount = session.totalAmountPaid || 0;
      userEarningsMap[userId].totalPaid += sessionAmount;
      userEarningsMap[userId].psychicEarnings += calculatePsychicEarnings(sessionAmount);
      userEarningsMap[userId].platformEarnings += sessionAmount * 0.75;
      userEarningsMap[userId].chatPaid += sessionAmount;
      userEarningsMap[userId].totalSessions += 1;
      userEarningsMap[userId].chatSessions += 1;
      
      const secondsUsed = session.totalSecondsAllowed - (session.paidSession?.remainingSeconds || 0);
      userEarningsMap[userId].totalTime += secondsUsed;
    });
    
    // Process call sessions
    allTimeCalls.forEach(session => {
      const userId = session.userId._id.toString();
      if (!userEarningsMap[userId]) {
        userEarningsMap[userId] = {
          user: {
            _id: session.userId._id,
            username: session.userId.username || 'Anonymous User',
            email: session.userId.email,
            image: session.userId.image
          },
          totalPaid: 0,
          psychicEarnings: 0,
          platformEarnings: 0,
          chatPaid: 0,
          callPaid: 0,
          totalSessions: 0,
          chatSessions: 0,
          callSessions: 0,
          totalTime: 0
        };
      }
      
      // Convert credits to dollars (1 credit = $1)
      const sessionAmount = session.totalCreditsUsed || 0;
      
      userEarningsMap[userId].totalPaid += sessionAmount;
      userEarningsMap[userId].psychicEarnings += calculatePsychicEarnings(sessionAmount);
      userEarningsMap[userId].platformEarnings += sessionAmount * 0.75;
      userEarningsMap[userId].callPaid += sessionAmount;
      userEarningsMap[userId].totalSessions += 1;
      userEarningsMap[userId].callSessions += 1;
      
      if (session.startTime && session.endTime) {
        const secondsUsed = (new Date(session.endTime) - new Date(session.startTime)) / 1000;
        userEarningsMap[userId].totalTime += secondsUsed;
      }
    });
    
    // Convert to array and sort by psychic earnings
    const userEarnings = Object.values(userEarningsMap)
      .sort((a, b) => b.psychicEarnings - a.psychicEarnings)
      .map(item => ({
        user: {
          _id: item.user._id,
          username: item.user.username,
          email: item.user.email,
          image: item.user.image
        },
        totalPaid: item.totalPaid, // What user paid
        psychicEarnings: item.psychicEarnings, // Psychic's 25%
        platformEarnings: item.platformEarnings, // Platform's 75%
        chatPaid: item.chatPaid,
        callPaid: item.callPaid,
        totalSessions: item.totalSessions,
        chatSessions: item.chatSessions,
        callSessions: item.callSessions,
        totalTimeMinutes: Math.round(item.totalTime / 60),
        avgEarningsPerSession: item.totalSessions > 0 ? item.psychicEarnings / item.totalSessions : 0
      }));
    
    // Get recent sessions (combined) with split shown
    const recentChatSessions = allTimeChats
      .sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
      .slice(0, 5)
      .map(session => ({
        _id: session._id,
        type: 'chat',
        user: {
          _id: session.user._id,
          username: session.user.username || 'Anonymous User',
          email: session.user.email
        },
        totalAmount: session.totalAmountPaid || 0, // Total paid
        psychicEarnings: calculatePsychicEarnings(session.totalAmountPaid || 0), // Psychic's 25%
        platformEarnings: (session.totalAmountPaid || 0) * 0.75, // Platform's 75%
        durationMinutes: Math.round((session.totalSecondsAllowed - (session.paidSession?.remainingSeconds || 0)) / 60),
        endedAt: session.endedAt,
        ratePerMin: session.ratePerMin || 1
      }));
    
    const recentCallSessions = allTimeCalls
      .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))
      .slice(0, 5)
      .map(session => {
        const durationSeconds = session.startTime && session.endTime 
          ? (new Date(session.endTime) - new Date(session.startTime)) / 1000 
          : 0;
        const totalAmount = session.totalCreditsUsed || 0;
        
        return {
          _id: session._id,
          type: 'call',
          user: {
            _id: session.userId._id,
            username: session.userId.username || 'Anonymous User',
            email: session.userId.email
          },
          totalAmount: totalAmount, // Total paid
          psychicEarnings: calculatePsychicEarnings(totalAmount), // Psychic's 25%
          platformEarnings: totalAmount * 0.75, // Platform's 75%
          durationMinutes: Math.round(durationSeconds / 60),
          endedAt: session.endTime,
          creditsPerMin: session.creditsPerMin || 1
        };
      });
    
    // Combine and sort recent sessions
    const recentSessions = [...recentChatSessions, ...recentCallSessions]
      .sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
      .slice(0, 10);
    
    // Calculate summary
    const dailyEarnings = calculateEarnings(dailyChats, dailyCalls);
    const weeklyEarnings = calculateEarnings(weeklyChats, weeklyCalls);
    const monthlyEarnings = calculateEarnings(monthlyChats, monthlyCalls);
    const allTimeEarnings = calculateEarnings(allTimeChats, allTimeCalls);
    
    const dailyTime = calculateTimeBreakdown(dailyChats, dailyCalls);
    const weeklyTime = calculateTimeBreakdown(weeklyChats, weeklyCalls);
    const monthlyTime = calculateTimeBreakdown(monthlyChats, monthlyCalls);
    const allTimeTime = calculateTimeBreakdown(allTimeChats, allTimeCalls);
    
    // Get unique users from both types
    const uniqueUserIds = new Set([
      ...allTimeChats.map(s => s.user._id.toString()),
      ...allTimeCalls.map(s => s.userId._id.toString())
    ]);
    
    res.json({
      success: true,
      data: {
        summary: {
          daily: {
            totalPaid: dailyEarnings.total, // Total amount paid by users
            psychicEarnings: dailyEarnings.psychicEarnings, // Psychic's 25%
            platformEarnings: dailyEarnings.platformEarnings, // Platform's 75%
            chatEarnings: dailyEarnings.chats,
            callEarnings: dailyEarnings.calls,
            sessions: dailyChats.length + dailyCalls.length,
            chatSessions: dailyChats.length,
            callSessions: dailyCalls.length,
            timeMinutes: Math.round(dailyTime.total / 60)
          },
          weekly: {
            totalPaid: weeklyEarnings.total,
            psychicEarnings: weeklyEarnings.psychicEarnings,
            platformEarnings: weeklyEarnings.platformEarnings,
            chatEarnings: weeklyEarnings.chats,
            callEarnings: weeklyEarnings.calls,
            sessions: weeklyChats.length + weeklyCalls.length,
            chatSessions: weeklyChats.length,
            callSessions: weeklyCalls.length,
            timeMinutes: Math.round(weeklyTime.total / 60)
          },
          monthly: {
            totalPaid: monthlyEarnings.total,
            psychicEarnings: monthlyEarnings.psychicEarnings,
            platformEarnings: monthlyEarnings.platformEarnings,
            chatEarnings: monthlyEarnings.chats,
            callEarnings: monthlyEarnings.calls,
            sessions: monthlyChats.length + monthlyCalls.length,
            chatSessions: monthlyChats.length,
            callSessions: monthlyCalls.length,
            timeMinutes: Math.round(monthlyTime.total / 60)
          },
          allTime: {
            totalPaid: allTimeEarnings.total,
            psychicEarnings: allTimeEarnings.psychicEarnings,
            platformEarnings: allTimeEarnings.platformEarnings,
            chatEarnings: allTimeEarnings.chats,
            callEarnings: allTimeEarnings.calls,
            sessions: allTimeChats.length + allTimeCalls.length,
            chatSessions: allTimeChats.length,
            callSessions: allTimeCalls.length,
            timeMinutes: Math.round(allTimeTime.total / 60),
            totalUsers: uniqueUserIds.size
          }
        },
        userBreakdown: userEarnings,
        recentSessions: recentSessions,
        splitRatio: {
          psychic: 0.25, // 25%
          platform: 0.75 // 75%
        }
      }
    });
  } catch (error) {
    console.error('Get psychic earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get psychic earnings from specific user (both chat and call)
exports.getPsychicEarningsByUserId = async (req, res) => {
  try {
    const psychicId = req.user._id;
    const { userId } = req.params;
    
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const now = new Date();
    const dailyStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weeklyStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthlyStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Fetch chat sessions for this specific user
    const [dailyChats, weeklyChats, monthlyChats, allChats] = await Promise.all([
      ChatRequest.find({
        psychic: psychicId,
        user: userId,
        status: 'completed',
        endedAt: { $gte: dailyStart }
      }),
      ChatRequest.find({
        psychic: psychicId,
        user: userId,
        status: 'completed',
        endedAt: { $gte: weeklyStart }
      }),
      ChatRequest.find({
        psychic: psychicId,
        user: userId,
        status: 'completed',
        endedAt: { $gte: monthlyStart }
      }),
      ChatRequest.find({
        psychic: psychicId,
        user: userId,
        status: 'completed'
      }).sort({ endedAt: -1 })
    ]);
    
    // Fetch call sessions for this specific user
    const [dailyCalls, weeklyCalls, monthlyCalls, allCalls] = await Promise.all([
      ActiveCallSession.find({
        psychicId: psychicId,
        userId: userId,
        status: 'ended',
        endTime: { $gte: dailyStart }
      }),
      ActiveCallSession.find({
        psychicId: psychicId,
        userId: userId,
        status: 'ended',
        endTime: { $gte: weeklyStart }
      }),
      ActiveCallSession.find({
        psychicId: psychicId,
        userId: userId,
        status: 'ended',
        endTime: { $gte: monthlyStart }
      }),
      ActiveCallSession.find({
        psychicId: psychicId,
        userId: userId,
        status: 'ended'
      }).sort({ endTime: -1 })
    ]);
    
    // Calculate earnings
    const calculateEarnings = (chats, calls) => {
      const chatEarnings = chats.reduce((total, session) => {
        return total + (session.totalAmountPaid || 0);
      }, 0);
      
      // Convert credits to dollars (1 credit = $1)
      const callEarnings = calls.reduce((total, session) => {
        return total + (session.totalCreditsUsed || 0);
      }, 0);
      
      return {
        total: chatEarnings + callEarnings,
        chats: chatEarnings,
        calls: callEarnings
      };
    };
    
    const dailyEarnings = calculateEarnings(dailyChats, dailyCalls);
    const weeklyEarnings = calculateEarnings(weeklyChats, weeklyCalls);
    const monthlyEarnings = calculateEarnings(monthlyChats, monthlyCalls);
    const allTimeEarnings = calculateEarnings(allChats, allCalls);
    
    // Combine session history - UPDATED to use username
    const chatHistory = allChats.map(session => ({
      _id: session._id,
      type: 'chat',
      amount: session.totalAmountPaid || 0,
      durationMinutes: Math.round((session.totalSecondsAllowed - (session.paidSession?.remainingSeconds || 0)) / 60),
      endTime: session.endedAt,
      ratePerMin: session.ratePerMin || 1
    }));
    
    const callHistory = allCalls.map(session => {
      const durationSeconds = session.startTime && session.endTime 
        ? (new Date(session.endTime) - new Date(session.startTime)) / 1000 
        : 0;
      
      return {
        _id: session._id,
        type: 'call',
        amount: session.totalCreditsUsed || 0,
        durationMinutes: Math.round(durationSeconds / 60),
        endTime: session.endTime,
        creditsPerMin: session.creditsPerMin || 1
      };
    });
    
    // Combine and sort session history
    const sessionHistory = [...chatHistory, ...callHistory]
      .sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
    
    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username, // Use username instead of firstName/lastName
          email: user.email,
          image: user.image
        },
        earnings: {
          daily: {
            amount: dailyEarnings.total,
            chatAmount: dailyEarnings.chats,
            callAmount: dailyEarnings.calls,
            sessions: dailyChats.length + dailyCalls.length,
            chatSessions: dailyChats.length,
            callSessions: dailyCalls.length
          },
          weekly: {
            amount: weeklyEarnings.total,
            chatAmount: weeklyEarnings.chats,
            callAmount: weeklyEarnings.calls,
            sessions: weeklyChats.length + weeklyCalls.length,
            chatSessions: weeklyChats.length,
            callSessions: weeklyCalls.length
          },
          monthly: {
            amount: monthlyEarnings.total,
            chatAmount: monthlyEarnings.chats,
            callAmount: monthlyEarnings.calls,
            sessions: monthlyChats.length + monthlyCalls.length,
            chatSessions: monthlyChats.length,
            callSessions: monthlyCalls.length
          },
          allTime: {
            amount: allTimeEarnings.total,
            chatAmount: allTimeEarnings.chats,
            callAmount: allTimeEarnings.calls,
            sessions: allChats.length + allCalls.length,
            chatSessions: allChats.length,
            callSessions: allCalls.length
          }
        },
        sessionHistory: sessionHistory
      }
    });
  } catch (error) {
    console.error('Get psychic earnings by user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get psychic earning statistics (for dashboard) - includes both chat and call
exports.getPsychicEarningsStats = async (req, res) => {
  try {
    const psychicId = req.user._id;
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Chat sessions aggregation
    const [todayChats, weekChats, monthChats, totalChats] = await Promise.all([
      ChatRequest.aggregate([
        {
          $match: {
            psychic: new mongoose.Types.ObjectId(psychicId),
            status: 'completed',
            endedAt: { $gte: todayStart }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmountPaid' },
            sessions: { $sum: 1 }
          }
        }
      ]),
      ChatRequest.aggregate([
        {
          $match: {
            psychic: new mongoose.Types.ObjectId(psychicId),
            status: 'completed',
            endedAt: { $gte: thisWeekStart }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmountPaid' },
            sessions: { $sum: 1 }
          }
        }
      ]),
      ChatRequest.aggregate([
        {
          $match: {
            psychic: new mongoose.Types.ObjectId(psychicId),
            status: 'completed',
            endedAt: { $gte: thisMonthStart }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmountPaid' },
            sessions: { $sum: 1 }
          }
        }
      ]),
      ChatRequest.aggregate([
        {
          $match: {
            psychic: new mongoose.Types.ObjectId(psychicId),
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmountPaid' },
            sessions: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        }
      ])
    ]);
    
    // Call sessions aggregation - convert credits to dollars
    const [todayCalls, weekCalls, monthCalls, totalCalls] = await Promise.all([
      ActiveCallSession.aggregate([
        {
          $match: {
            psychicId: new mongoose.Types.ObjectId(psychicId),
            status: 'ended',
            endTime: { $gte: todayStart }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalCreditsUsed' },
            sessions: { $sum: 1 }
          }
        }
      ]),
      ActiveCallSession.aggregate([
        {
          $match: {
            psychicId: new mongoose.Types.ObjectId(psychicId),
            status: 'ended',
            endTime: { $gte: thisWeekStart }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalCreditsUsed' },
            sessions: { $sum: 1 }
          }
        }
      ]),
      ActiveCallSession.aggregate([
        {
          $match: {
            psychicId: new mongoose.Types.ObjectId(psychicId),
            status: 'ended',
            endTime: { $gte: thisMonthStart }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalCreditsUsed' },
            sessions: { $sum: 1 }
          }
        }
      ]),
      ActiveCallSession.aggregate([
        {
          $match: {
            psychicId: new mongoose.Types.ObjectId(psychicId),
            status: 'ended'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalCreditsUsed' },
            sessions: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' }
          }
        }
      ])
    ]);
    
    // Get unique users from both collections
    const allUniqueUsers = new Set([
      ...(totalChats[0]?.uniqueUsers || []).map(id => id.toString()),
      ...(totalCalls[0]?.uniqueUsers || []).map(id => id.toString())
    ]);
    
    res.json({
      success: true,
      data: {
        today: {
          earnings: (todayChats[0]?.total || 0) + (todayCalls[0]?.total || 0),
          chatEarnings: todayChats[0]?.total || 0,
          callEarnings: todayCalls[0]?.total || 0,
          sessions: (todayChats[0]?.sessions || 0) + (todayCalls[0]?.sessions || 0),
          chatSessions: todayChats[0]?.sessions || 0,
          callSessions: todayCalls[0]?.sessions || 0
        },
        week: {
          earnings: (weekChats[0]?.total || 0) + (weekCalls[0]?.total || 0),
          chatEarnings: weekChats[0]?.total || 0,
          callEarnings: weekCalls[0]?.total || 0,
          sessions: (weekChats[0]?.sessions || 0) + (weekCalls[0]?.sessions || 0),
          chatSessions: weekChats[0]?.sessions || 0,
          callSessions: weekCalls[0]?.sessions || 0
        },
        month: {
          earnings: (monthChats[0]?.total || 0) + (monthCalls[0]?.total || 0),
          chatEarnings: monthChats[0]?.total || 0,
          callEarnings: monthCalls[0]?.total || 0,
          sessions: (monthChats[0]?.sessions || 0) + (monthCalls[0]?.sessions || 0),
          chatSessions: monthChats[0]?.sessions || 0,
          callSessions: monthCalls[0]?.sessions || 0
        },
        allTime: {
          earnings: (totalChats[0]?.total || 0) + (totalCalls[0]?.total || 0),
          chatEarnings: totalChats[0]?.total || 0,
          callEarnings: totalCalls[0]?.total || 0,
          sessions: (totalChats[0]?.sessions || 0) + (totalCalls[0]?.sessions || 0),
          chatSessions: totalChats[0]?.sessions || 0,
          callSessions: totalCalls[0]?.sessions || 0,
          uniqueUsers: allUniqueUsers.size
        }
      }
    });
  } catch (error) {
    console.error('Get psychic earnings stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get session details for psychic
exports.getPsychicSessionDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const psychicId = req.user._id;
    const session = await ChatRequest.findOne({
      _id: requestId,
      psychic: psychicId
    })
      .populate('user', 'firstName lastName email image')
      .populate('paidTimerId');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Get session details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
async function startTimerDeduction(paidTimerId, chatRequestId, userId) {
  console.log(`⏰ Starting timer deduction for: ${chatRequestId}`);
  
  const deductionInterval = setInterval(async () => {
    try {
      const paidTimer = await PaidTimer.findById(paidTimerId);
      const chatRequest = await ChatRequest.findById(chatRequestId);
      
      if (!paidTimer || !chatRequest ||
          paidTimer.status !== 'active' ||
          paidTimer.isPaused ||
          !chatRequest.paidSession.isActive ||
          chatRequest.paidSession.isPaused) {
        
        clearInterval(deductionInterval);
        console.log(`⏰ Timer stopped for: ${chatRequestId}`);
        return;
      }
      
      // Check if timer expired
      if (paidTimer.remainingSeconds <= 0) {
        await handleTimerExpiration(chatRequest, paidTimer);
        clearInterval(deductionInterval);
        return;
      }
      
      // Calculate elapsed time
      const now = new Date();
      const lastUpdate = paidTimer.lastDeductionTime || paidTimer.startTime;
      const secondsElapsed = Math.floor((now - lastUpdate) / 1000);
      
      if (secondsElapsed >= 1) {
        // Update remaining seconds
        const newRemainingSeconds = Math.max(0, paidTimer.remainingSeconds - secondsElapsed);
        paidTimer.remainingSeconds = newRemainingSeconds;
        paidTimer.lastDeductionTime = now;
        
        chatRequest.paidSession.remainingSeconds = newRemainingSeconds;
        chatRequest.paidSession.lastDeductionTime = now;
        chatRequest.paidSession.lastSyncTime = now;
        
        // Calculate deduction amount
        const amountToDeduct = (secondsElapsed / 60) * chatRequest.ratePerMin;
        
        // Update wallet
        const wallet = await Wallet.findOne({ userId: chatRequest.user });
        if (wallet && !wallet.lock) {
          wallet.lock = true;
          
          const newBalance = Math.max(0, wallet.credits - amountToDeduct);
          wallet.credits = newBalance;
          
          paidTimer.remainingBalance = newBalance;
          chatRequest.remainingBalance = newBalance;
          
          // Record deduction
          paidTimer.deductions.push({
            timestamp: now,
            secondsUsed: secondsElapsed,
            amount: amountToDeduct,
            newBalance: newBalance
          });
          
          await wallet.save();
          
          // Unlock wallet
          wallet.lock = false;
          await wallet.save();
          
          console.log(`💰 Deduction: ${amountToDeduct} credits, Remaining: ${newBalance}, Time left: ${newRemainingSeconds}s`);
          
          // Emit real-time update
          if (global.io) {
            const timerData = {
              requestId: chatRequest._id,
              remainingSeconds: newRemainingSeconds,
              currentBalance: newBalance,
              deductedAmount: amountToDeduct,
              timestamp: now,
              totalSeconds: paidTimer.totalSeconds
            };
            
            global.io.to(`user_${chatRequest.user}`).emit('timer_tick', timerData);
            global.io.to(`psychic_${chatRequest.psychic}`).emit('timer_tick', timerData);
            global.io.to(`chat_request_${chatRequest._id}`).emit('timer_tick', timerData);
          }
        }
        
        // Save updates
        await paidTimer.save();
        await chatRequest.save();
        
        // Check if timer reached 0
        if (newRemainingSeconds <= 0) {
          await handleTimerExpiration(chatRequest, paidTimer);
          clearInterval(deductionInterval);
        }
      }
    } catch (error) {
      console.error('❌ Timer deduction error:', error);
      clearInterval(deductionInterval);
    }
  }, 1000); // Check every second
  
  // Store interval reference
  global.timerIntervals = global.timerIntervals || {};
  global.timerIntervals[chatRequestId] = deductionInterval;
}

async function handleTimerExpiration(chatRequest, paidTimer) {
  const now = new Date();
  
  console.log(`⏰ Timer expired for: ${chatRequest._id}`);
  
  // Update chat request
  chatRequest.status = 'completed';
  chatRequest.endedAt = now;
  chatRequest.paidSession.isActive = false;
  chatRequest.paidSession.endTime = now;
  chatRequest.paidSession.remainingSeconds = 0;
  
  // Update paid timer
  paidTimer.status = 'completed';
  paidTimer.endTime = now;
  paidTimer.remainingSeconds = 0;
  
  await chatRequest.save();
  await paidTimer.save();
  
  // Emit session ended event
  if (global.io) {
    const endData = {
      requestId: chatRequest._id,
      endedAt: now,
      reason: 'time_expired',
      remainingSeconds: 0
    };
    
    global.io.to(`user_${chatRequest.user}`).emit('session_ended', endData);
    global.io.to(`psychic_${chatRequest.psychic}`).emit('session_ended', endData);
    global.io.to(`chat_request_${chatRequest._id}`).emit('session_ended', endData);
  }
}

// Helper function for final deduction
// Helper function for final deduction - FIXED VERSION
async function makeFinalDeduction(chatRequest, userId, secondsUsed, amountToDeduct) {
  try {
    const wallet = await Wallet.findOne({ userId: chatRequest.user });
    if (!wallet) return;
    
    // Lock wallet
    wallet.lock = true;
    await wallet.save();
    
    // Only deduct for time used, not remaining balance
    if (amountToDeduct > 0 && wallet.credits >= amountToDeduct) {
      // Calculate new balance (deduct only for time used)
      const newBalance = Math.max(0, wallet.credits - amountToDeduct);
      wallet.credits = newBalance;
      
      console.log(`💰 Final deduction: ${amountToDeduct} credits for ${secondsUsed}s used. Old balance: ${wallet.credits + amountToDeduct}, New balance: ${newBalance}`);
      
      // Record final deduction
      chatRequest.deductions.push({
        amount: amountToDeduct,
        timestamp: new Date(),
        secondsUsed: secondsUsed,
        remainingBalance: newBalance
      });

      chatRequest.totalAmountPaid = (chatRequest.totalAmountPaid || 0) + amountToDeduct;
      chatRequest.remainingBalance = newBalance;
      
      // Save chat request with updated balance
      await chatRequest.save();
    } else if (amountToDeduct > wallet.credits) {
      // If not enough credits, use what's available
      const actualDeducted = wallet.credits;
      const actualSeconds = (actualDeducted / chatRequest.ratePerMin) * 60;
      
      console.log(`⚠️ Not enough credits. Deducting ${actualDeducted} instead of ${amountToDeduct}`);
      
      wallet.credits = 0;
      
      chatRequest.deductions.push({
        amount: actualDeducted,
        timestamp: new Date(),
        secondsUsed: actualSeconds,
        remainingBalance: 0
      });

      chatRequest.totalAmountPaid = (chatRequest.totalAmountPaid || 0) + actualDeducted;
      chatRequest.remainingBalance = 0;
      await chatRequest.save();
    }
    
    // Unlock wallet
    wallet.lock = false;
    await wallet.save();

  } catch (error) {
    console.error('Final deduction error:', error);
    // Ensure wallet is unlocked on error
    try {
      const wallet = await Wallet.findOne({ userId: chatRequest.user });
      if (wallet && wallet.lock) {
        wallet.lock = false;
        await wallet.save();
      }
    } catch (unlockError) {
      console.error('Error unlocking wallet:', unlockError);
    }
  }
}

// Helper function to format time
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}// models/Psychic.js