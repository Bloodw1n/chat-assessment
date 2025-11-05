import { computed, onBeforeUnmount, onMounted, readonly, ref } from 'vue'
import { useChatStore } from '@/entities/chat'
import { ReconnectingWebSocket } from '@/shared/api/ws'
import type { WebSocketStatus } from '@/shared/api/ws'

const DEFAULT_WS_URL = 'ws://localhost:8181'

export const useChatSocket = (url?: string) => {
  const store = useChatStore()
  const status = ref<WebSocketStatus>('idle')
  let socket: ReconnectingWebSocket | null = null
  let detachMessage: (() => void) | undefined
  let detachStatus: (() => void) | undefined
  const isConnected = computed(() => status.value === 'open')

  onMounted(() => {
    socket = new ReconnectingWebSocket(url ?? DEFAULT_WS_URL)

    detachMessage = socket.onMessage(({ message }) => {
      store.handleIncoming({ from: message.from, text: message.message })
    })

    detachStatus = socket.onStatusChange((nextStatus) => {
      status.value = nextStatus
    })

    socket.connect()
  })

  onBeforeUnmount(() => {
    detachMessage?.()
    detachStatus?.()
    socket?.close()
  })

  const send = (payload: unknown) => {
    if (!socket) {
      return false
    }

    return socket.send(payload)
  }

  const reconnect = () => {
    if (!socket) {
      return false
    }

    socket.connect()
    return true
  }

  return {
    status: readonly(status),
    send,
    isConnected,
    reconnect,
  }
}
