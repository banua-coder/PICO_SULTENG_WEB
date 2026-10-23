import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    // ADR-0102: messages are precompiled at build time, so the runtime-only vue-i18n ships (no message compiler, no eval)
    VueI18nPlugin({ include: [fileURLToPath(new URL('./src/locales/**', import.meta.url))], runtimeOnly: true, compositionOnly: true, strictMessage: true }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  ssgOptions: { script: 'async', formatting: 'minify' },
})
