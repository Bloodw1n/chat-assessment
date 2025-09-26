<template>
  <aside class="flex h-full flex-col bg-slate-50 shadow-inner shadow-slate-200">
    <header class="flex items-center justify-between px-4 py-3">
      <div>
        <h2 class="text-base font-semibold text-slate-900">Диалоги</h2>
        <p class="text-xs text-slate-500">{{ statusLabel }}</p>
      </div>
      <span class="inline-flex h-2 w-2 rounded-full" :class="statusIndicatorClass" aria-hidden="true" />
    </header>

    <div class="flex-1 overflow-y-auto">
      <p v-if="!contacts.length" class="px-4 py-12 text-center text-sm text-slate-500">
        Пока нет сообщений. Подождите, новые контакты появятся автоматически.
      </p>

      <ul v-else class="space-y-1 px-2 pb-4">
        <li v-for="contact in contacts" :key="contact.id">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white"
            :class="contact.id === activeContactId ? 'bg-white shadow-sm shadow-slate-200' : ''"
            @click="emit('select', contact.id)"
          >
            <div
              class="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600"
            >
              {{ contact.name.charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <p class="truncate text-sm font-medium text-slate-900">{{ contact.name }}</p>
                <span class="ml-2 flex-none text-xs text-slate-400" v-if="contact.lastMessageTimestamp">
                  {{ formatTimestamp(contact.lastMessageTimestamp) }}
                </span>
              </div>
              <div class="mt-0.5 flex items-center justify-between gap-2">
                <p class="truncate text-xs text-slate-500">
                  {{ contact.lastMessagePreview || 'Нет сообщений' }}
                </p>
                <span
                  v-if="contact.unreadCount > 0"
                  class="inline-flex flex-none items-center justify-center rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-semibold text-white"
                >
                  {{ contact.unreadCount }}
                </span>
              </div>
            </div>
          </button>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Contact } from '@/entities/chat'
import type { WebSocketStatus } from '@/shared/api/ws'
import { formatTimestamp } from '@/shared/lib/date'

const props = defineProps<{
  contacts: Contact[]
  activeContactId: string | null
  status: WebSocketStatus
}>()

const emit = defineEmits<{
  select: [contactId: string]
}>()

const statusLabelMap: Record<WebSocketStatus, string> = {
  idle: 'Не подключено',
  connecting: 'Подключение...',
  open: 'Онлайн',
  closed: 'Отключено',
  error: 'Ошибка подключения',
}

const statusIndicatorClass = computed(() => {
  switch (props.status) {
    case 'open':
      return 'bg-emerald-500'
    case 'connecting':
      return 'bg-amber-400 animate-pulse'
    case 'error':
      return 'bg-rose-500 animate-pulse'
    default:
      return 'bg-slate-400'
  }
})

const statusLabel = computed(() => statusLabelMap[props.status])
</script>
