import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './app/routes'
import './styles/base.css'

// vite-ssg needs this exact export name
export const createApp = ViteSSG(App, { routes })
