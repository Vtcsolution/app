// backend/sockets/audioCallSocket.js
const ActiveCallSession = require('../models/CallSession/ActiveCallSession');
const CallSession = require('../models/CallSession/CallSession');
const CallRequest = require('../models/CallSession/CallRequest');
const Psychic = require('../models/HumanChat/Psychic');
const User = require('../models/User');

module.exports = (io, twilioService) => {
  const audioNamespace = io.of('/audio-calls');
  
  console.log('🎧 Audio namespace initialized at /audio-calls');
  
  // Store socket connections
  const psychicConnections = new Map();
  const userConnections = new Map();
  
  // Function to broadcast timer updates to all participants in a call
  const broadcastTimerUpdate = async (callSessionId) => {
    try {
      const callSession = await ActiveCallSession.findById(callSessionId);
      if (!callSession || callSession.status !== 'in-progress') return;
      
      const elapsedSeconds = Math.floor((new Date() - callSession.startTime) / 1000);
      
      const userSocketId = userConnections.get(callSession.userId.toString());
      const psychicSocketId = psychicConnections.get(callSession.psychicId.toString());
      
      const timerData = {
        callSessionId,
        elapsedSeconds,
        startTime: callSession.startTime
      };
      
      if (userSocketId) {
        audioNamespace.to(userSocketId).emit('timer-sync', timerData);
      }
      
      if (psychicSocketId) {
        audioNamespace.to(psychicSocketId).emit('timer-sync', timerData);
      }
      
    } catch (error) {
      console.error('Error broadcasting timer update:', error);
    }
  };

  // Start a global timer broadcast interval
  setInterval(() => {
    // Get all active in-progress calls
    ActiveCallSession.find({ status: 'in-progress' }).then(calls => {
      calls.forEach(call => {
        broadcastTimerUpdate(call._id);
      });
    }).catch(err => console.error('Error fetching active calls for timer broadcast:', err));
  }, 1000); // Broadcast every second
  
  audioNamespace.on('connection', (socket) => {
    console.log(`🎧 Audio socket connected: ${socket.id}`);
    
    // Add ping handler for connection testing
    socket.on('ping', (data) => {
      socket.emit('pong', { ...data, receivedAt: new Date() });
    });
    
    // Psychic connects with their ID
    socket.on('psychic-register', async (psychicId) => {
      try {
        console.log(`🎧 Psychic registration: ${psychicId}`);
        
        const psychic = await Psychic.findById(psychicId);
        if (psychic) {
          psychicConnections.set(psychicId, socket.id);
          socket.psychicId = psychicId;
          socket.userType = 'psychic';
          
          // Update psychic status
          psychic.status = 'online';
          psychic.socketId = socket.id;
          psychic.lastSeen = new Date();
          await psychic.save();
          
          console.log(`✅ Psychic ${psychicId} registered`);
          
          socket.emit('registration-success', {
            message: 'Registered successfully',
            socketId: socket.id
          });
          
          // Send pending calls
          const pendingRequests = await CallRequest.find({
            psychicId,
            status: 'pending',
            expiresAt: { $gt: new Date() }
          }).populate('userId', 'firstName lastName image email phone');
          
          if (pendingRequests.length > 0) {
            const formattedCalls = pendingRequests.map(call => ({
              _id: call._id,
              callRequestId: call._id,
              userId: call.userId._id,
              user: {
                _id: call.userId._id,
                firstName: call.userId.firstName,
                lastName: call.userId.lastName,
                image: call.userId.image,
                email: call.userId.email
              },
              status: call.status,
              requestedAt: call.requestedAt,
              expiresAt: call.expiresAt,
              roomName: call.roomName,
              creditsPerMin: call.creditsPerMin,
              ratePerMin: call.ratePerMin,
              isFreeSession: call.isFreeSession
            }));
            
            socket.emit('pending-calls', formattedCalls);
          } else {
            socket.emit('pending-calls', []);
          }
          
          socket.join(`psychic_${psychicId}`);
        } else {
          socket.emit('registration-error', { message: 'Psychic not found' });
        }
      } catch (error) {
        console.error('❌ Error registering psychic:', error);
        socket.emit('registration-error', { message: 'Registration failed' });
      }
    });
    
    // User connects with their ID
    socket.on('user-register', async (userId) => {
      try {
        const user = await User.findById(userId);
        if (user) {
          userConnections.set(userId, socket.id);
          socket.userId = userId;
          socket.userType = 'user';
          
          user.socketId = socket.id;
          user.lastSeen = new Date();
          await user.save();
          
          console.log(`✅ User ${userId} registered`);
          
          // Check for active calls
          const activeCall = await ActiveCallSession.findOne({
            userId,
            status: { $in: ['ringing', 'in-progress'] }
          }).populate('psychicId', 'name image');
          
          if (activeCall) {
            socket.emit('active-call', {
              callSessionId: activeCall._id,
              status: activeCall.status,
              psychic: activeCall.psychicId,
              roomName: activeCall.roomName
            });
          }
        }
      } catch (error) {
        console.error('❌ Error registering user:', error);
      }
    });
    
    // Psychic accepts call
    socket.on('accept-call', async (data) => {
      try {
        console.log('✅ Accepting call:', data);
        const { callRequestId } = data;
        
        const callRequest = await CallRequest.findById(callRequestId)
          .populate('userId', 'firstName lastName image email')
          .populate('psychicId', 'name image');
        
        if (!callRequest || callRequest.status !== 'pending') {
          socket.emit('call-error', { message: 'Invalid or expired call request' });
          return;
        }
        
        // Check if expired
        if (new Date(callRequest.expiresAt) < new Date()) {
          callRequest.status = 'expired';
          await callRequest.save();
          socket.emit('call-error', { message: 'Call request expired' });
          return;
        }
        
        // Update call request
        callRequest.status = 'accepted';
        callRequest.respondedAt = new Date();
        await callRequest.save();
        
        // Create active session
        const callSession = new ActiveCallSession({
          roomName: callRequest.roomName,
          userId: callRequest.userId._id,
          psychicId: callRequest.psychicId._id,
          callRequestId: callRequest._id,
          status: 'ringing',
          creditsPerMin: callRequest.creditsPerMin,
          ratePerMin: callRequest.ratePerMin,
          isFreeSession: callRequest.isFreeSession,
          participantTokens: {}
        });
        
        await callSession.save();
        
        // Generate Twilio tokens
        const tokens = twilioService.generateAudioCallTokens(
          callRequest.userId._id.toString(),
          callRequest.psychicId._id.toString(),
          callRequest.roomName
        );
        
        callSession.participantTokens = {
          user: tokens.userToken,
          psychic: tokens.psychicToken
        };
        await callSession.save();
        
        // Notify user
        const userSocketId = userConnections.get(callRequest.userId._id.toString());
        if (userSocketId) {
          audioNamespace.to(userSocketId).emit('call-accepted', {
            callSessionId: callSession._id,
            callRequestId: callRequest._id,
            roomName: callRequest.roomName,
            token: tokens.userToken,
            psychic: {
              _id: callRequest.psychicId._id,
              name: callRequest.psychicId.name,
              image: callRequest.psychicId.image
            }
          });
          console.log(`📢 Sent call-accepted to user ${callRequest.userId._id}`);
        }
        
        // Send token to psychic
        socket.emit('call-token', {
          token: tokens.psychicToken,
          roomName: callRequest.roomName,
          callSessionId: callSession._id,
          callRequestId: callRequest._id,
          user: {
            _id: callRequest.userId._id,
            firstName: callRequest.userId.firstName,
            lastName: callRequest.userId.lastName,
            image: callRequest.userId.image
          }
        });
        
        // Update psychic status
        await Psychic.findByIdAndUpdate(callRequest.psychicId._id, {
          status: 'busy',
          lastActive: new Date()
        });
        
        console.log(`✅ Call accepted: ${callRequestId}, session: ${callSession._id}`);
        
      } catch (error) {
        console.error('❌ Error accepting call:', error);
        socket.emit('call-error', { message: 'Failed to accept call' });
      }
    });
    
    // Psychic rejects call
    socket.on('reject-call', async (data) => {
      try {
        const { callRequestId, reason } = data;
        
        const callRequest = await CallRequest.findById(callRequestId)
          .populate('userId');
        
        if (!callRequest) return;
        
        callRequest.status = 'rejected';
        callRequest.rejectionReason = reason;
        callRequest.respondedAt = new Date();
        await callRequest.save();
        
        // Notify user
        const userSocketId = userConnections.get(callRequest.userId._id.toString());
        if (userSocketId) {
          audioNamespace.to(userSocketId).emit('call-rejected', {
            callRequestId,
            reason
          });
        }
        
        // Update psychic status
        await Psychic.findByIdAndUpdate(callRequest.psychicId, {
          status: 'online',
          lastActive: new Date()
        });
        
        console.log(`❌ Call rejected: ${callRequestId}`);
        
      } catch (error) {
        console.error('Error rejecting call:', error);
      }
    });
    
    // User cancels call
    socket.on('cancel-call', async (data) => {
      try {
        const { callRequestId } = data;
        
        const callRequest = await CallRequest.findById(callRequestId)
          .populate('psychicId');
        
        if (!callRequest) return;
        
        callRequest.status = 'cancelled';
        callRequest.respondedAt = new Date();
        await callRequest.save();
        
        // Notify psychic
        const psychicSocketId = psychicConnections.get(callRequest.psychicId._id.toString());
        if (psychicSocketId) {
          audioNamespace.to(psychicSocketId).emit('call-cancelled', {
            callRequestId,
            userId: callRequest.userId
          });
        }
        
        // Update psychic status
        await Psychic.findByIdAndUpdate(callRequest.psychicId._id, {
          status: 'online',
          lastActive: new Date()
        });
        
        console.log(`❌ Call cancelled: ${callRequestId}`);
        
      } catch (error) {
        console.error('Error cancelling call:', error);
      }
    });
    
    // Call started (participants connected)
    socket.on('call-started', async (data) => {
      try {
        const { callSessionId } = data;
        
        const callSession = await ActiveCallSession.findById(callSessionId);
        if (!callSession) return;
        
        callSession.status = 'in-progress';
        callSession.startTime = new Date();
        callSession.lastChargeTime = new Date();
        await callSession.save();
        
        console.log(`🎉 Call started: ${callSessionId} at ${callSession.startTime}`);
        
        // Start timer for both participants
        const userSocketId = userConnections.get(callSession.userId.toString());
        const psychicSocketId = psychicConnections.get(callSession.psychicId.toString());
        
        if (userSocketId) {
          audioNamespace.to(userSocketId).emit('timer-started', {
            callSessionId,
            startTime: callSession.startTime
          });
        }
        
        if (psychicSocketId) {
          audioNamespace.to(psychicSocketId).emit('timer-started', {
            callSessionId,
            startTime: callSession.startTime
          });
        }
        
      } catch (error) {
        console.error('Error starting call:', error);
      }
    });
    
    // Timer sync request
    socket.on('sync-timer', async (data) => {
      try {
        const { callSessionId } = data;
        
        const callSession = await ActiveCallSession.findById(callSessionId);
        if (!callSession || !callSession.startTime) return;
        
        const now = new Date();
        const elapsedSeconds = Math.floor((now - callSession.startTime) / 1000);
        
        socket.emit('timer-sync', {
          callSessionId,
          elapsedSeconds,
          startTime: callSession.startTime
        });
        
      } catch (error) {
        console.error('Error syncing timer:', error);
      }
    });
    
    // Call ended
    socket.on('call-ended', async (data) => {
      try {
        const { callSessionId, endReason } = data;
        
        console.log(`📞 Ending call: ${callSessionId}, reason: ${endReason}`);
        
        const callSession = await ActiveCallSession.findById(callSessionId);
        if (!callSession) {
          console.log(`⚠️ Call session ${callSessionId} not found`);
          return;
        }
        
        // CRITICAL: Check if call is already ended
        if (callSession.status === 'ended' || callSession.status === 'completed') {
          console.log(`⚠️ Call ${callSessionId} already ended`);
          return;
        }
        
        // Calculate duration
        const endTime = new Date();
        let durationSeconds = 0;
        
        if (callSession.startTime) {
          durationSeconds = Math.floor((endTime - callSession.startTime) / 1000);
        }
        
        console.log(`⏱️ Call duration: ${durationSeconds}s`);
        
        // Calculate credits used
        const minutesUsed = Math.ceil(durationSeconds / 60);
        const creditsUsed = minutesUsed * (callSession.creditsPerMin || 1);
        
        // CRITICAL: Update active session status to ENDED
        callSession.status = 'ended';
        callSession.endTime = endTime;
        callSession.endReason = endReason;
        callSession.totalCreditsUsed = creditsUsed;
        await callSession.save();
        
        console.log(`✅ Active session ${callSessionId} status updated to 'ended'`);
        
        // Archive to CallSession
        const archivedSession = new CallSession({
          callSid: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          roomName: callSession.roomName,
          userId: callSession.userId,
          psychicId: callSession.psychicId,
          callRequestId: callSession.callRequestId,
          status: 'completed',
          startTime: callSession.startTime,
          endTime,
          durationSeconds,
          ratePerMin: callSession.ratePerMin,
          creditsPerMin: callSession.creditsPerMin,
          totalCreditsUsed: creditsUsed,
          endReason,
          isFreeSession: callSession.isFreeSession
        });
        
        await archivedSession.save();
        
        // Update user credits if not free session
        if (!callSession.isFreeSession || durationSeconds > 60) {
          let billableSeconds = durationSeconds;
          if (callSession.isFreeSession) {
            billableSeconds = Math.max(0, durationSeconds - 60);
          }
          const billableMinutes = Math.ceil(billableSeconds / 60);
          const creditsToDeduct = billableMinutes * callSession.creditsPerMin;
          
          if (creditsToDeduct > 0) {
            await User.findByIdAndUpdate(callSession.userId, {
              $inc: { credits: -creditsToDeduct }
            });
          }
        }
        
        // Add earnings to psychic
        const psychicEarnings = creditsUsed * 0.7; // 70% to psychic
        await Psychic.findByIdAndUpdate(callSession.psychicId, {
          $inc: { 
            totalEarnings: psychicEarnings,
            totalCalls: 1,
            totalMinutes: minutesUsed
          },
          status: 'online',
          lastActive: new Date()
        });
        
        // CRITICAL: Delete active session
        await ActiveCallSession.deleteOne({ _id: callSessionId });
        
        // Prepare end data for both participants
        const endData = {
          callSessionId,
          callRequestId: callSession.callRequestId,
          duration: durationSeconds,
          creditsUsed,
          endReason,
          endedBy: endReason.includes('user') ? 'user' : 'psychic',
          timestamp: endTime.toISOString()
        };
        
        // Get participant socket IDs
        const userSocketId = userConnections.get(callSession.userId.toString());
        const psychicSocketId = psychicConnections.get(callSession.psychicId.toString());
        
        console.log(`📢 Notifying participants - User: ${userSocketId ? 'connected' : 'disconnected'}, Psychic: ${psychicSocketId ? 'connected' : 'disconnected'}`);
        
        // CRITICAL: Notify both participants with MULTIPLE events
        if (userSocketId) {
          audioNamespace.to(userSocketId).emit('call-completed', {
            ...endData,
            role: 'user',
            message: endReason === 'ended_by_psychic' ? 'Psychic ended the call' : 'Call ended'
          });
          
          audioNamespace.to(userSocketId).emit('call-ended', {
            ...endData,
            role: 'user'
          });
          
          audioNamespace.to(userSocketId).emit('timer-stopped', {
            callSessionId,
            finalTime: durationSeconds
          });
          
          console.log(`✅ Sent end events to user ${callSession.userId}`);
        }
        
        if (psychicSocketId) {
          audioNamespace.to(psychicSocketId).emit('call-completed', {
            ...endData,
            role: 'psychic',
            message: endReason === 'ended_by_psychic' ? 'You ended the call' : 'User ended the call'
          });
          
          audioNamespace.to(psychicSocketId).emit('call-ended', {
            ...endData,
            role: 'psychic'
          });
          
          audioNamespace.to(psychicSocketId).emit('timer-stopped', {
            callSessionId,
            finalTime: durationSeconds
          });
          
          console.log(`✅ Sent end events to psychic ${callSession.psychicId}`);
        }
        
        // Broadcast to room as backup
        if (callSession.roomName) {
          audioNamespace.to(callSession.roomName).emit('room-closed', {
            roomName: callSession.roomName,
            reason: 'call_ended',
            data: endData
          });
          
          // Force disconnect all from room
          const sockets = await audioNamespace.in(callSession.roomName).fetchSockets();
          sockets.forEach(socket => {
            socket.leave(callSession.roomName);
          });
          
          console.log(`👋 Disconnected ${sockets.length} sockets from room ${callSession.roomName}`);
        }
        
        console.log(`✅ Call ${callSessionId} fully ended and cleaned up, duration: ${durationSeconds}s`);
        
      } catch (error) {
        console.error('❌ Error ending call:', error);
      }
    });
    
    // Join room for signaling
    socket.on('join-room', (roomName) => {
      socket.join(roomName);
      console.log(`🎧 Socket ${socket.id} joined room ${roomName}`);
    });
    
    // Leave room
    socket.on('leave-room', (roomName) => {
      socket.leave(roomName);
    });
    
    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`🎧 Socket disconnected: ${socket.id}`);
      
      // Clean up psychic connection
      if (socket.psychicId) {
        psychicConnections.delete(socket.psychicId);
        
        await Psychic.findByIdAndUpdate(socket.psychicId, {
          socketId: null,
          status: 'offline',
          lastSeen: new Date()
        });
        
        // Check for active calls
        const activeCall = await ActiveCallSession.findOne({
          psychicId: socket.psychicId,
          status: { $in: ['ringing', 'in-progress'] }
        });
        
        if (activeCall) {
          // End the call automatically
          socket.emit('call-ended', {
            callSessionId: activeCall._id,
            endReason: 'psychic_disconnected'
          });
        }
      }
      
      // Clean up user connection
      if (socket.userId) {
        userConnections.delete(socket.userId);
        
        await User.findByIdAndUpdate(socket.userId, {
          socketId: null,
          lastSeen: new Date()
        });
        
        // Check for active calls
        const activeCall = await ActiveCallSession.findOne({
          userId: socket.userId,
          status: { $in: ['ringing', 'in-progress'] }
        });
        
        if (activeCall) {
          // End the call automatically
          socket.emit('call-ended', {
            callSessionId: activeCall._id,
            endReason: 'user_disconnected'
          });
        }
      }
    });
  });
  
  // Helper function to notify psychic of new call
  const notifyPsychicOfCall = async (psychicId, callRequest) => {
    const psychicSocketId = psychicConnections.get(psychicId.toString());
    
    if (psychicSocketId) {
      audioNamespace.to(psychicSocketId).emit('incoming-call', {
        callRequestId: callRequest._id,
        userId: callRequest.userId._id,
        user: {
          _id: callRequest.userId._id,
          firstName: callRequest.userId.firstName,
          lastName: callRequest.userId.lastName,
          image: callRequest.userId.image
        },
        roomName: callRequest.roomName,
        requestedAt: callRequest.requestedAt,
        expiresAt: callRequest.expiresAt,
        isFreeSession: callRequest.isFreeSession
      });
      
      console.log(`📞 Notified psychic ${psychicId} of incoming call`);
      return true;
    }
    
    return false;
  };
  
  return {
    notifyPsychicOfCall,
    psychicConnections,
    userConnections,
    audioNamespace
  };
};