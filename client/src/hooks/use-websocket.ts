
import { useEffect, useRef, useCallback } from 'react';
import { connectWebSocket, disconnectWebSocket, getWebSocket } from '../lib/websocket';

export const useWebSocket = (userId: number | null) => {
  const wsRef = useRef<WebSocket | null>(null);
  const userIdRef = useRef<number | null>(null);
  const messageHandlers = useRef<Map<string, Function>>(new Map());

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      const handler = messageHandlers.current.get(data.type);
      if (handler) {
        handler(data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, []);

  const onMessage = useCallback((type: string, handler: Function) => {
    messageHandlers.current.set(type, handler);
  }, []);

  const offMessage = useCallback((type: string) => {
    messageHandlers.current.delete(type);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    if (!userId || userId === userIdRef.current) return;

    // Clean up previous connection
    if (wsRef.current) {
      wsRef.current.removeEventListener('message', handleMessage);
      disconnectWebSocket();
    }

    userIdRef.current = userId;

    // Connect to WebSocket
    connectWebSocket(userId);
    const existingWs = getWebSocket();
    
    if (existingWs) {
      wsRef.current = existingWs;
      wsRef.current.addEventListener('message', handleMessage);
    }

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.removeEventListener('message', handleMessage);
      }
      disconnectWebSocket();
      userIdRef.current = null;
      messageHandlers.current.clear();
    };
  }, [userId, handleMessage]);

  const isConnected = wsRef.current?.readyState === WebSocket.OPEN;

  // Always return the same interface structure
  return {
    onMessage,
    offMessage,
    sendMessage,
    isConnected
  };
};
