const CallSession = require('../../models/CallSession/CallSession');
const ActiveCallSession = require('../../models/CallSession/ActiveCallSession');
const CallRequest = require('../../models/CallSession/CallRequest');
const Psychic = require('../../models/HumanChat/Psychic');
const User = require('../../models/User');
const Wallet = require('../../models/Wallet'); // ADD THIS IMPORT
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');


let io;
let twilioService;

const setSocketIO = (socketIO) => {
  io = socketIO;
};

const setTwilioService = (service) => {
  twilioService = service;
};


const initiateCall = async (req, res) => {
  try {
    const { psychicId } = req.params;
    const userId = req.user._id;
    
    console.log(`📞 User ${userId} initiating call to psychic ${psychicId}`);
    
    // ONLY CHECK: If user already has an ACTIVE (in-progress) call with this psychic
    const existingActiveCall = await ActiveCallSession.findOne({
      userId,
      psychicId,
      status: { $in: ['ringing', 'in-progress'] }
    });
    
    if (existingActiveCall) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active call with this psychic',
        existingSessionId: existingActiveCall._id
      });
    }
    
    // Check psychic availability
    const psychic = await Psychic.findById(psychicId);
    if (!psychic) {
      return res.status(404).json({ success: false, message: 'Psychic not found' });
    }
    
    if (psychic.status !== 'online' && psychic.status !== 'away') {
      return res.status(400).json({
        success: false,
        message: 'Psychic is not available for calls right now',
        psychicStatus: psychic.status
      });
    }
    
    // Check user credits
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const hasFreeSession = !user.hasUsedFreeAudioMinute;
    let creditsPerMin = psychic.creditsPerMin || 1;
    
    if (hasFreeSession) {
      creditsPerMin = 0;
    } else if (user.credits < creditsPerMin) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits to initiate call'
      });
    }
    
    // Generate room and tokens
    const roomName = `audio_${uuidv4().replace(/-/g, '')}_${Date.now()}`;
    const callIdentifier = `call_${uuidv4().replace(/-/g, '')}_${Date.now()}`;
    
    let userToken = 'dummy_user_token';
    if (global.twilioService && global.twilioService.isReady && global.twilioService.isReady()) {
      try {
        userToken = global.twilioService.generateVoiceToken(userId, 'client');
      } catch (error) {
        userToken = `dummy_token_user_${userId}`;
      }
    }
    
    // Create call request (ALLOW MULTIPLE REQUESTS)
    const callRequest = new CallRequest({
      userId,
      psychicId,
      status: 'pending',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 1000),
      ratePerMin: psychic.ratePerMin || 1,
      creditsPerMin,
      userCreditsAtRequest: user.credits || 0,
      callIdentifier,
      userToken,
      roomName
    });
    
    await callRequest.save();
    
    // Create active session
    const activeSession = new ActiveCallSession({
      roomName,
      callIdentifier,
      userId,
      psychicId,
      status: 'initiated',
      creditsPerMin,
      ratePerMin: psychic.ratePerMin || 1,
      isFreeSession: hasFreeSession,
      participantTokens: { user: userToken, psychic: null },
      callRequestId: callRequest._id
    });
    
    await activeSession.save();
    
    // Notify psychic via socket
    const audioNamespace = io.of('/audio-calls');
    const psychicSocketId = psychic.socketId;
    
    if (psychicSocketId && audioNamespace) {
      audioNamespace.to(psychicSocketId).emit('incoming-call', {
        callRequestId: callRequest._id,
        callSessionId: activeSession._id,
        userId,
        roomName,
        callIdentifier,
        isFreeSession: hasFreeSession
      });
      
      callRequest.notificationSent = true;
      callRequest.notificationSentAt = new Date();
      await callRequest.save();
    }
    
    // Send response
    res.status(200).json({
      success: true,
      message: 'Call initiated successfully',
      data: {
        callRequestId: callRequest._id,
        callSessionId: activeSession._id,
        roomName,
        callIdentifier,
        token: userToken,
        psychic: {
          _id: psychic._id,
          name: psychic.name,
          image: psychic.image,
          ratePerMin: psychic.ratePerMin
        },
        expiresAt: callRequest.expiresAt,
        isFreeSession: hasFreeSession,
        timeRemaining: 30
      }
    });
    
  } catch (error) {
    console.error('❌ Error initiating call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate call'
    });
  }
};

const acceptCall = async (req, res) => {
  try {
    console.log('📞 Accepting call request...');
    
    const { callRequestId } = req.params;
    const psychicId = req.user._id;
    
    console.log(`🎯 Psychic ${psychicId} accepting call request ${callRequestId}`);
    
    // Find call request
    const callRequest = await CallRequest.findById(callRequestId)
      .populate('userId', 'firstName lastName image email socketId')
      .populate('psychicId', 'name image bio socketId');
    
    if (!callRequest) {
      console.log(`❌ Call request ${callRequestId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Call request not found'
      });
    }
    
    // Verify psychic owns this request
    if (callRequest.psychicId._id.toString() !== psychicId.toString()) {
      console.log(`❌ Unauthorized: Psychic ${psychicId} does not own call request ${callRequestId}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this call'
      });
    }
    
    // Check if already responded
    if (callRequest.status !== 'pending') {
      console.log(`❌ Call request ${callRequestId} already in status: ${callRequest.status}`);
      return res.status(400).json({
        success: false,
        message: `Call request already ${callRequest.status}`
      });
    }
    
    // Check if expired
    const now = new Date();
    const expiresAt = new Date(callRequest.expiresAt);
    if (now > expiresAt) {
      console.log(`⏰ Call request ${callRequestId} expired at ${expiresAt}`);
      callRequest.status = 'expired';
      await callRequest.save();
      
      return res.status(400).json({
        success: false,
        message: 'Call request has expired'
      });
    }
    
    // Check if Twilio service is available
    if (!global.twilioService || !global.twilioService.isReady()) {
      console.error('❌ Twilio service not available or not ready!');
      return res.status(500).json({
        success: false,
        message: 'Audio service unavailable. Please try again.'
      });
    }
    
    // Find or create active session
    let activeSession = await ActiveCallSession.findOne({
      $or: [
        { callRequestId: callRequest._id },
        { 
          userId: callRequest.userId._id, 
          psychicId: callRequest.psychicId._id,
          status: 'initiated'
        }
      ]
    });
    
    let roomName;
    let roomSid;
    
    if (!activeSession) {
      console.log(`ℹ️ No active session found, creating new one...`);
      
      // Generate unique room name
      roomName = `audio_call_${Date.now()}_${callRequestId}`;
      
      try {
        // Create Twilio Video room for audio call
        const room = await global.twilioService.createAudioRoom(roomName);
        roomSid = room.sid;
        console.log(`✅ Created Twilio Video room: ${roomName} (SID: ${roomSid})`);
      } catch (error) {
        console.error('❌ Error creating Twilio room:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create audio room'
        });
      }
      
      // Create new active session
      activeSession = new ActiveCallSession({
        callRequestId: callRequest._id,
        userId: callRequest.userId._id,
        psychicId: callRequest.psychicId._id,
        roomName,
        roomSid,
        callIdentifier: roomName,
        status: 'initiated',
        startTime: new Date(),
        isAudioOnly: true
      });
    } else {
      roomName = activeSession.roomName;
      console.log(`ℹ️ Using existing session with room: ${roomName}`);
    }
    
    // ✅ GENERATE REAL TWILIO VIDEO TOKENS (NO DUMMY TOKENS!)
    let userToken;
    let psychicToken;
    
    try {
      // Generate Video tokens for audio-only call
      const tokens = global.twilioService.generateAudioCallTokens(
        callRequest.userId._id,
        psychicId,
        roomName
      );
      
      userToken = tokens.userToken;
      psychicToken = tokens.psychicToken;
      
      console.log(`✅ Generated Twilio Video tokens:`);
      console.log(`   User token length: ${userToken?.length}`);
      console.log(`   Psychic token length: ${psychicToken?.length}`);
      console.log(`   Room: ${roomName}`);
      
      // Validate tokens
      if (!userToken || !psychicToken) {
        throw new Error('Token generation failed');
      }
      
    } catch (tokenError) {
      console.error('❌ Error generating Twilio tokens:', tokenError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate audio connection tokens'
      });
    }
    
    // Update call request
    callRequest.status = 'accepted';
    callRequest.respondedAt = new Date();
    callRequest.callSessionId = activeSession._id;
    await callRequest.save();
    console.log(`✅ Updated call request status to 'accepted'`);
    
    // Update active session
    activeSession.status = 'ringing';
    activeSession.startTime = new Date();
    activeSession.participantTokens = {
      user: userToken,
      psychic: psychicToken
    };
    
    // Add room name if not set
    if (!activeSession.roomName && roomName) {
      activeSession.roomName = roomName;
    }
    if (!activeSession.roomSid && roomSid) {
      activeSession.roomSid = roomSid;
    }
    
    await activeSession.save();
    console.log(`✅ Updated active session status to 'ringing'`);
    
    // Update psychic status
    await Psychic.findByIdAndUpdate(psychicId, {
      status: 'busy',
      lastActive: new Date()
    });
    console.log(`✅ Updated psychic ${psychicId} status to 'busy'`);
    
    // Prepare response data
    const psychicData = {
      _id: callRequest.psychicId._id,
      name: callRequest.psychicId.name,
      image: callRequest.psychicId.image,
      bio: callRequest.psychicId.bio,
      ratePerMin: callRequest.ratePerMin
    };
    
    const userData = {
      _id: callRequest.userId._id,
      firstName: callRequest.userId.firstName,
      lastName: callRequest.userId.lastName,
      image: callRequest.userId.image,
      email: callRequest.userId.email
    };
    
    // Send socket notification to user
    if (io) {
      const audioNamespace = io.of('/audio-calls');
      const userSocketId = callRequest.userId.socketId;
      
      const callAcceptedData = {
        callRequestId: callRequest._id,
        callSessionId: activeSession._id,
        roomName: activeSession.roomName,
        roomSid: activeSession.roomSid,
        token: userToken, // ✅ REAL VIDEO TOKEN
        psychic: psychicData,
        startTime: activeSession.startTime
      };
      
      if (userSocketId && audioNamespace) {
        audioNamespace.to(userSocketId).emit('call-accepted', callAcceptedData);
        console.log(`📢 Sent 'call-accepted' event to user ${callRequest.userId._id}`);
      } else {
        console.log(`⚠️  User ${callRequest.userId._id} not connected via socket, storing for later...`);
      }
    }
    
    // Send response to psychic (frontend)
    res.status(200).json({
      success: true,
      message: 'Call accepted successfully',
      data: {
        callRequestId: callRequest._id,
        callSessionId: activeSession._id,
        roomName: activeSession.roomName,
        roomSid: activeSession.roomSid,
        token: psychicToken, // ✅ REAL VIDEO TOKEN
        user: userData,
        startTime: activeSession.startTime,
        ratePerMin: callRequest.ratePerMin,
        creditsPerMin: callRequest.creditsPerMin
      }
    });
    
    console.log(`🎉 Call ${callRequestId} accepted successfully!`);
    
  } catch (error) {
    console.error('❌ Error accepting call:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to accept call',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get specific call request by ID (for psychic)
const getCallRequestById = async (req, res) => {
  try {
    const { callRequestId } = req.params;
    
    console.log(`🔍 Fetching call request ${callRequestId}`);
    
    const token = req.cookies?.token || 
                  req.headers.authorization?.split(' ')[1] || 
                  req.query.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please login first'
      });
    }
    
    const decoded = jwt.decode(token);
    
    const psychic = await Psychic.findOne({ 
      email: decoded?.email || 'ranazia943@gmail.com' 
    });
    
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }
    
    const callRequest = await CallRequest.findById(callRequestId)
      .populate('userId', 'firstName lastName image email phone location credits rating totalSessions')
      .populate('psychicId', 'name image bio ratePerMin specialties status');

    if (!callRequest) {
      return res.status(404).json({
        success: false,
        message: 'Call request not found'
      });
    }

    if (callRequest.psychicId._id.toString() !== psychic._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this call request'
      });
    }

    const now = new Date();
    const expiresAt = new Date(callRequest.expiresAt);
    let timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    
    if (callRequest.status === 'pending' && now > expiresAt) {
      callRequest.status = 'expired';
      await callRequest.save();
      timeRemaining = 0;
    }

    const activeSession = await ActiveCallSession.findOne({
      callRequestId: callRequest._id,
      status: { $in: ['ringing', 'in-progress'] }
    }).select('_id status startTime roomName participantTokens');

    let elapsedSeconds = 0;
    let creditsUsed = 0;
    if (activeSession && activeSession.startTime && activeSession.status === 'in-progress') {
      const startTime = new Date(activeSession.startTime);
      elapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
      creditsUsed = Math.ceil(elapsedSeconds / 60) * (callRequest.creditsPerMin || 1);
    }

    const responseData = {
      ...callRequest.toObject(),
      timeRemaining,
      activeSession: activeSession ? {
        ...activeSession.toObject(),
        elapsedSeconds,
        creditsUsed
      } : null,
      elapsedSeconds,
      creditsUsed,
      isExpired: callRequest.status === 'expired',
      canAccept: callRequest.status === 'pending' && timeRemaining > 0
    };

    res.status(200).json({
      success: true,
      message: 'Call request fetched successfully',
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error fetching call request by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call request',
      error: error.message
    });
  }
};

// Get call with details
const getCallWithDetails = async (req, res) => {
  try {
    const { callRequestId } = req.params;
    const psychicId = req.user._id;
    
    console.log(`🔍 Fetching detailed call request ${callRequestId} for psychic ${psychicId}`);
    
    const callRequest = await CallRequest.findById(callRequestId)
      .populate('userId', 'firstName lastName image email phone')
      .populate('psychicId', 'name image bio ratePerMin');

    if (!callRequest) {
      return res.status(404).json({
        success: false,
        message: 'Call request not found'
      });
    }

    if (callRequest.psychicId._id.toString() !== psychicId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const now = new Date();
    let timeRemaining = 0;
    let isExpired = false;
    
    if (callRequest.expiresAt) {
      const expiresAt = new Date(callRequest.expiresAt);
      timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      isExpired = timeRemaining === 0;
      
      if (isExpired && callRequest.status === 'pending') {
        callRequest.status = 'expired';
        await callRequest.save();
        console.log(`⚠️  Auto-updated call ${callRequestId} to expired`);
      }
    }

    const activeSession = await ActiveCallSession.findOne({
      $or: [
        { callRequestId: callRequest._id },
        { userId: callRequest.userId._id, psychicId: callRequest.psychicId._id }
      ],
      status: { $in: ['ringing', 'in-progress'] }
    }).select('_id status startTime roomName participantTokens');
    
    let elapsedSeconds = 0;
    let creditsUsed = 0;
    if (activeSession && activeSession.startTime && activeSession.status === 'in-progress') {
      const startTime = new Date(activeSession.startTime);
      elapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
      creditsUsed = Math.ceil(elapsedSeconds / 60) * (callRequest.creditsPerMin || 1);
    }

    const responseData = {
      callRequest: {
        _id: callRequest._id,
        status: callRequest.status,
        requestedAt: callRequest.requestedAt,
        expiresAt: callRequest.expiresAt,
        ratePerMin: callRequest.ratePerMin,
        creditsPerMin: callRequest.creditsPerMin,
        userCreditsAtRequest: callRequest.userCreditsAtRequest,
        timeRemaining,
        isExpired
      },
      user: callRequest.userId,
      psychic: callRequest.psychicId,
      activeSession: activeSession ? {
        ...activeSession.toObject(),
        elapsedSeconds,
        creditsUsed
      } : null,
      elapsedSeconds,
      creditsUsed,
      canAccept: callRequest.status === 'pending' && timeRemaining > 0 && !activeSession,
      canJoin: activeSession && activeSession.status === 'ringing'
    };

    res.status(200).json({
      success: true,
      message: 'Call details fetched successfully',
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error fetching call details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call details',
      error: error.message
    });
  }
};

const rejectCall = async (req, res) => {
  try {
    console.log('❌ Rejecting call request...');
    
    const { callRequestId } = req.params;
    const { reason } = req.body;
    const psychicId = req.user._id;
    
    console.log(`🎯 Psychic ${psychicId} rejecting call ${callRequestId}`);
    
    let activeSession = await ActiveCallSession.findOne({
      $or: [
        { _id: callRequestId },
        { callRequestId: callRequestId },
        { callIdentifier: callRequestId }
      ]
    }).populate('userId');
    
    if (!activeSession) {
      console.log('❌ Call not found in ActiveCallSession, trying CallRequest...');
      
      const callRequest = await CallRequest.findById(callRequestId)
        .populate('userId');
      
      if (!callRequest) {
        return res.status(404).json({
          success: false,
          message: 'Call not found'
        });
      }
      
      if (callRequest.psychicId.toString() !== psychicId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to reject this call'
        });
      }
      
      if (callRequest.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Call already ${callRequest.status}`
        });
      }
      
      callRequest.status = 'rejected';
      callRequest.rejectionReason = reason || 'Psychic not available';
      callRequest.respondedAt = new Date();
      await callRequest.save();
      
      await ActiveCallSession.findOneAndUpdate(
        { 
          $or: [
            { callRequestId: callRequest._id },
            { userId: callRequest.userId, psychicId: callRequest.psychicId }
          ]
        },
        {
          status: 'rejected',
          endReason: 'psychic_rejected',
          endTime: new Date()
        }
      );
      
      await Psychic.findByIdAndUpdate(psychicId, {
        status: 'online',
        lastActive: new Date()
      });
      
      const io = req.app.get('io');
      if (io && callRequest.userId) {
        const audioNamespace = io.of('/audio-calls');
        audioNamespace.to(callRequest.userId.toString()).emit('call-rejected', {
          callRequestId: callRequest._id,
          reason: reason || 'Psychic rejected the call',
          psychicId
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Call rejected successfully'
      });
    }
    
    console.log('✅ Found call in ActiveCallSession:', activeSession._id);
    
    if (activeSession.psychicId.toString() !== psychicId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this call'
      });
    }
    
    if (activeSession.status !== 'initiated' && activeSession.status !== 'ringing') {
      return res.status(400).json({
        success: false,
        message: `Call already ${activeSession.status}`
      });
    }
    
    activeSession.status = 'rejected';
    activeSession.endReason = 'psychic_rejected';
    activeSession.endTime = new Date();
    activeSession.endedBy = 'psychic';
    
    activeSession.metadata = {
      ...(activeSession.metadata || {}),
      rejectionReason: reason || 'Not available',
      rejectedAt: new Date()
    };
    
    await activeSession.save();
    
    if (activeSession.callRequestId) {
      await CallRequest.findByIdAndUpdate(activeSession.callRequestId, {
        status: 'rejected',
        rejectionReason: reason || 'Psychic not available',
        respondedAt: new Date()
      });
    }
    
    await Psychic.findByIdAndUpdate(psychicId, {
      status: 'online',
      lastActive: new Date()
    });
    
    const io = req.app.get('io');
    if (io && activeSession.userId) {
      const audioNamespace = io.of('/audio-calls');
      
      audioNamespace.to(activeSession.userId.toString()).emit('call-rejected', {
        callRequestId: activeSession._id,
        callSessionId: activeSession._id,
        reason: reason || 'Psychic rejected the call',
        psychicId
      });
      
      if (activeSession.roomName) {
        audioNamespace.to(activeSession.roomName).emit('call-rejected', {
          callRequestId: activeSession._id,
          callSessionId: activeSession._id,
          reason: reason || 'Psychic rejected the call',
          psychicId
        });
      }
      
      console.log('✅ Sent call-rejected socket events');
    }
    
    res.status(200).json({
      success: true,
      message: 'Call rejected successfully',
      data: {
        callId: activeSession._id,
        status: 'rejected',
        rejectionReason: reason || 'Not available'
      }
    });
    
  } catch (error) {
    console.error('❌ Error rejecting call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject call',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cancel Call (User)
const cancelCall = async (req, res) => {
  try {
    const { callRequestId } = req.params;
    const userId = req.user._id;
    
    const callRequest = await CallRequest.findById(callRequestId)
      .populate('psychicId');
    
    if (!callRequest) {
      return res.status(404).json({
        success: false,
        message: 'Call request not found'
      });
    }
    
    if (callRequest.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this call'
      });
    }
    
    callRequest.status = 'cancelled';
    callRequest.respondedAt = new Date();
    await callRequest.save();
    
    await ActiveCallSession.findOneAndUpdate({
      userId: callRequest.userId,
      psychicId: callRequest.psychicId,
      status: { $in: ['initiated', 'ringing'] }
    }, {
      status: 'ended',
      endReason: 'user_cancelled',
      endTime: new Date()
    });
    
    if (callRequest.psychicId) {
      await Psychic.findByIdAndUpdate(callRequest.psychicId._id, {
        status: 'online',
        lastActive: new Date()
      });
    }
    
    const audioNamespace = io.of('/audio-calls');
    const psychicSocketId = callRequest.psychicId.socketId;
    
    if (psychicSocketId && audioNamespace) {
      audioNamespace.to(psychicSocketId).emit('call-cancelled', {
        callRequestId: callRequest._id,
        userId
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Call cancelled'
    });
    
  } catch (error) {
    console.error('Error cancelling call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel call',
      error: error.message
    });
  }
};

// ============= TIMER SYNC ENDPOINT - FIXED VERSION =============
const syncCallTimer = async (req, res) => {
  try {
    const { callSessionId } = req.params;
    const userId = req.user?._id;
    
    console.log(`⏱️ Timer sync requested for session: ${callSessionId}`);
    
    // Find the active session
    const activeSession = await ActiveCallSession.findById(callSessionId)
      .populate('userId', 'firstName lastName')
      .populate('psychicId', 'name');
    
    if (!activeSession) {
      const archivedSession = await CallSession.findOne({ 
        $or: [
          { _id: callSessionId },
          { callSid: callSessionId }
        ]
      });
      
      if (archivedSession) {
        return res.status(200).json({
          success: true,
          data: {
            callSessionId: archivedSession._id,
            elapsedSeconds: archivedSession.durationSeconds || 0,
            startTime: archivedSession.startTime,
            endTime: archivedSession.endTime,
            status: 'completed',
            isArchived: true,
            creditsUsed: archivedSession.totalCreditsUsed || 0,
            currentCredits: 0
          }
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Call session not found'
      });
    }
    
    // Verify user has access
    const isUser = activeSession.userId?._id?.toString() === userId?.toString();
    const isPsychicUser = activeSession.psychicId?._id?.toString() === userId?.toString();
    
    if (!isUser && !isPsychicUser && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this call'
      });
    }
    
    // Calculate elapsed time
    const now = new Date();
    let elapsedSeconds = 0;
    
    if (activeSession.status === 'in-progress' && activeSession.startTime) {
      elapsedSeconds = Math.floor((now - new Date(activeSession.startTime)) / 1000);
    } else if (activeSession.elapsedSeconds) {
      elapsedSeconds = activeSession.elapsedSeconds;
    } else if (activeSession.startTime && activeSession.endTime) {
      elapsedSeconds = Math.floor((new Date(activeSession.endTime) - new Date(activeSession.startTime)) / 1000);
    }
    
    // Calculate credits used
    const creditsPerMin = activeSession.creditsPerMin || 1;
    const minutesUsed = Math.ceil(elapsedSeconds / 60);
    let creditsUsed = minutesUsed * creditsPerMin;
    
    // Handle free session (first minute free)
    if (activeSession.isFreeSession) {
      if (elapsedSeconds <= 60) {
        creditsUsed = 0;
      } else {
        const billableSeconds = elapsedSeconds - 60;
        const billableMinutes = Math.ceil(billableSeconds / 60);
        creditsUsed = billableMinutes * creditsPerMin;
      }
    }
    
    // Use stored totalCreditsUsed if available
    if (activeSession.totalCreditsUsed && activeSession.totalCreditsUsed > 0) {
      creditsUsed = activeSession.totalCreditsUsed;
    }
    
    // Get current wallet balance for real-time display
    let currentCredits = 0;
    try {
      const wallet = await Wallet.findOne({ userId: activeSession.userId });
      if (wallet) {
        currentCredits = wallet.credits || 0;
      }
    } catch (walletError) {
      console.error('Error fetching wallet:', walletError);
    }
    
    console.log(`⏱️ Timer calc: elapsed=${elapsedSeconds}s, creditsUsed=${creditsUsed}, currentCredits=${currentCredits}`);
    
    const responseData = {
      callSessionId: activeSession._id,
      callRequestId: activeSession.callRequestId,
      elapsedSeconds: elapsedSeconds,
      startTime: activeSession.startTime,
      endTime: activeSession.endTime,
      status: activeSession.status,
      creditsUsed: creditsUsed,
      currentCredits: currentCredits,
      ratePerMin: activeSession.ratePerMin || creditsPerMin,
      creditsPerMin: creditsPerMin,
      isFreeSession: activeSession.isFreeSession || false,
      roomName: activeSession.roomName,
      participantTokens: activeSession.participantTokens
    };
    
    // Add participant info based on who's requesting
    if (isUser) {
      responseData.psychic = {
        _id: activeSession.psychicId?._id,
        name: activeSession.psychicId?.name,
        image: activeSession.psychicId?.image
      };
    } else if (isPsychicUser) {
      responseData.user = {
        _id: activeSession.userId?._id,
        firstName: activeSession.userId?.firstName,
        lastName: activeSession.userId?.lastName,
        image: activeSession.userId?.image
      };
    }
    
    res.status(200).json({
      success: true,
      data: responseData
    });
    
  } catch (error) {
    console.error('❌ Error syncing timer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync timer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const endCall = async (req, res) => {
  try {
    const { callSessionId } = req.params;
    const { endReason } = req.body;
    const userId = req.user._id;
    const isPsychic = req.originalUrl.includes('/psychic/');
    
    console.log(`📞 Ending call session: ${callSessionId}, user: ${userId}, isPsychic: ${isPsychic}`);
    
    const activeSession = await ActiveCallSession.findById(callSessionId)
      .populate('userId', 'firstName lastName email credits hasUsedFreeAudioMinute socketId')
      .populate('psychicId', 'name email socketId totalEarnings totalCalls totalMinutes status');
    
    if (!activeSession) {
      return res.status(404).json({
        success: false,
        message: 'Call session not found'
      });
    }
    
    const isUser = activeSession.userId._id.toString() === userId.toString();
    const isPsychicParticipant = activeSession.psychicId._id.toString() === userId.toString();
    
    if (!isUser && !isPsychicParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to end this call'
      });
    }
    
    if (activeSession.status === 'ended' || activeSession.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Call has already ended'
      });
    }
    
    const endTime = new Date();
    let durationSeconds = 0;
    let startTime = activeSession.startTime;
    
    if (startTime) {
      durationSeconds = Math.floor((endTime - new Date(startTime)) / 1000);
      console.log(`⏱️ Call duration: ${durationSeconds} seconds`);
    } else {
      console.log(`⚠️ No start time found for session, setting duration to 0`);
      startTime = endTime;
    }
    
    durationSeconds = Math.max(0, durationSeconds);
    
    const minutesUsed = Math.ceil(durationSeconds / 60);
    const creditsPerMin = activeSession.creditsPerMin || 1;
    const creditsUsed = minutesUsed * creditsPerMin;
    
    const endedBy = isPsychic ? 'psychic' : (isUser ? 'user' : 'unknown');
    const finalEndReason = endReason || (endedBy === 'user' ? 'ended_by_user' : 'ended_by_psychic');
    
    console.log(`📊 Call stats:`, {
      durationSeconds,
      minutesUsed,
      creditsPerMin,
      creditsUsed,
      endedBy,
      isFreeSession: activeSession.isFreeSession
    });
    
    // Handle free session
    if (activeSession.isFreeSession) {
      if (durationSeconds > 0) {
        await User.findByIdAndUpdate(activeSession.userId._id, {
          hasUsedFreeAudioMinute: true
        });
        console.log(`✅ Marked free session as used for user ${activeSession.userId._id}`);
      }
      
      let billableSeconds = Math.max(0, durationSeconds - 60);
      const billableMinutes = Math.ceil(billableSeconds / 60);
      const creditsToDeduct = billableMinutes * creditsPerMin;
      
      if (creditsToDeduct > 0 && !activeSession.isFreeSession) {
        await User.findByIdAndUpdate(activeSession.userId._id, {
          $inc: { credits: -creditsToDeduct }
        });
        console.log(`💰 Deducted ${creditsToDeduct} credits from user (beyond free minute)`);
      }
    } else {
      if (creditsUsed > 0) {
        await User.findByIdAndUpdate(activeSession.userId._id, {
          $inc: { credits: -creditsUsed }
        });
        console.log(`💰 Deducted ${creditsUsed} credits from user`);
      }
    }
    
    // Update psychic earnings
    const psychicEarnings = creditsUsed * 0.7;
    
    await Psychic.findByIdAndUpdate(activeSession.psychicId._id, {
      $inc: { 
        totalEarnings: psychicEarnings,
        totalCalls: 1,
        totalMinutes: minutesUsed
      },
      status: 'online',
      lastActive: new Date()
    });
    console.log(`💰 Added ${psychicEarnings} earnings to psychic`);
    
    // Update user stats
    await User.findByIdAndUpdate(activeSession.userId._id, {
      $inc: {
        totalCalls: 1,
        totalMinutes: minutesUsed
      }
    });
    
    // Archive the session
    const archivedSession = new CallSession({
      callSid: activeSession._id.toString(),
      roomName: activeSession.roomName,
      roomSid: activeSession.twilioRoomSid || activeSession.roomSid,
      userId: activeSession.userId._id,
      psychicId: activeSession.psychicId._id,
      callRequestId: activeSession.callRequestId,
      status: 'completed',
      endReason: finalEndReason,
      endedBy: endedBy,
      startTime: startTime,
      endTime: endTime,
      durationSeconds: durationSeconds,
      ratePerMin: activeSession.ratePerMin || 1,
      creditsPerMin: creditsPerMin,
      totalCreditsUsed: creditsUsed,
      psychicEarnings: psychicEarnings,
      platformFee: creditsUsed * 0.3,
      isFreeSession: activeSession.isFreeSession || false,
      userPlatform: activeSession.userPlatform || 'web',
      psychicPlatform: activeSession.psychicPlatform || 'web'
    });
    
    await archivedSession.save();
    console.log(`📦 Archived session created: ${archivedSession._id}`);
    
    // Update active session
    activeSession.status = 'ended';
    activeSession.endTime = endTime;
    activeSession.endReason = finalEndReason;
    activeSession.endedBy = endedBy;
    activeSession.durationSeconds = durationSeconds;
    activeSession.totalCreditsUsed = creditsUsed;
    await activeSession.save();
    console.log(`✅ Active session ${callSessionId} status updated to 'ended'`);
    
    // Socket notifications
    const io = req.app.get('io');
    
    if (io) {
      const audioNamespace = io.of('/audio-calls');
      
      const endCallData = {
        callSessionId: activeSession._id.toString(),
        callRequestId: activeSession.callRequestId,
        duration: durationSeconds,
        durationFormatted: formatDuration(durationSeconds),
        creditsUsed,
        endReason: finalEndReason,
        endedBy: endedBy,
        endTime: endTime.toISOString(),
        roomName: activeSession.roomName
      };
      
      if (activeSession.userId && activeSession.userId.socketId) {
        audioNamespace.to(activeSession.userId.socketId).emit('call-ended', {
          ...endCallData,
          role: 'user',
          message: endedBy === 'user' ? 'You ended the call' : 
                  (endedBy === 'psychic' ? 'Psychic ended the call' : 'Call ended')
        });
        console.log(`👤 Notified user ${activeSession.userId._id} via socket`);
      }
      
      if (activeSession.psychicId && activeSession.psychicId.socketId) {
        audioNamespace.to(activeSession.psychicId.socketId).emit('call-ended', {
          ...endCallData,
          role: 'psychic',
          message: endedBy === 'psychic' ? 'You ended the call' : 
                  (endedBy === 'user' ? 'User ended the call' : 'Call ended')
        });
        console.log(`🔮 Notified psychic ${activeSession.psychicId._id} via socket`);
      }
      
      if (activeSession.roomName) {
        audioNamespace.to(activeSession.roomName).emit('room-closed', {
          roomName: activeSession.roomName,
          reason: 'call_ended',
          endedBy: endedBy
        });
      }
    }
    
    // Clean up Twilio room
    if (global.twilioService && global.twilioService.isReady && global.twilioService.isReady()) {
      try {
        if (activeSession.roomSid || activeSession.twilioRoomSid) {
          const roomSid = activeSession.roomSid || activeSession.twilioRoomSid;
          await global.twilioService.completeRoom(roomSid);
          console.log(`✅ Twilio room ${roomSid} completed`);
        }
      } catch (twilioError) {
        console.error('❌ Error ending Twilio room:', twilioError);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Call ended successfully',
      data: {
        callSessionId: activeSession._id,
        callRequestId: activeSession.callRequestId,
        duration: durationSeconds,
        durationFormatted: formatDuration(durationSeconds),
        creditsUsed,
        endReason: finalEndReason,
        endedBy: endedBy,
        endTime: endTime
      }
    });
    
    console.log(`✅ Call ${callSessionId} ended successfully after ${durationSeconds}s`);
    
  } catch (error) {
    console.error('❌ Error ending call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end call',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function for disconnections
const handleCallDisconnection = async (socket, io) => {
  try {
    console.log(`🔌 Handling disconnection for socket: ${socket.id}`);
    
    const activeSession = await ActiveCallSession.findOne({
      $or: [
        { 'userId.socketId': socket.id },
        { 'psychicId.socketId': socket.id }
      ]
    }).populate('userId').populate('psychicId');
    
    if (activeSession) {
      console.log(`📞 Found active session ${activeSession._id} for disconnected socket`);
      
      const isUser = activeSession.userId?.socketId === socket.id;
      const isPsychic = activeSession.psychicId?.socketId === socket.id;
      
      if (isUser || isPsychic) {
        const endReason = isUser ? 'user_disconnected' : 'psychic_disconnected';
        
        const endTime = new Date();
        let durationSeconds = 0;
        
        if (activeSession.startTime) {
          durationSeconds = Math.floor((endTime - activeSession.startTime) / 1000);
        }
        
        const archivedSession = new CallSession({
          callSid: activeSession._id.toString(),
          roomName: activeSession.roomName,
          userId: activeSession.userId._id,
          psychicId: activeSession.psychicId._id,
          status: 'disconnected',
          endReason: endReason,
          endedBy: isUser ? 'user' : 'psychic',
          startTime: activeSession.startTime,
          endTime,
          durationSeconds,
          ratePerMin: activeSession.ratePerMin,
          creditsPerMin: activeSession.creditsPerMin,
          totalCreditsUsed: 0,
          isFreeSession: activeSession.isFreeSession
        });
        
        await archivedSession.save();
        await ActiveCallSession.deleteOne({ _id: activeSession._id });
        
        const audioNamespace = io.of('/audio-calls');
        const otherSocketId = isUser ? activeSession.psychicId?.socketId : activeSession.userId?.socketId;
        
        if (otherSocketId) {
          audioNamespace.to(otherSocketId).emit('call-completed', {
            callSessionId: activeSession._id,
            duration: durationSeconds,
            endReason: endReason,
            endedBy: isUser ? 'user' : 'psychic',
            message: isUser ? 'User disconnected' : 'Psychic disconnected'
          });
        }
        
        if (activeSession.roomName) {
          audioNamespace.to(activeSession.roomName).emit('call-ended-broadcast', {
            callSessionId: activeSession._id,
            reason: 'participant_disconnected'
          });
        }
        
        console.log(`✅ Call auto-ended due to ${endReason}`);
      }
    }
  } catch (error) {
    console.error('Error handling disconnection:', error);
  }
};

// Get Call Status
const getCallStatus = async (req, res) => {
  try {
    const { callSessionId } = req.params;
    const userId = req.user._id;
    
    const activeSession = await ActiveCallSession.findById(callSessionId)
      .populate('psychicId', 'name image bio ratePerMin')
      .populate('userId', 'firstName lastName image');
    
    if (!activeSession) {
      const archivedSession = await CallSession.findById(callSessionId)
        .populate('psychicId', 'name image')
        .populate('userId', 'firstName lastName');
      
      if (!archivedSession) {
        return res.status(404).json({
          success: false,
          message: 'Call session not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          ...archivedSession.toObject(),
          isArchived: true
        }
      });
    }
    
    if (activeSession.userId._id.toString() !== userId.toString() && 
        activeSession.psychicId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this call'
      });
    }
    
    let elapsedSeconds = 0;
    if (activeSession.startTime && activeSession.status === 'in-progress') {
      elapsedSeconds = Math.floor((new Date() - activeSession.startTime) / 1000);
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...activeSession.toObject(),
        elapsedSeconds,
        isActive: activeSession.status === 'in-progress'
      }
    });
    
  } catch (error) {
    console.error('Error getting call status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call status',
      error: error.message
    });
  }
};

// Get User's Call History
const getUserCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const [calls, total] = await Promise.all([
      CallSession.find({ userId })
        .populate('psychicId', 'name image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CallSession.countDocuments({ userId })
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        calls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting call history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call history',
      error: error.message
    });
  }
};

const getPsychicCallHistory = async (req, res) => {
  try {
    console.log('📋 Getting psychic call history for:', req.user.name);
    
    const psychicId = req.user._id;
    const { page = 1, limit = 20, status } = req.query;
    
    const skip = (page - 1) * limit;
    
    let query = { psychicId };
    
    if (status && status !== 'all') {
      query.status = status;
    } else {
      query.status = { $nin: ['initiated', 'ringing'] };
    }
    
    const [calls, total] = await Promise.all([
      ActiveCallSession.find(query)
        .populate('userId', 'username firstName lastName image email')
        .populate('psychicId', 'name email image ratePerMin')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActiveCallSession.countDocuments(query)
    ]);
    
    const callRequestIds = calls
      .map(call => call.callRequestId)
      .filter(id => id);
    
    const callRequests = await CallRequest.find({
      _id: { $in: callRequestIds }
    }).lean();
    
    const callRequestMap = {};
    callRequests.forEach(cr => {
      callRequestMap[cr._id.toString()] = cr;
    });
    
    const formattedCalls = calls.map(call => {
      const callRequest = call.callRequestId ? callRequestMap[call.callRequestId.toString()] : null;
      
      let durationSeconds = 0;
      
      if (call.totalCreditsUsed) {
        durationSeconds = call.totalCreditsUsed * 60;
      } else if (call.startTime && call.endTime) {
        durationSeconds = Math.floor((new Date(call.endTime) - new Date(call.startTime)) / 1000);
      }
      
      const ratePerMin = call.ratePerMin || callRequest?.ratePerMin || 1;
      const totalPaid = (durationSeconds / 60) * ratePerMin;
      const psychicEarnings = totalPaid * 0.25;
      
      return {
        _id: call._id,
        callSessionId: call._id,
        callRequestId: call.callRequestId,
        status: call.status,
        ratePerMin: ratePerMin,
        creditsPerMin: call.creditsPerMin || 1,
        requestedAt: callRequest?.requestedAt || call.createdAt,
        startedAt: call.startTime,
        endedAt: call.endTime,
        expiresAt: callRequest?.expiresAt,
        durationSeconds,
        totalPaid,
        psychicEarnings,
        platformEarnings: totalPaid * 0.75,
        endReason: call.endReason,
        isFreeSession: call.isFreeSession || false,
        userId: call.userId ? {
          _id: call.userId._id,
          username: call.userId.username || 'Unknown',
          firstName: call.userId.firstName || '',
          lastName: call.userId.lastName || '',
          image: call.userId.image || '',
          email: call.userId.email || ''
        } : null,
        psychicId: call.psychicId ? {
          _id: call.psychicId._id,
          name: call.psychicId.name || 'Unknown',
          email: call.psychicId.email || '',
          image: call.psychicId.image || '',
          ratePerMin: call.psychicId.ratePerMin || 1
        } : null,
        createdAt: call.createdAt,
        updatedAt: call.updatedAt,
        durationFormatted: formatDuration(durationSeconds),
        earningsFormatted: `$${psychicEarnings.toFixed(2)}`,
        totalPaidFormatted: `$${totalPaid.toFixed(2)}`,
        dateFormatted: new Date(call.createdAt).toLocaleDateString()
      };
    });
    
    const summary = {
      total: total,
      initiated: calls.filter(c => c.status === 'initiated').length,
      ringing: calls.filter(c => c.status === 'ringing').length,
      'in-progress': calls.filter(c => c.status === 'in-progress').length,
      ended: calls.filter(c => c.status === 'ended').length,
      completed: calls.filter(c => c.status === 'completed').length,
      rejected: calls.filter(c => c.status === 'rejected').length,
      failed: calls.filter(c => c.status === 'failed').length,
      totalEarnings: formattedCalls.reduce((sum, call) => sum + (call.psychicEarnings || 0), 0),
      totalDuration: formattedCalls.reduce((sum, call) => sum + (call.durationSeconds || 0), 0)
    };
    
    res.status(200).json({
      success: true,
      message: `Found ${total} call${total !== 1 ? 's' : ''} in history`,
      data: {
        calls: formattedCalls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        summary
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting psychic call history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call history',
      error: error.message
    });
  }
};

// Helper function
const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Twilio Webhook Handler
const twilioWebhook = async (req, res) => {
  try {
    const event = req.body;
    console.log('Twilio webhook received:', event.EventType);
    
    if (event.EventType === 'room-created') {
      const { RoomSid, RoomName } = event;
      
      await ActiveCallSession.findOneAndUpdate(
        { roomName: RoomName },
        { twilioRoomSid: RoomSid }
      );
    }
    
    if (event.EventType === 'participant-connected') {
      const { RoomSid } = event;
      
      const session = await ActiveCallSession.findOne({ twilioRoomSid: RoomSid });
      
      if (session && !session.startTime) {
        session.status = 'in-progress';
        session.startTime = new Date();
        session.lastChargeTime = new Date();
        await session.save();
        
        const audioNamespace = io.of('/audio-calls');
        
        if (session.userId.socketId) {
          audioNamespace.to(session.userId.socketId).emit('call-joined', {
            callSessionId: session._id,
            startTime: session.startTime
          });
        }
        
        if (session.psychicId.socketId) {
          audioNamespace.to(session.psychicId.socketId).emit('call-joined', {
            callSessionId: session._id,
            startTime: session.startTime
          });
        }
      }
    }
    
    if (event.EventType === 'recording-completed') {
      const { RoomSid, RecordingSid, RecordingUrl } = event;
      
      await ActiveCallSession.findOneAndUpdate(
        { twilioRoomSid: RoomSid },
        { recordingSid: RecordingSid, recordingUrl: RecordingUrl }
      );
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error in Twilio webhook:', error);
    res.status(500).send('Error');
  }
};

// Get Active Call for User
const getActiveCall = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log(`🔍 Fetching active call for user ${userId}`);
    
    const activeSession = await ActiveCallSession.findOne({
      userId,
      status: { $in: ['initiated', 'ringing', 'in-progress'] }
    })
    .populate('psychicId', 'name image bio ratePerMin specialization averageRating totalCalls')
    .populate('userId', 'firstName lastName image email')
    .sort({ createdAt: -1 });
    
    const pendingRequest = await CallRequest.findOne({
      userId,
      status: 'pending'
    })
    .populate('psychicId', 'name image bio ratePerMin specialization averageRating totalCalls')
    .sort({ requestedAt: -1 });
    
    let timeRemaining = 0;
    let isExpired = false;
    const now = new Date();
    
    if (pendingRequest && pendingRequest.expiresAt) {
      const expiresAt = new Date(pendingRequest.expiresAt);
      timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      isExpired = timeRemaining === 0;
      
      if (isExpired && pendingRequest.status === 'pending') {
        pendingRequest.status = 'expired';
        await pendingRequest.save();
        console.log(`⚠️ Auto-expired pending request ${pendingRequest._id}`);
        
        const io = req.app.get('io');
        if (io) {
          const audioNamespace = io.of('/audio-calls');
          audioNamespace.to(userId.toString()).emit('call-expired', {
            callRequestId: pendingRequest._id,
            message: 'Call request expired'
          });
        }
      }
    }
    
    let elapsedSeconds = 0;
    let creditsUsed = 0;
    let callStatus = null;
    
    if (activeSession) {
      callStatus = activeSession.status;
      
      if (activeSession.startTime) {
        const startTime = new Date(activeSession.startTime);
        elapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
        
        const minutesUsed = Math.ceil(elapsedSeconds / 60);
        creditsUsed = minutesUsed * (activeSession.creditsPerMin || 1);
      }
    }
    
    const responseData = {
      success: true,
      data: {
        activeSession: activeSession ? {
          ...activeSession.toObject(),
          elapsedSeconds,
          creditsUsed
        } : null,
        pendingRequest: pendingRequest ? {
          ...pendingRequest.toObject(),
          timeRemaining,
          isExpired
        } : null,
        elapsedSeconds,
        creditsUsed,
        timeRemaining,
        status: callStatus || (pendingRequest ? 'pending' : null),
        hasActiveCall: !!(activeSession || pendingRequest)
      }
    };
    
    res.status(200).json(responseData);
    
  } catch (error) {
    console.error('❌ Error getting active call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active call',
      error: error.message
    });
  }
};

// Get Psychic Active Call
const getPsychicActiveCall = async (req, res) => {
  try {
    const psychicId = req.user._id;
    
    console.log(`🔍 Fetching active call for psychic ${psychicId}`);
    
    const activeCall = await ActiveCallSession.findOne({
      psychicId,
      status: { $in: ['ringing', 'in-progress'] }
    })
    .populate('userId', 'firstName lastName image email socketId')
    .sort({ startTime: -1 });
    
    const pendingRequest = await CallRequest.findOne({
      psychicId,
      status: 'pending'
    })
    .populate('userId', 'firstName lastName image email')
    .sort({ requestedAt: -1 });
    
    const now = new Date();
    let elapsedSeconds = 0;
    let creditsUsed = 0;
    
    if (activeCall && activeCall.startTime && activeCall.status === 'in-progress') {
      const startTime = new Date(activeCall.startTime);
      elapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
      creditsUsed = Math.ceil(elapsedSeconds / 60) * (activeCall.creditsPerMin || 1);
    }
    
    let timeRemaining = 0;
    if (pendingRequest && pendingRequest.expiresAt) {
      const expiresAt = new Date(pendingRequest.expiresAt);
      timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      
      if (timeRemaining === 0 && pendingRequest.status === 'pending') {
        pendingRequest.status = 'expired';
        await pendingRequest.save();
        
        const io = req.app.get('io');
        if (io) {
          const audioNamespace = io.of('/audio-calls');
          audioNamespace.to(psychicId.toString()).emit('call-expired', {
            callRequestId: pendingRequest._id,
            message: 'Call request expired'
          });
        }
      }
    }
    
    const responseData = {
      success: true,
      data: {
        ...(activeCall ? activeCall.toObject() : {}),
        elapsedSeconds,
        creditsUsed,
        callRequestId: pendingRequest?._id || activeCall?.callRequestId,
        pendingRequest: pendingRequest ? {
          ...pendingRequest.toObject(),
          timeRemaining
        } : null,
        timeRemaining
      }
    };
    
    res.status(200).json(responseData);
    
  } catch (error) {
    console.error('Error getting psychic active call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active call',
      error: error.message
    });
  }
};

const getPsychicPendingCalls = async (req, res) => {
  try {
    console.log('📞 [PENDING CONTROLLER] Getting pending calls...');
    console.log('Psychic:', req.user.name, 'ID:', req.user._id);
    
    if (!req.user || !req.user._id) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const psychicId = req.user._id;
    
    const query = {
      psychicId,
      status: 'initiated'
    };
    
    console.log('Query:', JSON.stringify(query, null, 2));
    
    const pendingCalls = await ActiveCallSession.find(query)
      .populate('userId', 'username firstName lastName image email phone')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`✅ Found ${pendingCalls.length} pending calls in database`);
    
    if (pendingCalls.length === 0) {
      console.log('ℹ️ No pending calls found');
      return res.status(200).json({
        success: true,
        message: 'No pending calls',
        count: 0,
        data: [],
        psychic: {
          id: req.user._id,
          name: req.user.name,
          isVerified: req.user.isVerified
        }
      });
    }
    
    const now = new Date();
    const validCalls = [];
    
    for (const call of pendingCalls) {
      const createdAt = new Date(call.createdAt);
      const ageInSeconds = Math.floor((now - createdAt) / 1000);
      const timeRemaining = Math.max(0, 30 - ageInSeconds);
      const isExpired = timeRemaining === 0;
      
      if (isExpired) {
        console.log(`Call ${call._id} expired`);
        await ActiveCallSession.findByIdAndUpdate(call._id, { 
          status: 'expired',
          endTime: now,
          endReason: 'timeout'
        });
        continue;
      }
      
      const userData = call.userId ? {
        _id: call.userId._id,
        username: call.userId.username || 'Unknown',
        firstName: call.userId.firstName || '',
        lastName: call.userId.lastName || '',
        image: call.userId.image || '',
        email: call.userId.email || ''
      } : null;
      
      validCalls.push({
        _id: call._id,
        callRequestId: call._id,
        callSessionId: call._id,
        user: userData,
        userId: userData,
        ratePerMin: call.ratePerMin || 1,
        creditsPerMin: call.creditsPerMin || 1,
        requestedAt: call.createdAt,
        expiresAt: new Date(createdAt.getTime() + 30000).toISOString(),
        timeRemaining,
        isFreeSession: call.isFreeSession || false,
        status: 'pending'
      });
    }
    
    console.log(`✅ ${validCalls.length} valid (non-expired) pending calls`);
    
    res.status(200).json({
      success: true,
      message: `Found ${validCalls.length} pending call${validCalls.length !== 1 ? 's' : ''}`,
      count: validCalls.length,
      data: validCalls,
      psychic: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isVerified: req.user.isVerified
      }
    });
    
  } catch (error) {
    console.error('❌ Error in getPsychicPendingCalls:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending calls',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


module.exports = {
  setSocketIO,
  setTwilioService,
  initiateCall,
  acceptCall,
  rejectCall,
  cancelCall,
  endCall,
  getCallStatus,
  getUserCallHistory,
  getPsychicCallHistory,
  twilioWebhook,
  getActiveCall,
  handleCallDisconnection,
  getPsychicPendingCalls,
  getPsychicActiveCall,
  getCallRequestById,
  getCallWithDetails,
  syncCallTimer
};