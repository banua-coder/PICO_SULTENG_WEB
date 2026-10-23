// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createHead, renderSSRHead } from '@unhead/vue/server'
import { renderToString } from 'vue/server-renderer'
import { installI18n } from './i18n'
import { datasetLd, usePageHead } from './head'
import type { PageHead } from './head'
import { buildRoutes } from './routeTable'

async function head(path: string, opts: PageHead) {
  const router = createRouter({ history: createMemoryHistory(), routes: buildRoutes() })
  const app = createApp(defineComponent({ setup() { usePageHead(opts); return () => h('div') } }))
  const hd = createHead()
  installI18n(app, router)
  app.use(router).use(hd)
  await router.push(path)
  await router.isReady()
  await renderToString(app)
  return renderSSRHead(hd)
}
const S = 'https://pico.banuacoder.com'

describe('usePageHead', () => {
  it('title, description, canonical and html lang for an Indonesian page', async () => {
    const h = await head('/vaksin', { title: 'Vaksin', description: 'Cakupan vaksinasi' })
    expect(h.headTags).toContain('<title>Vaksin · PICO Sulteng</title>')
    expect(h.headTags).toContain('name="description" content="Cakupan vaksinasi"')
    expect(h.headTags).toContain(`rel="canonical" href="${S}/vaksin"`)
    expect(h.htmlAttrs).toContain('lang="id"')
  })

  it('hreflang id, en and x-default on both locales, x-default is the Indonesian URL', async () => {
    for (const path of ['/data/provinsi/aceh', '/en/data/provinsi/aceh']) {
      const h = await head(path, { title: 'Data Aceh' })
      expect(h.headTags).toContain(`hreflang="id" href="${S}/data/provinsi/aceh"`)
      expect(h.headTags).toContain(`hreflang="en" href="${S}/en/data/provinsi/aceh"`)
      expect(h.headTags).toContain(`hreflang="x-default" href="${S}/data/provinsi/aceh"`)
    }
  })

  it('English page: lang en, canonical under /en, og:locale en_GB with id_ID alternate', async () => {
    const h = await head('/en/wiki', { title: 'Wiki' })
    expect(h.htmlAttrs).toContain('lang="en"')
    expect(h.headTags).toContain(`rel="canonical" href="${S}/en/wiki"`)
    expect(h.headTags).toContain('property="og:locale" content="en_GB"')
    expect(h.headTags).toContain('property="og:locale:alternate" content="id_ID"')
  })

  it('Beranda in English keeps its trailing slash', async () => {
    const h = await head('/en/', { title: 'Home' })
    expect(h.headTags).toContain(`rel="canonical" href="${S}/en/"`)
  })

  it('Open Graph and Twitter tags with the brand OG image', async () => {
    const h = await head('/', { title: 'Beranda' })
    for (const needle of [
      'property="og:type" content="website"',
      'property="og:title" content="Beranda · PICO Sulteng"',
      `property="og:image" content="${S}/og-image-1200x630.png"`,
      'property="og:image:width" content="1200"',
      'name="twitter:card" content="summary_large_image"',
      `property="og:url" content="${S}/"`,
    ])
      expect(h.headTags).toContain(needle)
  })

  it('canonicalPath points /data at the Sulawesi Tengah page while hreflang keeps the page itself', async () => {
    const h = await head('/data', { title: 'Data', canonicalPath: '/data/provinsi/sulawesi-tengah' })
    expect(h.headTags).toContain(`rel="canonical" href="${S}/data/provinsi/sulawesi-tengah"`)
    expect(h.headTags).toContain(`hreflang="en" href="${S}/en/data"`)
  })

  it('noindex for the not-found page', async () => {
    expect((await head('/zzz', { title: 'x', noindex: true })).headTags).toContain('name="robots" content="noindex"')
    expect((await head('/zzz', { title: 'x' })).headTags).not.toContain('noindex')
  })

  it('JSON-LD Dataset with coverage and downloads, and no licence', async () => {
    const h = await head('/data/provinsi/aceh', { title: 'Data Aceh', dataset: { name: 'COVID-19 Aceh', description: 'Kasus harian', areaName: 'Aceh' } })
    const m = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/.exec(h.headTags)!
    const ld = JSON.parse(m[1]!)
    expect(ld['@type']).toBe('Dataset')
    expect(ld.temporalCoverage).toBe('2020-03-02/2024-01-14')
    expect(ld.spatialCoverage.name).toBe('Aceh')
    expect(ld.distribution.map((d: { contentUrl: string }) => d.contentUrl)).toContain(`${S}/unduh/provinsi.csv`)
    expect(ld.license).toBeUndefined()
  })

  it('no JSON-LD script on a page without a dataset', async () => {
    expect((await head('/wiki', { title: 'Wiki' })).headTags).not.toContain('ld+json')
  })

  it('datasetLd lists csv, xlsx and the API', () => {
    const d = datasetLd({ name: 'n', description: 'd', areaName: 'a', locale: 'en' }, 'https://x.test')
    expect(d.distribution).toHaveLength(7)
    expect(d.inLanguage).toBe('en')
  })
})
