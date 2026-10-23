import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { installI18n } from './app/i18n'
import { routes } from './app/routes'
import './styles/base.css'

// vite-ssg needs this exact export name
export const createApp = ViteSSG(App, { routes }, ({ app, router }) => {
  installI18n(app, router)
})
