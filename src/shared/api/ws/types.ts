export interface IncomingSocketMessage {
  message: {
    from: string
    message: string
  }
}

export type WebSocketStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error'
