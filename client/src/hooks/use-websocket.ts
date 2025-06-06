import { useEffect, useRef } from 'react';
import { connectWebSocket, disconnectWebSocket, getWebSocket } from '../lib/websocket';

export const useWebSocket = (userId: number | null) => {
  const wsRef = useRef<WebSocket | null>(null);
  const userIdRef = useRef<number | null>(null);

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

    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
      userIdRef.current = null;
    };
  }, [userId]);

  return wsRef.current;
};