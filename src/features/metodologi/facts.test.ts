import { describe, expect, it } from 'vitest'
import { DOWNLOAD_HEADER } from '@/app/csv'
import { RECORD_FIRST, RECORD_LAST } from '@/app/dateWindow'
import { SULTENG, INDONESIA } from '@/app/areas'
import { nationalSeries, provinceSeries } from '@/api/normalize/series'
import { testPeriods } from '@/api/normalize/stats'
import { vaccinationSeries } from '@/api/normalize/vaccination'
import { fx, type WireNationalCase, type WireProvinceCase } from '../../../test/fixtures/load'
import { COLUMN_DOCS, FACTS } from '@/app/facts'

// The page states these as facts: they must match what the API serves (the fixtures are recorded from it).
describe('Methodology facts', () => {
  const national = nationalSeries(INDONESIA, fx<WireNationalCase[]>('national'))
  const sulteng = provinceSeries(SULTENG, fx<WireProvinceCase[]>('province-72-cases'))
  const lastWith = <T extends { date: string }>(rows: T[], f: (r: T) => boolean) => [...rows].reverse().find(f)?.date

  it('the record runs from 2020-03-02 to 2024-01-14, for the national and the provincial series', () => {
    expect([FACTS.recordFirst, FACTS.recordLast]).toEqual([RECORD_FIRST, RECORD_LAST])
    expect([national.first, national.last]).toEqual(['2020-03-02', '2024-01-14'])
    expect([sulteng.first, sulteng.last]).toEqual(['2020-03-02', '2024-01-14'])
  })

  it('Rt ends on 9 July 2023 nationally and 24 June 2023 in Sulawesi Tengah', () => {
    expect(lastWith(national.rows, (r) => r.rt !== null)).toBe(FACTS.rtLastNational)
    expect(lastWith(sulteng.rows, (r) => r.rt !== null)).toBe(FACTS.rtLastSulteng)
  })

  it('every Rt value has an interval around it, and none is 0 or negative', () => {
    for (const r of [...national.rows, ...sulteng.rows]) if (r.rt) expect(r.rt.lower <= r.rt.value && r.rt.value <= r.rt.upper && r.rt.value > 0).toBe(true)
  })

  it('ODP and PDP end on 2022-05-08 for Sulawesi Tengah', () => {
    expect(lastWith(sulteng.rows, (r) => (r.odp?.total ?? 0) > 0 || (r.pdp?.total ?? 0) > 0)).toBe(FACTS.odpEnd)
  })

  it('tests end on 2020-09-28 and vaccination on 2022-03-25', () => {
    const periods = testPeriods(fx('tests'))
    expect(periods.map((p) => p.from).sort().at(-1)).toBe(FACTS.testsEnd)
    const days = vaccinationSeries(fx('vaccination-national'))
    expect(days.map((d) => d.date).sort().at(-1)).toBe(FACTS.vaccinationEnd)
  })

  it('every download column is described in both languages, and nothing else', () => {
    for (const lang of ['id', 'en'] as const) expect(Object.keys(COLUMN_DOCS[lang]), lang).toEqual([...DOWNLOAD_HEADER])
  })
})
