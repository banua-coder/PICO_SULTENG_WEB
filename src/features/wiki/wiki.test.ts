import { describe, expect, it } from 'vitest'
import { flush, mountApp } from '../../../test/support/mount'
import WikiView from './WikiView.vue'

const IDS = ['apa-itu', 'penularan', 'gejala', 'pencegahan', 'istilah', 'jika-terinfeksi', 'mitos']

describe('WikiView', () => {
  for (const [path, h1, lang] of [['/wiki', 'Wiki COVID-19', 'id'], ['/en/wiki', 'COVID-19 health wiki', 'en']] as const) {
    it(`${lang}: one h1, seven sections with the same anchors, a table of contents that links to each`, async () => {
      const { wrapper } = await mountApp(WikiView, {}, path)
      await flush()
      expect(wrapper.findAll('h1')).toHaveLength(1)
      expect(wrapper.find('h1').text()).toBe(h1)
      expect(wrapper.findAll('article h2').map((h) => h.attributes('id'))).toEqual(IDS)
      expect(wrapper.findAll('nav[aria-label] a[href^="#"]').map((a) => a.attributes('href'))).toEqual(IDS.map((i) => `#${i}`))
      expect(wrapper.find('article').findAll('h3')).toHaveLength(0) // order h1, h2 only: no skipped level
    })

    it(`${lang}: no photo or third-party image, brand tips are decorative with a caption, the dated note shows and no review marker is left`, async () => {
      const { wrapper } = await mountApp(WikiView, {}, path)
      await flush()
      // the only pictures are the two small old PICO illustrations (wash hands, mask), decorative with a caption
      expect(wrapper.findAll('img')).toHaveLength(2)
      for (const i of wrapper.findAll('img')) expect(i.attributes('alt')).toBe('')
      expect(wrapper.findAll('iframe')).toHaveLength(0)
      const figs = wrapper.findAll('figure')
      expect(figs).toHaveLength(4)
      for (const f of figs) {
        expect(f.find('img, svg').attributes('aria-hidden') ?? f.find('img, svg').attributes('alt')).toMatch(/^(true|)$/)
        expect(f.find('figcaption').text().length).toBeGreaterThan(10)
      }
      const ids = [...wrapper.element.querySelectorAll('[id]')].map((e) => e.id)
      expect(new Set(ids).size).toBe(ids.length) // inline SVG ids are unique
      expect(wrapper.find('[data-testid="archive-notice"]').text()).toMatch(lang === 'id' ? /2020 sampai 2022/ : /2020 and 2022/)
      expect(wrapper.findAll('[data-todo]')).toHaveLength(0)
    })
  }

  it('says nothing the old page said that is outdated or unsupported', async () => {
    const { wrapper } = await mountApp(WikiView, {}, '/wiki')
    await flush()
    const text = wrapper.text()
    for (const gone of ['belum ada vaksin', '98%', 'Tiongkok', 'feses', 'protap', 'Wuhan', 'ODP (Orang', 'tersedia dan dianjurkan']) expect(text, gone).not.toContain(gone)
  })
})
