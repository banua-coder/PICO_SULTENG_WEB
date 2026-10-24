import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flush, mountApp } from '../../../test/support/mount'
import { dayNumber, isoFromDay } from './core/days'
import RtChart from './RtChart.vue'
import TimeSeriesChart from './TimeSeriesChart.vue'
import type { BandPoint, LineSeries } from './types'

const END = '2023-07-09'
const dates = (n: number) => Array.from({ length: n }, (_, i) => isoFromDay(dayNumber(END) - (n - 1 - i)))
const series: LineSeries[] = [{ id: 'p', role: 'positive', label: 'Positif', points: dates(200).map((x, i) => ({ x, y: i })) }]
const band: BandPoint[] = dates(200).map((x, i) => (i % 50 === 49 ? { x, y: null, lo: null, hi: null } : { x, y: i === 3 ? 9 : 1, lo: 0.8, hi: i === 3 ? 12 : 1.3 }))
const a11y = { title: 'Grafik', summary: 'Ringkasan.' }

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: 640, height: 280, top: 0, left: 0, right: 640, bottom: 280, x: 0, y: 0, toJSON: () => ({}) }))
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const dateCount = (w: { findAll: (s: string) => unknown[] }) => w.findAll('svg [data-line]').length
describe('zoom on TimeSeriesChart', () => {
  it('starts unzoomed with the reset button disabled, buttons zoom in and reset', async () => {
    const { wrapper } = await mountApp(TimeSeriesChart, { series, kind: 'line', a11y }, '/')
    await flush()
    expect(dateCount(wrapper)).toBe(1)
    const reset = wrapper.get('[data-testid="zoom-reset"]')
    expect(reset.attributes('disabled')).toBeDefined()
    await wrapper.get('button[aria-label="Perbesar"]').trigger('click')
    await flush()
    expect(reset.attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-testid="zoom-status"]').text()).toMatch(/^Menampilkan .+ sampai .+/)
    await reset.trigger('click')
    await flush()
    expect(wrapper.get('[data-testid="zoom-status"]').text()).toMatch(/^Seret pada grafik/)
  })

  it('keys: + zooms in, - out, 0 resets, Shift+arrow pans, arrows still move the crosshair', async () => {
    const { wrapper } = await mountApp(TimeSeriesChart, { series, kind: 'line', a11y }, '/')
    await flush()
    const plot = wrapper.get('[role="group"][tabindex="0"]')
    await plot.trigger('keydown', { key: '+' })
    const first = wrapper.get('[data-testid="zoom-status"]').text()
    expect(first).toMatch(/^Menampilkan/)
    await plot.trigger('keydown', { key: '+' })
    const second = wrapper.get('[data-testid="zoom-status"]').text()
    expect(second).not.toBe(first)
    await plot.trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
    expect(wrapper.get('[data-testid="zoom-status"]').text()).not.toBe(second)
    await plot.trigger('keydown', { key: '-' })
    await plot.trigger('keydown', { key: '0' })
    expect(wrapper.get('[data-testid="zoom-status"]').text()).toMatch(/^Seret/)
    await plot.trigger('focus')
    await plot.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.find('[data-crosshair]').exists()).toBe(true)
  })

  it('a new range from the page resets the zoom, and the table says it shows the zoomed range', async () => {
    const { wrapper } = await mountApp(TimeSeriesChart, { series, kind: 'line', a11y, range: [dates(200)[0], END] }, '/')
    await flush()
    await wrapper.get('button[aria-label="Perbesar"]').trigger('click')
    await wrapper.findAll('button').find((b) => b.text().includes('tabel'))!.trigger('click')
    await flush()
    expect(wrapper.find('[data-testid="table-zoom-note"]').exists()).toBe(true)
    await wrapper.setProps({ range: [dates(100)[0], END] } as never)
    await flush()
    expect(wrapper.find('[data-testid="table-zoom-note"]').exists()).toBe(false)
  })
})

describe('RtChart bounds and scale', () => {
  it('draws both bounds, lists the clipped value, and Skala penuh removes the clipping', async () => {
    const { wrapper } = await mountApp(RtChart, { points: band, a11y }, '/')
    await flush()
    expect(wrapper.find('[data-rt-upper]').exists()).toBe(true)
    expect(wrapper.find('[data-rt-lower]').attributes('stroke-dasharray')).toBeDefined()
    expect(wrapper.find('[data-testid="rt-legend"]').text()).toContain('Batas atas (95 %)')
    expect(wrapper.find('[data-testid="rt-legend"]').text()).toContain('Batas bawah (95 %)')
    expect(wrapper.find('[data-testid="rt-clipped"]').text()).toContain('9,00')
    expect(wrapper.find('[data-testid="rt-key"]').text()).toContain('Sumbu dipotong di 4')
    await wrapper.findAll('button').find((b) => b.text() === 'Skala penuh')!.trigger('click')
    await flush()
    expect(wrapper.find('[data-testid="rt-clipped"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="rt-key"]').text()).toContain('Skala penuh')
  })

  it('the tooltip names the three values', async () => {
    const { wrapper } = await mountApp(RtChart, { points: band, a11y }, '/')
    await flush()
    const plot = wrapper.get('[role="group"][tabindex="0"]')
    await plot.trigger('focus')
    await plot.trigger('keydown', { key: 'ArrowLeft' })
    const tip = wrapper.get('[data-tooltip]').text()
    expect(tip).toContain('Batas atas (95 %)')
    expect(tip).toContain('Batas bawah (95 %)')
  })
})
