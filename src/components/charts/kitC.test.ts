import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flush, mountApp } from '../../../test/support/mount'
import { dayNumber, isoFromDay } from './core/days'
import ProgressBar from './ProgressBar.vue'
import RtChart from './RtChart.vue'
import BarList from './BarList.vue'
import type { BandPoint } from './types'

let w = 640
beforeEach(() => {
  w = 640
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: w, height: 280, top: 0, left: 0, right: w, bottom: 280, x: 0, y: 0, toJSON: () => ({}) }))
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const END = '2023-07-09'
const day = (n: number, end = END) => isoFromDay(dayNumber(end) - n)
const rt = (vals: (number | null)[]): BandPoint[] =>
  vals.map((v, i) => {
    const x = day(vals.length - 1 - i)
    return v === null ? { x, y: null, lo: null, hi: null } : { x, y: v, lo: v - 0.14, hi: v + 0.15 }
  })
const a11y = { title: 'Angka reproduksi Sulawesi Tengah', summary: 'Rt turun di bawah 1 lalu tidak dihitung.' }
async function chart(points: BandPoint[], path = '/', props: Record<string, unknown> = {}) {
  const out = await mountApp(RtChart, { points, a11y, ...props }, path)
  await flush()
  return out
}

describe('RtChart', () => {
  it('figure with caption and an img SVG labelled by the summary', async () => {
    const { wrapper } = await chart(rt([1.2, 1.1, 0.95]))
    expect(wrapper.find('figcaption').text()).toBe(a11y.title)
    expect(wrapper.find('svg[role="img"]').attributes('aria-label')).toBe(a11y.summary)
  })

  it('draws a solid thread, a gray 95 % band, and a dashed Rt = 1 line with a text label', async () => {
    const { wrapper } = await chart(rt([1.2, 1.1, 0.95, 0.9]))
    expect(wrapper.find('[data-rt-band]').attributes('fill')).toBe('var(--pico-rt)')
    const thread = wrapper.find('[data-line]')
    expect(thread.attributes('style')).not.toContain('dasharray') // solid
    const th = wrapper.find('[data-threshold]')
    expect(th.find('line').attributes('stroke-dasharray')).toBe('6 4')
    expect(th.find('text').text()).toBe('Rt = 1') // a label, not only a dash
  })

  it('labels the thread end with the ring mark and its name, and explains the encoding in text', async () => {
    const { wrapper } = await chart(rt([1.2, 1.1]))
    expect(wrapper.find('[data-end-label] [data-mark="rt"]').exists()).toBe(true)
    expect(wrapper.find('[data-end-label] text').text()).toBe('Rt')
    expect(wrapper.find('[data-testid="rt-key"]').text()).toContain('batas atas dan batas bawah')
    expect(wrapper.find('[data-testid="rt-key"]').text()).toContain('Rt = 1')
  })

  it('gaps: a null run splits the thread, and no Rt at all shows the message and no empty axes', async () => {
    const gap = await chart(rt([1.2, 1.1, null, null, 0.9, 0.8]))
    expect(((gap.wrapper.find('[data-line]').attributes('d') ?? '').match(/M/g) ?? []).length).toBe(2)
    const none = await chart(rt([null, null, null]))
    expect(none.wrapper.find('[data-testid="rt-empty"]').text()).toBe('Rt tidak tersedia untuk rentang ini')
    expect(none.wrapper.find('svg[role="img"]').exists()).toBe(false)
    expect(none.wrapper.find('[data-testid="rt-key"]').exists()).toBe(false)
  })

  it('a value above 4 shows a clipped marker with its number once the scale is cut (the default is the full scale)', async () => {
    const { wrapper } = await chart(rt([1.1, 5.25, 1.0]))
    expect(wrapper.find('[data-clipped]').exists()).toBe(false)
    await wrapper.find('[data-testid="rt-scale"]').trigger('click')
    const c = wrapper.find('[data-clipped]')
    expect(c.exists()).toBe(true)
    expect(c.find('[data-mark="rt"]').exists()).toBe(true)
    expect(c.find('text').text()).toBe('5,25')
  })

  it('keyboard: one Tab stop, the live region reads the value and its range, and Home/End/arrows move', async () => {
    const pts = rt([1.5, 1.2, 0.95])
    const { wrapper } = await chart(pts)
    const g = wrapper.find('[role="group"]')
    expect(g.attributes('tabindex')).toBe('0')
    await g.trigger('focus')
    await flush()
    const live = () => wrapper.find('[data-testid="chart-live"]').text()
    expect(live()).toBe('9 Juli 2023: Rt 0,95, rentang 0,81 sampai 1,10')
    await g.trigger('keydown', { key: 'ArrowLeft' })
    await flush()
    expect(live()).toBe('8 Juli 2023: Rt 1,20, rentang 1,06 sampai 1,35')
    await g.trigger('keydown', { key: 'Home' })
    await flush()
    expect(live()).toContain('7 Juli 2023: Rt 1,50')
    expect(wrapper.find('[data-crosshair] [data-mark="rt"]').exists()).toBe(true)
    expect(wrapper.find('[data-tooltip]').text()).toContain('Rt 1,50')
  })

  it('a day with no Rt is read as not available, never 0', async () => {
    const { wrapper } = await chart(rt([1.2, null]))
    await wrapper.find('[role="group"]').trigger('focus')
    await flush()
    expect(wrapper.find('[data-testid="chart-live"]').text()).toBe('9 Juli 2023: Rt tidak tersedia')
  })

  it('English', async () => {
    const { wrapper } = await chart(rt([1.2]), '/en/')
    await wrapper.find('[role="group"]').trigger('focus')
    await flush()
    expect(wrapper.find('[data-testid="chart-live"]').text()).toBe('9 July 2023: Rt 1.20, range 1.06 to 1.35')
  })

  it('table view has Rt, lower and upper for every day, equal to the points, and "tidak tersedia" for gaps', async () => {
    const pts = rt([1.2, null, 0.95])
    const { wrapper } = await chart(pts)
    await wrapper.find('button').trigger('click')
    expect(wrapper.findAll('th[scope="col"]').map((h) => h.text())).toEqual(['Tanggal', 'Rt', 'Batas bawah', 'Batas atas'])
    expect(wrapper.find(`td[data-series="rt"][data-date="${pts[0]!.x}"]`).text()).toBe('1,20')
    expect(wrapper.find(`td[data-series="lo"][data-date="${pts[2]!.x}"]`).text()).toBe('0,81')
    expect(wrapper.find(`td[data-series="rt"][data-date="${pts[1]!.x}"]`).text()).toBe('tidak tersedia')
  })

  it('draws no animation', async () => {
    const { wrapper } = await chart(rt([1.2, 1.1]))
    expect(wrapper.find('svg[role="img"]').html()).not.toMatch(/<animate|animation|transition/)
  })
})

describe('BarList', () => {
  const items = [
    { key: 'm', label: 'Laki-laki', value: 10199, role: 'positive' as const },
    { key: 'f', label: 'Perempuan', value: 12585, role: 'recovered' as const },
    { key: 'x', label: 'Tidak diketahui', value: null, role: 'deceased' as const },
  ]
  const bars = async (props: Record<string, unknown> = {}, path = '/') => {
    const out = await mountApp(BarList, { items, orientation: 'horizontal', a11y: { title: 'Jenis kelamin', summary: 'Perempuan lebih banyak.' }, ...props }, path)
    await flush()
    return out
  }

  it('each bar is filled with its role weave, longer for bigger values, with its number on plain ground', async () => {
    const { wrapper } = await bars()
    const m = wrapper.find('[data-bar-key="m"]')
    const f = wrapper.find('[data-bar-key="f"]')
    expect(m.find('[data-bar]').attributes('fill')).toBe('var(--pico-positive)')
    expect(f.find('[data-bar]').attributes('fill')).toBe('var(--pico-recovered)')
    expect(parseFloat(f.find('[data-bar]').attributes('width')!)).toBeGreaterThan(parseFloat(m.find('[data-bar]').attributes('width')!))
    expect(m.find('[data-value]').text()).toBe('10.199')
    const barEnd = parseFloat(m.find('[data-bar]').attributes('x')!) + parseFloat(m.find('[data-bar]').attributes('width')!)
    expect(parseFloat(m.find('[data-value]').attributes('x')!)).toBeGreaterThan(barEnd) // the number is outside the weave
  })

  it('null shows "tidak tersedia" in place of a bar', async () => {
    const { wrapper } = await bars()
    const x = wrapper.find('[data-bar-key="x"]')
    expect(x.find('[data-bar]').exists()).toBe(false)
    expect(x.find('[data-value]').text()).toBe('tidak tersedia')
  })

  it('vertical bars with wrapped labels, and English numbers', async () => {
    const v = await bars({ orientation: 'vertical' }, '/en/')
    expect(v.wrapper.find('[data-orientation="vertical"]').exists()).toBe(true)
    expect(v.wrapper.find('[data-bar-key="m"] [data-value]').text()).toBe('10,199')
    expect(v.wrapper.find('[data-bar-key="x"] [data-value]').text()).toBe('not available')
  })

  it('reserves its height before it knows its width', async () => {
    w = 0
    const { wrapper } = await bars()
    expect(wrapper.find('[data-orientation]').attributes('style')).toMatch(/height: \d+px/)
    expect(wrapper.find('svg[role="img"]').exists()).toBe(false)
  })

  it('the table view has the same numbers', async () => {
    const { wrapper } = await bars()
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('td[data-key="m"]').text()).toBe('10.199')
    expect(wrapper.find('td[data-key="f"]').text()).toBe('12.585')
    expect(wrapper.find('td[data-key="x"]').text()).toBe('tidak tersedia')
    expect(wrapper.findAll('th[scope="row"]')).toHaveLength(3)
  })

  it('the figure is named and the SVG is an img with the summary', async () => {
    const { wrapper } = await bars()
    expect(wrapper.find('figcaption').text()).toBe('Jenis kelamin')
    expect(wrapper.find('svg').attributes('aria-label')).toBe('Perempuan lebih banyak.')
  })
})

describe('ProgressBar', () => {
  const prog = async (props: Record<string, unknown>, path = '/') => (await mountApp(ProgressBar, { label: 'Dosis 1', role: 'positive', ...props }, path)).wrapper

  it('shows the percentage and "x dari y" as text, and a woven fill of that width', async () => {
    const wr = await prog({ value: 85441, target: 2240548 })
    expect(wr.find('[data-testid="progress-text"]').text()).toBe('3,8% · 85.441 dari 2.240.548')
    expect(wr.find('[data-fill]').attributes('width')).toMatch(/^3\.8\d*%$/)
    expect(wr.find('[data-fill]').attributes('fill')).toBe('var(--pico-positive)')
  })

  it('is a progressbar with a full-sentence value text', async () => {
    const wr = await prog({ value: 50, target: 200 })
    const bar = wr.find('[role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('25')
    expect(bar.attributes('aria-valuetext')).toBe('Dosis 1: 25,0 persen, 50 dari 200')
  })

  it('over 100 percent: a full bar and "melebihi target"', async () => {
    const wr = await prog({ value: 24885, target: 24698 })
    expect(wr.find('[data-fill]').attributes('width')).toBe('100%')
    expect(wr.find('[data-testid="progress-text"]').text()).toContain('melebihi target')
    expect(wr.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('100')
    expect(wr.find('[role="progressbar"]').attributes('aria-valuetext')).toContain('melebihi target')
  })

  it('no target, or no value: "tidak tersedia", no bar at all (not 0 %, not an empty track)', async () => {
    for (const props of [{ value: 5, target: 0 }, { value: null, target: 100 }, { value: null, target: 0 }]) {
      const wr = await prog(props)
      expect(wr.find('[data-testid="progress-text"]').text()).toBe('tidak tersedia')
      expect(wr.find('[data-fill]').exists()).toBe(false)
      expect(wr.find('[role="progressbar"]').exists()).toBe(false)
      expect(wr.text()).not.toContain('0,0%')
    }
    expect((await prog({ value: null, target: 100 }, '/en/')).find('[data-testid="progress-text"]').text()).toBe('not available')
  })

  it('a real zero is 0 %, with a bar', async () => {
    const wr = await prog({ value: 0, target: 100 })
    expect(wr.find('[data-testid="progress-text"]').text()).toContain('0,0%')
    expect(wr.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
  })

  it('English and the role weave follow the prop', async () => {
    const wr = await prog({ value: 1, target: 4, role: 'recovered' }, '/en/')
    expect(wr.find('[data-testid="progress-text"]').text()).toBe('25.0% · 1 of 4')
    expect(wr.find('[data-fill]').attributes('fill')).toBe('var(--pico-recovered)')
  })
})
