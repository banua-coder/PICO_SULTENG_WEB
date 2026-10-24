import { afterEach, describe, expect, it } from 'vitest'
import { cache } from '@/api/cache'
import { provinceSeries } from '@/api/normalize/series'
import { SULTENG } from '@/app/areas'
import { fx, type WireProvinceCase } from '../../../test/fixtures/load'
import { flush, mountApp } from '../../../test/support/mount'
import TabelView from './TabelView.vue'

afterEach(() => cache.clear())
const seed = () => {
  const s = provinceSeries(SULTENG, fx<WireProvinceCase[]>('province-72-cases'))
  cache.seed({ '/provinces/72/cases?all=true': s })
  return s
}

describe('TabelView', () => {
  it('shows 50 rows newest first with a caption, grouped headers and a labelled scroll region', async () => {
    const s = seed()
    const { wrapper } = await mountApp(TabelView, {}, '/tabel-data')
    await flush()
    expect(wrapper.find('h1').text()).toBe('Tabel Data')
    expect(wrapper.findAll('tbody tr')).toHaveLength(50)
    expect(wrapper.find('caption').text()).toContain('Sulawesi Tengah')
    expect(wrapper.find('tbody th').text()).toContain('9 Des 2023') // the last day with real counts, not the zero rows after it
    expect(s.rows.at(-1)!.date).toBe('2024-01-14')
    const region = wrapper.find('[role="region"]')
    expect(region.attributes('tabindex')).toBe('0')
    expect(region.attributes('aria-label')).toBeTruthy()
    expect(wrapper.findAll('thead th[scope="colgroup"]').map((e) => e.text())).toEqual(['Harian', 'Kumulatif', 'Pemantauan awal pandemi (kumulatif)'])
    expect(wrapper.findAll('tbody tr').at(0)!.text()).toContain('tidak tersedia') // ODP/PDP after 2022-05-08
  })

  it('pages with ?hal, clamps a junk page, and marks the current page', async () => {
    seed()
    const { wrapper, router } = await mountApp(TabelView, {}, '/tabel-data?hal=2')
    await flush()
    expect(wrapper.find('[aria-current="page"]').text()).toBe('2')
    await router.replace({ query: { hal: '999' } })
    await flush()
    const last = wrapper.findAll('nav li button').at(-1)!.text()
    expect(wrapper.find('[aria-current="page"]').text()).toBe(last)
  })

  it('a window narrows the rows, and a range with no rows says so', async () => {
    seed()
    const { wrapper } = await mountApp(TabelView, {}, '/tabel-data?dari=2023-12-01&sampai=2023-12-03')
    await flush()
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    expect(wrapper.find('caption').text()).toContain('3')
  })

  it('asks for the series nowhere but its own URL and offers the full files', async () => {
    seed()
    const { wrapper } = await mountApp(TabelView, {}, '/tabel-data')
    await flush()
    expect(wrapper.find('a[href="/unduh/provinsi.csv"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/unduh/kabupaten-sulteng.xlsx"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Unduh CSV (tampilan ini)')
  })
})
