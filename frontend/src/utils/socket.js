// src/utils/socket.js
import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnecting = false;
  }

  connect(userType, userId, token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    if (this.isConnecting) {
      console.log('Socket connection already in progress');
      return null;
    }

    this.isConnecting = true;
    
    console.log(`Connecting socket as ${userType}: ${userId}`);

    this.socket = io(import.meta.env.VITE_BASE_URL, {
      auth: {
        token,
        userId,
        role: userType
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true
    });

    // Event listeners
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      
      // Join personal room
      if (userType === 'psychic') {
        this.socket.emit('join_psychic_room');
        this.socket.emit('psychic_ready');
      } else {
        this.socket.emit('join_psychic_status');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.isConnecting = false;
      
      if (error.message.includes('auth') || error.message.includes('401') || error.message.includes('403')) {
        console.log('Authentication error, clearing token');
        localStorage.removeItem(userType === 'psychic' ? 'psychicToken' : 'token');
        window.location.href = userType === 'psychic' ? '/psychic/login' : '/login';
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnecting = false;
      
      if (reason === 'io server disconnect') {
        console.log('Server disconnected, attempting to reconnect...');
        setTimeout(() => {
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.connect(userType, userId, token);
          }
        }, 2000);
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Setup all stored listeners
    this.setupStoredListeners();

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.isConnecting = false;
    }
  }

  on(event, callback) {
    if (!this.socket) {
      // Store listener to setup when socket connects
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
      return;
    }

    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (!this.socket?.connected) {
      console.error('Cannot emit: Socket not connected');
      return false;
    }
    
    console.log(`📤 Emitting ${event}:`, data);
    this.socket.emit(event, data);
    return true;
  }

  setupStoredListeners() {
    for (const [event, callbacks] of this.listeners.entries()) {
      callbacks.forEach(callback => {
        this.socket.on(event, callback);
      });
    }
    this.listeners.clear();
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Singleton instance
const socketManager = new SocketManager();
export default socketManager;