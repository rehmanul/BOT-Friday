export class WebSocketClient {
  private ws: WebSocket | null = null;
  private userId: number | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private isConnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async connect(userId: number): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    this.userId = userId;
    this.isConnecting = true;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      console.log('Connecting to WebSocket:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected for user:', this.userId);
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Authenticate with user ID
        this.send({ type: 'auth', userId: this.userId });

        // Start heartbeat
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') {
            return; // Handle heartbeat response
          }
          const handler = this.messageHandlers.get(data.type);
          if (handler) {
            handler(data);
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.isConnecting = false;
        this.ws = null;
        this.stopHeartbeat();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  disconnect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  offMessage(type: string): void {
    this.messageHandlers.delete(type);
  }

  private handleMessage(message: any): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        if (this.userId) {
          this.connect(this.userId);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }
}

export const wsClient = new WebSocketClient();