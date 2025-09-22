import WebSocket, { WebSocketServer } from 'ws';
import { Server as HTTPServer } from 'http';
import { AssetData } from './asset-watcher';

// Message types for different data refresh events
export interface WebSocketMessage {
  type: 'profiles_updated' | 'feedback_updated' | 'metrics_updated' | 'data_refresh' | 'connection_ack';
  timestamp: string;
  data?: any;
  clientId?: string;
}

export interface ConnectedClient {
  id: string;
  socket: WebSocket;
  connectedAt: Date;
  lastPing?: Date;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupHeartbeat();
  }

  /**
   * Initialize WebSocket server on the existing HTTP server
   */
  initialize(server: HTTPServer): void {
    console.log('[WebSocket] Initializing WebSocket server...');
    
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      perMessageDeflate: {
        // Enable compression to reduce bandwidth usage
        threshold: 1024,
        concurrencyLimit: 10,
      }
    });

    this.wss.on('connection', (socket: WebSocket, request) => {
      this.handleConnection(socket, request);
    });

    this.wss.on('error', (error) => {
      console.error('[WebSocket] Server error:', error);
    });

    console.log('[WebSocket] WebSocket server initialized successfully');
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: WebSocket, request: any): void {
    const clientId = this.generateClientId();
    const client: ConnectedClient = {
      id: clientId,
      socket,
      connectedAt: new Date(),
    };

    this.clients.set(clientId, client);
    console.log(`[WebSocket] Client connected: ${clientId} (${this.clients.size} total clients)`);

    // Send connection acknowledgment
    this.sendToClient(clientId, {
      type: 'connection_ack',
      timestamp: new Date().toISOString(),
      data: { clientId }
    });

    // Handle incoming messages
    socket.on('message', (data: WebSocket.Data) => {
      this.handleMessage(clientId, data);
    });

    // Handle client disconnect
    socket.on('close', (code, reason) => {
      this.handleDisconnection(clientId, code, reason);
    });

    // Handle socket errors
    socket.on('error', (error) => {
      console.error(`[WebSocket] Client ${clientId} error:`, error);
      this.removeClient(clientId);
    });

    // Handle pong responses for heartbeat
    socket.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastPing = new Date();
      }
    });
  }

  /**
   * Handle incoming messages from clients
   */
  private handleMessage(clientId: string, data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      console.log(`[WebSocket] Message from ${clientId}:`, message);
      
      // Handle different message types if needed
      // For now, just acknowledge receipt
      this.sendToClient(clientId, {
        type: 'connection_ack',
        timestamp: new Date().toISOString(),
        data: { received: true }
      });
    } catch (error) {
      console.error(`[WebSocket] Invalid message from ${clientId}:`, error);
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(clientId: string, code: number, reason: Buffer): void {
    console.log(`[WebSocket] Client disconnected: ${clientId} (code: ${code}, reason: ${reason.toString()}) (${this.clients.size - 1} remaining clients)`);
    this.removeClient(clientId);
  }

  /**
   * Remove client from active connections
   */
  private removeClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: WebSocketMessage): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`[WebSocket] Failed to send message to ${clientId}:`, error);
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  public broadcast(message: WebSocketMessage): number {
    let successCount = 0;
    const deadClients: string[] = [];

    this.clients.forEach((client, clientId) => {
      if (client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.send(JSON.stringify(message));
          successCount++;
        } catch (error) {
          console.error(`[WebSocket] Failed to broadcast to ${clientId}:`, error);
          deadClients.push(clientId);
        }
      } else {
        deadClients.push(clientId);
      }
    });

    // Clean up dead connections
    deadClients.forEach(clientId => this.removeClient(clientId));

    console.log(`[WebSocket] Broadcasted ${message.type} to ${successCount} clients`);
    return successCount;
  }

  /**
   * Broadcast data refresh notification when profiles are updated
   */
  public broadcastProfilesUpdated(data?: any): number {
    return this.broadcast({
      type: 'profiles_updated',
      timestamp: new Date().toISOString(),
      data
    });
  }

  /**
   * Broadcast data refresh notification when feedback is updated
   */
  public broadcastFeedbackUpdated(data?: any): number {
    return this.broadcast({
      type: 'feedback_updated',
      timestamp: new Date().toISOString(),
      data
    });
  }

  /**
   * Broadcast data refresh notification when metrics are updated
   */
  public broadcastMetricsUpdated(data?: any): number {
    return this.broadcast({
      type: 'metrics_updated',
      timestamp: new Date().toISOString(),
      data
    });
  }

  /**
   * Broadcast general data refresh notification
   */
  public broadcastDataRefresh(assetData: AssetData): number {
    return this.broadcast({
      type: 'data_refresh',
      timestamp: new Date().toISOString(),
      data: {
        profileCount: Object.keys(assetData.profiles).length,
        feedbackCount: Object.keys(assetData.feedback).length,
        metricsCount: Object.keys(assetData.metrics).length
      }
    });
  }

  /**
   * Setup heartbeat to detect and clean up dead connections
   */
  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const deadClients: string[] = [];
      const now = new Date();

      this.clients.forEach((client, clientId) => {
        if (client.socket.readyState === WebSocket.OPEN) {
          // Send ping
          try {
            client.socket.ping();
          } catch (error) {
            console.error(`[WebSocket] Failed to ping ${clientId}:`, error);
            deadClients.push(clientId);
          }
        } else {
          deadClients.push(clientId);
        }

        // Check for clients that haven't responded to ping in too long
        if (client.lastPing && (now.getTime() - client.lastPing.getTime()) > 60000) {
          console.log(`[WebSocket] Client ${clientId} ping timeout`);
          deadClients.push(clientId);
        }
      });

      // Clean up dead connections
      deadClients.forEach(clientId => {
        const client = this.clients.get(clientId);
        if (client) {
          try {
            client.socket.terminate();
          } catch (error) {
            // Ignore errors when terminating dead connections
          }
          this.removeClient(clientId);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get connection statistics
   */
  public getStats(): { connectedClients: number; serverStatus: string } {
    return {
      connectedClients: this.clients.size,
      serverStatus: this.wss ? 'running' : 'stopped'
    };
  }

  /**
   * Shutdown WebSocket service
   */
  public shutdown(): Promise<void> {
    return new Promise((resolve) => {
      console.log('[WebSocket] Shutting down WebSocket service...');
      
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      // Close all client connections
      this.clients.forEach((client, clientId) => {
        try {
          client.socket.close(1000, 'Server shutdown');
        } catch (error) {
          console.error(`[WebSocket] Error closing client ${clientId}:`, error);
        }
      });
      this.clients.clear();

      if (this.wss) {
        this.wss.close(() => {
          console.log('[WebSocket] WebSocket server closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();