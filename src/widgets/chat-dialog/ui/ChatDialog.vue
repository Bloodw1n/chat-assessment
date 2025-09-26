<template>
  <section class="flex h-full flex-col bg-white">
    <div v-if="!contact" class="flex flex-1 flex-col items-center justify-center px-6 text-center text-slate-500">
      <p class="text-sm">Выберите контакт из списка, чтобы просмотреть диалог.</p>
    </div>

    <template v-else>
      <header class="flex items-center gap-4 border-b border-slate-100 px-4 py-3">
        <button
          v-if="showBackButton"
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          @click="emit('back')"
          aria-label="Назад к списку контактов"
        >
          <span aria-hidden="true">←</span>
        </button>
        <div class="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
          {{ contact.name.charAt(0).toUpperCase() }}
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-900">{{ contact.name }}</p>
          <p class="text-xs text-slate-500">Последнее сообщение: {{ lastMessageTimestamp }}</p>
        </div>
      </header>

      <div ref="messageContainer" class="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-4 py-4">
        <template v-if="messages.length">
          <article
            v-for="message in messages"
            :key="message.id"
            class="flex"
            :class="message.direction === 'incoming' ? 'justify-start' : 'justify-end'"
          >
            <div
              class="max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm"
              :class="message.direction === 'incoming'
                ? 'bg-white text-slate-800'
                : 'bg-indigo-500 text-white'
              "
            >
              <p class="whitespace-pre-line break-words">{{ message.text }}</p>
              <span
                class="mt-1 block text-right text-[10px]"
                :class="message.direction === 'incoming' ? 'text-slate-400' : 'text-white/70'"
              >
                {{ formatTimestamp(message.timestamp) }}
              </span>
            </div>
          </article>
        </template>
        <p v-else class="pt-20 text-center text-sm text-slate-500">
          Сообщений пока нет. Начните диалог первым.
        </p>
      </div>

      <form class="border-t border-slate-100 px-4 py-3" @submit.prevent="handleSubmit">
        <label class="sr-only" for="message-input">Введите сообщение</label>
        <div class="flex items-end gap-2 rounded-2xl bg-slate-100 px-3 py-2">
          <textarea
            id="message-input"
            v-model="messageText"
            class="h-10 min-h-[2.5rem] flex-1 resize-none border-none bg-transparent text-sm text-slate-800 outline-none"
            placeholder="Введите сообщение"
            rows="1"
            @keydown.enter.exact.prevent="handleSubmit"
          />
          <button
            type="submit"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300"
            :disabled="!isSubmitAllowed"
            aria-label="Отправить"
          >
            ➤
          </button>
        </div>
      </form>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRefs, watch } from 'vue'
import type { ChatMessage, Contact } from '@/entities/chat'
import { formatTimestamp } from '@/shared/lib/date'

const props = withDefaults(
  defineProps<{
    contact: Contact | null
    messages: ChatMessage[]
    showBackButton?: boolean
  }>(),
  {
    showBackButton: false,
  },
)

const emit = defineEmits<{
  back: []
  send: [message: string]
}>()

const { contact, messages, showBackButton } = toRefs(props)

const messageText = ref('')
const messageContainer = ref<HTMLDivElement | null>(null)

const lastMessageTimestamp = computed(() => {
  if (!contact.value || !contact.value.lastMessageTimestamp) {
    return 'нет данных'
  }

  return formatTimestamp(contact.value.lastMessageTimestamp)
})

const isSubmitAllowed = computed(() => Boolean(contact.value && messageText.value.trim()))

const handleSubmit = () => {
  const trimmed = messageText.value.trim()

  if (!trimmed || !contact.value) {
    return
  }

  messageText.value = ''
  emit('send', trimmed)
}

watch(
  () => messages.value.length,
  () => {
    nextTick(() => {
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight
      }
    })
  },
  { immediate: true },
)
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
