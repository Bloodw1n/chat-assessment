import { computed, onBeforeUnmount, onMounted, readonly, ref } from 'vue'
import { useChatStore } from '@/entities/chat'
import { ReconnectingWebSocket } from '@/shared/api/ws'
import type { WebSocketStatus } from '@/shared/api/ws'

const DEFAULT_WS_URL = 'ws://localhost:8181'

export const useChatSocket = (url?: string) => {
  const store = useChatStore()
  const status = ref<WebSocketStatus>('idle')
  const lastMessage = ref<{ from: string; text: string } | null>(null)
  const socketUrl = url ?? DEFAULT_WS_URL
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
