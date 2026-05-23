import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const auth = getAuth()

// Wait for Firebase Auth to initialize before mounting
onAuthStateChanged(auth, () => {
  const app = createApp(App)
  app.use(router)
  app.mount('#app')
})