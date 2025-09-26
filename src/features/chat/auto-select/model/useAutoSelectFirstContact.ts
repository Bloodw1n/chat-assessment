import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { useChatStore } from '@/entities/chat'

export const useAutoSelectFirstContact = (isDesktop: Ref<boolean>) => {
  const chatStore = useChatStore()
  const { contacts, activeContactId } = storeToRefs(chatStore)

  watch(
    [isDesktop, () => contacts.value.length],
    ([desktop, contactCount]) => {
      if (desktop && !activeContactId.value && contactCount > 0) {
        const firstContactId = contacts.value[0]?.id

        if (firstContactId) {
          chatStore.setActiveContact(firstContactId)
        }
      }
    },
    { immediate: true },
  )
}
