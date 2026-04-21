// server.js - COMPLETE CORRECTED VERSION WITH PSYCHIC STATUS FIXES
require('dotenv').config();
console.log('🚀 Starting server with audio call system...');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const UAParser = require('ua-parser-js');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const connectDB = require('./config/db');
const { startCreditDeductionJob, startFreeSessionTimerJob, startCallCleanupJob } = require('./jobs/creditDeductionJob');
const timerSocket = require('./socket/timerSocket');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// ✅ FIXED: Initialize Socket.IO BEFORE using it in middleware
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,      // Wait 60 seconds for pong
  pingInterval: 25000,     // Send ping every 25 seconds
  allowEIO3: true,
  maxHttpBufferSize: 1e6
});

// ✅ FIXED: Initialize timer socket immediately
timerSocket(io);

console.log('✅ Socket.IO server initialized with keepalive settings');

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Middleware
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ FIXED: Attach io to req AFTER io is initialized
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Visitor tracking middleware
app.use(async (req, res, next) => {
  const parser = new UAParser();
  const ua = req.headers['user-agent'];
  const result = parser.setUA(ua).getResult();

  let sessionId = req.cookies.sessionId;
  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  if (req.path.startsWith('/images') || req.path === '/favicon.ico') {
    return next();
  }

  try {
    const Visitor = require('./models/Visitor');
    const recentVisit = await Visitor.findOne({
      sessionId,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (!recentVisit) {
      const visitorData = {
        sessionId,
        browser: result.browser.name || 'Unknown',
        browserVersion: result.browser.version || 'Unknown',
        os: result.os.name || 'Unknown',
        osVersion: result.os.version || 'Unknown',
        device: result.device.type || 'desktop',
        ip: req.ip,
        path: req.path,
        timestamp: new Date(),
      };
      await Visitor.create(visitorData);
    }
  } catch (err) {
    console.error('Error in visitor tracking middleware:', err);
  }

  next();
});

// Import TwilioService
const TwilioService = require('./services/twilioService');
let twilioService = null;
let isTwilioReady = false;

// Check if Twilio credentials are available
const shouldInitializeTwilio = 
  process.env.TWILIO_ACCOUNT_SID && 
  process.env.TWILIO_AUTH_TOKEN && 
  process.env.TWILIO_API_KEY && 
  process.env.TWILIO_API_SECRET;

if (shouldInitializeTwilio) {
  try {
    console.log('\n🔄 Initializing Twilio service from module...');
    
    twilioService = TwilioService;
    isTwilioReady = twilioService.isInitialized;
    
    if (isTwilioReady) {
      console.log('✅ Twilio service initialized successfully');
      global.twilioService = twilioService;
    } else {
      console.error('❌ Twilio service failed to initialize');
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize Twilio service:', error.message);
    isTwilioReady = false;
  }
} else {
  console.log('⚠️ Twilio not configured - audio calls disabled');
  isTwilioReady = false;
}

// Import routes
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const videothumnail = require('./routes/videoThumbnailRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const walletRoutes = require('./routes/walletRoutes');
const timerRoutes = require('./routes/timerRoutes');
const messageRoutes = require('./routes/messageRoutes');
const psychicRoutes = require('./routes/HumanChatbot/psychicRoutes');
const chatRoute = require('./routes/HumanChatbot/chatRoutes');
const psychicChatRoutes = require('./routes/HumanChatbot/psychicChatRoutes');
const ChatRequestRoutes = require('./routes/PaidTimer/chatRequestRoutes');
const timerService = require('./services/timerService');
const ratingRoutes = require('./routes/HumanChatbot/ratingRoutes');
const admindataRoutes = require('./routes/HumanChatbot/admindataRoutes');
const callRoutes = require('./routes/CallSession/callRoutes');
const twilioVoiceRoutes = require('./routes/CallSession/twilioVoice');
const statsRoutes = require('./routes/statsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const feedback = require('./routes/feedbackRoutes');
const userSessionRoutes = require('./routes/CallSession/userSessionRoutes');
const psychicPaymentRoutes = require("./routes/CallSession/psychicPaymentRoutes");
const PsychicPaidRoutes = require("./routes/CallSession/PsychicPaidRoutes");
const blogRoutes = require("./routes/blogRoutes");
const commentRoutes = require("./routes/commentRoutes");
const homeRoutes = require('./routes/Pages/homeRoutes');
const aboutRoutes = require('./routes/Pages/aboutRoutes');
const contactRoutes = require('./routes/Pages/contactRoutes');
const termsRoutes = require('./routes/Pages/termsRoutes');
const footer = require('./routes/Pages/footerRoutes');
const psychicsPageRoutes = require('./routes/Pages/psychicsPageRoutes');

// API Routes
app.use('/api/human-psychics', psychicRoutes);
app.use("/api/humanchat", chatRoute);
app.use('/api/psychic', psychicChatRoutes);
app.use('/api/chatrequest', ChatRequestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/twilio', twilioVoiceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/thumbnails', videothumnail);
app.use('/api', timerRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', feedback);
app.use('/api/psychics-page', psychicsPageRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/comments", commentRoutes);
app.use('/api/admin/payments', psychicPaymentRoutes);
app.use('/api/psychic/payments', PsychicPaidRoutes);
app.use('/api/usersession', userSessionRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/admindata', admindataRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/terms', termsRoutes);
app.use('/api/footer', footer);

// Call routes (only if Twilio is ready)
if (isTwilioReady) {
  app.use('/api/calls', callRoutes);
  console.log('✅ Call routes enabled');
}

// ✅ ADDED: Psychic status sync endpoint for manual refresh
app.get('/api/debug/sync-psychic-status/:psychicId', async (req, res) => {
  try {
    const { psychicId } = req.params;
    const Psychic = require('./models/HumanChat/Psychic');
    
    const psychic = await Psychic.findById(psychicId).select('status lastActive lastSeen isActive warningCount');
    
    if (!psychic) {
      return res.status(404).json({ success: false, message: 'Psychic not found' });
    }
    
    // Broadcast current status to all subscribers
    io.to(`psychic_status_${psychicId}`).emit('psychic_status_changed', {
      psychicId,
      status: psychic.status,
      timestamp: Date.now(),
      lastSeen: psychic.lastSeen,
      lastActive: psychic.lastActive,
      isActive: psychic.isActive,
      warningCount: psychic.warningCount || 0
    });
    
    res.json({
      success: true,
      status: psychic.status,
      message: 'Status broadcasted to all subscribers'
    });
  } catch (error) {
    console.error('Error syncing psychic status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ ADDED: Get all online psychics endpoint
app.get('/api/psychics/online', async (req, res) => {
  try {
    const Psychic = require('./models/HumanChat/Psychic');
    
    const onlinePsychics = await Psychic.find({
      status: 'online',
      isActive: true,
      availability: true
    }).select('_id name specialty profileImage rating totalReadings status');
    
    res.json({
      success: true,
      count: onlinePsychics.length,
      psychics: onlinePsychics
    });
  } catch (error) {
    console.error('Error fetching online psychics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ ADDED: Force psychic offline endpoint (admin only)
app.post('/api/admin/psychic/:psychicId/force-offline', async (req, res) => {
  try {
    const { psychicId } = req.params;
    const Psychic = require('./models/HumanChat/Psychic');
    
    const psychic = await Psychic.findByIdAndUpdate(
      psychicId,
      {
        status: 'offline',
        lastSeen: new Date(),
        lastStatusUpdate: new Date()
      },
      { new: true }
    );
    
    if (!psychic) {
      return res.status(404).json({ success: false, message: 'Psychic not found' });
    }
    
    // Broadcast forced offline status
    io.to(`psychic_status_${psychicId}`).emit('psychic_status_changed', {
      psychicId,
      status: 'offline',
      forced: true,
      timestamp: Date.now(),
      lastSeen: new Date()
    });
    
    io.to('psychic_list_status').emit('psychic_status_update', {
      psychicId,
      status: 'offline',
      timestamp: Date.now()
    });
    
    res.json({
      success: true,
      message: 'Psychic forced offline',
      psychic
    });
  } catch (error) {
    console.error('Error forcing psychic offline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Socket.IO connection handlers
io.on('connection', (socket) => {
  console.log(`📡 Main namespace connection: ${socket.id}`);
  
  socket.on('disconnect', (reason) => {
    console.log(`📡 Main namespace disconnected: ${socket.id}, reason: ${reason}`);
  });
  
  socket.on('error', (error) => {
    console.error(`📡 Socket error: ${error}`);
  });
});

// Import controllers and set Socket.IO instance
const messageController = require('./controllers/HumanChatbot/messageController');
const chatSessionController = require('./controllers/HumanChatbot/chatSessionController');
const callController = require('./controllers/CallSession/callController');

if (messageController.setSocketIO) {
  messageController.setSocketIO(io);
}
if (chatSessionController.setSocketIO) {
  chatSessionController.setSocketIO(io);
}
if (callController.setSocketIO) {
  callController.setSocketIO(io);
}

// Set Twilio service in call controller if available
if (isTwilioReady && twilioService && callController.setTwilioService) {
  callController.setTwilioService(twilioService);
  console.log('✅ Twilio service set in call controller');
}

// ✅ Import and initialize Socket.IO handlers with status tracking
const socketHandler = require('./socket/socketHandler');
socketHandler(io);

// Initialize audio call socket handler if Twilio is ready
if (isTwilioReady && twilioService) {
  try {
    const audioSocketHandler = require('./socket/audioSocketHandler');
    audioSocketHandler(io, twilioService);
    console.log('✅ Audio call socket handler initialized');
  } catch (error) {
    console.error('❌ Failed to initialize audio socket handler:', error.message);
  }
}

// Debug endpoints
app.get('/api/debug/token-test/:userId/:psychicId', async (req, res) => {
  try {
    const { userId, psychicId } = req.params;
    
    if (!isTwilioReady || !twilioService) {
      return res.status(503).json({
        success: false,
        message: 'Twilio service not ready'
      });
    }
    
    const roomName = `test-room-${Date.now()}`;
    
    let tokens;
    let methodUsed = '';
    
    if (twilioService.generateAudioCallTokens) {
      methodUsed = 'generateAudioCallTokens';
      tokens = twilioService.generateAudioCallTokens(userId, psychicId, roomName);
    } else if (twilioService.generateVideoTokenForAudio) {
      methodUsed = 'generateVideoTokenForAudio';
      tokens = {
        userToken: twilioService.generateVideoTokenForAudio(`user_${userId}`, roomName),
        psychicToken: twilioService.generateVideoTokenForAudio(`psychic_${psychicId}`, roomName)
      };
    } else {
      return res.status(500).json({
        success: false,
        message: 'No valid token generation method found'
      });
    }
    
    const jwt = require('jsonwebtoken');
    const decodedUser = jwt.decode(tokens.userToken);
    const decodedPsychic = jwt.decode(tokens.psychicToken);
    
    res.json({
      success: true,
      methodUsed,
      roomName,
      tokens: {
        user: {
          token: tokens.userToken,
          length: tokens.userToken?.length || 0,
          decoded: decodedUser,
          isValid: !!decodedUser
        },
        psychic: {
          token: tokens.psychicToken,
          length: tokens.psychicToken?.length || 0,
          decoded: decodedPsychic,
          isValid: !!decodedPsychic
        }
      },
      twilioStatus: {
        initialized: isTwilioReady,
        hasService: !!twilioService,
        methods: Object.keys(twilioService).filter(key => typeof twilioService[key] === 'function')
      }
    });
    
  } catch (error) {
    console.error('❌ Error in token test:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
});

app.get('/api/debug/audio-sockets', (req, res) => {
  try {
    const audioNamespace = io.of('/audio-calls');
    const connectedSockets = Array.from(audioNamespace.sockets.values());
    
    const psychicConnections = [];
    const userConnections = [];
    
    connectedSockets.forEach(socket => {
      if (socket.psychicId) {
        psychicConnections.push({
          psychicId: socket.psychicId,
          socketId: socket.id,
          connectedAt: socket.handshake.issued
        });
      }
      if (socket.userId) {
        userConnections.push({
          userId: socket.userId,
          socketId: socket.id,
          connectedAt: socket.handshake.issued
        });
      }
    });
    
    res.json({
      success: true,
      audioNamespace: {
        connected: audioNamespace.connected.size,
        sockets: connectedSockets.length,
        psychicConnections,
        userConnections
      },
      io: {
        connected: io.engine.clientsCount,
        readyState: io.engine.clientsCount > 0 ? 'open' : 'closed'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/debug/socket-test', (req, res) => {
  res.json({
    success: true,
    message: 'Socket test endpoint',
    socketIO: {
      version: require('socket.io/package.json').version,
      clientCompatible: 'v2, v3, v4'
    }
  });
});

// ✅ ADDED: Debug endpoint for psychic status
app.get('/api/debug/psychic-status/:psychicId', async (req, res) => {
  try {
    const { psychicId } = req.params;
    const Psychic = require('./models/HumanChat/Psychic');
    
    const psychic = await Psychic.findById(psychicId).select('status lastActive lastSeen lastStatusUpdate isActive warningCount');
    
    if (!psychic) {
      return res.status(404).json({ success: false, message: 'Psychic not found' });
    }
    
    res.json({
      success: true,
      psychic: {
        id: psychic._id,
        status: psychic.status,
        lastActive: psychic.lastActive,
        lastSeen: psychic.lastSeen,
        lastStatusUpdate: psychic.lastStatusUpdate,
        isActive: psychic.isActive,
        warningCount: psychic.warningCount
      },
      socketStatus: {
        hasActiveConnection: !!global.connectedUsers?.has(psychicId),
        cachedStatus: global.psychicStatusCache?.get(psychicId)
      }
    });
  } catch (error) {
    console.error('Error getting psychic status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Twilio webhook endpoint
if (isTwilioReady) {
  app.post('/api/calls/webhook/twilio', express.raw({ type: 'application/x-www-form-urlencoded' }), (req, res) => {
    const params = req.body;
    req.body = params;
    req.io = io;
    
    if (callController.twilioWebhook) {
      callController.twilioWebhook(req, res);
    } else {
      res.status(500).json({ success: false, message: 'Webhook handler not available' });
    }
  });
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date(),
    services: {
      database: 'connected',
      twilio: {
        ready: isTwilioReady,
        configured: !!shouldInitializeTwilio,
        serviceType: twilioService?.getStatus ? twilioService.getStatus().service : 'unknown'
      },
      socketIO: {
        connected: io.engine.clientsCount,
        audioNamespace: io.of('/audio-calls').sockets.size,
        mainNamespace: io.sockets.sockets.size
      }
    }
  };
  
  if (isTwilioReady && twilioService && twilioService.testConnection) {
    try {
      const twilioTest = await twilioService.testConnection();
      health.services.twilio.testResult = twilioTest;
    } catch (error) {
      health.services.twilio.testError = error.message;
    }
  }
  
  res.json(health);
});

app.get('/api/debug/twilio', async (req, res) => {
  try {
    if (!isTwilioReady || !twilioService) {
      return res.status(503).json({
        success: false,
        message: 'Twilio service not initialized or not configured'
      });
    }
    
    const connectionTest = await twilioService.testConnection();
    
    res.json({
      success: true,
      timestamp: new Date(),
      diagnostics: {
        connectionTest,
        status: twilioService.getStatus ? twilioService.getStatus() : 'Status not available',
        methods: Object.keys(twilioService).filter(key => typeof twilioService[key] === 'function')
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to run diagnostics',
      error: error.message
    });
  }
});

app.get('/api/audio-test', async (req, res) => {
  try {
    const audioNamespace = io.of('/audio-calls');
    const connectedSockets = Array.from(audioNamespace.sockets.values());
    
    res.json({
      success: true,
      audioSystem: {
        enabled: isTwilioReady,
        connectedClients: connectedSockets.length,
        twilioReady: isTwilioReady,
        namespace: '/audio-calls',
        sockets: connectedSockets.map(s => ({
          id: s.id,
          psychicId: s.psychicId,
          userId: s.userId,
          rooms: Array.from(s.rooms)
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Audio system test failed',
      error: error.message
    });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Backend is running',
    services: {
      audioCalls: isTwilioReady ? 'Enabled' : 'Disabled (Twilio not configured)',
      socketIO: 'Enabled',
      database: 'Connected',
      twilioService: twilioService ? 'Loaded' : 'Not loaded'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// ✅ ADDED: Periodic cleanup for stale online statuses
const startStatusCleanupJob = () => {
  setInterval(async () => {
    try {
      const Psychic = require('./models/HumanChat/Psychic');
      const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
      
      // Find psychics marked online but with no recent activity and no socket connection
      const stalePsychics = await Psychic.find({
        status: 'online',
        lastActive: { $lt: staleThreshold }
      }).select('_id name status lastActive');
      
      for (const psychic of stalePsychics) {
        // Check if they have an active socket connection
        const hasActiveConnection = global.connectedUsers?.has(psychic._id.toString());
        
        if (!hasActiveConnection) {
          console.log(`🧹 Cleaning stale online status for psychic: ${psychic.name} (${psychic._id})`);
          
          await Psychic.findByIdAndUpdate(psychic._id, {
            status: 'offline',
            lastSeen: new Date(),
            lastStatusUpdate: new Date()
          });
          
          // Broadcast status change
          io.to(`psychic_status_${psychic._id}`).emit('psychic_status_changed', {
            psychicId: psychic._id.toString(),
            status: 'offline',
            reason: 'stale_connection',
            timestamp: Date.now()
          });
          
          io.to('psychic_list_status').emit('psychic_status_update', {
            psychicId: psychic._id.toString(),
            status: 'offline',
            timestamp: Date.now()
          });
        }
      }
      
      if (stalePsychics.length > 0) {
        console.log(`✅ Cleaned up ${stalePsychics.length} stale online psychics`);
      }
    } catch (error) {
      console.error('Error in status cleanup job:', error);
    }
  }, 60000); // Run every minute
};

// CONNECT TO DATABASE AND START SERVER
connectDB().then(() => {
  console.log('✅ MongoDB connected successfully');
  
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Socket.IO server running on /audio-calls namespace`);
    console.log(`✅ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    
    console.log('\n=== SOCKET.IO TEST ===');
    console.log(`Main namespace: ${io.sockets.sockets.size} sockets`);
    console.log(`Audio namespace: ${io.of('/audio-calls').sockets.size} sockets`);
    
    console.log('\n=== TWILIO STATUS ===');
    console.log(`Twilio Ready: ${isTwilioReady ? '✅' : '❌'}`);
    console.log(`Twilio Service: ${twilioService ? '✅ Loaded' : '❌ Not loaded'}`);
    
    if (twilioService && twilioService.getStatus) {
      const status = twilioService.getStatus();
      console.log(`Service Type: ${status.service || 'unknown'}`);
      console.log(`Initialized: ${status.initialized ? '✅' : '❌'}`);
    }
    
    // Start timer service and background jobs
    setTimeout(async () => {
      try {
        await timerService.initialize();
        
        // ✅ Start all background jobs
        startCreditDeductionJob(io);
        startFreeSessionTimerJob(io);
        startStatusCleanupJob(); // ✅ Start status cleanup job
        
        if (isTwilioReady && twilioService) {
          startCallCleanupJob(io);
          console.log('✅ Call cleanup job started');
        }
        
        console.log('✅ All background jobs started successfully');
        console.log('✅ Status cleanup job started (checks every minute)');
        
        if (isTwilioReady && twilioService && twilioService.testConnection) {
          const connectionTest = await twilioService.testConnection();
          
          if (connectionTest.success) {
            console.log('✅ Twilio connection successful');
            console.log('✅ Audio call system is fully operational');
          } else {
            console.log('❌ Twilio connection failed:', connectionTest.message);
          }
        }
        
        console.log('\n=== AUDIO CALL SYSTEM STATUS ===');
        console.log(`Twilio Ready: ${isTwilioReady ? '✅' : '❌'}`);
        console.log(`Audio Socket Handler: ${isTwilioReady ? '✅' : '❌'}`);
        console.log(`Call Routes: ${isTwilioReady ? '✅' : '❌'}`);
        console.log(`Webhook Endpoint: ${isTwilioReady ? '✅' : '❌'}`);
        console.log(`Credit Deduction Job: ✅ Running every 5 seconds`);
        console.log(`Free Session Job: ✅ Running`);
        console.log(`Call Cleanup Job: ${isTwilioReady ? '✅ Running' : '❌'}`);
        console.log(`Status Cleanup Job: ✅ Running (checks stale online statuses)`);
        console.log('================================\n');
        
        console.log('📡 Debug endpoints available:');
        console.log(`  - http://localhost:${PORT}/api/debug/token-test/123/456`);
        console.log(`  - http://localhost:${PORT}/api/debug/audio-sockets`);
        console.log(`  - http://localhost:${PORT}/api/debug/socket-test`);
        console.log(`  - http://localhost:${PORT}/api/debug/psychic-status/:psychicId`);
        console.log(`  - http://localhost:${PORT}/api/debug/sync-psychic-status/:psychicId`);
        console.log(`  - http://localhost:${PORT}/api/psychics/online`);
        console.log(`  - http://localhost:${PORT}/api/audio-test`);
        console.log(`  - http://localhost:${PORT}/api/health`);
        
      } catch (error) {
        console.error('❌ Failed to initialize services:', error);
      }
    }, 1000);
  });
}).catch((error) => {
  console.error('❌ Failed to connect to MongoDB:', error);
  process.exit(1);
});