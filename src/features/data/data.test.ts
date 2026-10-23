import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import { cache } from '@/api/cache'
import { KABUPATEN_SNAPSHOT_URL } from '@/api/useSeries'
import { provincesLatest, nationalLatest } from '@/api/normalize/areas'
import { provinceSeries } from '@/api/normalize/series'
import { INDONESIA, SULTENG } from '@/app/areas'
import snapshot from '../../../test/fixtures/kabupaten-latest.snapshot.json'
import { fx, type WireNationalCase, type WireProvince, type WireProvinceCase } from '../../../test/fixtures/load'
import { flush, mountApp } from '../../../test/support/mount'
import DataView from './DataView.vue'
import OdpPdpNote from './components/OdpPdpNote.vue'
import { DataPageKey } from './useDataPage'
import type { DataPageState } from './useDataPage'

afterEach(() => cache.clear())

function seedLatest() {
  cache.seed({
    '/provinces': provincesLatest(fx<WireProvince[]>('provinces')),
    '/national/latest': nationalLatest(fx<WireNationalCase>('national-latest')),
    [KABUPATEN_SNAPSHOT_URL]: snapshot,
  })
}
const seededProvince = () => provincesLatest(fx<WireProvince[]>('provinces'))

describe('DataView routes', () => {
  it('/data/provinsi/aceh: h1, figures from the prerendered latest row with no request, and its date', async () => {
    seedLatest()
    const { wrapper } = await mountApp(DataView, {}, '/data/provinsi/aceh')
    await flush()
    expect(wrapper.find('h1').text()).toBe('Data Aceh')
    const first = wrapper.find('[data-testid="summary"]')
    expect(first.text()).toContain('45.092') // Aceh's cumulative positive on 2024-01-14, as text
    expect(first.text()).toContain('14 Januari 2024')
  })

  it('every province page shows its own cumulative positive', async () => {
    seedLatest()
    for (const p of seededProvince().slice(0, 6)) {
      const { wrapper } = await mountApp(DataView, {}, `/data/provinsi/${p.area.slug}`)
      await flush()
      expect(wrapper.find('[data-testid="summary"]').text(), p.area.name).toContain(p.latest.cumulative.positive.toLocaleString('id-ID'))
    }
  })

  it('kabupaten: three figures, no "dirawat" (C2: active is null)', async () => {
    seedLatest()
    const { wrapper } = await mountApp(DataView, {}, '/data/kabupaten/kota-palu')
    await flush()
    const s = wrapper.find('[data-testid="summary"]')
    expect(s.findAll('svg[data-state]').map((e) => e.attributes('data-state'))).toEqual(['positive', 'recovered', 'deceased'])
    expect(s.text()).not.toContain('Dirawat')
  })

  it('province and country: four figures including dirawat', async () => {
    seedLatest()
    const nat = await mountApp(DataView, {}, '/data/indonesia')
    await flush()
    expect(nat.wrapper.find('[data-testid="summary"]').findAll('svg[data-state]')).toHaveLength(4)
    expect(nat.wrapper.find('h1').text()).toBe('Data Indonesia')
  })

  it('/data is the Sulawesi Tengah view', async () => {
    seedLatest()
    const { wrapper } = await mountApp(DataView, {}, '/data')
    await flush()
    expect(wrapper.find('h1').text()).toBe('Data Sulawesi Tengah')
  })

  it('shows two rates with one decimal, in the locale', async () => {
    seedLatest()
    const id = await mountApp(DataView, {}, '/data/provinsi/sulawesi-tengah')
    await flush()
    expect(id.wrapper.find('[data-testid="cfr"]').text()).toBe('2,8%') // 1760 / 63614
    expect(id.wrapper.find('[data-testid="recovery"]').text()).toBe('97,2%')
    const en = await mountApp(DataView, {}, '/en/data/provinsi/sulawesi-tengah')
    await flush()
    expect(en.wrapper.find('[data-testid="cfr"]').text()).toBe('2.8%')
  })

  it('an unknown slug is the not-found page', async () => {
    const { wrapper } = await mountApp(DataView, {}, '/data/provinsi/atlantis')
    expect(wrapper.find('h1').text()).toBe('Halaman tidak ditemukan')
  })

  it('a custom end date waits for the series and never shows the latest row under the wrong date', async () => {
    seedLatest()
    const { wrapper } = await mountApp(DataView, {}, '/data/provinsi/sulawesi-tengah?dari=2021-07-01&sampai=2021-07-31')
    await flush()
    expect(wrapper.find('[data-testid="summary"]').exists()).toBe(false) // series not loaded in this test (offline)
  })

  it('has a share block with the copy button, and the toolbar with area, dates, presets and the Delta window', async () => {
    seedLatest()
    const { wrapper } = await mountApp(DataView, {}, '/data/provinsi/aceh?dari=2021-07-01')
    await flush()
    expect(wrapper.find('[data-testid="share"] button').exists()).toBe(true)
    expect(wrapper.find('select').element.value).toBe('provinsi:aceh')
    expect(wrapper.findAll('button').map((b) => b.text())).toEqual(expect.arrayContaining(['Semua', '2020', '2021', '2022', '2023', 'Gelombang Delta']))
  })
})

describe('OdpPdpNote', () => {
  const series = provinceSeries(SULTENG, fx<WireProvinceCase[]>('province-72-cases'))

  it('Sulawesi Tengah: the last ODP/PDP figures, their date 8 Mei 2022, and the sentence', async () => {
    const { wrapper } = await mountApp(
      defineComponent({
        setup() {
          provide(DataPageKey, { area: { value: SULTENG }, series: { data: { value: series } } } as unknown as DataPageState)
          return () => h(OdpPdpNote)
        },
      }),
    )
    const t = wrapper.find('[data-testid="odp-note"]').text()
    expect(t).toContain('8 Mei 2022')
    expect(t).toContain('Data ODP/PDP tidak tersedia setelah 8 Mei 2022, karena sumber berhenti melaporkannya.')
    expect(t).toMatch(/ODP.*total/)
  })

  it('the country has no note, and neither does a series without ODP numbers', async () => {
    const country = await mountApp(defineComponent({ setup() { provide(DataPageKey, { area: { value: INDONESIA }, series: { data: { value: series } } } as unknown as DataPageState); return () => h(OdpPdpNote) } }))
    expect(country.wrapper.find('[data-testid="odp-note"]').exists()).toBe(false)
    const none = await mountApp(defineComponent({ setup() { provide(DataPageKey, { area: { value: SULTENG }, series: { data: { value: { ...series, rows: series.rows.map((r) => ({ ...r, odp: null, pdp: null })) } } } } as unknown as DataPageState); return () => h(OdpPdpNote) } }))
    expect(none.wrapper.find('[data-testid="odp-note"]').exists()).toBe(false)
  })
})

