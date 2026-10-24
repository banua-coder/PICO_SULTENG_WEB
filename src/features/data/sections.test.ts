import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cache } from '@/api/cache'
import { provincesLatest } from '@/api/normalize/areas'
import { genderSnapshot, testPeriods, testTypes } from '@/api/normalize/stats'
import { nationalSeries, provinceSeries, regencySeries } from '@/api/normalize/series'
import type { LatestByArea } from '@/api/types'
import { KABUPATEN_SNAPSHOT_URL, LAST_REAL_URL } from '@/api/useSeries'
import { areaByCode, INDONESIA, SULTENG } from '@/app/areas'
import snapshot from '../../../test/fixtures/kabupaten-latest.snapshot.json'
import { fx, type WireNationalCase, type WireProvince, type WireProvinceCase, type WireRegencyCase } from '../../../test/fixtures/load'
import { flush, mountApp, until } from '../../../test/support/mount'
import DataView from './DataView.vue'
import { mapDateRange, mapKinds, metricsFor, selectedCode, useSubAreaItems } from './useSubAreaItems'

beforeEach(() => {
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
// `ready` is a selector that exists once the lazy chart chunk has loaded. Without one, only the synchronous parts are awaited.
const open = async (path: string, ready?: string) => {
  seedAll()
  const out = await mountApp(DataView, {}, path)
  await flush()
  if (ready) await until(() => out.wrapper.find(ready).exists())
  return out
}
const CURVES = '[data-testid="curves"] figure'
const RT_CHART = '[data-testid="rt-section"] figure'

describe('CaseCurves (W15)', () => {
  const lastDay = () => {
    const rows = sul().rows
    return [...rows].reverse().find((r) => r.daily.positive > 0 || r.daily.recovered > 0 || r.daily.deceased > 0)!
  }

  it('daily view: one case type, bars with the 7-day average over it, one peak bar, a legend, and the window ends on the last real day', async () => {
    const { wrapper } = await open('/data/provinsi/sulawesi-tengah', CURVES)
    const figs = wrapper.find('[data-testid="curves"]').findAll('figure')
    expect(figs).toHaveLength(1)
    const bars = figs[0]!
    expect(bars.find('figcaption').text()).toBe('positif baru per hari')
    expect(bars.findAll('[data-peak]')).toHaveLength(1)
    expect(bars.findAll('[data-end-label]').map((e) => e.text())).toEqual(['Positif', 'rata-rata 7 hari'])
    expect(bars.findAll('[data-testid="legend"] li').map((e) => e.text())).toEqual(['Positif', 'rata-rata 7 hari'])
    const last = lastDay()
    const label = bars.find('svg[role="img"]').attributes('aria-label')!
    expect(label).toMatch(/^Puncak positif harian [\d.]+ pada \d+ \w+ \d{4}\. Nilai terakhir [\d.]+ pada \d+ \w+ \d{4}\.$/)
    // never the padded end of the record (14 January 2024, zeros)
    expect(label).not.toContain('14 Januari 2024')
    expect(label).toContain(`${Number(last.date.slice(8))} `)
  })

  it('case type "Semua": recovered and deceased join the positive line, with a legend', async () => {
    const { wrapper } = await open('/data/provinsi/sulawesi-tengah?jenis=all', CURVES)
    const fig = wrapper.find('[data-testid="curves"] figure')
    expect(fig.findAll('[data-end-label]').map((e) => e.text()).sort()).toEqual(['Meninggal', 'Positif', 'Sembuh'])
    expect(fig.findAll('[data-testid="legend"] li')).toHaveLength(3)
  })

  it('English summary sentence', async () => {
    const { wrapper } = await open('/en/data/provinsi/sulawesi-tengah', CURVES)
    const label = wrapper.find('[data-testid="curves"] svg[role="img"]').attributes('aria-label')!
    expect(label).toMatch(/^Peak daily positive [\d,]+ on \d+ \w+ \d{4}\. Last value [\d,]+ on \d+ \w+ \d{4}\.$/)
    expect(label).not.toContain('14 January 2024')
  })

  it('cumulative view: four lines for a province, three for a kabupaten (all types); one line for a single type', async () => {
    const p = await open('/data/provinsi/sulawesi-tengah?tampilan=kumulatif&jenis=all', CURVES)
    expect(p.wrapper.find('[data-testid="curves"]').findAll('[data-end-label]').map((e) => e.text())).toEqual(['Positif', 'Sembuh', 'Meninggal', 'Dirawat'])
    expect(p.wrapper.find('[data-testid="curves"]').findAll('[data-testid="legend"] li')).toHaveLength(4)
    const k = await open('/data/kabupaten/kota-palu?tampilan=kumulatif&jenis=all', CURVES)
    expect(k.wrapper.find('[data-testid="curves"]').findAll('[data-end-label]').map((e) => e.text())).toEqual(['Positif', 'Sembuh', 'Meninggal'])
    const one = await open('/data/provinsi/sulawesi-tengah?tampilan=kumulatif', CURVES)
    expect(one.wrapper.find('[data-testid="curves"]').findAll('[data-end-label]').map((e) => e.text())).toEqual(['Positif'])
    expect(one.wrapper.find('[data-testid="curves"] svg[role="img"]').attributes('aria-label')).toContain('Total kasus positif 63.614')
  })

  it('the tabs switch the view and the toggle group the case type; both write the query with replace and keep the window', async () => {
    const { wrapper, router } = await open('/data/provinsi/sulawesi-tengah?dari=2023-12-01', CURVES)
    await wrapper.findAll('[role="tab"]').find((t) => t.text() === 'Kumulatif')!.trigger('mousedown', { button: 0, ctrlKey: false })
    await flush()
    expect(router.currentRoute.value.query).toEqual({ dari: '2023-12-01', tampilan: 'kumulatif' })
    await wrapper.find('[data-testid="curves"] [data-value="recovered"]').trigger('click')
    await flush()
    expect(router.currentRoute.value.query).toEqual({ dari: '2023-12-01', tampilan: 'kumulatif', jenis: 'recovered' })
    await wrapper.findAll('[role="tab"]').find((t) => t.text() === 'Harian')!.trigger('mousedown', { button: 0, ctrlKey: false })
    await flush()
    expect(router.currentRoute.value.query).toEqual({ dari: '2023-12-01', jenis: 'recovered' })
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

  it('national at the default end: Rt runs to its own last day (9 July 2023), after the last day with counts, and says the estimate stopped', async () => {
    const { wrapper } = await open('/data/indonesia', RT_CHART)
    const s = wrapper.find('[data-testid="rt-section"]')
    expect(s.find('[data-testid="rt-last"]').text()).toMatch(/^Rt [\d,]+ \([\d,]+ sampai [\d,]+\) pada 9 Juli 2023$/)
    expect(s.find('[data-testid="rt-end"]').text()).toBe('Setelah 9 Juli 2023 Rt tidak dihitung lagi: perhitungannya berhenti pada pertengahan 2023.')
    expect(s.find('[data-testid="rt-gaps"]').text()).not.toContain('2024') // the padded end of the record is not a gap
    expect(s.find('figure').exists()).toBe(true)
  })

  it('a window with no Rt shows the explainer and "Rt tidak tersedia untuk rentang ini", no chart', async () => {
    const { wrapper } = await open('/data/indonesia?dari=2020-03-02&sampai=2020-03-08')
    const s = wrapper.find('[data-testid="rt-section"]')
    expect(s.find('[data-testid="rt-none"]').text()).toBe('Rt tidak tersedia untuk rentang ini')
    expect(s.find('figure').exists()).toBe(false)
    expect(s.text()).toContain('Rt adalah rata-rata jumlah orang yang tertular dari satu kasus')
  })

  it('a window with Rt draws the chart with a text label for the threshold at 1', async () => {
    const { wrapper } = await open('/data/provinsi/sulawesi-tengah?dari=2023-06-01&sampai=2023-06-30', RT_CHART)
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
      // the build file of the map date rule: each area's own last real day (the record is padded with zero rows to 2024-01-14)
      [LAST_REAL_URL]: { provinsi: Object.fromEntries(provincesLatest(fx<WireProvince[]>('provinces')).map((p) => [p.area.code, p.area.code === '72' ? '2023-12-09' : '2023-07-03'])), kabupaten: { '7204': '2023-04-19', '7271': '2023-12-16' } },
    })
  // the map chunk is lazy: wait for its first area unless the page has no map
  const openMap = async (path: string, map = true) => {
    seedLatest()
    const out = await mountApp(DataView, {}, path)
    await flush()
    if (map) await until(() => out.wrapper.find('[data-testid="submap"] g[role="link"]').exists())
    return out
  }

  it('items: the metric per area, from the snapshot, and the map kind per level', () => {
    const k = snapshot as LatestByArea[]
    const items = useSubAreaItems(k, 'deceased')
    expect(items).toHaveLength(13)
    expect(items.find((i) => i.code === '7204')).toMatchObject({ code: '7204', name: 'Poso', value: k.find((x) => x.area.code === '7204')!.latest.cumulative.deceased })
    // a kabupaten has no "dirawat": null (not available), never 0
    expect(useSubAreaItems(k, 'active').every((i) => i.value === null && i.detail!.active === null)).toBe(true)
    expect([INDONESIA, SULTENG, areaByCode('kabupaten', '7204')!, areaByCode('provinsi', '11')!].map(mapKinds)).toEqual([['provinces'], ['provinces', 'kabupaten'], ['kabupaten'], ['provinces']])
    expect(metricsFor(['kabupaten'])).toEqual(['positive', 'recovered', 'deceased'])
    expect(metricsFor(['provinces'])).toEqual(['positive', 'active', 'recovered', 'deceased'])
    expect(selectedCode(areaByCode('kabupaten', '7204')!, 'kabupaten')).toBe('7204')
    expect(selectedCode(SULTENG, 'kabupaten')).toBeUndefined()
    expect(selectedCode(SULTENG, 'provinces')).toBe('72')
    // map date rule: each item carries its own last real day, the caption range goes from the oldest to the newest
    const dated = useSubAreaItems(k, 'positive', { '7204': '2023-04-19', '7271': '2023-12-16' })
    expect(dated.find((i) => i.code === '7204')!.date).toBe('2023-04-19')
    expect(dated.find((i) => i.code === '7201')!.date).toBe('2024-01-14') // no build entry: the row's own date
    expect(mapDateRange(dated)).toEqual({ from: '2023-04-19', to: '2024-01-14' })
    expect(mapDateRange(dated.filter((i) => i.code === '7271'))).toEqual({ from: '2023-12-16', to: '2023-12-16' })
    expect(mapDateRange([])).toBeUndefined()
  })

  it('/data/kabupaten/poso: Poso is selected on the map and in the table, values match the snapshot, the caption says the map ignores the window', async () => {
    const { wrapper } = await openMap('/data/kabupaten/poso?dari=2021-07-01')
    const s = wrapper.find('[data-testid="submap"]')
    expect(s.find('g[role="link"][aria-current="true"]').attributes('data-code')).toBe('7204')
    const k = (snapshot as LatestByArea[]).find((x) => x.area.code === '7204')!
    expect(s.find('td[data-code="7204"]').text()).toBe(k.latest.cumulative.positive.toLocaleString('id-ID'))
    expect(s.findAll('tbody tr')).toHaveLength(13)
    // the kabupaten without a build entry keep the padded end of the record; the two with one show their own day, in the table and in the caption range
    expect(s.find('[data-testid="map-caption"]').text()).toContain('19 April 2023 sampai 14 Januari 2024')
    expect(s.find('[data-testid="map-caption"]').text()).toContain('tidak mengikuti rentang tanggal')
    expect(s.find('td[data-date="7271"]').text()).toBe('16 Desember 2023')
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
    await wrapper.find('[data-testid="submap"] [data-value="deceased"]').trigger('click')
    expect(wrapper.find('[data-testid="submap"] td[data-code="7271"]').text()).not.toBe(before)
  })

  it('the country gets the 34 provinces, any province gets the province map with itself selected, Sulawesi Tengah also its 13 kabupaten', async () => {
    const nat = await openMap('/data/indonesia')
    expect(nat.wrapper.find('[data-testid="submap"]').findAll('tbody tr')).toHaveLength(34)
    const aceh = await openMap('/data/provinsi/aceh')
    const m = aceh.wrapper.find('[data-testid="submap"]')
    expect(m.findAll('table')).toHaveLength(1)
    expect(m.find('g[role="link"][aria-current="true"]').attributes('data-code')).toBe('11')
    const st = await openMap('/data/provinsi/sulawesi-tengah')
    await until(() => st.wrapper.findAll('[data-testid="submap"] table').length === 2)
    const rows = st.wrapper.findAll('[data-testid="submap"] table')
    expect(rows.map((r) => r.findAll('tbody tr').length)).toEqual([34, 13])
    expect(rows[0]!.findAll('tbody tr')[0]!.text()).toContain('Sulawesi Tengah') // pinned first
  })

  it('"dirawat": the province map has it, the kabupaten map says it is not available instead of drawing zeros', async () => {
    const st = await openMap('/data/provinsi/sulawesi-tengah')
    await until(() => st.wrapper.findAll('[data-testid="submap"] table').length === 2)
    await st.wrapper.find('[data-testid="submap"] [data-value="active"]').trigger('click')
    const blocks = st.wrapper.findAll('[data-map-kind]')
    expect(blocks[0]!.find('table').exists()).toBe(true)
    expect(blocks[1]!.find('table').exists()).toBe(false)
    expect(blocks[1]!.text()).toContain('tidak tersedia untuk kabupaten/kota')
    const kab = await openMap('/data/kabupaten/poso')
    expect(kab.wrapper.find('[data-testid="submap"] [data-value="active"]').exists()).toBe(false)
    expect(kab.wrapper.find('[data-testid="map-no-active"]').exists()).toBe(true)
  })

  it('Titik switches the map to proportional marks', async () => {
    const { wrapper } = await openMap('/data/kabupaten/poso')
    expect(wrapper.find('[data-testid="submap"] [data-mark]').exists()).toBe(false)
    await wrapper.find('[data-testid="submap"] [data-value="points"]').trigger('click')
    expect(wrapper.find('[data-testid="submap"] [data-mark]').exists()).toBe(true)
  })
})

describe('GenderAge and TestsByType (W18)', () => {
  const seedStats = () =>
    cache.seed({
      '/stats/gender/latest': genderSnapshot(fx('gender-latest')),
      'tests+types': { periods: testPeriods(fx('tests')), types: testTypes(fx('test-types')) },
    })
  const openStats = async (path: string, charts = true) => {
    seedStats()
    const out = await mountApp(DataView, {}, path)
    await flush()
    if (charts) await until(() => out.wrapper.find('[data-testid="gender"] figure').exists() && out.wrapper.find('[data-testid="tests"] figure').exists())
    return out
  }

  it('renders only on the Sulawesi Tengah routes', async () => {
    for (const p of ['/data', '/data/provinsi/sulawesi-tengah']) {
      const { wrapper } = await openStats(p)
      expect(wrapper.find('[data-testid="gender"]').exists(), p).toBe(true)
      expect(wrapper.find('[data-testid="tests"]').exists(), p).toBe(true)
    }
    for (const p of ['/data/provinsi/aceh', '/data/indonesia', '/data/kabupaten/kota-palu']) {
      const { wrapper } = await openStats(p, false)
      expect(wrapper.find('[data-testid="gender"]').exists(), p).toBe(false)
      expect(wrapper.find('[data-testid="tests"]').exists(), p).toBe(false)
    }
  })

  it('with no date from the API the caption says the date is not recorded, and no date is shown', async () => {
    const { wrapper } = await openStats('/data/provinsi/sulawesi-tengah')
    expect(wrapper.find('[data-testid="gender-caption"]').text()).toBe('Data terakhir yang tersedia dari sumber. Tanggal tidak tercatat di API.')
    expect(wrapper.find('[data-testid="gender-caption"]').text()).not.toMatch(/\d{4}/)
  })

  it('sex bars carry label, share and value as text; the PDP toggle swaps the numbers', async () => {
    const { wrapper } = await openStats('/data/provinsi/sulawesi-tengah')
    const g = wrapper.find('[data-testid="gender"]')
    const first = g.findAll('figure')[0]!
    expect(first.text()).toContain('Laki-laki (44,8%)')
    expect(first.text()).toContain('10.199')
    expect(g.findAll('figure')).toHaveLength(3)
    await g.find('[data-value="pdp"]').trigger('click')
    expect(g.findAll('figure')[0]!.text()).toContain('178')
    expect(g.findAll('figure')[0]!.find('figcaption').text()).toBe('PDP menurut jenis kelamin')
  })

  it('tests: PCR and RDT only, the last period as text, the type description, and the end-date note', async () => {
    const { wrapper } = await openStats('/data/provinsi/sulawesi-tengah')
    const t = wrapper.find('[data-testid="tests"]')
    expect(t.findAll('[data-type]').map((e) => e.attributes('data-type'))).toEqual(['pcr', 'rdt'])
    // a period of four zeros (28 September 2020 and after) is padding: the last real period is shown, never a 0 row
    expect(t.find('[data-testid="tests-note"]').text()).toMatch(/^Data pemeriksaan hanya tersedia sampai \d+ \w+ 2020\.$/)
    expect(t.find('[data-testid="tests-note"]').text()).not.toContain('28 September 2020')
    expect(t.text()).toMatch(/Periode terakhir \(\d+ \w+ 2020\)/)
    expect(t.text()).not.toContain('Periode terakhir (28 September 2020)')
    expect(t.text()).toContain('Spesimen saluran pernapasan')
    expect(t.findAll('[data-type]')[0]!.findAll('dl')[1]!.findAll('dt').map((d) => d.text())).toEqual(['Diproses', 'Tidak valid', 'Positif', 'Negatif'])
    // the legacy coloured blocks, PCR first: total and the four results with their share of it
    const pcr = t.find('[data-block="pcr"]')
    expect(pcr.exists()).toBe(true)
    expect(pcr.attributes('style')).toContain('var(--pico-test-pcr-ground)')
    expect(pcr.find('[data-total]').text()).toMatch(/^[\d.]+$/)
    expect(pcr.findAll('[data-figure]').map((e) => e.attributes('data-figure'))).toEqual(['positive', 'negative', 'invalid', 'process'])
    expect(pcr.text()).not.toContain('NaN')
    expect(t.find('[data-block="rdt"]').exists()).toBe(true)
  })
})
