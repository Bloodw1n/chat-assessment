import { createApp } from 'vue'
import App from './App.vue'
import { registerProviders } from './providers'
import './styles/index.css'

export const bootstrap = () => {
  const app = createApp(App)

  registerProviders(app)

  app.mount('#app')
}
