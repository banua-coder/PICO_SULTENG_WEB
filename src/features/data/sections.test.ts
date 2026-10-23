import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cache } from '@/api/cache'
import { provincesLatest } from '@/api/normalize/areas'
import { nationalSeries, provinceSeries, regencySeries } from '@/api/normalize/series'
import type { LatestByArea } from '@/api/types'
import { KABUPATEN_SNAPSHOT_URL } from '@/api/useSeries'
import { areaByCode, INDONESIA, SULTENG } from '@/app/areas'
import snapshot from '../../../test/fixtures/kabupaten-latest.snapshot.json'
import { fx, type WireNationalCase, type WireProvince, type WireProvinceCase, type WireRegencyCase } from '../../../test/fixtures/load'
import { flush, mountApp } from '../../../test/support/mount'
import DataView from './DataView.vue'
import { mapDate, mapKind, selectedCode, useSubAreaItems } from './useSubAreaItems'

beforeEach(() => {
  // reduced motion keeps the Lottie player out of the loading states of unseeded resources
  vi.spyOn(window, 'matchMedia').mockImplementation((q) => ({ matches: q.includes('reduce'), media: q, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return { width: 640, height: 280, top: 0, left: 0, right: 640, bottom: 280, x: 0, y: 0, toJSON: () => ({}) }
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  cache.clear()
  document.body.innerHTML = ''
})

const sul = () => provinceSeries(SULTENG, fx<WireProvinceCase[]>('province-72-cases'))
const seedAll = () =>
  cache.seed({
    '/provinces/72/cases?all=true': sul(),
    '/national?all=true': nationalSeries(INDONESIA, fx<WireNationalCase[]>('national')),
    '/regencies/7271/cases': regencySeries({ level: 'kabupaten', code: '7271', slug: 'kota-palu', name: 'Kota Palu' }, fx<WireRegencyCase[]>('regency-7271-cases')),
  })
const open = async (path: string) => {
  seedAll()
  const out = await mountApp(DataView, {}, path)
  await flush()
  await flush()
  return out
}

describe('CaseCurves (W15)', () => {
  it('daily view: a bar chart with the 7-day average over it and one crimson peak bar, plus recovered and deceased', async () => {
    const { wrapper } = await open('/data/provinsi/sulawesi-tengah')
    const figs = wrapper.find('[data-testid="curves"]').findAll('figure')
    expect(figs).toHaveLength(2)
    const bars = figs[0]!
    expect(bars.find('figcaption').text()).toBe('Kasus positif baru per hari')
    expect(bars.findAll('[data-peak]')).toHaveLength(1)
    expect(bars.findAll('[data-end-label]').map((e) => e.text())).toEqual(['Positif', 'rata-rata 7 hari'])
    expect(bars.find('svg[role="img"]').attributes('aria-label')).toMatch(/^Puncak kasus harian [\d.]+ pada \d+ \w+ \d{4}\. Nilai terakhir 0 pada 14 Januari 2024\.$/)
    expect(figs[1]!.findAll('[data-end-label]').map((e) => e.text())).toEqual(['Sembuh', 'Meninggal'])
  })

  it('English summary sentence', async () => {
    const { wrapper } = await open('/en/data/provinsi/sulawesi-tengah')
    expect(wrapper.find('[data-testid="curves"] svg[role="img"]').attributes('aria-label')).toMatch(/^Peak daily cases [\d,]+ on \d+ \w+ \d{4}\. Last value 0 on 14 January 2024\.$/)
  })

  it('cumulative view: four lines for a province, three for a kabupaten; the table lists the same days', async () => {
    const p = await open('/data/provinsi/sulawesi-tengah?tampilan=kumulatif')
    expect(p.wrapper.find('[data-testid="curves"]').findAll('[data-end-label]').map((e) => e.text())).toEqual(['Positif', 'Sembuh', 'Meninggal', 'Dirawat'])
    expect(p.wrapper.find('[data-testid="curves"] svg[role="img"]').attributes('aria-label')).toContain('Total kasus positif 63.614 pada 14 Januari 2024.')
    const k = await open('/data/kabupaten/kota-palu?tampilan=kumulatif')
    expect(k.wrapper.find('[data-testid="curves"]').findAll('[data-end-label]').map((e) => e.text())).toEqual(['Positif', 'Sembuh', 'Meninggal'])
  })

  it('the radio switches the view, writes ?tampilan with replace and keeps the window', async () => {
    const { wrapper, router } = await open('/data/provinsi/sulawesi-tengah?dari=2024-01-01')
    await wrapper.find('input[value="kumulatif"]').setValue()
    await flush()
    expect(router.currentRoute.value.query).toEqual({ dari: '2024-01-01', tampilan: 'kumulatif' })
    await wrapper.find('input[value="harian"]').setValue()
    await flush()
    expect(router.currentRoute.value.query).toEqual({ dari: '2024-01-01' })
  })

  it('an empty window says so and draws no chart', async () => {
    const { wrapper } = await open('/data/provinsi/sulawesi-tengah?dari=2021-01-01&sampai=2021-01-02')
    expect(wrapper.find('[data-testid="curves"]').text()).toContain('Tidak ada data pada rentang ini')
    expect(wrapper.find('[data-testid="curves"] figure').exists()).toBe(false)
  })
})

describe('RtSection (W16)', () => {
  it('links the explainer to /metodologi#rt in both languages', async () => {
    const id = await open('/data/provinsi/sulawesi-tengah')
    expect(id.wrapper.find('[data-testid="rt-section"] a[href$="metodologi#rt"]').attributes('href')).toBe('/metodologi#rt')
    const en = await open('/en/data/provinsi/sulawesi-tengah')
    expect(en.wrapper.find('[data-testid="rt-section"] a[href$="metodologi#rt"]').attributes('href')).toBe('/en/metodologi#rt')
  })

  it('national, 2023-07-01 to 2024-01-14: last value on 9 July 2023, and the gap note covers the rest', async () => {
    const { wrapper } = await open('/data/indonesia?dari=2023-07-01')
    const s = wrapper.find('[data-testid="rt-section"]')
    expect(s.find('[data-testid="rt-last"]').text()).toMatch(/^Rt [\d,]+ \([\d,]+ sampai [\d,]+\) pada 9 Juli 2023$/)
    expect(s.find('[data-testid="rt-gaps"]').text()).toContain('10 Juli 2023')
    expect(s.find('[data-testid="rt-gaps"]').text()).toContain('14 Januari 2024')
    expect(s.find('[data-testid="rt-end"]').text()).toBe('Setelah 9 Juli 2023 Rt tidak dihitung lagi: perhitungannya berhenti pada pertengahan 2023.')
    expect(s.find('figure').exists()).toBe(true)
  })

  it('a window with no Rt shows the explainer and "Rt tidak tersedia untuk rentang ini", no chart', async () => {
    const { wrapper } = await open('/data/indonesia?dari=2023-08-01')
    const s = wrapper.find('[data-testid="rt-section"]')
    expect(s.find('[data-testid="rt-none"]').text()).toBe('Rt tidak tersedia untuk rentang ini')
    expect(s.find('figure').exists()).toBe(false)
    expect(s.text()).toContain('Rt adalah rata-rata jumlah orang yang tertular dari satu kasus')
  })

  it('a window with Rt draws the chart with a text label for the threshold at 1', async () => {
    const { wrapper } = await open('/data/provinsi/sulawesi-tengah?dari=2023-06-01&sampai=2023-06-30')
    const s = wrapper.find('[data-testid="rt-section"]')
    expect(s.find('svg[role="img"]').exists()).toBe(true)
    expect(s.text()).toMatch(/\b1\b/)
  })
})

describe('SubAreaMap (W17)', () => {
  const seedLatest = () =>
    cache.seed({
      '/provinces': provincesLatest(fx<WireProvince[]>('provinces')),
      [KABUPATEN_SNAPSHOT_URL]: snapshot,
    })
  const openMap = async (path: string) => {
    seedLatest()
    const out = await mountApp(DataView, {}, path)
    await flush()
    await flush()
    return out
  }

  it('items: the metric per area, from the snapshot, and the map kind per level', () => {
    const k = snapshot as LatestByArea[]
    const items = useSubAreaItems(k, 'deceased')
    expect(items).toHaveLength(13)
    expect(items.find((i) => i.code === '7204')).toEqual({ code: '7204', name: 'Poso', value: k.find((x) => x.area.code === '7204')!.latest.cumulative.deceased })
    expect([mapKind(INDONESIA), mapKind(SULTENG), mapKind(areaByCode('kabupaten', '7204')!), mapKind(areaByCode('provinsi', '11')!)]).toEqual(['provinces', 'kabupaten', 'kabupaten', null])
    expect(selectedCode(areaByCode('kabupaten', '7204')!)).toBe('7204')
    expect(selectedCode(SULTENG)).toBeUndefined()
    expect(mapDate(k)).toBe('2024-01-14')
  })

  it('/data/kabupaten/poso: Poso is selected on the map and in the table, values match the snapshot, the caption says the map ignores the window', async () => {
    const { wrapper } = await openMap('/data/kabupaten/poso?dari=2021-07-01')
    const s = wrapper.find('[data-testid="submap"]')
    expect(s.find('g[role="link"][aria-current="true"]').attributes('data-code')).toBe('7204')
    const k = (snapshot as LatestByArea[]).find((x) => x.area.code === '7204')!
    expect(s.find('td[data-code="7204"]').text()).toBe(k.latest.cumulative.positive.toLocaleString('id-ID'))
    expect(s.findAll('tbody tr')).toHaveLength(13)
    expect(s.find('[data-testid="map-caption"]').text()).toContain('14 Januari 2024')
    expect(s.find('[data-testid="map-caption"]').text()).toContain('tidak mengikuti rentang tanggal')
  })

  it('a click on the map and a link in the table keep ?dari and ?sampai', async () => {
    const { wrapper, router } = await openMap('/data/kabupaten/poso?dari=2021-07-01&sampai=2021-07-31')
    const link = wrapper.find('[data-testid="submap"] tbody a[href*="kota-palu"]')
    expect(link.attributes('href')).toBe('/data/kabupaten/kota-palu?dari=2021-07-01&sampai=2021-07-31')
    await wrapper.find('g[role="link"][data-code="7271"]').trigger('click')
    await flush()
    expect(router.currentRoute.value.fullPath).toBe('/data/kabupaten/kota-palu?dari=2021-07-01&sampai=2021-07-31')
  })

  it('the metric switch changes the numbers', async () => {
    const { wrapper } = await openMap('/data/provinsi/sulawesi-tengah')
    const before = wrapper.find('[data-testid="submap"] td[data-code="7271"]').text()
    await wrapper.find('input[value="deceased"]').setValue()
    expect(wrapper.find('[data-testid="submap"] td[data-code="7271"]').text()).not.toBe(before)
  })

  it('the country gets the 34 provinces; another province gets no section and no empty box', async () => {
    const nat = await openMap('/data/indonesia')
    expect(nat.wrapper.find('[data-testid="submap"]').findAll('tbody tr')).toHaveLength(34)
    const aceh = await openMap('/data/provinsi/aceh')
    expect(aceh.wrapper.find('[data-testid="submap"]').exists()).toBe(false)
    expect(aceh.wrapper.find('#peta').exists()).toBe(false)
  })
})
