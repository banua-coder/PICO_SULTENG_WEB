// @vitest-environment node
// The dates the Methodology page states, against the real API. Skipped unless LIVE_API=1 (nightly job).
import { describe, expect, it } from 'vitest'
import { fetchJson } from '@/api/client'
import { isArrayOf, isWireNationalCase, isWireProvinceCase } from '@/api/guards'
import { nationalSeries, provinceSeries } from '@/api/normalize/series'
import { INDONESIA, SULTENG } from '@/app/areas'
import { FACTS } from './facts'

describe.skipIf(!process.env.LIVE_API)('Methodology facts live (spec 74)', () => {
  it('the last Rt dates and the ODP end match the served data', async () => {
    const nat = nationalSeries(INDONESIA, await fetchJson('/national?all=true', { guard: isArrayOf(isWireNationalCase) }))
    const sul = provinceSeries(SULTENG, await fetchJson('/provinces/72/cases?all=true', { guard: isArrayOf(isWireProvinceCase) }))
    const last = <T extends { date: string }>(rows: T[], f: (r: T) => boolean) => [...rows].reverse().find(f)?.date
    expect(last(nat.rows, (r) => r.rt !== null)).toBe(FACTS.rtLastNational)
    expect(last(sul.rows, (r) => r.rt !== null)).toBe(FACTS.rtLastSulteng)
    expect(last(sul.rows, (r) => (r.odp?.total ?? 0) > 0 || (r.pdp?.total ?? 0) > 0)).toBe(FACTS.odpEnd)
    expect([nat.first, nat.last]).toEqual([FACTS.recordFirst, FACTS.recordLast])
  })
})
