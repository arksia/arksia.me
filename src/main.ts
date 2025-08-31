import { ViteSSG } from 'vite-ssg'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'
import './styles/main.css'
import './styles/prose.css'
import './styles/markdown.css'

export const createApp = ViteSSG(
  App,
  { routes },
)
