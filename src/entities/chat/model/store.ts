import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { ChatMessage, ChatMessageDirection, Contact } from './types'

interface IncomingPayload {
  from: string
  text: string
}

const createMessageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const sortContacts = (items: Contact[]) =>
  [...items].sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp)

const createChatMessage = (
  contactId: string,
  direction: ChatMessageDirection,
  text: string,
  timestamp: number,
): ChatMessage => ({
  id: createMessageId(),
  contactId,
  direction,
  text,
  timestamp,
})

export const useChatStore = defineStore('chat', () => {
  const contacts = ref<Contact[]>([])
  const messages = ref<Record<string, ChatMessage[]>>({})
  const activeContactId = ref<string | null>(null)

  const activeContact = computed(() =>
    contacts.value.find((contact) => contact.id === activeContactId.value) ?? null,
  )

  const activeMessages = computed(() => {
    if (!activeContactId.value) {
      return []
    }

    return messages.value[activeContactId.value] ?? []
  })

  const hasContacts = computed(() => contacts.value.length > 0)

  const upsertContact = (name: string) => {
    const id = name.trim()
    const existing = contacts.value.find((contact) => contact.id === id)

    if (existing) {
      return existing
    }

    const newContact: Contact = {
      id,
      name,
      unreadCount: 0,
      lastMessagePreview: '',
      lastMessageTimestamp: 0,
    }

    contacts.value = sortContacts([...contacts.value, newContact])

    return newContact
  }

  const appendMessage = (message: ChatMessage) => {
    const contactMessages = messages.value[message.contactId] ?? []

    messages.value = {
      ...messages.value,
      [message.contactId]: [...contactMessages, message],
    }
  }

  const updateContactMeta = (contactId: string, updater: (contact: Contact) => Contact) => {
    const updated = contacts.value.map((contact) =>
      contact.id === contactId ? updater(contact) : contact,
    )

    contacts.value = sortContacts(updated)
  }

  const setLastMessageMeta = (
    contactId: string,
    text: string,
    timestamp: number,
    unreadCountUpdater: (currentUnread: number) => number,
  ) => {
    updateContactMeta(contactId, (current) => ({
      ...current,
      lastMessagePreview: text,
      lastMessageTimestamp: timestamp,
      unreadCount: unreadCountUpdater(current.unreadCount),
    }))
  }

  const markAsRead = (contactId: string) => {
    updateContactMeta(contactId, (contact) => ({
      ...contact,
      unreadCount: 0,
    }))
  }

  const handleIncoming = ({ from, text }: IncomingPayload) => {
    const contact = upsertContact(from)
    const timestamp = Date.now()

    const message = createChatMessage(contact.id, 'incoming', text, timestamp)

    appendMessage(message)

    setLastMessageMeta(contact.id, text, timestamp, (currentUnread) =>
      activeContactId.value === contact.id ? 0 : currentUnread + 1,
    )
  }

  const sendLocalMessage = (text: string) => {
    if (!activeContactId.value) {
      return
    }

    const timestamp = Date.now()

    const message = createChatMessage(activeContactId.value, 'outgoing', text, timestamp)

    appendMessage(message)

    setLastMessageMeta(message.contactId, text, timestamp, (currentUnread) => currentUnread)
  }

  const setActiveContact = (contactId: string | null) => {
    activeContactId.value = contactId

    if (contactId) {
      markAsRead(contactId)
    }
  }

  const clear = () => {
    contacts.value = []
    messages.value = {}
    activeContactId.value = null
  }

  return {
    contacts,
    activeContact,
    activeMessages,
    activeContactId,
    hasContacts,
    handleIncoming,
    sendLocalMessage,
    setActiveContact,
    clear,
    markAsRead,
  }
})
