import { describe, expect, it } from 'vitest'
import { genderSnapshot, testPeriods, testTypes } from '@/api/normalize/stats'
import { fx } from '../../../test/fixtures/load'
import { ageMax, testTotals, typeInfo, useGenderBars, useTestSeries } from './useGenderTests'

const snap = genderSnapshot(fx('gender-latest'))
const pct = (n: number) => `${n.toFixed(1)}%`
const L = { male: 'Laki-laki', female: 'Perempuan' }

describe('useGenderBars', () => {
  it('sex bars carry the total and the share in text; age bars have the source\'s own six groups', () => {
    const b = useGenderBars(snap, 'positive', 'id', L, pct)
    expect(b.total).toBe(10199 + 12585)
    expect(b.sex.map((x) => [x.label, x.value])).toEqual([['Laki-laki (44.8%)', 10199], ['Perempuan (55.2%)', 12585]])
    expect(b.male.map((x) => x.label)).toEqual(['0 sampai 14 tahun', '15 sampai 19 tahun', '20 sampai 24 tahun', '25 sampai 49 tahun', '50 sampai 54 tahun', '55 tahun ke atas'])
    expect(b.female.map((x) => x.value)).toEqual([324, 1107, 3564, 3924, 2441, 1223])
  })
  it('English labels, PDP numbers, and a shared scale for the two age charts', () => {
    const b = useGenderBars(snap, 'pdp', 'en', { male: 'Male', female: 'Female' }, pct)
    expect(b.sex[0]!.value).toBe(178)
    expect(b.male[0]!.label).toBe('0 to 14 years')
    expect(ageMax(b.male, b.female)).toBe(91)
  })
  it('an all-zero snapshot has no share text and no division by zero', () => {
    const zero = { ...snap, pdp: { male: { total: 0, ages: [] }, female: { total: 0, ages: [] } } }
    expect(useGenderBars(zero, 'pdp', 'id', L, pct).sex.map((x) => x.label)).toEqual(['Laki-laki', 'Perempuan'])
    expect(ageMax([], [])).toBe(0)
  })
  it('a missing age number stays null in the bars (the chart then says "tidak tersedia")', () => {
    const s2 = structuredClone(snap)
    s2.positive.male.ages[1]!.count = null
    const b = useGenderBars(s2, 'positive', 'id', L, pct)
    expect(b.male[1]!.value).toBeNull()
    expect(ageMax(b.male, b.female)).toBe(3924)
  })
  it('never invents a date', () => expect(snap.asOf).toBeNull())
})

describe('useTestSeries', () => {
  const periods = testPeriods(fx('tests'))
  it('PCR and RDT only, ascending, last period with its four numbers', () => {
    const pcr = useTestSeries(periods, 'pcr', { positive: 'Positif', negative: 'Negatif' })
    expect(pcr.series.map((s) => s.label)).toEqual(['Positif', 'Negatif'])
    const xs = pcr.series[0]!.points.map((p) => p.x)
    expect([...xs].sort()).toEqual(xs)
    expect(pcr.last?.type).toBe('pcr')
    const rdt = useTestSeries(periods, 'rdt', { positive: 'P', negative: 'N' })
    // the periods after it are four zeros: padding, not a report
    expect(rdt.last?.from).toBe('2020-05-26')
    expect(periods.some((p) => p.type === 'rdt' && p.from > '2020-05-26')).toBe(true)
    expect(Object.keys(rdt.last!).sort()).toEqual(['from', 'invalid', 'negative', 'positive', 'process', 'type'])
  })
  it('type descriptions come from the API rows', () => {
    const types = testTypes(fx('test-types'))
    expect(typeInfo(types, 'pcr')?.sample).toContain('Spesimen saluran pernapasan')
    expect(typeInfo([], 'rdt')).toBeUndefined()
  })
})

describe('testTotals (the legacy PCR/RDT block)', () => {
  const periods = [
    { from: '2020-03-03', type: 'pcr', process: 10, invalid: 0, positive: 5, negative: 85 },
    { from: '2020-03-10', type: 'pcr', process: 0, invalid: 5, positive: 5, negative: 90 },
    { from: '2020-03-03', type: 'rdt', process: 0, invalid: 0, positive: 1, negative: 3 },
  ] as never[]
  it('sums one type over all periods and gives each result its share of the total', () => {
    const t = testTotals(periods, 'pcr')
    expect(t).toMatchObject({ total: 200, positive: 10, negative: 175, invalid: 5, process: 10 })
    expect(t.share.positive).toBe(5)
  })
  it('no tests: shares are null, never NaN', () => {
    expect(testTotals([], 'rdt').share.positive).toBeNull()
  })
})
