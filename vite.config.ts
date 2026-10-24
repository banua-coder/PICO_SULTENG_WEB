import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { NOT_FOUND_PATH, sitePaths } from './src/app/siteRoutes'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    // ADR-0102: messages are precompiled at build time, so the runtime-only vue-i18n ships (no message compiler, no eval)
    VueI18nPlugin({ include: [fileURLToPath(new URL('./src/locales/**', import.meta.url))], runtimeOnly: true, compositionOnly: true, strictMessage: true }),
  ],
  define: { __MAP_BANDS__: JSON.stringify(!!process.env.VITE_MAP_BANDS), __BUILD_DAY__: JSON.stringify(process.env.PICO_BUILD_DAY ?? new Date().toISOString().slice(0, 10)) },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    rollupOptions: {
      output: {
        // Named chunks, so check-budget can see a heavy library in a page's initial JS: d3 (charts, Data and Vaksin only)
        // and xlsx (the lazy export). Lottie is already named lottie_light by its module.
        manualChunks(id) {
          if (/node_modules\/(\.pnpm\/)?d3-/.test(id) || id.includes('/node_modules/d3-')) return 'd3'
          if (id.includes('node_modules/xlsx') || id.includes('/xlsx@')) return 'xlsx'
        },
      },
    },
  },
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    dirStyle: 'nested', // /data/provinsi/aceh/index.html
    // Dynamic routes (34 provinces, 13 kabupaten, both locales) are listed from the C5 slug table. /404 renders the not-found
    // page (postbuild renames it to 404.html). The /_kit test page is included only when the static route list has it.
    includedRoutes: (paths) => [...new Set([...paths.filter((p) => p.startsWith('/_kit') || p.startsWith('/en/_kit')), ...sitePaths(), NOT_FOUND_PATH])],
    onFinished() {
      // a small resource that failed during prerender (API down, bad shape) must stop the build
      const errors = (globalThis as unknown as Record<string, string[] | undefined>).__PICO_SSR_ERRORS__
      if (errors?.length) throw new Error(`prerender data errors:\n${[...new Set(errors)].join('\n')}`)
    },
  },
})
