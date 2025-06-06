let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let reconnectTimer: NodeJS.Timeout | null = null;
let isConnecting = false;

export const connectWebSocket = (userId: number) => {
  // Prevent multiple connection attempts
  if (isConnecting || (ws && ws.readyState === WebSocket.OPEN)) {
    return ws;
  }

  // Close existing connection if it's in a bad state
  if (ws && ws.readyState !== WebSocket.CLOSED) {
    ws.close();
    ws = null;
  }

  isConnecting = true;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  console.log('Connecting to WebSocket:', wsUrl);

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket connected for user:', userId);
    isConnecting = false;
    reconnectAttempts = 0;

    // Send user identification
    ws?.send(JSON.stringify({
      type: 'authenticate',
      userId: userId
    }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Handle different message types
      switch (data.type) {
        case 'activity_update':
          // Trigger activity refresh
          window.dispatchEvent(new CustomEvent('activity_update', { detail: data }));
          break;
        case 'campaign_update':
          // Trigger campaign refresh
          window.dispatchEvent(new CustomEvent('campaign_update', { detail: data }));
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
    isConnecting = false;
    ws = null;

    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);

      reconnectTimer = setTimeout(() => {
        connectWebSocket(userId);
      }, 2000 * reconnectAttempts); // Exponential backoff
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    isConnecting = false;
  };

  return ws;
};

export const disconnectWebSocket = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }

  isConnecting = false;
  reconnectAttempts = 0;
};

export const getWebSocket = () => ws;