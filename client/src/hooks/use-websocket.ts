import { useEffect, useRef } from 'react';
import { wsClient } from '@/lib/websocket';

export function useWebSocket(userId: number) {
  const isConnected = useRef(false);

  useEffect(() => {
    if (!isConnected.current && userId) {
      wsClient.connect(userId)
        .then(() => {
          isConnected.current = true;
          console.log('WebSocket connected for user:', userId);
        })
        .catch(error => {
          console.error('WebSocket connection failed:', error);
        });
    }

    return () => {
      if (isConnected.current) {
        wsClient.disconnect();
        isConnected.current = false;
      }
    };
  }, [userId]);

  const onMessage = (type: string, handler: (data: any) => void) => {
    wsClient.onMessage(type, handler);
  };

  const offMessage = (type: string) => {
    wsClient.offMessage(type);
  };

  const sendMessage = (data: any) => {
    wsClient.send(data);
  };

  return {
    onMessage,
    offMessage,
    sendMessage,
    isConnected: wsClient.isConnected
  };
}
