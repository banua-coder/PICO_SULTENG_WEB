import { describe, expect, it } from 'vitest'
import type { Point } from '../types'
import { downsampleMax, DOWNSAMPLE_ABOVE } from './downsample'
import { nearestIndex, spreadLabels, weeklySums, xTicks, yDomain, yTicks } from './scales'
import { dayNumber, isoFromDay } from './days'

const pts = (ys: (number | null)[], start = '2020-01-01'): Point[] => ys.map((y, i) => ({ x: isoFromDay(dayNumber(start) + i), y }))

describe('days', () => {
  it('round-trips ISO dates through UTC day numbers, across leap days and month ends', () => {
    for (const d of ['2020-02-29', '2020-03-01', '2023-12-31', '2024-01-14']) expect(isoFromDay(dayNumber(d))).toBe(d)
    expect(dayNumber('2020-03-01') - dayNumber('2020-02-28')).toBe(2)
  })
})

describe('yDomain', () => {
  it('starts at 0 and ends at a nice maximum', () => {
    const [lo, hi] = yDomain([pts([1, 5, 87])])
    expect(lo).toBe(0)
    expect(hi).toBeGreaterThanOrEqual(87)
    expect(hi).toBeLessThan(150)
  })
  it('all-null or empty series give a usable 0..1 domain', () => {
    expect(yDomain([pts([null, null, null])])).toEqual([0, 1])
    expect(yDomain([])).toEqual([0, 1])
    expect(yDomain([pts([])])).toEqual([0, 1])
  })
  it('all zero gives 0..1 and a negative value pulls the floor down', () => {
    expect(yDomain([pts([0, 0])])).toEqual([0, 1])
    expect(yDomain([pts([-5, 3])])[0]).toBeLessThan(0)
  })
  it('spans several series', () => {
    expect(yDomain([pts([1, 2]), pts([null, 500])])[1]).toBeGreaterThanOrEqual(500)
  })
  it('gives 4 to 5 ticks inside the domain', () => {
    const t = yTicks(yDomain([pts([0, 63614])]))
    expect(t.length).toBeGreaterThanOrEqual(3)
    expect(t.length).toBeLessThanOrEqual(6)
    expect(t[0]).toBe(0)
  })
})

describe('downsampleMax', () => {
  const big = (n: number) => pts(Array.from({ length: n }, (_, i) => (i === 700 ? 9999 : (i * 7) % 50)))

  it('leaves short series untouched', () => {
    const p = pts([1, 2, 3])
    expect(downsampleMax(p, 100)).toBe(p)
    expect(downsampleMax(big(DOWNSAMPLE_ABOVE), 100)).toHaveLength(DOWNSAMPLE_ABOVE)
  })
  it('above 1,000 points reduces to about one point per pixel column and keeps the global max', () => {
    const p = big(1414)
    const out = downsampleMax(p, 300)
    expect(out.length).toBeLessThanOrEqual(300)
    expect(Math.max(...out.map((d) => d.y ?? -1))).toBe(9999)
    expect(out.find((d) => d.y === 9999)?.x).toBe(p[700]!.x) // the real date of the peak
  })
  it('stays in date order and every kept point is an original point', () => {
    const p = big(1414)
    const out = downsampleMax(p, 200)
    expect(out.every((d, i) => i === 0 || d.x > out[i - 1]!.x)).toBe(true)
    const all = new Set(p.map((d) => d.x + d.y))
    expect(out.every((d) => all.has(d.x + d.y))).toBe(true)
  })
  it('a bucket that is entirely null stays a gap', () => {
    const ys = Array.from({ length: 1200 }, (_, i) => (i >= 600 && i < 900 ? null : 5))
    const out = downsampleMax(pts(ys), 100)
    expect(out.some((d) => d.y === null)).toBe(true)
    expect(out.filter((d) => d.y !== null).every((d) => d.y === 5)).toBe(true)
  })
  it('a bucket with some nulls and some numbers keeps the number', () => {
    const ys = Array.from({ length: 1400 }, (_, i) => (i % 2 ? null : 3))
    expect(downsampleMax(pts(ys), 100).every((d) => d.y === 3)).toBe(true)
  })
})

describe('weeklySums', () => {
  it('sums 7 days at a time, week starting on the first date', () => {
    const w = weeklySums(pts([1, 1, 1, 1, 1, 1, 1, 2, 2, 2]))
    expect(w.map((d) => d.y)).toEqual([7, 6])
    expect(w[0]!.x).toBe('2020-01-01')
    expect(w[1]!.x).toBe('2020-01-08')
  })
  it('a week of only nulls stays null, and nulls inside a week count as 0 when other days exist', () => {
    const w = weeklySums(pts([null, null, null, null, null, null, null, 4, null, 1]))
    expect(w[0]!.y).toBeNull()
    expect(w[1]!.y).toBe(5)
  })
  it('total is preserved', () => {
    const ys = Array.from({ length: 100 }, (_, i) => i % 9)
    const w = weeklySums(pts(ys))
    expect(w.reduce((s, d) => s + (d.y ?? 0), 0)).toBe(ys.reduce((s, y) => s + y, 0))
  })
})

describe('xTicks', () => {
  it('uses years for long ranges and months for short ones', () => {
    const years = xTicks(['2020-03-02', '2024-01-14'], 640)
    expect(years.kind).toBe('year')
    expect(years.ticks).toEqual(['2021-01-01', '2022-01-01', '2023-01-01', '2024-01-01'])
    const months = xTicks(['2021-01-01', '2021-06-30'], 640)
    expect(months.kind).toBe('month')
    expect(months.ticks[0]).toBe('2021-01-01')
    expect(months.ticks.length).toBeGreaterThan(2)
  })
  it('thins out ticks on a narrow chart so labels never touch', () => {
    const wide = xTicks(['2021-01-01', '2021-12-31'], 800).ticks.length
    const narrow = xTicks(['2021-01-01', '2021-12-31'], 200).ticks.length
    expect(narrow).toBeLessThan(wide)
    expect(narrow).toBeGreaterThanOrEqual(1)
  })
  it('ticks lie inside the range', () => {
    const { ticks } = xTicks(['2020-03-02', '2020-05-20'], 400)
    expect(ticks.every((t) => t >= '2020-03-02' && t <= '2020-05-20')).toBe(true)
  })
})

describe('nearestIndex', () => {
  const dates = ['2021-01-01', '2021-01-02', '2021-01-03', '2021-01-10']
  it('finds the nearest date for a day number', () => {
    expect(nearestIndex(dates, dayNumber('2021-01-02'))).toBe(1)
    expect(nearestIndex(dates, dayNumber('2021-01-02') + 0.4)).toBe(1)
    expect(nearestIndex(dates, dayNumber('2021-01-08'))).toBe(3)
    expect(nearestIndex(dates, dayNumber('1999-01-01'))).toBe(0)
    expect(nearestIndex(dates, dayNumber('2030-01-01'))).toBe(3)
    expect(nearestIndex([], 5)).toBe(-1)
  })
})

describe('spreadLabels', () => {
  it('keeps labels at least minGap apart, inside the bounds, in the original order', () => {
    const out = spreadLabels([100, 102, 104, 300], 14, 10, 280)
    for (let i = 1; i < out.length; i++) expect(out[i]!).toBeGreaterThanOrEqual(out[i - 1]! + 14 - 1e-9)
    expect(Math.min(...out)).toBeGreaterThanOrEqual(10)
    expect(Math.max(...out)).toBeLessThanOrEqual(280)
  })
  it('does not move labels that already fit', () => {
    expect(spreadLabels([20, 60, 120], 14, 0, 200)).toEqual([20, 60, 120])
  })
  it('returns results in input order even when input is unsorted', () => {
    const out = spreadLabels([200, 100, 102], 14, 0, 300)
    expect(out[0]).toBe(200)
    expect(out[2]! - out[1]!).toBeGreaterThanOrEqual(14 - 1e-9)
  })
})
