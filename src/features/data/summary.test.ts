import { describe, expect, it } from 'vitest'
import type { DailyRow, LatestByArea, Series } from '@/api/types'
import { INDONESIA } from '@/app/areas'
import { lastObservationRow, rate, rowOnOrBefore, summaryRow } from './summary'

const row = (date: string, positive = 0, odp: DailyRow['odp'] = null): DailyRow => ({
  date,
  daily: { positive: 1, recovered: 0, deceased: 0, active: 1 },
  cumulative: { positive, recovered: 0, deceased: 0, active: 1 },
  rt: null,
  odp,
  pdp: null,
})
const rows = [row('2021-07-29', 10), row('2021-07-30', 20), row('2021-08-02', 30)]
const series: Series = { area: INDONESIA, rows, first: '2021-07-29', last: '2021-08-02' }
const latest: LatestByArea = { area: INDONESIA, latest: row('2024-01-14', 999) }

describe('rowOnOrBefore', () => {
  it('finds the exact day, or the nearest earlier one, or nothing', () => {
    expect(rowOnOrBefore(rows, '2021-07-30')?.cumulative.positive).toBe(20)
    expect(rowOnOrBefore(rows, '2021-08-01')?.cumulative.positive).toBe(20) // 08-01 has no row
    expect(rowOnOrBefore(rows, '2030-01-01')?.cumulative.positive).toBe(30)
    expect(rowOnOrBefore(rows, '2020-01-01')).toBeUndefined()
    expect(rowOnOrBefore([], '2021-01-01')).toBeUndefined()
  })
})

describe('summaryRow', () => {
  const w = { from: '2021-07-29', to: '2021-07-30' }
  it('series here: its row on the window end (the last day with real counts)', () => {
    expect(summaryRow({ latest, series, window: w })?.row.cumulative.positive).toBe(20)
    expect(summaryRow({ latest, series, window: w })?.dailyKnown).toBe(true)
  })
  it('before the series: the last real day when the build knows it', () => {
    expect(summaryRow({ latest, series: undefined, window: w, lastReal: series.rows[0] })?.row.cumulative.positive).toBe(10)
  })
  it('before the series, no last real day: the latest row, with its daily changes withheld (the padded zeros are not a report)', () => {
    const r = summaryRow({ latest, series: undefined, window: w })
    expect(r?.row.cumulative.positive).toBe(999)
    expect(r?.dailyKnown).toBe(false)
  })
  it('nothing at all: undefined', () => {
    expect(summaryRow({ latest: undefined, series: undefined, window: w })).toBeUndefined()
  })
})

describe('rate', () => {
  it('percent with the full float, null when nothing is positive', () => {
    expect(rate(1760, 63614)).toBeCloseTo(2.7667, 3)
    expect(rate(5, 0)).toBeNull()
  })
})

describe('lastObservationRow', () => {
  it('is the newest row with ODP or PDP numbers', () => {
    const r = [row('2022-05-07', 1, { active: 1, finished: 1, total: 2 }), row('2022-05-08', 1, { active: 0, finished: 3, total: 3 }), row('2022-05-09'), row('2024-01-14')]
    expect(lastObservationRow(r)?.date).toBe('2022-05-08')
    expect(lastObservationRow([row('2024-01-14')])).toBeUndefined()
    // rows of zeros are not reports
    expect(lastObservationRow([row('2021-01-01', 1, { active: 0, finished: 0, total: 0 })])).toBeUndefined()
    expect(lastObservationRow([row('2021-01-01', 1, { active: null, finished: 2, total: null }), row('2021-01-02', 1, { active: 0, finished: 0, total: 0 })])?.date).toBe('2021-01-01')
  })
})
