import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createHead } from '@unhead/vue/client'
import { installI18n } from '@/app/i18n'
import { buildRoutes } from '@/app/routeTable'
import App from '@/App.vue'
import { flush, mountApp } from '../../../test/support/mount'
import AppNav from './AppNav.vue'
import MobileTabBar from './MobileTabBar.vue'
import LocaleSwitch from './LocaleSwitch.vue'
import NotFoundView from '@/app/NotFoundView.vue'
import DataView from '@/features/data/DataView.vue'

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

const items = ['beranda', 'data', 'tabel'].map((k, i) => ({ key: k as 'beranda', to: `/${k}`, label: k, active: i === 1, primary: i < 2, tab: false }))

describe('AppNav', () => {
  it('lists the primary pages as links and keeps the rest under a "Lainnya" button with aria-expanded', async () => {
    const { wrapper } = await mountApp(AppNav, { items })
    expect(wrapper.findAll('a').map((a) => a.text())).toEqual(['beranda', 'data'])
    const btn = wrapper.find('button')
    expect(btn.text()).toBe('Lainnya')
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(btn.attributes('aria-haspopup')).toBe('dialog')
  })

  it('marks exactly the active page with aria-current', async () => {
    const { wrapper } = await mountApp(AppNav, { items })
    const current = wrapper.findAll('a[aria-current="page"]')
    expect(current).toHaveLength(1)
    expect(current[0]!.text()).toBe('data')
  })
})

describe('MobileTabBar', () => {
  it('shows the tab pages and "Lainnya", which opens the sheet with the other pages', async () => {
    const all = ['beranda', 'data', 'kontak', 'wiki', 'tabel'].map((k, i) => ({ key: k as 'beranda', to: `/${k}`, label: k, active: i === 0, primary: true, tab: i < 3 }))
    const { wrapper } = await mountApp(MobileTabBar, { items: all })
    expect(wrapper.findAll('nav li a').map((a) => a.text())).toEqual(['beranda', 'data', 'kontak'])
    expect(wrapper.find('nav li a[aria-current="page"]').text()).toBe('beranda')
    const more = wrapper.findAll('button').find((b) => b.text() === 'Lainnya')!
    expect(more.attributes('aria-expanded')).toBe('false')
  })
})

describe('LocaleSwitch', () => {
  it('links to the same page in the other locale, with the query', async () => {
    const { wrapper } = await mountApp(LocaleSwitch, {}, '/data/provinsi/aceh?dari=2021-01-01')
    expect(wrapper.find('a').attributes('href')).toBe('/en/data/provinsi/aceh?dari=2021-01-01')
    expect(wrapper.find('a').attributes('hreflang')).toBe('en')
    const en = await mountApp(LocaleSwitch, {}, '/en/data/provinsi/aceh?dari=2021-01-01')
    expect(en.wrapper.find('a').attributes('href')).toBe('/data/provinsi/aceh?dari=2021-01-01')
    expect(en.wrapper.find('a').text()).toContain('Bahasa Indonesia')
  })
})

async function shell(path: string) {
  const router = createRouter({ history: createMemoryHistory(), routes: buildRoutes() })
  const app = createApp(App)
  installI18n(app, router)
  app.use(router)
  app.use(createHead())
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })))
  await router.push(path)
  await router.isReady()
  const el = document.createElement('div')
  document.body.append(el)
  app.mount(el)
  await flush()
  return { router, el }
}

describe('app shell', () => {
  it('skip link is the first focusable element and targets the main landmark', async () => {
    const { el } = await shell('/')
    const first = el.querySelector<HTMLElement>('a, button')!
    expect(first.getAttribute('href')).toBe('#konten')
    expect(el.querySelector('main#konten')).not.toBeNull()
    expect(el.querySelectorAll('main').length).toBe(1)
  })

  it('has one h1, a header with the nav and a footer', async () => {
    const { el } = await shell('/vaksin')
    expect(el.querySelectorAll('h1')).toHaveLength(1)
    expect(el.querySelectorAll('header nav')).toHaveLength(2) // the top bar and the phone's bottom bar
    expect(el.querySelector('footer')).not.toBeNull()
    expect(el.querySelectorAll('header nav')[0]!.querySelectorAll('li')).toHaveLength(8) // 7 pages and "Lainnya"
    expect(el.querySelectorAll('header nav')[0]!.querySelectorAll('a[aria-current="page"]')).toHaveLength(1) // Vaksin is on the top bar only
  })

  it('after a client navigation, focus moves to the new h1 and the live region announces it', async () => {
    const { router, el } = await shell('/')
    await router.push('/kontak')
    await flush()
    const h1 = el.querySelector('h1')!
    expect(document.activeElement).toBe(h1)
    expect(el.querySelector('[data-testid="route-announcer"]')!.textContent).toBe('Kontak')
  })

  it('does not steal focus on a query-only change or on first load', async () => {
    const { router, el } = await shell('/data')
    expect(document.activeElement).not.toBe(el.querySelector('h1'))
    await router.push('/data?dari=2021-01-01')
    await flush()
    expect(document.activeElement).not.toBe(el.querySelector('h1'))
  })

  it('English routes render English chrome', async () => {
    const { el } = await shell('/en/wiki')
    expect(el.querySelector('h1')!.textContent).toBe('COVID-19 health wiki')
    expect(el.textContent).toContain('Skip to content')
    expect(el.querySelector('html, [lang]')).toBeDefined()
  })

  it('the footer carries the archive notice, the API and docs links and the way to the Methodology page', async () => {
    const { el } = await shell('/')
    const footer = el.querySelector('footer')!
    expect(footer.textContent).toContain('Arsip: catatan berhenti pada 14 Januari 2024')
    expect(footer.textContent).toContain('Metodologi')
    expect([...footer.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(
      expect.arrayContaining(['https://pico-api.banuacoder.com/api/v1', 'https://pico-api.banuacoder.com/', '/mulai', '/metodologi']),
    )
  })
})

describe('NotFoundView and unknown slugs', () => {
  it('is an h1 page with links back to Beranda and Data, in the right locale', async () => {
    const id = await mountApp(NotFoundView)
    expect(id.wrapper.find('h1').text()).toBe('Halaman tidak ditemukan')
    expect(id.wrapper.findAll('a').map((a) => a.attributes('href'))).toEqual(['/', '/data'])
    const en = await mountApp(NotFoundView, {}, '/en/zzz')
    expect(en.wrapper.findAll('a').map((a) => a.attributes('href'))).toEqual(['/en/', '/en/data'])
  })

  it('/data/provinsi/<unknown> renders the not-found page and a known slug renders the area', async () => {
    const bad = await mountApp(DataView, {}, '/data/provinsi/atlantis')
    expect(bad.wrapper.find('h1').text()).toBe('Halaman tidak ditemukan')
    const ok = await mountApp(DataView, {}, '/data/provinsi/aceh')
    expect(ok.wrapper.find('h1').text()).toBe('Data Aceh')
    const nat = await mountApp(DataView, {}, '/en/data/indonesia')
    expect(nat.wrapper.find('h1').text()).toBe('Indonesia data')
  })
})
