import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(userId: number) {
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Function[]>>(new Map());

  useEffect(() => {
    if (!userId) return;

    // Create socket connection
    socketRef.current = io('/', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    // Join user room
    socket.emit('join_user', userId);

    // Handle connection events
    socket.on('connected', (data) => {
      console.log('WebSocket connected:', data);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Handle incoming messages
    socket.on('message', (message) => {
      const listeners = listenersRef.current.get('message') || [];
      listeners.forEach(listener => listener(message));
    });

    socket.on('session_status', (status) => {
      const listeners = listenersRef.current.get('session_status') || [];
      listeners.forEach(listener => listener(status));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      listenersRef.current.clear();
    };
  }, [userId]);

  const onMessage = useCallback((event: string, callback: Function) => {
    const listeners = listenersRef.current.get(event) || [];
    listeners.push(callback);
    listenersRef.current.set(event, listeners);

    return () => {
      const currentListeners = listenersRef.current.get(event) || [];
      const index = currentListeners.indexOf(callback);
      if (index > -1) {
        currentListeners.splice(index, 1);
        listenersRef.current.set(event, currentListeners);
      }
    };
  }, []);

  const offMessage = useCallback((event: string, callback: Function) => {
    const listeners = listenersRef.current.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      listenersRef.current.set(event, listeners);
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    onMessage,
    offMessage,
    emit,
    connected: socketRef.current?.connected || false,
  };
}