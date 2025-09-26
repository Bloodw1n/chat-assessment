<template>
  <div class="min-h-screen bg-slate-100 px-3 py-6">
    <div class="mx-auto flex h-[calc(100vh-3rem)] max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl lg:h-[720px]">
      <div class="flex flex-1 overflow-hidden">
        <ChatContacts
          v-if="showContacts"
          class="w-full max-w-full border-r border-slate-100 md:max-w-sm lg:max-w-xs"
          :contacts="contacts"
          :active-contact-id="activeContactId"
          :status="socketStatus"
          @select="handleSelect"
        />

        <ChatDialog
          v-if="showChat"
          class="flex-1"
          :contact="activeContact"
          :messages="activeMessages"
          :show-back-button="!isDesktop"
          @back="handleBack"
          @send="handleSend"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/entities/chat'
import { useChatSocket } from '@/processes/chat-connection'
import { useMediaQuery } from '@/shared/lib/media-query'
import ChatContacts from '@/widgets/chat-contacts'
import ChatDialog from '@/widgets/chat-dialog'
import { useSelectContact } from '@/features/chat/select-contact'
import { useSendMessage } from '@/features/chat/send-message'
import { useAutoSelectFirstContact } from '@/features/chat/auto-select'

const chatStore = useChatStore()
const { contacts, activeContact, activeMessages, activeContactId } = storeToRefs(chatStore)

const { selectContact, clearSelection } = useSelectContact()
const { send } = useSendMessage()

const { status } = useChatSocket(import.meta.env.VITE_WS_URL)
const socketStatus = computed(() => status.value)

const isDesktop = useMediaQuery('(min-width: 1024px)')

useAutoSelectFirstContact(isDesktop)

const showContacts = computed(() => isDesktop.value || !activeContactId.value)
const showChat = computed(() => isDesktop.value || Boolean(activeContactId.value))

const handleSelect = (contactId: string) => {
  selectContact(contactId)
}

const handleBack = () => {
  clearSelection()
}

const handleSend = (message: string) => {
  send(message)
}
</script>
