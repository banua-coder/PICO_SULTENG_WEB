import { describe, expect, it } from 'vitest'
import type { DailyRow } from '@/api/types'
import { newCasesDay } from '@/app/newCases'
import { newCaseBars, shareBars } from './useRegencyNewCases'

const row = (date: string, positive: number, recovered = 0, deceased = 0): DailyRow =>
  ({ date, daily: { positive, recovered, deceased, active: null }, cumulative: { positive: 0, recovered: 0, deceased: 0, active: null }, rt: null, odp: null, pdp: null }) as DailyRow
const area = (code: string, name: string) => ({ level: 'kabupaten' as const, code, slug: name, name })

describe('newCasesDay', () => {
  it('uses the last day with any new positive, not the padded zero rows after it', () => {
    const d = newCasesDay([
      { area: area('1', 'A'), rows: [row('2023-01-01', 5), row('2023-01-02', 0), row('2023-01-03', 0)] },
      { area: area('2', 'B'), rows: [row('2023-01-01', 1), row('2023-01-02', 3, 2, 1), row('2023-01-03', 0)] },
    ])
    expect(d?.date).toBe('2023-01-02')
    expect(d?.items).toEqual([
      { code: '1', name: 'A', positive: 0, recovered: 0, deceased: 0 },
      { code: '2', name: 'B', positive: 3, recovered: 2, deceased: 1 },
    ])
  })
  it('an area with no row that day is null, never 0; no positives at all is null', () => {
    const d = newCasesDay([{ area: area('1', 'A'), rows: [row('2023-01-02', 4)] }, { area: area('2', 'B'), rows: [] }])
    expect(d?.items[1]).toEqual({ code: '2', name: 'B', positive: null, recovered: null, deceased: null })
    expect(newCasesDay([{ area: area('1', 'A'), rows: [row('2023-01-02', 0)] }])).toBeNull()
  })
})

describe('bars', () => {
  it('newCaseBars sorts largest first and keeps null as no value', () => {
    const b = newCaseBars([{ code: '1', name: 'A', positive: 2, recovered: 0, deceased: 0 }, { code: '2', name: 'B', positive: null, recovered: null, deceased: null }, { code: '3', name: 'C', positive: 9, recovered: 0, deceased: 0 }], 'positive')
    expect(b.map((x) => x.key)).toEqual(['3', '1', '2'])
    expect(b[2]!.value).toBeNull()
  })
  it('shareBars: count and share in the label; a missing Dirawat is not 0 and not in the total', () => {
    const r = { ...row('2023-01-01', 0), cumulative: { positive: 100, recovered: 90, deceased: 10, active: null } } as DailyRow
    const b = shareBars(r, { active: 'Dirawat', recovered: 'Sembuh', deceased: 'Meninggal' }, (n) => `${n}%`, (n) => String(n))
    expect(b.map((x) => x.label)).toEqual(['Dirawat', 'Sembuh (90; 90%)', 'Meninggal (10; 10%)'])
    expect(b[0]!.value).toBeNull()
  })
})
