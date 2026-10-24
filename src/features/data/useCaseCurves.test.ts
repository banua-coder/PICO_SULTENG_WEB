import { describe, expect, it } from 'vitest'
import { SULTENG } from '@/app/areas'
import { provinceSeries, regencySeries } from '@/api/normalize/series'
import { fx, type WireProvinceCase, type WireRegencyCase } from '../../../test/fixtures/load'
import { buildCurves, movingAverage, peakDay, rowsInWindow } from './useCaseCurves'

const L = { positive: 'Positif', recovered: 'Sembuh', deceased: 'Meninggal', active: 'Dirawat', average: 'rata-rata 7 hari' }
const sul = provinceSeries(SULTENG, fx<WireProvinceCase[]>('province-72-cases'))

describe('movingAverage', () => {
  it('is centred, with a shorter window at both edges and no fake zeros', () => {
    const v = movingAverage([10, 20, 30, 40, 50, 60, 70, 80, 90])
    expect(v[0]).toBe(25) // (10+20+30+40)/4: only 3 days ahead, none behind
    expect(v[4]).toBe(50) // full 7 days
    expect(v[8]).toBe(75) // (60..90)/4
  })
  it('skips nulls and keeps a position with nothing in reach as null', () => {
    expect(movingAverage([null, 4, null], 1)).toEqual([4, 4, 4])
    expect(movingAverage([null, null], 1)).toEqual([null, null])
    expect(movingAverage([])).toEqual([])
    expect(movingAverage([6])).toEqual([6])
  })
})

describe('buildCurves', () => {
  it('keeps only the days of the window, both ends included, in order', () => {
    const w = { from: '2024-01-10', to: '2024-01-12' }
    expect(rowsInWindow(sul.rows, w).map((r) => r.date)).toEqual(['2024-01-10', '2024-01-11', '2024-01-12'])
    const c = buildCurves(sul.rows, w, 'provinsi', L)
    expect(c.dailyPositive.points.map((p) => p.x)).toEqual(['2024-01-10', '2024-01-11', '2024-01-12'])
    expect(c.average.points).toHaveLength(3)
    expect(c.last?.date).toBe('2024-01-12')
  })
  it('a province and the country have four cumulative lines, a kabupaten three (no dirawat)', () => {
    const w = { from: sul.first, to: sul.last }
    expect(buildCurves(sul.rows, w, 'provinsi', L).cumulative.map((s) => s.id)).toEqual(['positive', 'recovered', 'deceased', 'active'])
    const palu = regencySeries({ level: 'kabupaten', code: '7271', slug: 'kota-palu', name: 'Kota Palu' }, fx<WireRegencyCase[]>('regency-7271-cases'))
    const k = buildCurves(palu.rows, { from: palu.first, to: palu.last }, 'kabupaten', L)
    expect(k.cumulative.map((s) => s.id)).toEqual(['positive', 'recovered', 'deceased'])
  })
  it('the peak is the highest daily positive of the window, none when the window has no case', () => {
    const rows = sul.rows
    const all = peakDay(rows)!
    expect(all.value).toBe(Math.max(...rows.map((r) => r.daily.positive)))
    expect(rows.find((r) => r.date === all.date)!.daily.positive).toBe(all.value)
    expect(buildCurves(rows, { from: '2024-01-01', to: '2024-01-14' }, 'provinsi', L).peak).toBeNull()
    expect(buildCurves([], { from: '2020-03-02', to: '2024-01-14' }, 'provinsi', L).last).toBeNull()
  })
})
