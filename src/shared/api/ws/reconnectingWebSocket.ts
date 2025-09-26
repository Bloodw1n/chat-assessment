import type { IncomingSocketMessage, WebSocketStatus } from './types'

type MessageListener = (payload: IncomingSocketMessage) => void
type StatusListener = (status: WebSocketStatus) => void

type ReconnectingWebSocketOptions = {
  reconnectInterval?: number
  maxReconnectInterval?: number
  multiplier?: number
}

const isIncomingMessage = (data: unknown): data is IncomingSocketMessage => {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const root = data as Record<string, unknown>
  const message = root['message']

  if (typeof message !== 'object' || message === null) {
    return false
  }

  const from = (message as Record<string, unknown>)['from']
  const text = (message as Record<string, unknown>)['message']

  return typeof from === 'string' && typeof text === 'string'
}

export class ReconnectingWebSocket {
  private readonly url: string
  private ws: WebSocket | null
  private reconnectTimer: number | null
  private reconnectAttempts: number
  private manuallyClosed: boolean
  private status: WebSocketStatus
  private readonly messageListeners: Set<MessageListener>
  private readonly statusListeners: Set<StatusListener>
  private readonly options: Required<ReconnectingWebSocketOptions>

  constructor(url: string, options: ReconnectingWebSocketOptions = {}) {
    this.url = url
    this.ws = null
    this.reconnectTimer = null
    this.reconnectAttempts = 0
    this.manuallyClosed = false
    this.status = 'idle'
    this.messageListeners = new Set<MessageListener>()
    this.statusListeners = new Set<StatusListener>()
    this.options = {
      reconnectInterval: options.reconnectInterval ?? 1000,
      maxReconnectInterval: options.maxReconnectInterval ?? 10000,
      multiplier: options.multiplier ?? 1.6,
    }
  }

  connect() {
    if (typeof window === 'undefined') {
      return
    }

    this.clearTimer()
    this.manuallyClosed = false
    this.setStatus('connecting')

    this.ws = new WebSocket(this.url)

    this.ws.addEventListener('open', () => {
      this.reconnectAttempts = 0
      this.setStatus('open')
    })

    this.ws.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') {
        return
      }

      try {
        const parsed = JSON.parse(event.data)

        if (isIncomingMessage(parsed)) {
          this.messageListeners.forEach((listener) => listener(parsed))
        }
      } catch (error) {
        console.warn('Не удалось разобрать сообщение WebSocket', error)
      }
    })

    this.ws.addEventListener('close', () => {
      this.setStatus('closed')
      this.scheduleReconnect()
    })

    this.ws.addEventListener('error', () => {
      this.setStatus('error')
      this.scheduleReconnect()
    })
  }

  close() {
    this.manuallyClosed = true
    this.clearTimer()
    this.ws?.close()
    this.setStatus('closed')
  }

  onMessage(listener: MessageListener) {
    this.messageListeners.add(listener)

    return () => {
      this.messageListeners.delete(listener)
    }
  }

  onStatusChange(listener: StatusListener) {
    this.statusListeners.add(listener)
    listener(this.status)

    return () => {
      this.statusListeners.delete(listener)
    }
  }

  private setStatus(status: WebSocketStatus) {
    this.status = status
    this.statusListeners.forEach((listener) => listener(status))
  }

  private scheduleReconnect() {
    if (this.manuallyClosed) {
      return
    }

    const attempt = this.reconnectAttempts + 1
    this.reconnectAttempts = attempt

    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(this.options.multiplier, attempt - 1),
      this.options.maxReconnectInterval,
    )

    this.clearTimer()

    this.reconnectTimer = window.setTimeout(() => {
      this.connect()
    }, delay)
  }

  private clearTimer() {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}
