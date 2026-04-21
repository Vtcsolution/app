// utils/audioSocket.js
import { io } from 'socket.io-client';

class AudioSocketManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.psychicId = null;
    this.token = null;
  }

  connect(psychicId, token) {
    if (this.socket?.connected) {
      console.log('Audio socket already connected');
      return this.socket;
    }

    this.psychicId = psychicId;
    this.token = token;

    console.log('🔌 Connecting to audio namespace...');
    
    this.socket = io(`${import.meta.env.VITE_BASE_URL || 'http://localhost:5001'}/audio-calls`, {
      auth: {
        token: token,
        psychicId: psychicId,
        role: 'psychic'
      },
      query: {
        psychicId: psychicId,
        type: 'audio',
        timestamp: Date.now()
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 30000,
      forceNew: true,
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Audio socket connected:', this.socket.id);
      this.connected = true;
      
      // Immediately register as psychic
      setTimeout(() => {
        this.registerPsychic(psychicId);
      }, 100);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Audio socket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Audio socket connection error:', error.message);
      this.connected = false;
    });

    this.socket.on('registration-success', (data) => {
      console.log('✅ Audio registration success:', data);
    });

    this.socket.on('registration-error', (error) => {
      console.error('❌ Audio registration error:', error);
    });

    return this.socket;
  }

  registerPsychic(psychicId) {
    if (!this.socket?.connected) {
      console.error('Cannot register: Socket not connected');
      return;
    }

    console.log('📝 Registering psychic for audio calls:', psychicId);
    this.socket.emit('psychic-register', psychicId);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new AudioSocketManager();