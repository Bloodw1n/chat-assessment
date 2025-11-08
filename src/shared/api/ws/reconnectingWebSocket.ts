import type { IncomingSocketMessage, WebSocketStatus } from './types';

type MessageListener = (payload: IncomingSocketMessage) => void;
type StatusListener = (status: WebSocketStatus) => void;

export type ReconnectingWebSocketOptions = {
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  multiplier?: number;
  maxQueueLength?: number;
  jitter?: number;
};

const isIncomingMessage = (data: unknown): data is IncomingSocketMessage => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const root = data as Record<string, unknown>;
  const message = root['message'];

  if (typeof message !== 'object' || message === null) {
    return false;
  }

  const from = (message as Record<string, unknown>)['from'];
  const text = (message as Record<string, unknown>)['message'];

  return typeof from === 'string' && typeof text === 'string';
};

export class ReconnectingWebSocket {
  private readonly url: string;
  private ws: WebSocket | null;
  private reconnectTimer: number | null;
  private reconnectAttempts: number;
  private manuallyClosed: boolean;
  private status: WebSocketStatus;
  private readonly messageListeners: Set<MessageListener>;
  private readonly statusListeners: Set<StatusListener>;
  private readonly options: Required<ReconnectingWebSocketOptions>;
  private readonly pendingMessages: string[];
  private lastActivityAt: number | null;

  constructor(url: string, options: ReconnectingWebSocketOptions = {}) {
    this.url = url;
    this.ws = null;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.manuallyClosed = false;
    this.status = 'idle';
    this.messageListeners = new Set<MessageListener>();
    this.statusListeners = new Set<StatusListener>();
    this.pendingMessages = [];
    this.lastActivityAt = null;
    this.options = {
      reconnectInterval: options.reconnectInterval ?? 1000,
      maxReconnectInterval: options.maxReconnectInterval ?? 10000,
      multiplier: options.multiplier ?? 1.6,
      maxQueueLength: options.maxQueueLength ?? 50,
      jitter: Math.min(Math.max(options.jitter ?? 0, 0), 1),
    };
  }

  connect() {
    if (typeof window === 'undefined') {
      return;
    }

    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.clearTimer();
    this.manuallyClosed = false;
    this.setStatus('connecting');

    this.ws = new WebSocket(this.url);

    this.ws.addEventListener('open', () => {
      this.reconnectAttempts = 0;
      this.lastActivityAt = Date.now();
      this.setStatus('open');
      this.flushPendingMessages();
    });

    this.ws.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') {
        return;
      }

      this.lastActivityAt = Date.now();
      try {
        const parsed = JSON.parse(event.data);

        if (isIncomingMessage(parsed)) {
          this.messageListeners.forEach((listener) => listener(parsed));
        }
      } catch (error) {
        console.warn('Не удалось разобрать сообщение WebSocket', error);
      }
    });

    this.ws.addEventListener('close', () => {
      this.ws = null;
      this.lastActivityAt = Date.now();
      this.setStatus('closed');
      this.scheduleReconnect();
    });

    this.ws.addEventListener('error', () => {
      this.ws = null;
      this.lastActivityAt = Date.now();
      this.setStatus('error');
      this.scheduleReconnect();
    });
  }

  close() {
    this.manuallyClosed = true;
    this.clearTimer();
    this.ws?.close();
    this.ws = null;
    this.pendingMessages.length = 0;
    this.setStatus('closed');
  }

  onMessage(listener: MessageListener) {
    this.messageListeners.add(listener);

    return () => {
      this.messageListeners.delete(listener);
    };
  }

  onStatusChange(listener: StatusListener) {
    this.statusListeners.add(listener);
    listener(this.status);

    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(status: WebSocketStatus) {
    if (this.status === status) {
      return;
    }

    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  private scheduleReconnect() {
    if (this.manuallyClosed) {
      return;
    }

    const attempt = this.reconnectAttempts + 1;
    this.reconnectAttempts = attempt;

    const baseDelay =
      this.options.reconnectInterval * Math.pow(this.options.multiplier, attempt - 1);
    const jitterOffset =
      this.options.jitter > 0 ? baseDelay * Math.random() * this.options.jitter : 0;
    const delay = Math.min(baseDelay + jitterOffset, this.options.maxReconnectInterval);

    this.clearTimer();

    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearTimer() {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  send(payload: unknown): boolean {
    const message = this.serializePayload(payload);

    if (message === null) {
      return false;
    }

    const socket = this.ws;

    if (socket && socket.readyState === socket.OPEN) {
      socket.send(message);
      this.lastActivityAt = Date.now();
      return true;
    }

    if (this.status === 'idle' && !this.manuallyClosed) {
      this.connect();
    }

    if (this.pendingMessages.length >= this.options.maxQueueLength) {
      this.pendingMessages.shift();
    }

    this.pendingMessages.push(message);
    return false;
  }

  private flushPendingMessages() {
    if (!this.ws || this.pendingMessages.length === 0) {
      return;
    }

    while (this.pendingMessages.length > 0) {
      const next = this.pendingMessages.shift();

      if (next !== undefined) {
        this.ws.send(next);
        this.lastActivityAt = Date.now();
      }
    }
  }

  getMetaSnapshot(): {
    status: WebSocketStatus;
    reconnectAttempts: number;
    queueLength: number;
    lastActivityAt: number | null;
  } {
    return {
      status: this.status,
      reconnectAttempts: this.reconnectAttempts,
      queueLength: this.pendingMessages.length,
      lastActivityAt: this.lastActivityAt,
    };
  }

  private serializePayload(payload: unknown): string | null {
    if (typeof payload === 'string') {
      return payload;
    }

    try {
      return JSON.stringify(payload);
    } catch (error) {
      console.warn('Не удалось сериализовать сообщение WebSocket', error);
      return null;
    }
  }
}
