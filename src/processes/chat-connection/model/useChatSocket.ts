import { computed, onBeforeUnmount, onMounted, readonly, ref } from 'vue'
import { useChatStore } from '@/entities/chat'
import { ReconnectingWebSocket } from '@/shared/api/ws'
import type { WebSocketStatus } from '@/shared/api/ws'

const LOCAL_SOCKET_PORT = '8181'
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'])

const resolveSocketUrl = (url?: string) => {
  if (url) {
    return url
  }

  if (typeof window === 'undefined') {
    return null
  }

  const { hostname, host, protocol } = window.location
  const isLocalhost = LOCAL_HOSTNAMES.has(hostname)
  const socketProtocol = isLocalhost
    ? protocol === 'https:'
      ? 'wss:'
      : 'ws:'
    : 'wss:'
  const socketHost = isLocalhost ? `${hostname}:${LOCAL_SOCKET_PORT}` : host

  return `${socketProtocol}//${socketHost}`
}

export const useChatSocket = (url?: string) => {
  const store = useChatStore()
  const status = ref<WebSocketStatus>('idle')
  const lastMessage = ref<{ from: string; text: string } | null>(null)
  let socket: ReconnectingWebSocket | null = null
  let detachMessage: (() => void) | undefined
  let detachStatus: (() => void) | undefined
  const isConnected = computed(() => status.value === 'open')

  const cleanupListeners = () => {
    detachMessage?.()
    detachStatus?.()
    detachMessage = undefined
    detachStatus = undefined
  }

  const closeSocket = () => {
    cleanupListeners()
    socket?.close()
    socket = null
  }

  const attachSocketListeners = (nextSocket: ReconnectingWebSocket) => {
    detachMessage = nextSocket.onMessage(({ message }) => {
      const normalized = { from: message.from, text: message.message }
      lastMessage.value = normalized
      store.handleIncoming(normalized)
    })

    detachStatus = nextSocket.onStatusChange((nextStatus) => {
      status.value = nextStatus
    })
  }

  const connectSocket = () => {
    const socketUrl = resolveSocketUrl(url)

    if (!socketUrl) {
      status.value = 'error'
      return
    }

    closeSocket()

    const nextSocket = new ReconnectingWebSocket(socketUrl)
    socket = nextSocket
    attachSocketListeners(nextSocket)
    nextSocket.connect()
  }

  onMounted(() => {
    connectSocket()
  })

  onBeforeUnmount(() => {
    closeSocket()
  })

  const send = (payload: unknown) => socket?.send(payload) ?? false

  const reconnect = () => {
    if (!socket) {
      return false
    }

    socket.connect()
    return true
  }

  const getSocketMeta = () => socket?.getMetaSnapshot() ?? null

  return {
    status: readonly(status),
    send,
    isConnected,
    reconnect,
    lastMessage: readonly(lastMessage),
    getSocketMeta,
  }
}
