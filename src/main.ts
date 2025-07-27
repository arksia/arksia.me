import { ViteSSG } from 'vite-ssg'
import './styles/main.css'
import './styles/prose.css'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'

export const createApp = ViteSSG(
  App, 
  { routes }
)