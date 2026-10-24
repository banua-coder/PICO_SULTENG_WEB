import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KABUPATEN_AREAS, PROVINCE_AREAS } from '@/app/areas'
import { flush, mountApp } from '../../../test/support/mount'
import KabupatenMap from './KabupatenMap.vue'
import ProvinceMap from './ProvinceMap.vue'
import sulteng from './geo/sulteng.paths.json'

let w = 640
beforeEach(() => {
  w = 640
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: w, height: 480, top: 0, left: 0, right: w, bottom: 480, x: 0, y: 0, toJSON: () => ({}) }))
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const metric = { label: 'Positif kumulatif', role: 'positive' as const }
const items = KABUPATEN_AREAS.map((a, i) => ({ code: a.code, name: a.name, value: (i + 1) * 1000 + (i % 3) * 17 }))
const provItems = PROVINCE_AREAS.map((a, i) => ({ code: a.code, name: a.name, value: (i + 1) * 5000 }))

async function kab(props: Record<string, unknown> = {}, path = '/') {
  const out = await mountApp(KabupatenMap, { items, metric, ...props }, path)
  await flush()
  return out
}
const areas = (wr: Awaited<ReturnType<typeof kab>>['wrapper']) => wr.findAll('g[role="link"]')

describe('KabupatenMap', () => {
  it('has 13 focusable links, one per kabupaten, each named with its value', async () => {
    const { wrapper } = await kab()
    const links = areas(wrapper)
    expect(links).toHaveLength(13)
    for (const l of links) expect(l.attributes('tabindex')).toBe('0')
    const poso = wrapper.find('g[data-code="7204"]')
    expect(poso.attributes('aria-label')).toBe('Poso: 4.000')
    expect(wrapper.find('svg[data-testid="geo-map"]').attributes('role')).toBe('group')
  })

  it('Tab order is west to east, then north to south', async () => {
    const { wrapper } = await kab()
    const order = areas(wrapper).map((l) => l.attributes('data-code')!)
    const cx = (c: string) => sulteng.find((p) => p.code === c)!.cx
    const xs = order.map(cx)
    expect(xs).toEqual([...xs].sort((a, b) => a - b))
    expect(order[0]).toBe('7271') // Kota Palu on the west coast
  })

  it('click, Enter and Space each fire select(code)', async () => {
    const { wrapper } = await kab()
    const poso = wrapper.find('g[data-code="7204"]')
    await poso.trigger('click')
    await poso.trigger('keydown', { key: 'Enter' })
    await poso.trigger('keydown', { key: ' ' })
    const emitted = wrapper.findComponent(KabupatenMap).emitted('select')!
    expect(emitted).toEqual([['7204'], ['7204'], ['7204']])
    await poso.trigger('keydown', { key: 'a' })
    expect(wrapper.findComponent(KabupatenMap).emitted('select')).toHaveLength(3)
  })

  it('Titik: magnitude is a mark size plus a number, every area has the same fill', async () => {
    const { wrapper } = await kab({ mode: 'points' })
    const fills = new Set(areas(wrapper).map((l) => l.find('path').attributes('style')!.match(/fill: ([^;]+)/)![1]))
    expect(fills.size).toBe(1)
    expect(wrapper.find('[data-mark]').exists()).toBe(true)
  })

  it('Sebaran: each area is filled by its quantile class from the ramp of the case, with its number as text and no marks', async () => {
    const { wrapper } = await kab({ metric: { label: 'Dirawat', role: 'active' } })
    const fill = (c: string) => wrapper.find(`g[data-code="${c}"] path`).attributes('style')!.match(/fill: ([^;]+)/)![1]
    expect(fill('7201')).toBe('var(--pico-ramp-active-1)') // smallest value
    expect(fill('7271')).toBe('var(--pico-ramp-active-9)') // biggest, the exact legacy blue
    expect(new Set(areas(wrapper).map((l) => fill(l.attributes('data-code')!))).size).toBeGreaterThanOrEqual(8) // up to 9 classes like the legacy map
    expect(wrapper.find('[data-mark]').exists()).toBe(false)
    expect(wrapper.find('[data-mark-for="7271"] text[data-value]').text()).toMatch(/^\d/)
    expect(wrapper.find('svg[data-testid="geo-map"]').attributes('data-mode')).toBe('choropleth')
  })

  it('Sebaran: a missing value is a hatched fill (never a ramp step) and a "tidak tersedia" legend entry', async () => {
    const withNull = items.map((i) => (i.code === '7204' ? { ...i, value: null } : i))
    const { wrapper } = await kab({ items: withNull })
    expect(wrapper.find('g[data-code="7204"] path').attributes('style')).toContain('url(#hatch-')
    expect(wrapper.find('g[data-code="7204"]').attributes('data-step')).toBeUndefined()
    expect(wrapper.find('[data-nodata]').text()).toBe('tidak tersedia')
  })

  it('Sebaran legend: swatch, range and count per class, and the date of the numbers in the title', async () => {
    const { wrapper } = await kab({ date: '2024-01-14' })
    const li = wrapper.findAll('[data-testid="map-legend"] li[data-step]')
    expect(li.length).toBeGreaterThanOrEqual(8)
    expect(li.length).toBeLessThanOrEqual(9)
    expect(li[0]!.find('[data-swatch]').attributes('style')).toContain('--pico-ramp-positive-1')
    expect(li.map((l) => l.text()).some((x) => /\d.*sampai.*\d.*\(\d+ wilayah\)/.test(x))).toBe(true)
    expect(li[0]!.text()).toMatch(/\(\d+ wilayah\)/)
    expect(wrapper.find('figure').text()).toContain('14 Januari 2024')
  })

  it('the title names the metric and the area', async () => {
    const { wrapper } = await kab({ areaName: 'Sulawesi Tengah' })
    expect(wrapper.find('figcaption').text()).toBe('Peta sebaran positif kumulatif COVID-19 di Sulawesi Tengah')
  })

  it('hover and focus show the four numbers of the area in the legacy order; a missing one says so', async () => {
    const detail = { positive: 100, active: null, recovered: 90, deceased: 10 }
    const { wrapper } = await kab({ items: items.map((i) => (i.code === '7204' ? { ...i, detail } : i)) })
    await wrapper.find('g[data-code="7204"]').trigger('pointerenter', { clientX: 50, clientY: 40 })
    const tip = wrapper.find('[data-tooltip]')
    expect(tip.text()).toContain('Poso')
    expect(tip.findAll('tr').map((r) => r.text())).toEqual(['Positif100', 'Dirawattidak tersedia', 'Sembuh90', 'Meninggal10'])
    await wrapper.find('g[data-code="7204"]').trigger('pointerleave')
    expect(wrapper.find('[data-tooltip]').exists()).toBe(false)
    await wrapper.find('g[data-code="7203"]').trigger('focus')
    expect(wrapper.find('[data-tooltip]').exists()).toBe(true)
  })

  it('zoom buttons change the viewBox, reset restores it, and the marks keep their pixel size', async () => {
    const { wrapper } = await kab()
    const vb = () => wrapper.find('svg[data-testid="geo-map"]').attributes('viewBox')
    expect(vb()).toBe('0 0 800 600')
    expect(wrapper.find('[data-zoom="reset"]').attributes('disabled')).toBeDefined()
    await wrapper.find('[data-zoom="in"]').trigger('click')
    expect(vb()).not.toBe('0 0 800 600')
    expect(parseFloat(wrapper.find('svg[data-testid="geo-map"]').attributes('data-zoom-level')!)).toBeCloseTo(1.5, 1)
    await wrapper.find('[data-zoom="reset"]').trigger('click')
    expect(vb()).toBe('0 0 800 600')
  })

  it('Ctrl+wheel zooms, a plain wheel does not', async () => {
    const { wrapper } = await kab()
    const host = wrapper.find('[data-testid="geo-host"]')
    await host.trigger('wheel', { deltaY: -100 })
    expect(wrapper.find('svg[data-testid="geo-map"]').attributes('viewBox')).toBe('0 0 800 600')
    await host.trigger('wheel', { deltaY: -100, ctrlKey: true })
    expect(wrapper.find('svg[data-testid="geo-map"]').attributes('viewBox')).not.toBe('0 0 800 600')
  })

  it('a plain wheel zooms only after a click or focus, and Escape or blur ends it', async () => {
    const { wrapper } = await kab()
    const host = wrapper.find('[data-testid="geo-host"]')
    const vb = () => wrapper.find('svg[data-testid="geo-map"]').attributes('viewBox')
    expect(wrapper.find('[data-testid="wheel-hint"]').text()).toContain('Klik peta')
    await host.trigger('wheel', { deltaY: -100 })
    expect(vb()).toBe('0 0 800 600') // not armed: the page scrolls
    await host.trigger('pointerdown', { pointerId: 1, pointerType: 'mouse', clientX: 1, clientY: 1 })
    expect(wrapper.find('[data-testid="wheel-hint"]').text()).toContain('Zoom roda aktif')
    await host.trigger('wheel', { deltaY: -100 })
    expect(vb()).not.toBe('0 0 800 600')
    await wrapper.find('[data-zoom="reset"]').trigger('click')
    await host.trigger('keydown', { key: 'Escape' })
    await host.trigger('wheel', { deltaY: -100 })
    expect(vb()).toBe('0 0 800 600')
    await host.trigger('focusin')
    await host.trigger('focusout')
    await host.trigger('wheel', { deltaY: -100 })
    expect(vb()).toBe('0 0 800 600')
  })

  it('pin lists one area first in the table', async () => {
    const { wrapper } = await kab({ pin: '7202' })
    expect(wrapper.findAll('tbody tr')[0]!.text()).toContain('Banggai')
  })

  it('every visible mark has a text value next to it, and bigger values get bigger marks', async () => {
    const { wrapper } = await kab({ mode: 'points' })
    const marks = wrapper.findAll('[data-mark-for]')
    expect(marks).toHaveLength(13)
    for (const m of marks) {
      expect(m.find('[data-mark]').exists()).toBe(true)
      expect(m.find('text[data-value]').text()).toMatch(/^\d/)
    }
    const scale = (code: string) => parseFloat(wrapper.find(`[data-mark-for="${code}"] [data-mark]`).attributes('transform')!.match(/scale\(([\d.]+)\)/)![1]!)
    expect(scale('7202')).toBeLessThan(scale('7271'))
    expect(wrapper.findAll('[data-mark]').length).toBe(marks.length)
  })

  it('marks and the legend use the data role (shape), and the legend lists the ramp with text', async () => {
    const { wrapper } = await kab({ mode: 'points', metric: { label: 'Meninggal kumulatif', role: 'deceased' } })
    expect(wrapper.find('[data-mark]').attributes('data-mark')).toBe('deceased')
    const legend = wrapper.find('[data-testid="map-legend"]')
    expect(legend.findAll('li')).toHaveLength(6)
    expect(legend.text()).toMatch(/\d.*sampai.*\d/)
  })

  it('small areas (Banggai Laut, Banggai Kepulauan, Kota Palu) have a leader line, a label away from the shape and a 44 px hit target; big ones do not', async () => {
    const { wrapper } = await kab()
    for (const code of ['7211', '7201', '7271']) {
      expect(wrapper.find(`[data-mark-for="${code}"] [data-leader]`).exists()).toBe(true)
      const hit = wrapper.find(`g[data-code="${code}"] [data-hit]`)
      expect(hit.exists()).toBe(true)
      expect(parseFloat(hit.attributes('r')!) * (640 / 800)).toBeCloseTo(22, 1) // 22 CSS px radius = 44 px target
    }
    expect(wrapper.find('[data-mark-for="7202"] [data-leader]').exists()).toBe(false)
    expect(wrapper.find('g[data-code="7202"] [data-hit]').exists()).toBe(false)
  })

  it('the table holds the same values as the map, area by area', async () => {
    const { wrapper } = await kab()
    for (const i of items) {
      const onMap = wrapper.find(`[data-mark-for="${i.code}"] text[data-value]`).text()
      const inTable = wrapper.find(`td[data-code="${i.code}"]`).text()
      expect(onMap).toBe(inTable)
      expect(wrapper.find(`g[data-code="${i.code}"]`).attributes('aria-label')).toBe(`${i.name}: ${inTable}`)
    }
  })

  it('the table is sorted by value, biggest first, with real headers and a caption', async () => {
    const { wrapper } = await kab()
    const first = wrapper.findAll('tbody tr')[0]!
    expect(first.text()).toContain('Kota Palu') // the last item has the biggest value
    expect(wrapper.find('caption').text()).toBe('Positif kumulatif')
    expect(wrapper.findAll('th[scope="col"]')).toHaveLength(2)
    expect(wrapper.findAll('th[scope="row"]')).toHaveLength(13)
  })

  it('a null value has no mark, no number on the map, and says "tidak tersedia" in label and table', async () => {
    const withNull = items.map((i) => (i.code === '7204' ? { ...i, value: null } : i))
    const { wrapper } = await kab({ items: withNull })
    expect(wrapper.find('[data-mark-for="7204"]').exists()).toBe(false)
    expect(wrapper.find('g[data-code="7204"]').attributes('aria-label')).toBe('Poso: tidak tersedia')
    expect(wrapper.find('td[data-code="7204"]').text()).toBe('tidak tersedia')
    expect(wrapper.findAll('[data-mark-for]')).toHaveLength(12)
    expect(wrapper.find('tbody tr:last-child').text()).toContain('Poso') // missing values sort last
  })

  it('selected: aria-current, an indigo outline on top, and in the table; no band pattern by default', async () => {
    const { wrapper } = await kab({ selected: '7204' })
    expect(wrapper.find('g[data-code="7204"]').attributes('aria-current')).toBe('true')
    expect(wrapper.find('g[data-code="7203"]').attributes('aria-current')).toBeUndefined()
    expect(wrapper.find('[data-selected]').exists()).toBe(true)
    expect(wrapper.find('[data-selected]').attributes('style')).toContain('--pico-indigo')
    expect(wrapper.find('tr[class*="border-indigo"]').text()).toContain('Poso')
    expect(wrapper.find('tr[class*="border-indigo"]').text()).toContain('dipilih')
    expect(wrapper.find('[data-band]').exists()).toBe(false)
  })

  it('table buttons select too, and hrefFor turns the names into links', async () => {
    const { wrapper } = await kab()
    await wrapper.find('tbody button').trigger('click')
    expect(wrapper.findComponent(KabupatenMap).emitted('select')).toHaveLength(1)
    const linked = await kab({ hrefFor: (c: string) => `/data/kabupaten/${c}` })
    expect(linked.wrapper.findAll('tbody a')[0]!.attributes('href')).toMatch(/^\/data\/kabupaten\/\d+/)
    expect(linked.wrapper.find('tbody button').exists()).toBe(false)
  })

  it('English', async () => {
    const { wrapper } = await kab({}, '/en/')
    expect(wrapper.find('g[data-code="7204"]').attributes('aria-label')).toBe('Poso: 4,000')
    expect(wrapper.find('[data-testid="map-legend"]').text()).toContain(' to ')
  })

  it('draws the areas before it knows its width but no marks (SSR safe)', async () => {
    w = 0
    const { wrapper } = await kab()
    expect(areas(wrapper)).toHaveLength(13)
    expect(wrapper.find('[data-marks]').exists()).toBe(false)
  })
})

describe('ProvinceMap', () => {
  it('has 34 links with marks and numbers on a wide screen', async () => {
    const { wrapper } = await mountApp(ProvinceMap, { items: provItems, metric }, '/')
    await flush()
    expect(wrapper.findAll('g[role="link"]')).toHaveLength(34)
    expect(wrapper.findAll('[data-mark-for]')).toHaveLength(34)
    expect(wrapper.findAll('tbody tr')).toHaveLength(34)
  })
  it('on a narrow screen the marks give way to the table (it still has every number)', async () => {
    w = 340
    const { wrapper } = await mountApp(ProvinceMap, { items: provItems, metric }, '/')
    await flush()
    expect(wrapper.find('[data-marks]').exists()).toBe(false)
    expect(wrapper.findAll('g[role="link"]')).toHaveLength(34)
    expect(wrapper.find('td[data-code="72"]').text()).toMatch(/^\d/)
  })
  it('select fires with the province code', async () => {
    const { wrapper } = await mountApp(ProvinceMap, { items: provItems, metric, selected: '72' }, '/')
    await flush()
    await wrapper.find('g[data-code="31"]').trigger('keydown', { key: 'Enter' })
    expect(wrapper.findComponent(ProvinceMap).emitted('select')![0]).toEqual(['31'])
    expect(wrapper.find('g[data-code="72"]').attributes('aria-current')).toBe('true')
  })
})
