import { useEffect, useRef, useState, useCallback } from 'react';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// WebSocket message types matching server implementation
interface WebSocketMessage {
  type: 'profiles_updated' | 'feedback_updated' | 'metrics_updated' | 'data_refresh' | 'connection_ack';
  timestamp: string;
  data?: any;
  clientId?: string;
}

// Connection states
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  backoffMultiplier?: number;
}

interface UseWebSocketReturn {
  connectionState: ConnectionState;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  clientId: string | null;
}

const DEFAULT_OPTIONS: Required<UseWebSocketOptions> = {
  autoConnect: true,
  reconnectAttempts: 5,
  reconnectInterval: 1000,
  maxReconnectInterval: 30000,
  backoffMultiplier: 2,
};

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { toast } = useToast();
  
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectIntervalRef = useRef(opts.reconnectInterval);
  const mountedRef = useRef(true);

  // Get WebSocket URL (use current host and protocol)
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }, []);

  // Handle different message types and invalidate appropriate caches
  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log('[WebSocket] Received message:', message);
    setLastMessage(message);

    switch (message.type) {
      case 'connection_ack':
        if (message.data?.clientId) {
          setClientId(message.data.clientId);
          console.log('[WebSocket] Client ID received:', message.data.clientId);
        }
        break;

      case 'profiles_updated':
        // Invalidate profiles data
        queryClient.invalidateQueries({ queryKey: ['/api/assets/profiles'] });
        toast({
          title: 'Client Profiles Updated',
          description: 'Client profile data has been refreshed automatically',
          variant: 'default',
        });
        break;

      case 'feedback_updated':
        // Invalidate feedback data
        queryClient.invalidateQueries({ queryKey: ['/api/assets/feedback'] });
        toast({
          title: 'Client Feedback Updated',
          description: 'Client feedback data has been refreshed automatically',
          variant: 'default',
        });
        break;

      case 'metrics_updated':
        // Invalidate metrics data
        queryClient.invalidateQueries({ queryKey: ['/api/assets/metrics'] });
        toast({
          title: 'Client Metrics Updated',
          description: 'Client performance metrics have been refreshed automatically',
          variant: 'default',
        });
        break;

      case 'data_refresh':
        // Invalidate all asset-related queries
        queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
        
        // Show comprehensive update notification
        const { profileCount, feedbackCount, metricsCount } = message.data || {};
        toast({
          title: 'Dashboard Data Refreshed',
          description: `Updated: ${profileCount || 0} profiles, ${feedbackCount || 0} feedback entries, ${metricsCount || 0} metrics`,
          variant: 'default',
        });
        break;

      default:
        console.log('[WebSocket] Unknown message type:', message.type);
    }
  }, [toast]);

  // WebSocket connection management
  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocket] Connection already in progress');
      return;
    }

    try {
      setConnectionState('connecting');
      const wsUrl = getWebSocketUrl();
      console.log('[WebSocket] Connecting to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('[WebSocket] Connected successfully');
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;
        reconnectIntervalRef.current = opts.reconnectInterval;

        // Clear any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error, event.data);
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        setConnectionState('disconnected');
        wsRef.current = null;

        // Only attempt reconnection if it wasn't a manual disconnect (code 1000)
        if (event.code !== 1000 && reconnectAttemptsRef.current < opts.reconnectAttempts) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        if (!mountedRef.current) return;
        
        console.error('[WebSocket] Connection error:', error);
        setConnectionState('error');
        
        // Show error toast only if we haven't been trying to reconnect
        if (reconnectAttemptsRef.current === 0) {
          toast({
            title: 'Connection Error',
            description: 'Lost connection to server. Attempting to reconnect...',
            variant: 'destructive',
          });
        }
      };

    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      setConnectionState('error');
    }
  }, [getWebSocketUrl, handleMessage, opts.reconnectAttempts, opts.reconnectInterval, toast]);

  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    
    reconnectAttemptsRef.current += 1;
    
    if (reconnectAttemptsRef.current > opts.reconnectAttempts) {
      console.log('[WebSocket] Maximum reconnection attempts reached');
      toast({
        title: 'Connection Lost',
        description: 'Unable to reconnect to server. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    setConnectionState('reconnecting');
    
    console.log(`[WebSocket] Scheduling reconnection attempt ${reconnectAttemptsRef.current}/${opts.reconnectAttempts} in ${reconnectIntervalRef.current}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      connect();
    }, reconnectIntervalRef.current);

    // Exponential backoff with maximum interval
    reconnectIntervalRef.current = Math.min(
      reconnectIntervalRef.current * opts.backoffMultiplier,
      opts.maxReconnectInterval
    );
  }, [connect, opts.reconnectAttempts, opts.backoffMultiplier, opts.maxReconnectInterval, toast]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    console.log('[WebSocket] Manually disconnecting...');
    
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setConnectionState('disconnected');
    reconnectAttemptsRef.current = 0;
    reconnectIntervalRef.current = opts.reconnectInterval;
  }, [opts.reconnectInterval]);

  // Manual reconnect (resets attempt counter)
  const reconnect = useCallback(() => {
    console.log('[WebSocket] Manual reconnection requested');
    reconnectAttemptsRef.current = 0;
    reconnectIntervalRef.current = opts.reconnectInterval;
    disconnect();
    setTimeout(() => connect(), 100);
  }, [connect, disconnect, opts.reconnectInterval]);

  // Send message to WebSocket server
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        console.log('[WebSocket] Message sent:', message);
      } catch (error) {
        console.error('[WebSocket] Failed to send message:', error);
      }
    } else {
      console.warn('[WebSocket] Cannot send message: connection not open');
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (opts.autoConnect) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [opts.autoConnect, connect, disconnect]);

  // Handle visibility change to reconnect when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && connectionState === 'disconnected') {
        console.log('[WebSocket] Tab became active, attempting to reconnect');
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connectionState, connect]);

  return {
    connectionState,
    connect,
    disconnect,
    reconnect,
    lastMessage,
    sendMessage,
    clientId,
  };
}