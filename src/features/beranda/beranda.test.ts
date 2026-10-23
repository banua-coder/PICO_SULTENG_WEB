import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cache } from '@/api/cache'
import { ENDPOINTS } from '@/api/endpoints'
import { banners as toBanners, hospitals as toHospitals, infographics } from '@/api/normalize/content'
import { nationalLatest, provincesLatest } from '@/api/normalize/areas'
import { nationalSeries, provinceSeries } from '@/api/normalize/series'
import { vaccinationSeries } from '@/api/normalize/vaccination'
import { HOME_LATEST_URL } from '@/api/useSeries'
import { INDONESIA, SULTENG } from '@/app/areas'
import { buildHomeLatest } from '@/app/homeLatest'
import { fx, type WireHospital, type WireInfographic, type WireNationalCase, type WireProvince, type WireProvinceCase } from '../../../test/fixtures/load'
import { flush, mountApp } from '../../../test/support/mount'
import BerandaView from './BerandaView.vue'
import { dailyPick, jakartaDay, provinceRows } from './useBeranda'

Object.defineProperty(HTMLImageElement.prototype, 'complete', { get: () => false, configurable: true })
beforeEach(() => {
  vi.spyOn(window, 'matchMedia').mockImplementation((q) => ({ matches: q.includes('reduce'), media: q, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList)
})
afterEach(() => {
  vi.restoreAllMocks()
  cache.clear()
  document.body.innerHTML = ''
})

const provinces = () => provincesLatest(fx<WireProvince[]>('provinces'))
const hospitals = () => toHospitals(fx<WireHospital[]>('hospitals'))
const home = () =>
  buildHomeLatest({
    national: nationalSeries(INDONESIA, fx<WireNationalCase[]>('national')).rows,
    sulteng: provinceSeries(SULTENG, fx<WireProvinceCase[]>('province-72-cases')).rows,
    vaccination: { indonesia: vaccinationSeries(fx('vaccination-national')), 'sulawesi-tengah': vaccinationSeries(fx('vaccination-province')) },
    infographics: infographics(fx<WireInfographic[]>('infographics')),
  })
const seedAll = () =>
  cache.seed({
    '/provinces': provinces(),
    '/national/latest': nationalLatest(fx('national-latest')),
    [HOME_LATEST_URL]: home(),
    [ENDPOINTS.banners.path]: toBanners(fx('banners')),
    [ENDPOINTS.hospitals.path]: hospitals(),
  })
const open = async (path = '/') => {
  seedAll()
  const out = await mountApp(BerandaView, {}, path)
  await flush()
  await flush()
  return out
}

describe('logic', () => {
  it('provinces: by cumulative positive descending, Sulawesi Tengah pinned first, filter by name', () => {
    const rows = provinceRows(provinces())
    expect(rows).toHaveLength(34)
    expect(rows[0]!.area.code).toBe('72')
    const rest = rows.slice(1).map((r) => r.latest.cumulative.positive)
    expect(rest).toEqual([...rest].sort((a, b) => b - a))
    expect(provinceRows(provinces(), ' aceh').map((r) => r.area.slug)).toEqual(['aceh'])
    expect(provinceRows(provinces(), 'zzz')).toEqual([])
  })
  it('the daily hospitals: 3, the same for the same day, a different set on another day, order independent of the input order', () => {
    const h = hospitals()
    const a = dailyPick(h, '2024-01-14').map((x) => x.code)
    expect(a).toHaveLength(3)
    expect(dailyPick(h, '2024-01-14').map((x) => x.code)).toEqual(a)
    expect(dailyPick([...h].reverse(), '2024-01-14').map((x) => x.code)).toEqual(a)
    const days = new Set(['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18'].map((d) => dailyPick(h, d).map((x) => x.code).join()))
    expect(days.size).toBeGreaterThan(1)
    expect(dailyPick(h.slice(0, 2), 'x')).toHaveLength(2)
  })
  it('Jakarta day: UTC evening is already the next day', () => {
    expect(jakartaDay(new Date('2024-01-14T20:00:00Z'))).toBe('2024-01-15')
  })
})

describe('BerandaView', () => {
  it('the h1, the archive line (not alarming), the Sulteng and Indonesia figures with their date, as text', async () => {
    const { wrapper } = await open()
    expect(wrapper.find('h1').text()).toBe('Pusat Informasi COVID-19 Sulawesi Tengah')
    expect(wrapper.find('[data-testid="archive-line"]').text()).toBe('Arsip catatan COVID-19 dari 2 Maret 2020 sampai 14 Januari 2024. Data tidak diperbarui lagi.')
    const sul = wrapper.find('[data-group="sulteng"]')
    expect(sul.text()).toContain('63.614')
    expect(sul.text()).toContain('14 Januari 2024')
    expect(wrapper.find('[data-group="indonesia"]').text()).toMatch(/\d{1,3}(\.\d{3})+/)
    expect(sul.findAll('svg[data-state]').map((e) => e.attributes('data-state'))).toEqual(['positive', 'recovered', 'deceased', 'active'])
  })

  it('Rt: the last non-null value with its date, never "0" for missing', async () => {
    const { wrapper } = await open()
    const t = wrapper.find('[data-testid="rt-now"]').text()
    expect(t).toMatch(/Sulawesi Tengah: Rt terakhir yang dapat dihitung [\d,]+ \(24 Juni 2023\)/)
    expect(t).toMatch(/Indonesia: Rt terakhir yang dapat dihitung [\d,]+ \(9 Juli 2023\)/)
    expect(wrapper.find('[data-testid="rt-now"] + p a').attributes('href')).toBe('/metodologi#rt')
  })

  it('34 provinces with links, Sulawesi Tengah first, the filter narrows', async () => {
    const { wrapper } = await open()
    const items = wrapper.findAll('[data-testid="province-list"] li')
    expect(items).toHaveLength(34)
    expect(items[0]!.find('a').attributes('href')).toBe('/data/provinsi/sulawesi-tengah')
    await wrapper.find('#province-q').setValue('bali')
    expect(wrapper.findAll('[data-testid="province-list"] li')).toHaveLength(1)
    expect(wrapper.text()).toContain('Menampilkan 1 dari 34 provinsi')
  })

  it('vaccination summary: dose bars for Sulteng and Indonesia, the date, a link to /vaksin', async () => {
    const { wrapper } = await open()
    const v = wrapper.find('[data-testid="vaccine-summary"]')
    expect(v.findAll('[role="progressbar"]')).toHaveLength(4)
    expect(v.text()).toContain('25 Maret 2022')
    expect(wrapper.find('a[href="/vaksin"]').exists()).toBe(true)
  })

  it('banners: the title card with the missing-image state, external links in a new tab with a label', async () => {
    const { wrapper } = await open()
    const b = wrapper.find('[data-testid="banners"]')
    expect(b.findAll('li')).toHaveLength(3)
    expect(b.findAll('[data-placeholder]')).toHaveLength(3) // images are on the expired server: resolved to null
    const a = b.find('a')
    expect(a.attributes('target')).toBe('_blank')
    expect(a.attributes('rel')).toContain('noopener')
    expect(a.text()).toContain('Tautan luar')
  })

  it('banners are hidden with none', async () => {
    seedAll()
    cache.seed({ [ENDPOINTS.banners.path]: [] })
    const { wrapper } = await mountApp(BerandaView, {}, '/')
    await flush()
    expect(wrapper.find('#pengumuman').exists()).toBe(false)
  })

  it('5 newest infographics link to ?id=, 3 hospitals, and the call centre shows 119 and not the old hotline', async () => {
    const { wrapper } = await open()
    const info = wrapper.findAll('[data-testid="latest-infographics"] li a')
    expect(info).toHaveLength(5)
    expect(info[0]!.attributes('href')).toMatch(/^\/infografis\?id=\d+$/)
    expect(wrapper.findAll('[data-testid="hospital-teaser"] li')).toHaveLength(3)
    expect(wrapper.find('[data-testid="call-center"]').text()).toContain('119')
    expect(wrapper.html()).not.toContain('0811404119')
    expect(wrapper.find('[data-todo="beranda-119"]').exists()).toBe(true)
  })

  it('one failed resource does not blank the page: its section shows an error and retry, the rest stay', async () => {
    seedAll()
    cache.clear()
    cache.seed({ '/provinces': provinces(), '/national/latest': nationalLatest(fx('national-latest')), [ENDPOINTS.banners.path]: toBanners(fx('banners')), [ENDPOINTS.hospitals.path]: hospitals() })
    const { wrapper } = await mountApp(BerandaView, {}, '/')
    await flush()
    await flush()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true) // the home snapshot is missing (offline in tests)
    expect(wrapper.find('[data-testid="headline"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="province-list"]').exists()).toBe(true)
    expect(wrapper.find('h1').exists()).toBe(true)
  })

  it('English home', async () => {
    const { wrapper } = await open('/en/')
    expect(wrapper.find('h1').text()).toBe('COVID-19 Information Centre of Central Sulawesi')
    expect(wrapper.find('[data-testid="rt-now"]').text()).toContain('last Rt that could be computed')
    expect(wrapper.find('[data-testid="province-list"] a').attributes('href')).toBe('/en/data/provinsi/sulawesi-tengah')
  })
})
