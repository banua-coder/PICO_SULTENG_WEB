import { describe, expect, it } from 'vitest'
import type { LineSeries, Point } from '../types'
import { dayNumber, isoFromDay } from './days'
import { buildModel } from './model'
import { moveFocus } from './keys'

const pts = (ys: (number | null)[], start = '2021-01-01'): Point[] => ys.map((y, i) => ({ x: isoFromDay(dayNumber(start) + i), y }))
const s = (id: string, role: LineSeries['role'], ys: (number | null)[], start?: string): LineSeries => ({ id, role, label: id, points: pts(ys, start) })
const base = { kind: 'line' as const, width: 640, height: 280 }

describe('buildModel: line mode', () => {
  it('draws one connected path for a series with no gaps', () => {
    const m = buildModel({ ...base, series: [s('a', 'positive', [1, 2, 3, 4])] })
    expect((m.series[0]!.path.match(/M/g) ?? []).length).toBe(1)
  })

  it('a null value breaks the line into separate sub-paths (never drawn as 0)', () => {
    const m = buildModel({ ...base, series: [s('a', 'positive', [1, 2, null, 4, 5])] })
    expect((m.series[0]!.path.match(/M/g) ?? []).length).toBe(2)
    const m2 = buildModel({ ...base, series: [s('a', 'positive', [1, null, null, 5])] })
    expect(m2.series[0]!.path).not.toContain('L' + m2.y(0).toFixed(0)) // no segment to the zero line
  })

  it('an all-null series draws nothing, has no end label, and the domain stays usable', () => {
    const m = buildModel({ ...base, series: [s('a', 'positive', [null, null, null])] })
    expect(m.series[0]!.path).toBe('')
    expect(m.series[0]!.end).toBeNull()
    expect(m.domain).toEqual([0, 1])
  })

  it('no series and no points do not throw', () => {
    expect(() => buildModel({ ...base, series: [] })).not.toThrow()
    expect(buildModel({ ...base, series: [s('a', 'rt', [])] }).dates).toEqual([])
  })

  it('range limits points, dates and the y domain', () => {
    const series = [s('a', 'positive', [1, 1, 1, 900, 1, 1])]
    const all = buildModel({ ...base, series })
    const part = buildModel({ ...base, series, range: ['2021-01-05', '2021-01-06'] })
    expect(part.dates).toEqual(['2021-01-05', '2021-01-06'])
    expect(part.domain[1]).toBeLessThan(all.domain[1])
  })

  it('x grows to the right and y grows upward in value', () => {
    const m = buildModel({ ...base, series: [s('a', 'positive', [0, 10, 20])] })
    expect(m.x('2021-01-03')).toBeGreaterThan(m.x('2021-01-01'))
    expect(m.y(20)).toBeLessThan(m.y(0))
    expect(m.x('2021-01-03')).toBeCloseTo(m.plotW)
  })

  it('end labels of close lines never overlap', () => {
    const m = buildModel({ ...base, series: [s('a', 'positive', [10, 10]), s('b', 'recovered', [10, 11]), s('c', 'deceased', [10, 10.5]), s('d', 'active', [10, 9.5])] })
    const ys = m.series.map((x) => x.end!.labelY).sort((a, b) => a - b)
    for (let i = 1; i < ys.length; i++) expect(ys[i]! - ys[i - 1]!).toBeGreaterThanOrEqual(14 - 1e-9)
  })

  it('1,414 x 4 points keep the path short (downsampled to the plot width)', () => {
    const big = (role: LineSeries['role'], k: number) => s(role, role, Array.from({ length: 1414 }, (_, i) => (i * k) % 997))
    const m = buildModel({ ...base, series: [big('positive', 3), big('recovered', 5), big('deceased', 7), big('active', 11)] })
    for (const sm of m.series) expect((sm.path.match(/[ML]/g) ?? []).length).toBeLessThanOrEqual(Math.round(m.plotW))
    expect(m.visible[0]).toHaveLength(1414) // the table keeps every value
  })

  it('the global maximum stays inside the plot after downsampling', () => {
    const ys = Array.from({ length: 1414 }, (_, i) => (i === 900 ? 5000 : 3))
    const m = buildModel({ ...base, series: [s('a', 'positive', ys)] })
    const peakY = m.y(5000)
    expect(peakY).toBeGreaterThanOrEqual(-0.001)
    expect(m.series[0]!.path).toContain(peakY.toFixed(1).replace(/\.0$/, ''))
  })

  it('valuesAt returns every series on a date, null where there is none', () => {
    const m = buildModel({ ...base, series: [s('a', 'positive', [1, 2]), s('b', 'recovered', [null, 7])] })
    expect(m.valuesAt('2021-01-02').map((v) => v.value)).toEqual([2, 7])
    expect(m.valuesAt('2021-01-01').map((v) => v.value)).toEqual([1, null])
  })
})

describe('buildModel: bar mode', () => {
  const daily = Array.from({ length: 30 }, (_, i) => i + 1)

  it('draws one bar per day with a value, none for null or zero', () => {
    const m = buildModel({ kind: 'bar', width: 640, height: 280, series: [s('a', 'positive', [3, null, 0, 5])] })
    expect(m.series[0]!.bars.map((b) => b.value)).toEqual([3, 5])
    expect(m.weekly).toBe(false)
  })

  it('bars stand on the zero line and grow with value', () => {
    const m = buildModel({ kind: 'bar', width: 640, height: 280, series: [s('a', 'positive', [1, 10])] })
    const [b1, b2] = m.series[0]!.bars
    expect(b2!.h).toBeGreaterThan(b1!.h)
    expect(b1!.y + b1!.h).toBeCloseTo(m.y(0))
  })

  it('under 360 px wide the bars become weekly sums', () => {
    const narrow = buildModel({ kind: 'bar', width: 340, height: 280, series: [s('a', 'positive', daily)] })
    expect(narrow.weekly).toBe(true)
    expect(narrow.series[0]!.bars.map((b) => b.value)).toEqual([28, 77, 126, 175, 59])
    const wide = buildModel({ kind: 'bar', width: 640, height: 280, series: [s('a', 'positive', daily)] })
    expect(wide.weekly).toBe(false)
  })

  it('also weekly when daily bars would be thinner than 1.5 px', () => {
    const many = Array.from({ length: 1414 }, () => 1)
    expect(buildModel({ kind: 'bar', width: 640, height: 280, series: [s('a', 'positive', many)] }).weekly).toBe(true)
  })

  it('weekly sums keep the total', () => {
    const m = buildModel({ kind: 'bar', width: 340, height: 280, series: [s('a', 'positive', daily)] })
    expect(m.series[0]!.bars.reduce((t, b) => t + b.value, 0)).toBe(daily.reduce((t, n) => t + n, 0))
  })

  it('several series sit side by side inside a day', () => {
    const m = buildModel({ kind: 'bar', width: 640, height: 280, series: [s('a', 'positive', [5, 5]), s('b', 'recovered', [5, 5])] })
    const [a, b] = m.series.map((x) => x.bars[0]!)
    expect(b!.x).toBeGreaterThan(a!.x)
    expect(b!.x).toBeGreaterThanOrEqual(a!.x + a!.w - 1e-9)
  })
})

describe('moveFocus', () => {
  it('arrows move one, Page keys 30, Home and End the ends, clamped', () => {
    expect(moveFocus('ArrowRight', 5, 100)).toBe(6)
    expect(moveFocus('ArrowLeft', 5, 100)).toBe(4)
    expect(moveFocus('PageDown', 5, 100)).toBe(35)
    expect(moveFocus('PageUp', 5, 100)).toBe(0)
    expect(moveFocus('Home', 50, 100)).toBe(0)
    expect(moveFocus('End', 50, 100)).toBe(99)
    expect(moveFocus('ArrowRight', 99, 100)).toBe(99)
    expect(moveFocus('ArrowLeft', 0, 100)).toBe(0)
    expect(moveFocus('a', 5, 100)).toBeNull()
  })
})
