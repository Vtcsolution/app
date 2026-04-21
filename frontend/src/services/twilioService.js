// frontend/src/services/twilioService.js

class TwilioService {
  constructor() {
    this.room = null;
    this.localAudioTrack = null;
    this.remoteAudioTracks = new Map();
    this.isConnected = false;
    this.isInitialized = false;
  }

  checkSDK() {
    if (!window.Twilio) {
      console.error('❌ Twilio global object not found');
      return false;
    }
    if (!window.Twilio.Video) {
      console.error('❌ Twilio.Video not found. Make sure Video SDK is loaded.');
      return false;
    }
    return true;
  }

  async initialize() {
    try {
      console.log('🎯 Initializing Twilio Video for audio call...');
      
      if (!this.checkSDK()) {
        throw new Error('Twilio Video SDK not loaded');
      }
      
      console.log('✅ Twilio Video SDK available:', {
        version: Twilio.Video.version,
        isSupported: Twilio.Video.isSupported
      });
      
      this.isInitialized = true;
      return true;
      
    } catch (error) {
      console.error('❌ Error initializing Twilio Video:', error);
      throw error;
    }
  }

  // ✅ FIXED: Add initializeDevice method (for compatibility with AudioCallPage)
  async initializeDevice(token) {
    console.log('🎯 Initializing Twilio Device with token...');
    return this.initialize(); // Just call initialize for now
  }

  // ✅ FIXED: Add makeCall method (for compatibility with AudioCallPage)
  async makeCall(to) {
    try {
      console.log(`📞 Making call to: ${to}`);
      // Note: In Video SDK, calls are made by joining rooms, not traditional calls
      // This is just for compatibility
      return true;
    } catch (error) {
      console.error('❌ Error making call:', error);
      throw error;
    }
  }

  // ✅ FIXED: Add endCall method (to fix the error)
  endCall() {
    console.log('📞 Ending call...');
    return this.disconnect();
  }

  async joinRoom(token, roomName) {
    try {
      console.log(`🎤 Joining room: ${roomName}`);
      
      if (!this.checkSDK()) {
        throw new Error('Twilio Video SDK not loaded');
      }
      
      const connectOptions = {
        name: roomName,
        audio: {
          name: 'microphone',
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false,
        dominantSpeaker: false,
        networkQuality: false,
        maxAudioBitrate: 16000,
        preferredAudioCodecs: [{ codec: 'opus', preferredPayloadType: 111 }],
        bandwidthProfile: {
          video: {
            dominantSpeakerPriority: 'standard',
            renderDimensions: {
              low: { width: 1, height: 1 },
              standard: { width: 1, height: 1 },
              high: { width: 1, height: 1 }
            }
          }
        }
      };
      
      console.log('🔧 Connect options:', connectOptions);
      
      this.room = await Twilio.Video.connect(token, connectOptions);
      
      console.log('✅ Connected to room:', this.room.name);
      console.log('👤 Local participant:', this.room.localParticipant.identity);
      this.isConnected = true;
      
      this.setupRoomListeners();
      
      this.room.participants.forEach(participant => {
        console.log('👤 Existing participant:', participant.identity);
        this.setupParticipantListeners(participant);
      });
      
      return this.room;
      
    } catch (error) {
      console.error('❌ Error joining room:', error);
      
      if (error.code === 20101) {
        console.error('Invalid Access Token. Check token generation.');
      } else if (error.code === 53113) {
        console.error('Room not found or already completed.');
      } else if (error.code === 53405) {
        console.error('Room is full (max 2 participants).');
      }
      
      throw error;
    }
  }

  setupRoomListeners() {
    if (!this.room) return;
    
    this.room.on('participantConnected', (participant) => {
      console.log('👤 Participant connected:', participant.identity);
      this.setupParticipantListeners(participant);
    });
    
    this.room.on('participantDisconnected', (participant) => {
      console.log('👤 Participant disconnected:', participant.identity);
      this.cleanupParticipant(participant);
    });
    
    this.room.on('disconnected', (room, error) => {
      console.log('🚪 Room disconnected:', error ? error.message : 'Normal disconnect');
      this.isConnected = false;
      this.cleanup();
    });
    
    this.room.on('reconnecting', (error) => {
      console.log('🔄 Reconnecting to room:', error?.message);
    });
    
    this.room.on('reconnected', () => {
      console.log('✅ Reconnected to room');
    });
  }

  setupParticipantListeners(participant) {
    participant.on('trackSubscribed', (track) => {
      console.log('🎧 Track subscribed from:', participant.identity, track.kind);
      
      if (track.kind === 'audio') {
        const audioElement = this.createAudioElement(participant.identity);
        track.attach(audioElement);
        
        this.remoteAudioTracks.set(participant.sid, { 
          track, 
          audioElement,
          participantIdentity: participant.identity 
        });
        
        console.log('✅ Remote audio attached for:', participant.identity);
      }
    });
    
    participant.on('trackUnsubscribed', (track) => {
      console.log('🎧 Track unsubscribed from:', participant.identity, track.kind);
      this.cleanupParticipantTrack(participant.sid, track);
    });
  }

  createAudioElement(participantIdentity) {
    const audioElement = document.createElement('audio');
    audioElement.id = `audio-${participantIdentity}`;
    audioElement.autoplay = true;
    audioElement.controls = false;
    audioElement.style.display = 'none';
    document.body.appendChild(audioElement);
    
    audioElement.addEventListener('playing', () => {
      console.log('▶️ Audio playing for:', participantIdentity);
    });
    
    audioElement.addEventListener('error', (error) => {
      console.error('🎧 Audio element error:', error, participantIdentity);
    });
    
    return audioElement;
  }

  cleanupParticipant(participant) {
    const trackInfo = this.remoteAudioTracks.get(participant.sid);
    if (trackInfo) {
      if (trackInfo.audioElement) {
        trackInfo.audioElement.remove();
      }
      this.remoteAudioTracks.delete(participant.sid);
      console.log('🧹 Cleaned up participant:', participant.identity);
    }
  }

  cleanupParticipantTrack(participantSid, track) {
    const trackInfo = this.remoteAudioTracks.get(participantSid);
    if (trackInfo && trackInfo.track === track) {
      if (trackInfo.audioElement) {
        trackInfo.audioElement.remove();
      }
      this.remoteAudioTracks.delete(participantSid);
      console.log('🧹 Cleaned up track for participant:', trackInfo?.participantIdentity);
    }
  }

  // ✅ FIXED: Add toggleMute method (for compatibility with AudioCallPage)
  toggleMute(mute) {
    if (this.room && this.room.localParticipant) {
      this.room.localParticipant.audioTracks.forEach(publication => {
        if (publication.track) {
          if (mute) {
            publication.track.disable();
            console.log('🔇 Local audio muted');
          } else {
            publication.track.enable();
            console.log('🔊 Local audio unmuted');
          }
        }
      });
    }
  }

  async disconnect() {
    try {
      if (this.room) {
        this.room.disconnect();
        console.log('✅ Disconnected from room');
      }
      this.cleanup();
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
    }
  }

  cleanup() {
    this.remoteAudioTracks.forEach((trackInfo) => {
      if (trackInfo.audioElement) {
        trackInfo.audioElement.remove();
      }
    });
    this.remoteAudioTracks.clear();
    
    if (this.localAudioTrack) {
      this.localAudioTrack.stop();
      this.localAudioTrack = null;
    }
    
    this.room = null;
    this.isConnected = false;
    
    console.log('🧹 Twilio resources cleaned up');
  }

  // ✅ FIXED: Add getStatus method (for compatibility with AudioCallPage)
  getStatus() {
    return {
      initialized: this.isInitialized,
      connected: this.isConnected,
      audio: this.isConnected ? 'ready' : 'not-ready',
      roomName: this.room?.name,
      localParticipant: this.room?.localParticipant?.identity,
      participants: this.room ? Array.from(this.room.participants.values()).map(p => p.identity) : []
    };
  }

  // ✅ FIXED: Add isAudioEnabled method
  isAudioEnabled() {
    if (this.room && this.room.localParticipant) {
      const audioPublication = this.room.localParticipant.audioTracks.values().next().value;
      return audioPublication && audioPublication.track && audioPublication.track.isEnabled;
    }
    return false;
  }

  getParticipants() {
    if (!this.room) return [];
    
    const participants = [];
    this.room.participants.forEach(participant => {
      participants.push({
        identity: participant.identity,
        sid: participant.sid,
        audioTracks: Array.from(participant.audioTracks.values()).map(pub => ({
          isEnabled: pub.track ? pub.track.isEnabled : false,
          kind: pub.kind
        }))
      });
    });
    
    return participants;
  }

  isReady() {
    return this.isConnected && this.room !== null;
  }
}

// Export as singleton instance
const twilioService = new TwilioService();
export default twilioService;