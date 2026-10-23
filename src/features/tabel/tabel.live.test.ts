// @vitest-environment node
// Spec 50 acceptance against the real API. Skipped unless LIVE_API=1 (nightly job): the CSV of provinsi/72, full range,
// has 1,415 lines (header and 1,414 days) and its first data line is the newest day.
import { describe, expect, it } from 'vitest'
import { fetchJson } from '@/api/client'
import { isArrayOf, isWireProvinceCase } from '@/api/guards'
import { provinceSeries } from '@/api/normalize/series'
import { SULTENG } from '@/app/areas'
import { toCsv } from '@/app/csv'
import { columnsFor } from './columns'
import { exportTable } from './exportRows'
import { observationUntil } from './useTabelPage'

describe.skipIf(!process.env.LIVE_API)('Tabel Data live (spec 50)', () => {
  it('the CSV of provinsi/72, full range, has 1,415 lines and matches the table values', async () => {
    const s = provinceSeries(SULTENG, await fetchJson('/provinces/72/cases?all=true', { guard: isArrayOf(isWireProvinceCase) }))
    const rows = [...s.rows].reverse()
    const cols = columnsFor('provinsi', { windowFrom: s.first, observationUntil: observationUntil(s.rows) })
    const { header, rows: cells } = exportTable(rows, cols)
    const lines = toCsv(header, cells).trimEnd().split('\r\n')
    expect(lines).toHaveLength(1415)
    expect(lines[1]!.startsWith('2024-01-14,')).toBe(true)
    expect(lines[1]!.split(',')[5]).toBe(String(s.rows.at(-1)!.cumulative.positive))
  })
})
