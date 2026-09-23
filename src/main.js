import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/index.css'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Restore session from localStorage before routing
const authStore = useAuthStore()
authStore.restoreSession().finally(() => {
  app.use(router)
  app.mount('#app')
})
