import { afterEach, describe, expect, it } from 'vitest'
import { cache } from '@/api/cache'
import { DOWNLOAD_HEADER } from '@/app/csv'
import { flush, mountApp } from '../../../test/support/mount'
import MetodologiView from './MetodologiView.vue'

afterEach(() => cache.clear())
const IDS = ['sumber', 'harian', 'rt', 'kekosongan', 'unduh', 'lisensi', 'kredit']

describe('MetodologiView', () => {
  it('id: seven sections, a table of contents, and every Rt parameter', async () => {
    const { wrapper } = await mountApp(MetodologiView, {}, '/metodologi')
    await flush()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.findAll('article h2').map((h) => h.attributes('id'))).toEqual(IDS)
    expect(wrapper.findAll('nav a[href^="#"]').map((a) => a.attributes('href'))).toEqual(IDS.map((i) => `#${i}`))
    const rt = wrapper.find('#rt').element.parentElement!.textContent!
    for (const s of ['EpiEstim', 'Cori dkk., 2013', '7,5 hari', '3,4 hari', '7 hari', 'kurang dari 12', 'rentang kredibel 95%', '9 Juli 2023', '24 Juni 2023']) expect(rt, s).toContain(s)
    const text = wrapper.text()
    expect(text).toContain('2 Maret 2020')
    expect(text).toContain('14 Januari 2024')
    expect(text).toContain('8 Mei 2022')
    expect(text).toContain('PICO (data peta lama)')
    expect(text).toContain('PICO Sulteng dan sumber aslinya')
  })

  it('en: the same sections and facts', async () => {
    const { wrapper } = await mountApp(MetodologiView, {}, '/en/metodologi')
    await flush()
    expect(wrapper.findAll('article h2').map((h) => h.attributes('id'))).toEqual(IDS)
    const rt = wrapper.find('#rt').element.parentElement!.textContent!
    for (const s of ['EpiEstim', 'mean 7.5 days', 'standard deviation 3.4 days', 'Window: 7 days', 'fewer than 12', '95% credible interval', '9 July 2023', '24 June 2023']) expect(rt, s).toContain(s)
    expect(wrapper.text()).toContain('PICO (data peta lama)')
  })

  it('the download table lists every column of the files, in order, in both languages', async () => {
    for (const path of ['/metodologi', '/en/metodologi']) {
      const { wrapper } = await mountApp(MetodologiView, {}, path)
      await flush()
      expect(wrapper.findAll('table tbody th code').map((c) => c.text())).toEqual([...DOWNLOAD_HEADER])
      expect(wrapper.find('[role="region"][tabindex="0"]').exists()).toBe(true)
    }
  })

  it('carries the cultural note, says the review is pending, makes no usage claim, and marks what is unreviewed', async () => {
    const { wrapper } = await mountApp(MetodologiView, {}, '/en/metodologi')
    await flush()
    const t = wrapper.text()
    expect(t).toContain('Kaili motifs are communal heritage of the Kaili people. They do not belong to PICO.')
    expect(t).toContain('no photograph of real cloth was used')
    expect(t).toContain('Taiganja and Sambulugana')
    expect(t).toContain('cultural review')
    expect(t.toLowerCase()).not.toMatch(/\b(users|visitors|downloads per)\b/)
    expect(wrapper.findAll('[data-todo]').map((e) => e.attributes('data-todo')).sort()).toEqual(['metodologi-budaya', 'metodologi-kode', 'metodologi-lisensi', 'metodologi-peta', 'metodologi-sumber'])
  })
})
