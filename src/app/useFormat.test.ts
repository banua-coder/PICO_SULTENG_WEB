import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { installI18n } from './i18n'
import { useFormat } from './useFormat'
import { useLocale } from './useLocale'

async function setup(startAt: string) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }] })
  let api!: { fmt: ReturnType<typeof useFormat>; loc: ReturnType<typeof useLocale> }
  const Host = defineComponent({
    setup() {
      api = { fmt: useFormat(), loc: useLocale() }
      return () => h('div')
    },
  })
  const app = createApp(Host)
  const i18n = installI18n(app, router)
  app.use(router)
  await router.push(startAt)
  await router.isReady()
  app.mount(document.createElement('div'))
  return { api, router, i18n }
}

describe('useLocale + useFormat on the route', () => {
  it('Indonesian has no prefix and formats in id', async () => {
    const { api } = await setup('/data')
    expect(api.loc.locale.value).toBe('id')
    expect(api.fmt.num(1234567)).toBe('1.234.567')
    expect(api.fmt.date('2024-01-14')).toBe('14 Januari 2024')
    expect(api.fmt.nullable(null, api.fmt.num)).toBe('tidak tersedia')
  })

  it('/en loads the English chunk before the route resolves and formats in en', async () => {
    const { api, i18n } = await setup('/en/data')
    expect(api.loc.locale.value).toBe('en')
    expect(i18n.global.locale.value).toBe('en')
    expect(api.fmt.num(1234567)).toBe('1,234,567')
    expect(api.fmt.date('2024-01-14')).toBe('14 January 2024')
    expect(api.fmt.nullable(null, api.fmt.num)).toBe('not available')
    expect(i18n.global.t('nav.beranda')).toBe('Home')
  })

  it('switchPath keeps the query, and following it flips the whole page', async () => {
    const { api, router } = await setup('/data/provinsi/aceh?dari=2021-01-01')
    expect(api.loc.switchPath.value).toBe('/en/data/provinsi/aceh?dari=2021-01-01')
    await router.push(api.loc.switchPath.value)
    await nextTick()
    expect(api.loc.locale.value).toBe('en')
    expect(api.fmt.nullable(null, api.fmt.num)).toBe('not available')
    expect(api.loc.switchPath.value).toBe('/data/provinsi/aceh?dari=2021-01-01')
    expect(api.loc.localize('/vaksin')).toBe('/en/vaksin')
  })
})
