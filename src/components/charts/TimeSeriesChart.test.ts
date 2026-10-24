import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flush, mountApp } from '../../../test/support/mount'
import { dayNumber, isoFromDay } from './core/days'
import TimeSeriesChart from './TimeSeriesChart.vue'
import type { LineSeries } from './types'

const END = '2024-01-14'
const dates = (n: number) => Array.from({ length: n }, (_, i) => isoFromDay(dayNumber(END) - (n - 1 - i)))
const mk = (id: string, role: LineSeries['role'], label: string, f: (i: number) => number | null, n = 120): LineSeries => ({
  id,
  role,
  label,
  points: dates(n).map((x, i) => ({ x, y: f(i) })),
})
const four = (): LineSeries[] => [
  mk('p', 'positive', 'Positif', (i) => i * 3),
  mk('r', 'recovered', 'Sembuh', (i) => i * 2),
  mk('d', 'deceased', 'Meninggal', (i) => i),
  mk('a', 'active', 'Dirawat', (i) => i * 4),
]
const a11y = { title: 'Kasus harian Sulawesi Tengah', summary: 'Kasus naik lalu turun.' }

let rectWidth = 640
beforeEach(() => {
  rectWidth = 640
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return { width: rectWidth, height: 280, top: 0, left: 0, right: rectWidth, bottom: 280, x: 0, y: 0, toJSON: () => ({}) }
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

async function chart(props: Record<string, unknown> = {}, path = '/') {
  const out = await mountApp(TimeSeriesChart, { series: four(), kind: 'line', a11y, ...props }, path)
  await flush()
  return out
}
const live = (w: Awaited<ReturnType<typeof chart>>['wrapper']) => w.find('[data-testid="chart-live"]').text()
const press = async (w: Awaited<ReturnType<typeof chart>>['wrapper'], key: string) => {
  await w.find('[role="group"]').trigger('keydown', { key })
  await flush()
}

describe('TimeSeriesChart: structure and roles', () => {
  it('is a figure with a figcaption (title) and an img SVG labelled with the summary', async () => {
    const { wrapper } = await chart()
    expect(wrapper.find('figure figcaption').text()).toBe(a11y.title)
    const svg = wrapper.find('svg[role="img"]')
    expect(svg.attributes('aria-label')).toBe(a11y.summary)
  })

  it('reserves its height before it knows its width (no layout shift) and draws nothing at width 0', async () => {
    rectWidth = 0
    const { wrapper } = await chart({ height: 300 })
    expect(wrapper.find('[data-kind]').attributes('style')).toContain('height: 300px')
    expect(wrapper.find('svg[role="img"]').exists()).toBe(false)
  })

  it('each role draws its own line form, its mark and its name at the line end', async () => {
    const { wrapper } = await chart()
    const forms = new Set<string>()
    for (const [id, role, label, dash, paths] of [
      ['p', 'positive', 'Positif', 'var(--pico-positive-dash)', 1],
      ['r', 'recovered', 'Sembuh', 'var(--pico-recovered-dash)', 1],
      ['d', 'deceased', 'Meninggal', '', 2],
      ['a', 'active', 'Dirawat', 'var(--pico-active-dash)', 1],
    ] as const) {
      const line = wrapper.find(`g[data-series="${id}"]`)
      expect(line.attributes('data-role')).toBe(role)
      const drawn = line.findAll('[data-line]')
      expect(drawn).toHaveLength(paths) // deceased is doubled
      const style = drawn[0]!.attributes('style') ?? ''
      if (dash) expect(style).toContain(`stroke-dasharray: ${dash}`)
      forms.add(`${paths}|${dash}`)
      const end = wrapper.find(`g[data-end-label="${id}"]`)
      expect(end.find(`[data-mark="${role}"]`).exists()).toBe(true)
      expect(end.find('text').text()).toBe(label)
    }
    expect(forms.size).toBe(4) // four different line forms: colour alone never separates two series
  })

  it('marks differ in shape per role (square, diamond, two bars, triangle)', async () => {
    const { wrapper } = await chart()
    const shape = (role: string) => wrapper.find(`g[data-end-label] [data-mark="${role}"]`).html().replace(/ style="[^"]*"/g, '').replace(/transform="[^"]*"/, '')
    const shapes = ['positive', 'recovered', 'deceased', 'active'].map(shape)
    expect(new Set(shapes).size).toBe(4)
  })

  it('a series whose points are all null draws no line and no end label, and nothing breaks', async () => {
    const { wrapper } = await chart({ series: [mk('p', 'positive', 'Positif', () => null)] })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('g[data-end-label]').exists()).toBe(false)
  })

  it('no series data at all shows a plain message', async () => {
    const { wrapper } = await chart({ series: [mk('p', 'positive', 'Positif', () => 1, 0)] })
    expect(wrapper.text()).toContain('Tidak ada data pada rentang ini')
  })

  it('draws no animation', async () => {
    const { wrapper } = await chart()
    expect(wrapper.find('svg[role="img"]').html()).not.toMatch(/<animate|<set |animation|transition/)
  })
})

describe('TimeSeriesChart: bars', () => {
  it('bars are filled with the role weave pattern', async () => {
    const { wrapper } = await chart({ kind: 'bar', series: [mk('p', 'positive', 'Positif', (i) => i + 1, 30)] })
    const bars = wrapper.findAll('rect[data-bar]')
    expect(bars.length).toBeGreaterThan(0)
    expect(bars[0]!.attributes('fill')).toBe('var(--pico-positive)')
  })
  it('narrow charts switch to weekly bars', async () => {
    rectWidth = 340
    const { wrapper } = await chart({ kind: 'bar', series: [mk('p', 'positive', 'Positif', () => 1, 28)] })
    expect(wrapper.findAll('rect[data-bar]')).toHaveLength(4)
  })
})

describe('TimeSeriesChart: keyboard', () => {
  it('the plot is one Tab stop with a description of the keys', async () => {
    const { wrapper } = await chart()
    const g = wrapper.find('[role="group"]')
    expect(g.attributes('tabindex')).toBe('0')
    expect(wrapper.find(`#${g.attributes('aria-describedby')}`).text()).toContain('panah')
  })

  it('focusing starts at the latest date and the live region reads date and every value', async () => {
    const { wrapper } = await chart({ series: [mk('p', 'positive', 'Positif', () => 0), mk('r', 'recovered', 'Sembuh', () => 0)] })
    await wrapper.find('[role="group"]').trigger('focus')
    await flush()
    expect(live(wrapper)).toBe('14 Januari 2024: positif 0, sembuh 0')
  })

  it('arrows move one day, PageUp and PageDown 30, Home and End the ends', async () => {
    const { wrapper } = await chart({ series: [mk('p', 'positive', 'Positif', (i) => i, 120)] })
    await wrapper.find('[role="group"]').trigger('focus')
    await flush()
    expect(live(wrapper)).toBe('14 Januari 2024: positif 119')
    await press(wrapper, 'ArrowLeft')
    expect(live(wrapper)).toBe('13 Januari 2024: positif 118')
    await press(wrapper, 'ArrowRight')
    expect(live(wrapper)).toBe('14 Januari 2024: positif 119')
    await press(wrapper, 'PageUp')
    expect(live(wrapper)).toBe('15 Desember 2023: positif 89')
    await press(wrapper, 'PageDown')
    expect(live(wrapper)).toBe('14 Januari 2024: positif 119')
    await press(wrapper, 'Home')
    expect(live(wrapper)).toBe(`${(await import('@/app/format')).createFormatter('id', { notAvailable: '', rangeJoin: '' }).date(dates(120)[0]!)}: positif 0`)
    await press(wrapper, 'End')
    expect(live(wrapper)).toBe('14 Januari 2024: positif 119')
  })

  it('English reads in English', async () => {
    const { wrapper } = await chart({ series: [mk('p', 'positive', 'Positive', () => 1234)] }, '/en/data')
    await wrapper.find('[role="group"]').trigger('focus')
    await flush()
    expect(live(wrapper)).toBe('14 January 2024: positive 1,234')
  })

  it('a null value is read as not available, never 0', async () => {
    const { wrapper } = await chart({ series: [mk('p', 'positive', 'Positif', () => null, 5), mk('r', 'recovered', 'Sembuh', () => 2, 5)] })
    await wrapper.find('[role="group"]').trigger('focus')
    await flush()
    expect(live(wrapper)).toBe('14 Januari 2024: positif tidak tersedia, sembuh 2')
  })

  it('shows a crosshair with a mark for each series with a value, and emits focus-date', async () => {
    const { wrapper } = await chart()
    await wrapper.find('[role="group"]').trigger('focus')
    await flush()
    expect(wrapper.find('[data-crosshair]').exists()).toBe(true)
    expect(wrapper.findAll('[data-crosshair] [data-mark]')).toHaveLength(4)
    expect(wrapper.find('[data-tooltip]').text()).toContain('14 Januari 2024')
    const emitted = wrapper.findComponent(TimeSeriesChart).emitted('focus-date')!
    expect(emitted.at(-1)).toEqual([END])
    await wrapper.find('[role="group"]').trigger('blur')
    await flush()
    expect(wrapper.find('[data-crosshair]').exists()).toBe(false)
    expect(wrapper.findComponent(TimeSeriesChart).emitted('focus-date')!.at(-1)).toEqual([null])
  })

  it('Escape clears the focus point', async () => {
    const { wrapper } = await chart()
    await wrapper.find('[role="group"]').trigger('focus')
    await press(wrapper, 'Escape')
    expect(wrapper.find('[data-crosshair]').exists()).toBe(false)
  })
})

describe('TimeSeriesChart: table view', () => {
  it('"Lihat sebagai tabel" swaps the plot for a table with the same values as the series', async () => {
    const series = four()
    const { wrapper } = await chart({ series })
    const btn = wrapper.find('button')
    expect(btn.text()).toBe('Lihat sebagai tabel')
    await btn.trigger('click')
    expect(wrapper.find('svg[role="img"]').exists()).toBe(false)
    expect(btn.text()).toBe('Lihat sebagai grafik')
    const cells = wrapper.findAll('td[data-series]')
    expect(cells).toHaveLength(120 * 4)
    const fmt = (n: number) => n.toLocaleString('id-ID')
    for (const s of series)
      for (const p of s.points) {
        const cell = wrapper.find(`td[data-series="${s.id}"][data-date="${p.x}"]`)
        expect(cell.text()).toBe(fmt(p.y as number))
      }
  })

  it('the table marks missing values as tidak tersedia and has real headers', async () => {
    const { wrapper } = await chart({ series: [mk('p', 'positive', 'Positif', (i) => (i === 2 ? null : i), 5)] })
    await wrapper.find('button').trigger('click')
    expect(wrapper.findAll('td').filter((c) => c.text() === 'tidak tersedia')).toHaveLength(1)
    expect(wrapper.findAll('th[scope="col"]').map((h) => h.text())).toEqual(['Tanggal', 'Positif'])
    expect(wrapper.findAll('th[scope="row"]')).toHaveLength(5)
    expect(wrapper.find('[role="region"]').attributes('tabindex')).toBe('0')
  })

  it('table and plot agree on the values of a focused date', async () => {
    const series = four()
    const { wrapper } = await chart({ series })
    await wrapper.find('[role="group"]').trigger('focus')
    await press(wrapper, 'ArrowLeft')
    const text = live(wrapper)
    const date = dates(120).at(-2)!
    await wrapper.find('button').trigger('click')
    for (const s of series) {
      const v = s.points.find((p) => p.x === date)!.y
      expect(text).toContain(`${s.label.toLowerCase()} ${(v as number).toLocaleString('id-ID')}`)
      expect(wrapper.find(`td[data-series="${s.id}"][data-date="${date}"]`).text()).toBe((v as number).toLocaleString('id-ID'))
    }
  })

  it('range limits both plot and table', async () => {
    const { wrapper } = await chart({ range: ['2024-01-10', '2024-01-14'] })
    await wrapper.find('button').trigger('click')
    expect(wrapper.findAll('th[scope="row"]')).toHaveLength(5)
  })
})
