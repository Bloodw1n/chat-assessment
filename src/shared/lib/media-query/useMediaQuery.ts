import { onBeforeUnmount, onMounted, ref } from 'vue'

export const useMediaQuery = (query: string) => {
  const matches = ref(false)
  let mediaQuery: MediaQueryList | null = null

  const updateMatches = (next: boolean) => {
    matches.value = next
  }

  const handleChange = (event: MediaQueryListEvent) => {
    updateMatches(event.matches)
  }

  onMounted(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    mediaQuery = window.matchMedia(query)
    updateMatches(mediaQuery.matches)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
    } else if ('addListener' in mediaQuery) {
      const legacyQuery = mediaQuery as MediaQueryList & {
        addListener: (listener: (event: MediaQueryListEvent) => void) => void
      }

      legacyQuery.addListener(handleChange)
    }
  })

  onBeforeUnmount(() => {
    if (!mediaQuery) {
      return
    }

    if (typeof mediaQuery.removeEventListener === 'function') {
      mediaQuery.removeEventListener('change', handleChange)
    } else if ('removeListener' in mediaQuery) {
      const legacyQuery = mediaQuery as MediaQueryList & {
        removeListener: (listener: (event: MediaQueryListEvent) => void) => void
      }

      legacyQuery.removeListener(handleChange)
    }
  })

  return matches
}
