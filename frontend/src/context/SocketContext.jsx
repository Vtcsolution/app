// src/context/SocketContext.jsx
import React, { createContext, useContext, useRef, useEffect } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, userType = 'user', userId, token }) => {
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;

  // Clean up socket
  const cleanupSocket = () => {
    if (socketRef.current) {
      console.log('🧹 Cleaning up socket:', socketRef.current.id);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // Initialize socket
  const initializeSocket = () => {
    // Don't create socket if no userId or token
    if (!userId || !token || !userType) {
      console.log('⚠️ Cannot create socket: missing userId, token, or userType');
      return;
    }

    // Clean up existing socket first
    cleanupSocket();

    console.log('🔄 Creating socket connection for:', { userId, userType });

    const newSocket = io(`${import.meta.env.VITE_BASE_URL}`, {
      auth: {
        token,
        userId,
        role: userType
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = newSocket;

    // Event listeners
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      reconnectAttemptsRef.current = 0;
      
      // Join appropriate room based on user type
      if (userType === 'psychic') {
        newSocket.emit('join_psychic_room', userId);
      } else if (userType === 'user') {
        newSocket.emit('join_user_room', userId);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      reconnectAttemptsRef.current++;
      
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.log('⚠️ Max reconnection attempts reached');
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    return newSocket;
  };

  // Get socket instance
  const getSocket = () => {
    if (!socketRef.current) {
      return initializeSocket();
    }
    return socketRef.current;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🔌 SocketProvider unmounting, cleaning up socket');
      cleanupSocket();
    };
  }, []);

  // Reinitialize socket when userId, token, or userType changes
  useEffect(() => {
    if (userId && token && userType) {
      const socket = initializeSocket();
      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    }
  }, [userId, token, userType]);

  const value = {
    getSocket,
    isConnected: () => socketRef.current?.connected || false,
    disconnect: cleanupSocket
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};