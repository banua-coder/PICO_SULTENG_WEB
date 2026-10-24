import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

export default defineConfig({
  plugins: [vue(), VueI18nPlugin({ include: [fileURLToPath(new URL('./src/locales/**', import.meta.url))], runtimeOnly: true, compositionOnly: true, strictMessage: true })],
  define: { __BUILD_DAY__: JSON.stringify(process.env.PICO_BUILD_DAY ?? new Date().toISOString().slice(0, 10)) },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)), // the shadcn-vue components import `cn` from the package of that name: it is this small file
      cn: fileURLToPath(new URL('./src/lib/cn.ts', import.meta.url)) } },
  test: { environment: 'happy-dom', setupFiles: ['test/setup.ts'], include: ['src/**/*.test.ts', 'test/**/*.test.ts', 'scripts/**/*.test.ts'] },
})
