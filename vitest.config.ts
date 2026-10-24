import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

export default defineConfig({
  plugins: [vue(), VueI18nPlugin({ include: [fileURLToPath(new URL('./src/locales/**', import.meta.url))], runtimeOnly: true, compositionOnly: true, strictMessage: true })],
  define: { __MAP_BANDS__: JSON.stringify(!!process.env.VITE_MAP_BANDS), __BUILD_DAY__: JSON.stringify(process.env.PICO_BUILD_DAY ?? new Date().toISOString().slice(0, 10)) },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'happy-dom', setupFiles: ['test/setup.ts'], include: ['src/**/*.test.ts', 'test/**/*.test.ts', 'scripts/**/*.test.ts'] },
})
