import { computed } from 'vue'
import { useChatStore } from '@/entities/chat'

export const useSelectContact = () => {
  const chatStore = useChatStore()

  const selectContact = (contactId: string) => {
    chatStore.setActiveContact(contactId)
  }

  const clearSelection = () => {
    chatStore.setActiveContact(null)
  }

  const selectedContactId = computed(() => chatStore.activeContactId)

  return {
    selectContact,
    clearSelection,
    selectedContactId,
  }
}
