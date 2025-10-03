import { ViteSSG } from 'vite-ssg'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'
import NProgress from './utils/nprogress'
import './styles/main.css'
import './styles/prose.css'
import './styles/markdown.css'

export const createApp = ViteSSG(
  App,
  { routes },
  ({ router }) => {
    router.beforeEach(() => {
      NProgress.start()
    })
    router.afterEach(() => {
      NProgress.done()
    })
  },
)
