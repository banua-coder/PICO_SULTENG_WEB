import { describe, expect, it } from 'vitest'
import type { DailyRow } from '@/api/types'
import { INDONESIA } from '@/app/areas'
import { nationalSeries } from '@/api/normalize/series'
import { fx, type WireNationalCase } from '../../../test/fixtures/load'
import { lastRt, nullRuns, rtPoints } from './useRtView'

const day = (date: string, rt: number | null): DailyRow => ({
  date,
  daily: { positive: 1, recovered: 0, deceased: 0, active: 0 },
  cumulative: { positive: 1, recovered: 0, deceased: 0, active: 0 },
  rt: rt === null ? null : { value: rt, lower: rt - 0.1, upper: rt + 0.1 },
  odp: null,
  pdp: null,
})
const rows = [day('2020-03-02', null), day('2020-03-03', null), day('2020-03-04', 1.2), day('2020-03-05', null), day('2020-03-06', 0.9), day('2020-03-07', null), day('2020-03-08', null)]
const all = { from: '2020-03-02', to: '2020-03-08' }

describe('useRtView', () => {
  it('null runs at the start, in the middle and at the end (the end reaches the last day of the record)', () => {
    expect(nullRuns(rows, all)).toEqual([
      { from: '2020-03-02', to: '2020-03-03', kind: 'gap' },
      { from: '2020-03-05', to: '2020-03-05', kind: 'gap' },
      { from: '2020-03-07', to: '2020-03-08', kind: 'end' },
    ])
  })
  it('a run that stops before the record ends is a gap, even when it is the last in the window', () => {
    expect(nullRuns(rows, { from: '2020-03-02', to: '2020-03-07' }).at(-1)).toEqual({ from: '2020-03-07', to: '2020-03-07', kind: 'gap' })
  })
  it('the last value is the newest non-null one in the window, with its interval', () => {
    expect(lastRt(rows, all)).toEqual({ date: '2020-03-06', value: 0.9, lower: 0.9 - 0.1, upper: 0.9 + 0.1 })
    expect(lastRt(rows, { from: '2020-03-07', to: '2020-03-08' })).toBeNull()
  })
  it('points keep the gaps as null, never 0', () => {
    const p = rtPoints(rows, all)
    expect(p).toHaveLength(7)
    expect(p[0]).toEqual({ x: '2020-03-02', y: null, lo: null, hi: null })
    expect(p[2]!.y).toBe(1.2)
  })
  it('national, 2023-07-01 to 2024-01-14: the last value is on 2023-07-09 and one end run covers the rest', () => {
    const s = nationalSeries(INDONESIA, fx<WireNationalCase[]>('national'))
    const w = { from: '2023-07-01', to: '2024-01-14' }
    expect(lastRt(s.rows, w)?.date).toBe('2023-07-09')
    const runs = nullRuns(s.rows, w)
    expect(runs.at(-1)).toEqual({ from: '2023-07-10', to: '2024-01-14', kind: 'end' })
    expect(runs).toHaveLength(1)
  })
})
