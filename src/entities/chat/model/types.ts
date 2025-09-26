export type ChatMessageDirection = 'incoming' | 'outgoing'

export interface ChatMessage {
  id: string
  contactId: string
  direction: ChatMessageDirection
  text: string
  timestamp: number
}

export interface Contact {
  id: string
  name: string
  unreadCount: number
  lastMessagePreview: string
  lastMessageTimestamp: number
}
