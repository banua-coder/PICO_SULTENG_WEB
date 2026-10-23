// @vitest-environment node
// Full-series acceptance checks against the real API. Skipped unless LIVE_API=1 (run by the nightly job and by hand):
//   LIVE_API=1 pnpm test src/api/live.test.ts
import { describe, expect, it } from 'vitest'
import { INDONESIA, SULTENG } from '@/app/areas'
import { fetchJson } from './client'
import { isArrayOf, isWireNationalCase, isWireProvinceCase } from './guards'
import { nationalSeries, provinceSeries } from './normalize/series'

describe.skipIf(!process.env.LIVE_API)('live API acceptance (spec 14)', () => {
  it('provinsi/72 has 1,414 unique ascending rows from 2020-03-02 to 2024-01-14, ODP/PDP null after 2022-05-08', async () => {
    const wire = await fetchJson('/provinces/72/cases?all=true', { guard: isArrayOf(isWireProvinceCase) })
    const s = provinceSeries(SULTENG, wire)
    expect(s.rows).toHaveLength(1414)
    expect(s.first).toBe('2020-03-02')
    expect(s.last).toBe('2024-01-14')
    expect(new Set(s.rows.map((r) => r.date)).size).toBe(1414)
    expect(s.rows.every((r, i) => i === 0 || r.date > s.rows[i - 1]!.date)).toBe(true)
    const after = s.rows.filter((r) => r.date > '2022-05-08')
    expect(after.length).toBeGreaterThan(500)
    expect(after.every((r) => r.odp === null && r.pdp === null)).toBe(true)
    const before = s.rows.filter((r) => r.date <= '2022-05-08')
    expect(before.every((r) => r.odp !== null && r.pdp !== null)).toBe(true)
    expect(s.rows.find((r) => r.date === '2022-05-08')?.odp?.total).toBeGreaterThan(0)
  })

  it('national: day 1414 sits at 2023-07-22, Rt is null on 2020-03-02 and after 2023-07-09', async () => {
    const wire = await fetchJson('/national?all=true', { guard: isArrayOf(isWireNationalCase) })
    const s = nationalSeries(INDONESIA, wire)
    expect(s.rows).toHaveLength(1414)
    const idx = s.rows.findIndex((r) => r.date === '2023-07-22')
    expect(idx).toBeGreaterThan(1200)
    expect(idx).toBeLessThan(1413)
    expect(s.rows[0]?.rt).toBeNull()
    expect(s.rows.filter((r) => r.date > '2023-07-09').every((r) => r.rt === null)).toBe(true)
    expect(s.rows.find((r) => r.date === '2023-07-09')?.rt).not.toBeNull()
  })
})
