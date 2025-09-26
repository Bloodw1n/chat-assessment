import type { App } from 'vue'
import { createPinia } from 'pinia'

export const registerProviders = (app: App) => {
  const pinia = createPinia()
  app.use(pinia)
}
