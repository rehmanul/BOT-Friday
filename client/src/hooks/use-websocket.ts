
import { useEffect, useRef } from 'react';
import { connectWebSocket, disconnectWebSocket, getWebSocket } from '../lib/websocket';

export const useWebSocket = (userId: number | null) => {
  const wsRef = useRef<WebSocket | null>(null);
  const userIdRef = useRef<number | null>(null);
  const messageHandlers = useRef<Map<string, Function>>(new Map());

  useEffect(() => {
    if (!userId || userId === userIdRef.current) return;

    // Update user ID reference
    userIdRef.current = userId;

    // Connect WebSocket only if not already connected
    const existingWs = getWebSocket();
    if (!existingWs || existingWs.readyState !== WebSocket.OPEN) {
      wsRef.current = connectWebSocket(userId);
    } else {
      wsRef.current = existingWs;
    }

    // Setup message handling
    if (wsRef.current) {
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
  }, [userId]);

  const handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      const handler = messageHandlers.current.get(data.type);
      if (handler) {
        handler(data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  const onMessage = (type: string, handler: Function) => {
    messageHandlers.current.set(type, handler);
  };

  const offMessage = (type: string) => {
    messageHandlers.current.delete(type);
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const isConnected = wsRef.current?.readyState === WebSocket.OPEN;

  return {
    onMessage,
    offMessage,
    sendMessage,
    isConnected
  };
};
