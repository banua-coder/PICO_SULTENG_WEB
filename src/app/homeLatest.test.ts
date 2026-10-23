import { describe, expect, it } from 'vitest'
import { infographics } from '@/api/normalize/content'
import { nationalSeries, provinceSeries } from '@/api/normalize/series'
import { vaccinationSeries } from '@/api/normalize/vaccination'
import { INDONESIA, SULTENG } from './areas'
import { buildHomeLatest, lastRtOf } from './homeLatest'
import { fx, type WireInfographic, type WireNationalCase, type WireProvinceCase } from '../../test/fixtures/load'

describe('buildHomeLatest', () => {
  const national = nationalSeries(INDONESIA, fx<WireNationalCase[]>('national')).rows
  const sulteng = provinceSeries(SULTENG, fx<WireProvinceCase[]>('province-72-cases')).rows
  const home = buildHomeLatest({
    national,
    sulteng,
    vaccination: { indonesia: vaccinationSeries(fx('vaccination-national')), 'sulawesi-tengah': vaccinationSeries(fx('vaccination-province')) },
    infographics: infographics(fx<WireInfographic[]>('infographics')),
  })

  it('the last Rt is the newest non-null one, with its date: 9 July 2023 and 24 June 2023', () => {
    expect(home.rt.indonesia?.date).toBe('2023-07-09')
    expect(home.rt['sulawesi-tengah']?.date).toBe('2023-06-24')
    expect(home.rt.indonesia!.lower).toBeLessThanOrEqual(home.rt.indonesia!.value)
    expect(lastRtOf([])).toBeNull()
  })
  it('the last vaccination day of both scopes is 2022-03-25', () => {
    expect(home.vaccination.indonesia?.date).toBe('2022-03-25')
    expect(home.vaccination['sulawesi-tengah']?.total.coverage.dose1).toBe(85.55)
  })
  it('the 5 newest infographics, newest first', () => {
    expect(home.infographics).toHaveLength(5)
    const ids = home.infographics.map((i) => i.id)
    expect(ids).toEqual([...ids].sort((a, b) => b - a))
  })
  it('survives JSON (it is written to a file and read back)', () => {
    expect(JSON.parse(JSON.stringify(home))).toEqual(home)
  })
})
