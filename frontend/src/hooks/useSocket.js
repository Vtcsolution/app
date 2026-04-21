// src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import socketManager from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import { usePsychicAuth } from '../context/PsychicAuthContext';

const useSocket = () => {
  const { user } = useAuth();
  const { psychic } = usePsychicAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    let socket = null;
    
    if (psychic?.authenticated) {
      const token = localStorage.getItem('psychicToken');
      socket = socketManager.connect('psychic', psychic._id, token);
    } else if (user?.authenticated) {
      const token = localStorage.getItem('token');
      socket = socketManager.connect('user', user._id, token);
    }

    socketRef.current = socket;

    return () => {
      // Only disconnect if component unmounts, not on re-renders
      // socketManager.disconnect();
    };
  }, [user, psychic]);

  const emit = (event, data) => {
    return socketManager.emit(event, data);
  };

  const on = (event, callback) => {
    socketManager.on(event, callback);
  };

  const off = (event, callback) => {
    socketManager.off(event, callback);
  };

  const disconnect = () => {
    socketManager.disconnect();
  };

  return {
    socket: socketRef.current,
    emit,
    on,
    off,
    disconnect,
    isConnected: socketManager.isConnected()
  };
};

export default useSocket;