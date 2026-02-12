export { ReconnectingWebSocket } from './reconnectingWebSocket'
export type { ReconnectingWebSocketOptions } from './reconnectingWebSocket'
export type { IncomingSocketMessage, WebSocketStatus } from './types'

import { ReconnectingWebSocket as InternalReconnectingWebSocket } from './reconnectingWebSocket'
import type { ReconnectingWebSocketOptions } from './reconnectingWebSocket'

const DEFAULT_WS_URL = 'ws://localhost:8181'

let cachedSocket: InternalReconnectingWebSocket | null = null
let cacheKey: string | null = null

const createCacheKey = (url: string, options: ReconnectingWebSocketOptions) =>
  `${url}:${JSON.stringify(options)}`

export const getOrCreateReconnectingSocket = (
  url: string = DEFAULT_WS_URL,
  options: ReconnectingWebSocketOptions = {},
) => {
  const nextKey = createCacheKey(url, options)

  if (cachedSocket && cacheKey === nextKey) {
    return cachedSocket
  }

  cachedSocket?.close()
  cachedSocket = new InternalReconnectingWebSocket(url, options)
  cacheKey = nextKey

  return cachedSocket
}

export const resetInternalSocketState = () => {
  if (!cachedSocket) {
    cacheKey = null
    return false
  }

  cachedSocket.close()
  cachedSocket = null
  cacheKey = null
  return true
}
