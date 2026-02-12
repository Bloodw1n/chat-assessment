import { computed, onBeforeUnmount, onMounted, readonly, ref } from 'vue'
import { useChatStore } from '@/entities/chat'
import { ReconnectingWebSocket } from '@/shared/api/ws'
import type { WebSocketStatus } from '@/shared/api/ws'

const DEFAULT_WS_URL = 'ws://localhost:8181'

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

  const connectSocket = () => {
    closeSocket()

    const nextSocket = new ReconnectingWebSocket(url ?? DEFAULT_WS_URL)
    socket = nextSocket

    detachMessage = nextSocket.onMessage(({ message }) => {
      const normalized = { from: message.from, text: message.message }
      lastMessage.value = normalized
      store.handleIncoming(normalized)
    })

    detachStatus = nextSocket.onStatusChange((nextStatus) => {
      status.value = nextStatus
    })

    nextSocket.connect()
  }

  const withSocket = <T>(handler: (activeSocket: ReconnectingWebSocket) => T, fallback: T) => {
    if (!socket) {
      return fallback
    }

    return handler(socket)
  }

  onMounted(() => {
    connectSocket()
  })

  onBeforeUnmount(() => {
    closeSocket()
  })

  const send = (payload: unknown) => withSocket((activeSocket) => activeSocket.send(payload), false)

  const reconnect = () =>
    withSocket((activeSocket) => {
      activeSocket.connect()
      return true
    }, false)

  const getSocketMeta = () =>
    withSocket((activeSocket) => activeSocket.getMetaSnapshot(), null)

  return {
    status: readonly(status),
    send,
    isConnected,
    reconnect,
    lastMessage: readonly(lastMessage),
    getSocketMeta,
  }
}
