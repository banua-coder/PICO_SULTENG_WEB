import { describe, expect, it } from 'vitest'
import type { BandPoint } from '../types'
import { dayNumber, isoFromDay } from './days'
import { buildRtModel, RT_Y_MAX } from './rtModel'

const pt = (i: number, v: number | null, spread = 0.2): BandPoint =>
  v === null ? { x: isoFromDay(dayNumber('2021-01-01') + i), y: null, lo: null, hi: null } : { x: isoFromDay(dayNumber('2021-01-01') + i), y: v, lo: v - spread, hi: v + spread }
const model = (vals: (number | null)[], extra: object = {}) => buildRtModel({ points: vals.map((v, i) => pt(i, v)), width: 640, height: 280, ...extra })
const subPaths = (d: string) => (d.match(/M/g) ?? []).length

describe('buildRtModel', () => {
  it('the y axis is 0 to 4 by default, with ticks 0 to 4', () => {
    const m = model([1, 2])
    expect(m.yMax).toBe(RT_Y_MAX)
    expect(m.yTicks.map((t) => t.value)).toEqual([0, 1, 2, 3, 4])
    expect(m.y(4)).toBeCloseTo(0)
    expect(m.y(0)).toBeCloseTo(m.plotH)
  })

  it('the Rt = 1 threshold sits at the y of 1', () => {
    const m = model([1, 2])
    expect(m.threshold).toBeCloseTo(m.y(1))
  })

  it('null runs at the start, middle and end break the thread and the band', () => {
    const start = model([null, null, 1, 1.1, 1.2])
    expect(subPaths(start.thread)).toBe(1)
    const middle = model([1, 1.1, null, null, 0.9, 0.8])
    expect(subPaths(middle.thread)).toBe(2)
    expect(subPaths(middle.band)).toBe(2)
    const end = model([1, 1.1, 1.2, null, null])
    expect(subPaths(end.thread)).toBe(1)
    expect(end.end?.value).toBe(1.2) // the label sits on the last real value, not at the gap
  })

  it('no Rt at all: nothing drawn, no end label, and hasAny says so (the page shows its message)', () => {
    const m = model([null, null, null])
    expect(m.hasAny).toBe(false)
    expect(m.thread).toBe('')
    expect(m.band).toBe('')
    expect(m.end).toBeNull()
    expect(buildRtModel({ points: [], width: 640, height: 280 }).hasAny).toBe(false)
  })

  it('a value above 4 is drawn at the top edge and gets one clipped marker with its number per run', () => {
    const m = model([1, 5.2, 6.8, 4.5, 2, 1, 4.1, 0.9])
    expect(m.clipped.map((c) => c.value)).toEqual([6.8, 4.1]) // two runs, highest of each
    expect(m.clipped[0]!.date).toBe('2021-01-03')
    expect(m.y(6.8)).toBeCloseTo(0) // clipped to the top
    expect(m.thread).not.toMatch(/-\d/) // never above the plot
  })

  it('a clipped run touching the end of the data still gets its marker', () => {
    expect(model([1, 2, 4.4, 5]).clipped.map((c) => c.value)).toEqual([5])
  })

  it('the band is clipped to 0..4 too and the lower edge never goes below 0', () => {
    const m = model([0.1, 3.9], { })
    expect(m.band).not.toMatch(/-\d/)
  })

  it('a custom yMax moves the clipping line', () => {
    expect(model([1, 5.2], { yMax: 6 }).clipped).toEqual([])
    expect(model([1, 5.2], { yMax: 3 }).clipped).toHaveLength(1)
  })

  it('range limits points; valueAt returns the triple or null', () => {
    const m = model([1, 2, null, 3], { range: ['2021-01-02', '2021-01-04'] })
    expect(m.dates).toEqual(['2021-01-02', '2021-01-03', '2021-01-04'])
    expect(m.valueAt('2021-01-02')).toEqual({ value: 2, lo: 1.8, hi: 2.2 })
    expect(m.valueAt('2021-01-03')).toBeNull()
  })

  it('1,414 points stay a short path, and a peak survives the reduction', () => {
    const vals = Array.from({ length: 1414 }, (_, i) => (i === 900 ? 3.9 : 1 + ((i * 7) % 10) / 20))
    const m = model(vals)
    expect((m.thread.match(/[ML]/g) ?? []).length).toBeLessThanOrEqual(Math.round(m.plotW))
    expect(m.thread).toContain(m.y(3.9).toFixed(1).replace(/\.0$/, ''))
    expect(m.visible).toHaveLength(1414)
  })
})
