// socket/socketHandler.js - COMPLETE FIXED VERSION WITH HEARTBEAT MONITORING

module.exports = (io) => {
  // Store connected users
  const connectedUsers = new Map(); // userId -> socketId
  const userData = new Map(); // socketId -> {userId, userRole}
  const socketRooms = new Map(); // socketId -> Set of room names
  
  // ========== INSTANT STATUS CACHE ==========
  const psychicStatusCache = new Map(); // psychicId -> {status, lastSeen, lastActive, timestamp, warningCount, isActive}
  const psychicConnections = new Map(); // psychicId -> {socketId, connectedAt, lastHeartbeat}
  
  // ========== HEARTBEAT TRACKING ==========
  const heartbeatTimeouts = new Map(); // psychicId -> timeout
  const heartbeatIntervals = new Map(); // socketId -> interval
  
  // ========== CACHE MANAGEMENT FUNCTIONS ==========
  const updatePsychicCache = (psychicId, status, lastSeen = null, lastActive = null, warningData = null) => {
    const now = Date.now();
    
    // Get existing cache or create new
    const existing = psychicStatusCache.get(psychicId.toString()) || {};
    
    const cacheData = {
      status: status || existing.status || 'offline',
      lastSeen: lastSeen || existing.lastSeen || new Date(),
      lastActive: lastActive || existing.lastActive || new Date(),
      timestamp: now,
      lastUpdate: now,
      warningCount: warningData?.warningCount || existing.warningCount || 0,
      isActive: warningData?.isActive !== undefined ? warningData.isActive : (existing.isActive !== undefined ? existing.isActive : true),
      deactivatedAt: warningData?.deactivatedAt || existing.deactivatedAt || null
    };
    
    psychicStatusCache.set(psychicId.toString(), cacheData);
    
    // Update connection tracking
    if (status === 'online' || status === 'away' || status === 'busy') {
      const existingConn = psychicConnections.get(psychicId.toString()) || {};
      psychicConnections.set(psychicId.toString(), {
        ...existingConn,
        isOnline: true,
        lastHeartbeat: now,
        lastStatusUpdate: now
      });
    } else if (status === 'offline') {
      psychicConnections.delete(psychicId.toString());
    }
    
    return cacheData;
  };
  
  const getPsychicStatusFromCache = (psychicId) => {
    const cached = psychicStatusCache.get(psychicId.toString());
    if (!cached) return null;
    
    // If cache is fresh (less than 10 seconds), return it
    if (Date.now() - cached.timestamp < 10000) {
      return cached;
    }
    
    // If psychic has a live connection, they're online
    const connection = psychicConnections.get(psychicId.toString());
    if (connection && (Date.now() - connection.lastHeartbeat < 60000)) {
      return { ...cached, status: 'online', timestamp: Date.now() };
    }
    
    return cached;
  };
  
  const broadcastPsychicStatus = (psychicId, statusData) => {
    if (!io) return;
    
    // Emit to specific psychic room
    io.to(`psychic_status_${psychicId}`).emit('psychic_status_changed', statusData);
    
    // Emit to global room
    io.to('psychic_list_status').emit('psychic_status_update', statusData);
    
    console.log(`📡 Broadcast status for ${psychicId}: ${statusData.status} (Active: ${statusData.isActive}, Warnings: ${statusData.warningCount})`);
  };
  
  // ========== HEARTBEAT MANAGEMENT ==========
  
  const startHeartbeatMonitor = (socket, psychicId) => {
    // Clear existing timeout for this psychic
    if (heartbeatTimeouts.has(psychicId)) {
      clearTimeout(heartbeatTimeouts.get(psychicId));
      heartbeatTimeouts.delete(psychicId);
    }
    
    // Set timeout to check for missed heartbeats
    const timeout = setTimeout(async () => {
      console.log(`⚠️ No heartbeat from psychic ${psychicId} for 45 seconds, marking as offline`);
      
      // Check if socket is still connected
      const connection = psychicConnections.get(psychicId.toString());
      const socketStillConnected = connection && connection.socketId === socket.id;
      
      if (socketStillConnected) {
        // Update cache to offline
        const cacheData = updatePsychicCache(psychicId, 'offline', new Date());
        
        // Broadcast status change
        broadcastPsychicStatus(psychicId, {
          psychicId: psychicId.toString(),
          status: 'offline',
          timestamp: Date.now(),
          lastSeen: new Date(),
          lastActive: cacheData.lastActive,
          isActive: cacheData.isActive,
          warningCount: cacheData.warningCount,
          reason: 'heartbeat_timeout'
        });
        
        // Update database
        try {
          const Psychic = require('../models/HumanChat/Psychic');
          await Psychic.findByIdAndUpdate(psychicId, {
            status: 'offline',
            lastSeen: new Date(),
            lastStatusUpdate: new Date()
          });
          console.log(`✅ Psychic ${psychicId} marked offline due to missed heartbeat`);
        } catch (error) {
          console.error('Error updating psychic status:', error);
        }
        
        // Disconnect the socket
        if (socket && socket.connected) {
          socket.disconnect(true);
        }
      }
      
      heartbeatTimeouts.delete(psychicId);
    }, 45000); // 45 seconds without heartbeat = offline
    
    heartbeatTimeouts.set(psychicId, timeout);
  };
  
  const updateHeartbeat = (psychicId, socket) => {
    // Clear existing timeout
    if (heartbeatTimeouts.has(psychicId)) {
      clearTimeout(heartbeatTimeouts.get(psychicId));
      heartbeatTimeouts.delete(psychicId);
    }
    
    // Update connection lastHeartbeat
    const connection = psychicConnections.get(psychicId.toString());
    if (connection) {
      connection.lastHeartbeat = Date.now();
      psychicConnections.set(psychicId.toString(), connection);
    }
    
    // Update cache timestamp
    const existing = psychicStatusCache.get(psychicId.toString());
    if (existing && existing.status === 'online') {
      existing.timestamp = Date.now();
      existing.lastActive = new Date();
      psychicStatusCache.set(psychicId.toString(), existing);
    }
    
    // Restart monitor
    startHeartbeatMonitor(socket, psychicId);
  };
  
  // ========== INITIALIZE CACHE ON STARTUP ==========
  const initializeStatusCache = async () => {
    try {
      const Psychic = require('../models/HumanChat/Psychic');
      const psychics = await Psychic.find({})
        .select('_id status lastActive lastSeen lastStatusUpdate isActive warningCount deactivatedAt')
        .limit(100)
        .lean();
      
      psychics.forEach(psychic => {
        updatePsychicCache(
          psychic._id, 
          psychic.status || 'offline', 
          psychic.lastSeen, 
          psychic.lastActive,
          {
            warningCount: psychic.warningCount || 0,
            isActive: psychic.isActive,
            deactivatedAt: psychic.deactivatedAt
          }
        );
      });
      
      console.log(`✅ Initialized cache with ${psychics.length} psychic statuses and warning data`);
    } catch (error) {
      console.error('Error initializing status cache:', error);
    }
  };
  
  // Initialize cache when server starts
  initializeStatusCache();

  io.on('connection', (socket) => {
    console.log('🟢 New client connected:', socket.id);

    const { userId, token, role } = socket.handshake.auth;
    
    if (!userId || !role) {
      console.log('❌ Unauthenticated socket connection');
      socket.disconnect();
      return;
    }

    console.log(`✅ User connected: ${userId} (${role})`);
    
    // ========== CHECK IF PSYCHIC IS ACTIVE ON CONNECTION ==========
    if (role.toLowerCase() === 'psychic') {
      // Check if psychic is deactivated
      const Psychic = require('../models/HumanChat/Psychic');
      Psychic.findById(userId).select('isActive warningCount deactivatedAt status')
        .then(psychic => {
          if (!psychic) {
            console.log(`❌ Psychic ${userId} not found in database`);
            socket.emit('account_error', { message: 'Account not found' });
            socket.disconnect();
            return;
          }
          
          if (!psychic.isActive) {
            // Send deactivation notice immediately
            socket.emit('account_deactivated', {
              reason: 'warning_limit',
              message: 'Your account has been deactivated due to multiple warnings.',
              deactivatedAt: psychic.deactivatedAt,
              warningCount: psychic.warningCount
            });
            console.log(`🔴 Deactivated psychic ${userId} tried to connect`);
            socket.disconnect();
            return;
          }
          
          // Store connection info
          psychicConnections.set(userId.toString(), {
            socketId: socket.id,
            connectedAt: Date.now(),
            lastHeartbeat: Date.now(),
            isOnline: true
          });
          
          // Update cache immediately (INSTANT)
          updatePsychicCache(userId, 'online', null, null, {
            warningCount: psychic?.warningCount || 0,
            isActive: psychic?.isActive !== false,
            deactivatedAt: psychic?.deactivatedAt
          });
          
          // Broadcast to all subscribed users immediately
          const statusData = {
            psychicId: userId.toString(),
            status: 'online',
            timestamp: Date.now(),
            lastSeen: new Date(),
            lastActive: new Date(),
            isActive: psychic?.isActive !== false,
            warningCount: psychic?.warningCount || 0
          };
          
          broadcastPsychicStatus(userId, statusData);
          
          // Start heartbeat monitor
          startHeartbeatMonitor(socket, userId);
          
          console.log(`✅ Psychic ${userId} marked online with heartbeat monitoring`);
        })
        .catch(err => console.error('Error checking psychic status:', err));
    }
    
    // Check if user already connected (avoid duplicates)
    const existingSocketId = connectedUsers.get(userId.toString());
    if (existingSocketId && existingSocketId !== socket.id) {
      console.log(`⚠️ User ${userId} already connected with socket ${existingSocketId}, disconnecting old socket`);
      const oldSocket = io.sockets.sockets.get(existingSocketId);
      if (oldSocket && oldSocket.connected) {
        // Don't mark as offline if it's a psychic - they might be reconnecting
        const oldUserInfo = userData.get(existingSocketId);
        if (oldUserInfo && oldUserInfo.role !== 'psychic') {
          oldSocket.disconnect();
        }
      }
    }
    
    // Store user data
    connectedUsers.set(userId.toString(), socket.id);
    userData.set(socket.id, { 
      userId: userId.toString(), 
      role: role.toLowerCase() 
    });
    
    // Initialize room tracking for this socket
    socketRooms.set(socket.id, new Set());
    
    // Join personal room
    const personalRoom = role.toLowerCase() === 'user' ? `user_${userId}` : `psychic_${userId}`;
    socket.join(personalRoom);
    socketRooms.get(socket.id).add(personalRoom);
    console.log(`📍 Joined personal room: ${personalRoom}`);
    
    // Join timer room based on role
    if (role.toLowerCase() === 'psychic') {
      const timerRoom = `psychic_timer_${userId}`;
      socket.join(timerRoom);
      socketRooms.get(socket.id).add(timerRoom);
      console.log(`⏰ Joined psychic timer room: ${timerRoom}`);
    } else {
      const timerRoom = `user_timer_${userId}`;
      socket.join(timerRoom);
      socketRooms.get(socket.id).add(timerRoom);
      console.log(`⏰ Joined user timer room: ${timerRoom}`);
    }
    
    // ========== SEND INSTANT STATUSES TO USER ON CONNECTION ==========
    if (role.toLowerCase() === 'user') {
      // Send ALL cached statuses immediately (INSTANT, NO DB QUERY)
      const cachedStatuses = {};
      psychicStatusCache.forEach((value, key) => {
        cachedStatuses[key] = {
          status: value.status,
          lastSeen: value.lastSeen,
          lastActive: value.lastActive,
          lastUpdate: value.timestamp,
          isActive: value.isActive,
          warningCount: value.warningCount
        };
      });
      
      if (Object.keys(cachedStatuses).length > 0) {
        console.log(`⚡ Sending ${Object.keys(cachedStatuses).length} cached statuses to user ${userId}`);
        socket.emit('psychic_statuses_response', { statuses: cachedStatuses });
      }
      
      // Also join global status room
      socket.join('psychic_list_status');
      socketRooms.get(socket.id).add('psychic_list_status');
    }
    
    // If psychic, fetch and join their chat rooms and check warnings
    if (role.toLowerCase() === 'psychic') {
      const ChatSession = require('../models/HumanChat/HumanChatSession');
      const Warning = require('../models/HumanChat/Warning');
      
      // Get active warnings for this psychic
      Warning.find({ psychicId: userId, status: 'active' })
        .sort({ createdAt: -1 })
        .limit(5)
        .then(warnings => {
          if (warnings.length > 0) {
            socket.emit('active_warnings', {
              count: warnings.length,
              warnings: warnings.map(w => ({
                id: w._id,
                type: w.warningType,
                number: w.warningNumber,
                createdAt: w.createdAt
              }))
            });
          }
        })
        .catch(err => console.error('Error fetching warnings:', err));
      
      ChatSession.find({ psychic: userId })
        .select('_id')
        .then(sessions => {
          const sessionIds = sessions.map(s => s._id.toString());
          console.log(`📋 Psychic ${userId} has ${sessionIds.length} chat sessions`);
          
          // Join all chat rooms
          sessionIds.forEach(chatId => {
            const roomName = `chat_${chatId}`;
            if (!socketRooms.get(socket.id).has(roomName)) {
              socket.join(roomName);
              socketRooms.get(socket.id).add(roomName);
              console.log(`👥 Psychic joined room: ${roomName}`);
            }
          });
          
          // Send connected sessions to psychic
          socket.emit('connected_sessions', sessionIds);
        })
        .catch(err => console.error('Error fetching psychic sessions:', err));
    }

    // Send online status to all connected users
    const onlineStatus = {};
    connectedUsers.forEach((socketId, uid) => {
      const userInfo = userData.get(socketId);
      if (userInfo) {
        onlineStatus[uid] = 'online';
      }
    });
    
    // Notify others that this user is online
    socket.broadcast.emit('user_status_change', {
      userId,
      userRole: role,
      status: 'online',
      timestamp: Date.now()
    });

    // Send current online status to newly connected user
    socket.emit('online_users', onlineStatus);

    // ========== PSYCHIC STATUS SYSTEM ==========
    
    // Psychic updates their status - INSTANT
    socket.on('psychic_status_update', async (data) => {
      try {
        const { status, psychicId } = data;
        const { userId, role } = socket.handshake.auth;
        
        // Verify psychic owns this status update
        if (role !== 'psychic' || userId.toString() !== psychicId.toString()) {
          console.log('❌ Unauthorized psychic status update attempt');
          return;
        }
        
        console.log(`🔄 Psychic ${psychicId} status update: ${status}`);
        
        // Update cache immediately (INSTANT)
        const cacheData = updatePsychicCache(psychicId, status);
        
        // Broadcast immediately from cache (INSTANT)
        const statusData = {
          psychicId,
          status,
          timestamp: Date.now(),
          lastSeen: cacheData.lastSeen,
          lastActive: cacheData.lastActive,
          isActive: cacheData.isActive,
          warningCount: cacheData.warningCount
        };
        
        broadcastPsychicStatus(psychicId, statusData);
        
        // Update in database (async - don't wait)
        const Psychic = require('../models/HumanChat/Psychic');
        await Psychic.findByIdAndUpdate(psychicId, { 
          status,
          lastStatusUpdate: new Date(),
          lastActive: new Date(),
          ...(status === 'offline' && { lastSeen: new Date() })
        });
        
        // Manage heartbeat monitor based on status
        if (status === 'online') {
          startHeartbeatMonitor(socket, psychicId);
        } else if (status === 'offline') {
          // Clear heartbeat monitor when going offline
          if (heartbeatTimeouts.has(psychicId)) {
            clearTimeout(heartbeatTimeouts.get(psychicId));
            heartbeatTimeouts.delete(psychicId);
          }
          // Remove from connections map
          psychicConnections.delete(psychicId.toString());
        }
        
        console.log(`✅ Psychic ${psychicId} status updated to ${status}`);
        
      } catch (error) {
        console.error('Error updating psychic status:', error);
      }
    });

    // User subscribes to psychic status - INSTANT CACHE RESPONSE
    socket.on('subscribe_to_psychic_status', async ({ psychicIds }) => {
      if (!Array.isArray(psychicIds)) psychicIds = [psychicIds];
      
      console.log(`📊 ${socket.id} subscribing to ${psychicIds.length} psychic statuses`);
      
      // Join status rooms
      psychicIds.forEach(psychicId => {
        const roomName = `psychic_status_${psychicId}`;
        if (!socketRooms.get(socket.id).has(roomName)) {
          socket.join(roomName);
          socketRooms.get(socket.id).add(roomName);
        }
      });
      
      // Send immediate statuses from CACHE (INSTANT)
      psychicIds.forEach(psychicId => {
        const cached = getPsychicStatusFromCache(psychicId);
        if (cached) {
          socket.emit('psychic_status_changed', {
            psychicId,
            status: cached.status,
            timestamp: Date.now(),
            lastSeen: cached.lastSeen,
            lastActive: cached.lastActive,
            isActive: cached.isActive,
            warningCount: cached.warningCount
          });
        }
      });
      
      // Request fresh data from DB in background
      setTimeout(() => {
        const Psychic = require('../models/HumanChat/Psychic');
        Psychic.find({ 
          _id: { $in: psychicIds } 
        })
        .select('_id status lastActive lastSeen isActive warningCount')
        .lean()
        .then(psychics => {
          psychics.forEach(psychic => {
            const cacheData = updatePsychicCache(
              psychic._id, 
              psychic.status || 'offline', 
              psychic.lastSeen, 
              psychic.lastActive,
              {
                warningCount: psychic.warningCount || 0,
                isActive: psychic.isActive
              }
            );
            
            // Send updated status
            socket.emit('psychic_status_changed', {
              psychicId: psychic._id.toString(),
              status: cacheData.status,
              timestamp: Date.now(),
              lastSeen: cacheData.lastSeen,
              lastActive: cacheData.lastActive,
              isActive: cacheData.isActive,
              warningCount: cacheData.warningCount
            });
          });
        })
        .catch(err => console.error('Background status update error:', err));
      }, 1000);
    });

    // Get psychic statuses - INSTANT CACHE RESPONSE
    socket.on('get_psychic_statuses', async ({ psychicIds }) => {
      try {
        console.log(`🚀 Fast status request for ${psychicIds?.length || 0} psychics`);
        
        const statuses = {};
        const needsFetch = [];
        
        // 1. Check cache FIRST (INSTANT)
        psychicIds.forEach(psychicId => {
          const cached = getPsychicStatusFromCache(psychicId);
          if (cached) {
            statuses[psychicId] = {
              status: cached.status,
              lastSeen: cached.lastSeen,
              lastActive: cached.lastActive,
              lastStatusUpdate: cached.timestamp,
              isActive: cached.isActive,
              warningCount: cached.warningCount
            };
          } else {
            needsFetch.push(psychicId);
          }
        });
        
        console.log(`⚡ Cache hits: ${Object.keys(statuses).length}, Need DB: ${needsFetch.length}`);
        
        // 2. Fetch missing from DB (async)
        if (needsFetch.length > 0) {
          const Psychic = require('../models/HumanChat/Psychic');
          const psychics = await Psychic.find({ 
            _id: { $in: needsFetch } 
          }).select('_id status lastSeen lastStatusUpdate lastActive isActive warningCount').lean();
          
          psychics.forEach(psychic => {
            const cacheData = updatePsychicCache(
              psychic._id, 
              psychic.status || 'offline', 
              psychic.lastSeen, 
              psychic.lastActive,
              {
                warningCount: psychic.warningCount || 0,
                isActive: psychic.isActive
              }
            );
            
            statuses[psychic._id.toString()] = {
              status: cacheData.status,
              lastSeen: cacheData.lastSeen,
              lastActive: cacheData.lastActive,
              lastStatusUpdate: cacheData.timestamp,
              isActive: cacheData.isActive,
              warningCount: cacheData.warningCount
            };
          });
        }
        
        // 3. Send response immediately
        socket.emit('psychic_statuses_response', { statuses });
        
      } catch (error) {
        console.error('Error in get_psychic_statuses:', error);
        const cachedStatuses = {};
        psychicIds.forEach(psychicId => {
          const cached = getPsychicStatusFromCache(psychicId);
          if (cached) {
            cachedStatuses[psychicId] = {
              status: cached.status,
              lastSeen: cached.lastSeen,
              lastActive: cached.lastActive,
              isActive: cached.isActive,
              warningCount: cached.warningCount
            };
          }
        });
        socket.emit('psychic_statuses_response', { statuses: cachedStatuses });
      }
    });

    // ========== HEARTBEAT HANDLER ==========
    socket.on('psychic_heartbeat', ({ psychicId }) => {
      const { userId, role } = socket.handshake.auth;
      
      if (role === 'psychic' && userId.toString() === psychicId.toString()) {
        console.log(`💓 Heartbeat received from psychic ${psychicId}`);
        
        // Update heartbeat tracking
        updateHeartbeat(psychicId, socket);
        
        // Update cache
        const cacheData = updatePsychicCache(psychicId, 'online');
        
        // Broadcast to subscribers (only if status changed or periodically)
        const statusData = {
          psychicId,
          status: 'online',
          timestamp: Date.now(),
          lastSeen: cacheData.lastSeen,
          lastActive: new Date(),
          isActive: cacheData.isActive,
          warningCount: cacheData.warningCount
        };
        
        broadcastPsychicStatus(psychicId, statusData);
        
        // Update DB lastActive asynchronously
        const Psychic = require('../models/HumanChat/Psychic');
        Psychic.findByIdAndUpdate(psychicId, { 
          lastActive: new Date()
        }).catch(err => console.error('Heartbeat DB error:', err));
      }
    });

    // ========== WARNING SYSTEM SOCKET EVENTS ==========
    
    socket.on('acknowledge_warning', async ({ warningId }) => {
      try {
        const { userId, role } = socket.handshake.auth;
        
        if (role !== 'psychic') {
          console.log('❌ Only psychics can acknowledge warnings');
          return;
        }
        
        const Warning = require('../models/HumanChat/Warning');
        const warning = await Warning.findById(warningId);
        
        if (!warning) {
          console.log('❌ Warning not found');
          return;
        }
        
        if (warning.psychicId.toString() !== userId) {
          console.log('❌ Not authorized to acknowledge this warning');
          return;
        }
        
        warning.acknowledgedAt = new Date();
        await warning.save();
        
        socket.emit('warning_acknowledged', {
          warningId,
          acknowledgedAt: new Date()
        });
        
        console.log(`✅ Warning ${warningId} acknowledged by psychic ${userId}`);
        
      } catch (error) {
        console.error('Error acknowledging warning:', error);
      }
    });

    socket.on('get_psychic_warning_status', async ({ psychicId }) => {
      try {
        const Warning = require('../models/HumanChat/Warning');
        const Psychic = require('../models/HumanChat/Psychic');
        
        const [psychic, activeWarnings] = await Promise.all([
          Psychic.findById(psychicId).select('isActive warningCount deactivatedAt'),
          Warning.find({ psychicId, status: 'active' }).sort({ createdAt: -1 })
        ]);
        
        socket.emit('psychic_warning_status', {
          psychicId,
          isActive: psychic?.isActive !== false,
          warningCount: psychic?.warningCount || 0,
          deactivatedAt: psychic?.deactivatedAt,
          activeWarnings: activeWarnings.map(w => ({
            type: w.warningType,
            number: w.warningNumber,
            createdAt: w.createdAt
          }))
        });
        
      } catch (error) {
        console.error('Error getting psychic warning status:', error);
      }
    });

    socket.on('report_message', async ({ messageId, chatSessionId, reason }) => {
      try {
        const { userId, role } = socket.handshake.auth;
        
        console.log(`🚨 Message reported: ${messageId} by ${role} ${userId} for: ${reason}`);
        
        io.to('admin_room').emit('message_reported', {
          messageId,
          chatSessionId,
          reportedBy: { userId, role },
          reason,
          timestamp: new Date()
        });
        
        socket.emit('report_submitted', {
          success: true,
          message: 'Report submitted successfully'
        });
        
      } catch (error) {
        console.error('Error reporting message:', error);
      }
    });

    // Join chat room
    socket.on('join_room', (roomName) => {
      if (!socketRooms.get(socket.id).has(roomName)) {
        socket.join(roomName);
        socketRooms.get(socket.id).add(roomName);
        console.log(`👥 ${role} ${userId} joined room: ${roomName}`);
      }
    });

    socket.on('join_psychic_timer', ({ psychicId }) => {
      const roomName = `psychic_timer_${psychicId}`;
      if (!socketRooms.get(socket.id).has(roomName)) {
        socket.join(roomName);
        socketRooms.get(socket.id).add(roomName);
        console.log(`⏰ Socket ${socket.id} joined psychic timer room: ${roomName}`);
      }
    });

    socket.on('join_user_timer', ({ userId: targetUserId }) => {
      const roomName = `user_timer_${targetUserId}`;
      if (!socketRooms.get(socket.id).has(roomName)) {
        socket.join(roomName);
        socketRooms.get(socket.id).add(roomName);
        console.log(`⏰ Socket ${socket.id} joined user timer room: ${roomName}`);
      }
    });

    socket.on('join_chat_request', ({ chatRequestId }) => {
      const roomName = `chat_request_${chatRequestId}`;
      if (!socketRooms.get(socket.id).has(roomName)) {
        socket.join(roomName);
        socketRooms.get(socket.id).add(roomName);
        console.log(`📋 Socket ${socket.id} joined chat request room: ${roomName}`);
      }
    });

    socket.on('chat_session_created', ({ chatSession }) => {
      console.log(`🎯 Chat session created: ${chatSession._id}`);
      
      const psychicId = chatSession.psychic._id || chatSession.psychic;
      const psychicRoom = `psychic_${psychicId}`;
      const chatRoom = `chat_${chatSession._id}`;
      
      io.to(psychicRoom).emit('new_chat_session', {
        chatSession,
        timestamp: Date.now()
      });
      
      io.to(chatRoom).emit('session_created', {
        chatSession
      });
      
      console.log(`📢 Notified psychic ${psychicId} about new session`);
    });

    socket.on('join_chats', (roomNames) => {
      roomNames.forEach(roomName => {
        if (!socketRooms.get(socket.id).has(roomName)) {
          socket.join(roomName);
          socketRooms.get(socket.id).add(roomName);
          console.log(`👥 ${role} ${userId} joined room: ${roomName}`);
        }
      });
    });

    socket.on('leave_room', (roomName) => {
      socket.leave(roomName);
      socketRooms.get(socket.id).delete(roomName);
      console.log(`👋 ${role} ${userId} left room: ${roomName}`);
    });

    socket.on('typing', ({ chatSessionId, isTyping }) => {
      socket.to(`chat_${chatSessionId}`).emit('typing_indicator', {
        chatSessionId,
        userId,
        userRole: role,
        isTyping,
        timestamp: Date.now()
      });
    });

    socket.on('send_message', async (data, callback) => {
      try {
        const { chatSessionId, message, senderId, senderRole } = data;

        if (!chatSessionId || !message) {
          if (callback) callback({ success: false, error: 'Missing data' });
          return;
        }

        if (senderId.toString() !== userId.toString()) {
          if (callback) callback({ success: false, error: 'Sender mismatch' });
          return;
        }

        const MessageBox = require('../models/HumanChat/MessageBox');
        const ChatSession = require('../models/HumanChat/HumanChatSession');
        
        const fullMessage = await MessageBox.findById(message._id)
          .populate('sender', 'name firstName lastName username image isActive')
          .populate('receiver', 'name firstName lastName username image isActive')
          .populate({
            path: 'replyTo',
            select: 'content sender senderModel createdAt isBlocked'
          });

        if (!fullMessage) {
          if (callback) callback({ success: false, error: 'Message not found' });
          return;
        }

        const chatSession = await ChatSession.findById(chatSessionId)
          .populate('user', 'firstName lastName username image isActive')
          .populate('psychic', 'name email image isActive');

        if (!chatSession) {
          if (callback) callback({ success: false, error: 'Chat session not found' });
          return;
        }

        const emitData = {
          message: fullMessage,
          chatSessionId,
          senderId: userId,
          senderRole: role,
          timestamp: Date.now(),
          isPsychicMessage: role === 'psychic',
          isBlocked: fullMessage.isBlocked || false,
          containsProhibitedContent: fullMessage.containsProhibitedContent || false,
          warningIssued: fullMessage.warningId ? true : false
        };
        
        const chatRoom = `chat_${chatSessionId}`;
        
        if (fullMessage.isBlocked) {
          socket.emit('message_blocked', {
            messageId: fullMessage._id,
            reason: 'Message contained prohibited content',
            redactedContent: fullMessage.redactedContent
          });
          
          io.to(chatRoom).emit('system_message', {
            type: 'warning',
            content: '⚠️ A message was blocked because it contained prohibited content.',
            timestamp: new Date()
          });
        } else {
          io.to(chatRoom).emit('new_message', emitData);
          
          if (role === 'psychic') {
            const userRoom = `user_${chatSession.user._id}`;
            io.to(userRoom).emit('new_message', emitData);
          } else {
            const psychicRoom = `psychic_${chatSession.psychic._id}`;
            io.to(psychicRoom).emit('new_message', emitData);
          }
        }
        
        if (callback) callback({ 
          success: true, 
          message: 'Message delivered',
          isBlocked: fullMessage.isBlocked 
        });

      } catch (error) {
        console.error('❌ Error in send_message handler:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });

    socket.on('sync_messages', async (data, callback) => {
      try {
        const { chatSessionId, lastMessageId } = data;
        
        const MessageBox = require('../models/HumanChat/MessageBox');
        const query = { chatSession: chatSessionId };
        
        if (lastMessageId) {
          try {
            const lastMessage = await MessageBox.findById(lastMessageId);
            if (lastMessage) {
              query.createdAt = { $gt: lastMessage.createdAt };
            }
          } catch (err) {
            console.log('Could not find last message, fetching all');
          }
        }
        
        const messages = await MessageBox.find(query)
          .sort({ createdAt: -1 })
          .limit(50)
          .populate('sender', 'name firstName lastName username image isActive')
          .populate('receiver', 'name firstName lastName username image isActive');
        
        if (callback) {
          callback({
            success: true,
            messages: messages.reverse(),
            chatSessionId,
            count: messages.length
          });
        }
        
      } catch (error) {
        console.error('Error syncing messages:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });

    socket.on('message_received', (data) => {
      const { messageId, chatSessionId } = data;
      socket.to(`chat_${chatSessionId}`).emit('message_delivery_status', {
        messageId, 
        status: 'delivered', 
        timestamp: Date.now()
      });
      
      const MessageBox = require('../models/HumanChat/MessageBox');
      MessageBox.findByIdAndUpdate(messageId, { 
        status: 'delivered',
        deliveredAt: Date.now()
      }).catch(err => console.error('Update delivery status error:', err));
    });

    socket.on('message_read', (data) => {
      const { messageId, chatSessionId } = data;
      socket.to(`chat_${chatSessionId}`).emit('message_read_status', {
        messageId, 
        status: 'read', 
        timestamp: Date.now()
      });
      
      const MessageBox = require('../models/HumanChat/MessageBox');
      MessageBox.findByIdAndUpdate(messageId, { 
        status: 'read',
        readAt: Date.now()
      }).catch(err => console.error('Update read status error:', err));
    });

    socket.on('timer_status_update', ({ requestId, isPaused, remainingSeconds, psychicId, userId }) => {
      if (psychicId) {
        io.to(`psychic_${psychicId}`).emit('timer_updated', {
          requestId,
          isPaused,
          remainingSeconds,
          updatedBy: role
        });
      }
      
      if (userId) {
        io.to(`user_${userId}`).emit('timer_updated', {
          requestId,
          isPaused,
          remainingSeconds,
          updatedBy: role
        });
      }
      
      io.to(`chat_request_${requestId}`).emit('timer_status', {
        requestId,
        isPaused,
        remainingSeconds,
        updatedBy: role
      });
    });

    socket.on('session_started', ({ requestId, chatRequest, psychicId, remainingSeconds }) => {
      if (psychicId) {
        io.to(`psychic_${psychicId}`).emit('session_started', {
          requestId,
          chatRequest,
          psychicId,
          remainingSeconds
        });
        
        io.to(`psychic_timer_${psychicId}`).emit('timer_initialized', {
          requestId,
          remainingSeconds,
          psychicId,
          user: chatRequest?.user
        });
      }
      
      if (chatRequest?.user?._id) {
        io.to(`user_${chatRequest.user._id}`).emit('session_started', {
          requestId,
          chatRequest,
          psychicId,
          remainingSeconds
        });
      }
      
      io.to(`chat_request_${requestId}`).emit('session_activated', {
        requestId,
        status: 'active'
      });
    });

    socket.on('request_accepted', ({ requestId, userId, psychicId }) => {
      if (userId) {
        io.to(`user_${userId}`).emit('chat_request_accepted', {
          requestId,
          psychicId
        });
      }
      
      if (psychicId) {
        io.to(`psychic_${psychicId}`).emit('chat_request_accepted_for_psychic', {
          requestId,
          userId
        });
      }
    });

    socket.on('request_rejected', ({ requestId, userId, psychicId }) => {
      if (userId) {
        io.to(`user_${userId}`).emit('chat_request_rejected', {
          requestId,
          psychicId
        });
      }
    });

    socket.on('get_online_status', ({ userIds }) => {
      const statuses = {};
      userIds.forEach(id => {
        statuses[id] = connectedUsers.has(id.toString()) ? 'online' : 'offline';
      });
      socket.emit('online_status_response', statuses);
    });

    socket.on('check_availability', ({ userId, userModel }) => {
      const socketId = connectedUsers.get(userId.toString());
      const isAvailable = !!socketId;
      
      socket.emit('availability_response', {
        userId,
        userModel,
        isAvailable,
        timestamp: Date.now()
      });
    });

    // ========== DISCONNECT HANDLER ==========
    socket.on('disconnect', (reason) => {
      console.log(`🔴 Client disconnected: ${socket.id}, reason: ${reason}`);
      
      const userInfo = userData.get(socket.id);
      if (userInfo) {
        const { userId, role } = userInfo;
        
        // Remove from connected users
        connectedUsers.delete(userId);
        
        // If psychic, update status to offline ONLY if they didn't manually go offline
        if (role === 'psychic') {
          // Clear heartbeat timeout
          if (heartbeatTimeouts.has(userId)) {
            clearTimeout(heartbeatTimeouts.get(userId));
            heartbeatTimeouts.delete(userId);
          }
          
          // Check if this was a manual disconnect or unexpected
          const isManualDisconnect = reason === 'client namespace disconnect' || reason === 'transport close';
          
          if (!isManualDisconnect) {
            console.log(`⚠️ Unexpected disconnect for psychic ${userId}, marking as offline`);
            
            const cacheData = updatePsychicCache(userId, 'offline', new Date());
            
            const statusData = {
              psychicId: userId,
              status: 'offline',
              timestamp: Date.now(),
              lastSeen: new Date(),
              lastActive: cacheData.lastActive,
              isActive: cacheData.isActive,
              warningCount: cacheData.warningCount,
              reason: 'disconnected'
            };
            
            broadcastPsychicStatus(userId, statusData);
            
            // Update DB async
            const Psychic = require('../models/HumanChat/Psychic');
            Psychic.findByIdAndUpdate(userId, { 
              status: 'offline',
              lastSeen: new Date(),
              lastStatusUpdate: new Date()
            }).catch(err => console.error('DB update error:', err));
          }
          
          // Remove from connections map
          psychicConnections.delete(userId.toString());
        }
        
        // Notify others
        socket.broadcast.emit('user_status_change', {
          userId,
          userRole: role,
          status: 'offline',
          timestamp: Date.now()
        });
      }
      
      // Clean up room tracking
      socketRooms.delete(socket.id);
      userData.delete(socket.id);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  });

  // Helper function to format time
  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "00:00";
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  // Function to emit timer tick
  const emitTimerTick = (chatRequestId, remainingSeconds, userId, psychicId) => {
    if (!io) return;
    
    const timerData = {
      requestId: chatRequestId,
      remainingSeconds,
      formattedTime: formatTime(remainingSeconds),
      timestamp: Date.now()
    };
    
    if (userId) {
      io.to(`user_${userId}`).emit('timer_tick', timerData);
      io.to(`user_timer_${userId}`).emit('timer_tick', timerData);
    }
    
    if (psychicId) {
      io.to(`psychic_${psychicId}`).emit('timer_tick', timerData);
      io.to(`psychic_timer_${psychicId}`).emit('timer_tick', timerData);
    }
    
    io.to(`chat_request_${chatRequestId}`).emit('timer_tick', timerData);
  };
  
  // Function to emit timer pause/resume
  const emitTimerStatus = (chatRequestId, isPaused, remainingSeconds, userId, psychicId) => {
    if (!io) return;
    
    const statusData = {
      requestId: chatRequestId,
      isPaused,
      remainingSeconds,
      timestamp: Date.now()
    };
    
    const eventName = isPaused ? 'timer_paused' : 'timer_resumed';
    
    if (userId) {
      io.to(`user_${userId}`).emit(eventName, statusData);
    }
    
    if (psychicId) {
      io.to(`psychic_${psychicId}`).emit(eventName, statusData);
    }
    
    io.to(`chat_request_${chatRequestId}`).emit(eventName, statusData);
  };
  
  // Function to emit session ended
  const emitSessionEnded = (chatRequestId, userId, psychicId, reason = 'ended') => {
    if (!io) return;
    
    const endData = {
      requestId: chatRequestId,
      endedAt: new Date(),
      reason,
      timestamp: Date.now()
    };
    
    if (userId) {
      io.to(`user_${userId}`).emit('session_ended', endData);
    }
    
    if (psychicId) {
      io.to(`psychic_${psychicId}`).emit('session_ended', endData);
    }
    
    io.to(`chat_request_${chatRequestId}`).emit('session_ended', endData);
  };

  // Cache cleanup every 5 minutes
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    psychicStatusCache.forEach((value, key) => {
      if (now - value.timestamp > 300000) { // 5 minutes
        psychicStatusCache.delete(key);
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} old cache entries`);
    }
  }, 300000);
  
  // Cleanup heartbeat timeouts on server shutdown
  const cleanup = () => {
    for (const [psychicId, timeout] of heartbeatTimeouts) {
      clearTimeout(timeout);
    }
    heartbeatTimeouts.clear();
    console.log('🧹 Cleaned up all heartbeat timeouts');
  };
  
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);

  // Make available globally
  global.io = io;
  global.connectedUsers = connectedUsers;
  global.userData = userData;
  global.psychicStatusCache = psychicStatusCache;
  
  // Export helper functions
  module.exports.emitTimerTick = emitTimerTick;
  module.exports.emitTimerStatus = emitTimerStatus;
  module.exports.emitSessionEnded = emitSessionEnded;
  module.exports.updatePsychicCache = updatePsychicCache;
  module.exports.getPsychicStatusFromCache = getPsychicStatusFromCache;
};