export { ReconnectingWebSocket } from './reconnectingWebSocket'
export type { ReconnectingWebSocketOptions } from './reconnectingWebSocket'
export type { IncomingSocketMessage, WebSocketStatus } from './types'

import { ReconnectingWebSocket as InternalReconnectingWebSocket } from './reconnectingWebSocket'
import type { ReconnectingWebSocketOptions } from './reconnectingWebSocket'

type ReconnectingSocketScopeKey = string

const socketCache = new Map<string, InternalReconnectingWebSocket>()

const createCacheKey = (
  scopeKey: ReconnectingSocketScopeKey,
  url: string,
  options: ReconnectingWebSocketOptions,
) => `${scopeKey}:${url}:${JSON.stringify(options)}`

const resetSocketScope = (scopeKey: ReconnectingSocketScopeKey) => {
  const scopePrefix = `${scopeKey}:`
  let removed = false

  socketCache.forEach((socket, key) => {
    if (!key.startsWith(scopePrefix)) {
      return
    }

    socket.close()
    socketCache.delete(key)
    removed = true
  })

  return removed
}

export const getOrCreateReconnectingSocket = (
  url: string,
  scopeKey: ReconnectingSocketScopeKey,
  options: ReconnectingWebSocketOptions = {},
) => {
  const nextKey = createCacheKey(scopeKey, url, options)
  const cachedSocket = socketCache.get(nextKey)

  if (cachedSocket) {
    return cachedSocket
  }

  resetSocketScope(scopeKey)

  const nextSocket = new InternalReconnectingWebSocket(url, options)
  socketCache.set(nextKey, nextSocket)

  return nextSocket
}

export const resetInternalSocketState = (scopeKey?: ReconnectingSocketScopeKey) => {
  if (scopeKey) {
    return resetSocketScope(scopeKey)
  }

  if (socketCache.size === 0) {
    return false
  }

  socketCache.forEach((socket) => {
    socket.close()
  })
  socketCache.clear()

  return true
}
