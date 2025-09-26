import { useChatStore } from '@/entities/chat'

export const useSendMessage = () => {
  const chatStore = useChatStore()

  const send = (message: string) => {
    chatStore.sendLocalMessage(message)
  }

  return {
    send,
  }
}
