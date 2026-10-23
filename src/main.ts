import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { cache } from './api/cache'
import { DOWNLOAD_SIZES_URL, KABUPATEN_LATEST_SOURCE, KABUPATEN_SNAPSHOT_URL } from './api/useSeries'
import { SSR_KEYS, STATE_ELEMENT_ID, safeJson } from './api/ssrState'
import { installI18n } from './app/i18n'
import { routes, scrollBehavior } from './app/routes'
import './styles/base.css'

// vite-ssg needs this exact export name.
// Initial state is written by us as <script type="application/json"> (data, not code, so a strict CSP needs no inline-script hash)
// and not through vite-ssg's inline `window.__INITIAL_STATE__` script: transformState returns '' on the server to switch that off.
export const createApp = ViteSSG(
  App,
  { routes, scrollBehavior },
  async ({ app, router, isClient, head, onSSRAppRendered }) => {
    installI18n(app, router)

    if (isClient) {
      // start with what the prerender already knew: no request for those resources after hydrate
      try {
        const raw = document.getElementById(STATE_ELEMENT_ID)?.textContent
        if (raw) cache.seed(JSON.parse(raw) as Record<string, unknown>)
      } catch {
        // a broken state block only costs the requests it would have saved
      }
      return
    }

    // prerender (Node)
    const keys = new Set<string>()
    app.provide(SSR_KEYS, keys)
    // build-time files are on disk, not at a URL Node can fetch: seed them straight into the cache
    const files: [boolean, string, string][] = [
      [KABUPATEN_LATEST_SOURCE === 'snapshot', KABUPATEN_SNAPSHOT_URL, 'public/data/kabupaten-latest.json'],
      [true, DOWNLOAD_SIZES_URL, 'public/unduh/sizes.json'],
    ]
    for (const [wanted, key, file] of files) {
      if (!wanted || cache.peek(key) !== undefined) continue
      const { readFile } = await import('node:fs/promises')
      try {
        cache.seed({ [key]: JSON.parse(await readFile(file, 'utf8')) })
      } catch {
        // the data step has not run (unit tests): the resource errors and the build's error check reports it
      }
    }
    onSSRAppRendered(() => {
      const state = Object.fromEntries([...keys].flatMap((k) => (cache.peek(k) === undefined ? [] : [[k, cache.peek(k)]])))
      if (Object.keys(state).length) head?.push({ script: [{ id: STATE_ELEMENT_ID, type: 'application/json', innerHTML: safeJson(state) }] })
    })
  },
  { transformState: () => (import.meta.env.SSR ? '' : {}) },
)
