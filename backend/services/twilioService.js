// services/twilioService.js - FINAL VERSION
const twilio = require('twilio');
const { v4: uuidv4 } = require('uuid');

class TwilioService {
  constructor() {
    this.isInitialized = false;
    this.client = null;
    this.apiKey = null;
    this.apiSecret = null;
    this.accountSid = null;
    this.authToken = null;
    
    this.initialize();
  }

  initialize() {
    try {
      console.log('\n🔄 Initializing Twilio service for BROWSER AUDIO calls...');
      
      const requiredVars = [
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'TWILIO_API_KEY',
        'TWILIO_API_SECRET'
      ];
      
      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.error(`❌ Missing Twilio environment variables: ${missingVars.join(', ')}`);
        console.error('   Audio calls will be disabled');
        return;
      }
      
      this.accountSid = process.env.TWILIO_ACCOUNT_SID.trim();
      this.authToken = process.env.TWILIO_AUTH_TOKEN.trim();
      this.apiKey = process.env.TWILIO_API_KEY.trim();
      this.apiSecret = process.env.TWILIO_API_SECRET.trim();
      
      console.log('📋 Twilio credentials loaded');
      console.log(`   Account SID: ${this.accountSid.substring(0, 8)}...`);
      console.log(`   API Key: ${this.apiKey.substring(0, 8)}...`);
      
      // Validate credentials
      if (!this.accountSid.startsWith('AC')) {
        console.error('❌ Invalid TWILIO_ACCOUNT_SID format');
        return;
      }
      
      if (!this.apiKey.startsWith('SK')) {
        console.error('❌ Invalid TWILIO_API_KEY format');
        return;
      }
      
      // Initialize Twilio client
      this.client = twilio(this.accountSid, this.authToken);
      this.isInitialized = true;
      
      console.log('✅ Twilio service initialized successfully\n');
      
      // Test connection
      this.testConnection().then(result => {
        if (result.success) {
          console.log('✅ Twilio connection test passed');
        } else {
          console.error('❌ Twilio connection test failed:', result.message);
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize Twilio service:', error.message);
      this.isInitialized = false;
    }
  }

  isReady() {
    return this.isInitialized && this.client !== null;
  }

  // Generate Video token for audio-only calls (recommended)
  generateVideoToken(identity, roomName) {
    if (!this.isReady()) {
      throw new Error('Twilio service not initialized');
    }
    
    try {
      const AccessToken = twilio.jwt.AccessToken;
      const VideoGrant = AccessToken.VideoGrant;
      
      const token = new AccessToken(
        this.accountSid,
        this.apiKey,
        this.apiSecret,
        { 
          identity: identity,
          ttl: 3600 // 1 hour
        }
      );
      
      const videoGrant = new VideoGrant({ 
        room: roomName 
      });
      
      token.addGrant(videoGrant);
      
      const jwtToken = token.toJwt();
      
      console.log(`✅ Generated Video token for ${identity} in room ${roomName}`);
      console.log(`   Token length: ${jwtToken.length}`);
      
      return jwtToken;
      
    } catch (error) {
      console.error('❌ Error generating Video token:', error.message);
      throw error;
    }
  }

  // Generate tokens for audio call using Video API
  // In services/twilioService.js, ensure generateAudioCallTokens exists:
generateAudioCallTokens(userId, psychicId, roomName) {
  if (!this.isReady()) {
    throw new Error('Twilio service not initialized');
  }
  
  try {
    // Generate Video tokens for audio-only calls
    const userToken = this.generateVideoToken(`user_${userId}`, roomName);
    const psychicToken = this.generateVideoToken(`psychic_${psychicId}`, roomName);
    
    console.log(`✅ Generated audio call tokens for room: ${roomName}`);
    console.log(`   User: user_${userId}`);
    console.log(`   Psychic: psychic_${psychicId}`);
    
    return {
      userToken,
      psychicToken,
      roomName,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Error generating audio call tokens:', error.message);
    throw error;
  }
}

  // Create audio room (using Video API)
  async createAudioRoom(roomName, options = {}) {
    if (!this.isReady()) {
      throw new Error('Twilio service not initialized');
    }
    
    try {
      const roomOptions = {
        uniqueName: roomName,
        type: 'peer-to-peer',
        maxParticipants: 2,
        recordParticipantsOnConnect: false,
        statusCallback: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/calls/webhook/twilio`,
        statusCallbackMethod: 'POST',
        ...options
      };
      
      const room = await this.client.video.v1.rooms.create(roomOptions);
      
      console.log(`✅ Audio room created: ${roomName} (SID: ${room.sid})`);
      return room;
      
    } catch (error) {
      // If room already exists, fetch it
      if (error.code === 53113) {
        console.log(`ℹ️  Room ${roomName} already exists, fetching...`);
        try {
          const room = await this.client.video.v1.rooms(roomName).fetch();
          return room;
        } catch (fetchError) {
          console.error('❌ Error fetching existing room:', fetchError.message);
          throw fetchError;
        }
      }
      
      console.error('❌ Error creating audio room:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Error status:', error.status);
      
      throw error;
    }
  }

  // Complete a room
  async completeRoom(roomSid) {
    if (!this.isReady()) {
      throw new Error('Twilio service not initialized');
    }
    
    try {
      const room = await this.client.video.v1.rooms(roomSid).update({ 
        status: 'completed' 
      });
      console.log(`✅ Room completed: ${roomSid}`);
      return room;
    } catch (error) {
      if (error.code === 20404) {
        console.log(`ℹ️  Room ${roomSid} not found or already completed`);
        return null;
      }
      console.error('❌ Error completing room:', error.message);
      throw error;
    }
  }

  // Generate unique room name
  generateRoomName() {
    return `audio_call_${uuidv4().replace(/-/g, '')}_${Date.now()}`;
  }

  // Setup a complete audio call
  async setupAudioCall(userId, psychicId) {
    if (!this.isReady()) {
      throw new Error('Twilio service not initialized');
    }
    
    try {
      // Generate room name
      const roomName = this.generateRoomName();
      
      // Create room
      const room = await this.createAudioRoom(roomName);
      
      // Generate tokens
      const tokens = await this.generateAudioCallTokens(userId, psychicId, roomName);
      
      return {
        success: true,
        roomName,
        roomSid: room.sid,
        userToken: tokens.userToken,
        psychicToken: tokens.psychicToken,
        message: 'Audio call setup complete'
      };
      
    } catch (error) {
      console.error('❌ Error setting up audio call:', error.message);
      throw error;
    }
  }

  // Join existing audio call
  async joinAudioCall(userId, psychicId, roomName) {
    if (!this.isReady()) {
      throw new Error('Twilio service not initialized');
    }
    
    try {
      // Check if room exists
      let room;
      try {
        room = await this.client.video.v1.rooms(roomName).fetch();
        console.log(`✅ Found existing room: ${roomName}`);
      } catch (error) {
        if (error.code === 20404) {
          console.log(`❌ Room ${roomName} not found`);
          throw new Error('Room not found');
        }
        throw error;
      }
      
      // Generate tokens for joining
      const tokens = await this.generateAudioCallTokens(userId, psychicId, roomName);
      
      return {
        success: true,
        roomName,
        roomSid: room.sid,
        roomStatus: room.status,
        userToken: tokens.userToken,
        psychicToken: tokens.psychicToken,
        message: 'Audio call join ready'
      };
      
    } catch (error) {
      console.error('❌ Error joining audio call:', error.message);
      throw error;
    }
  }

  // Get service status
  getStatus() {
    return {
      initialized: this.isInitialized,
      service: 'Twilio Video API (for Audio Calls)',
      accountSid: this.accountSid ? `${this.accountSid.substring(0, 8)}...` : 'missing',
      apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'missing',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'not configured for audio calls'
    };
  }

  // Test connection
  async testConnection() {
    if (!this.isReady()) {
      return {
        success: false,
        message: 'Twilio service not initialized'
      };
    }
    
    try {
      const account = await this.client.api.accounts(this.accountSid).fetch();
      
      // Also test video API
      const rooms = await this.client.video.v1.rooms.list({ limit: 1 });
      
      return {
        success: true,
        message: 'Twilio connection successful',
        account: {
          friendlyName: account.friendlyName,
          status: account.status,
          type: account.type
        },
        services: {
          voice: true,
          video: true,
          videoRooms: rooms.length
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: `Twilio connection failed: ${error.message}`,
        error: {
          code: error.code,
          status: error.status,
          moreInfo: error.moreInfo
        }
      };
    }
  }
}

// Export as singleton instance
const twilioServiceInstance = new TwilioService();
module.exports = twilioServiceInstance;