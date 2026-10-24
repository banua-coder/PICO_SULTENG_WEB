import { describe, expect, it } from 'vitest'
import { toCsv } from '@/app/csv'
import type { DailyRow } from '@/api/types'
import { columnsFor, groupSpans, numberFor } from './columns'
import { exportTable } from './exportRows'
import { clampPage, pageCount, pageNumbers, pageOfDate, parsePage, slicePage } from './paging'
import { observationUntil, parseLevel, resolveArea } from './useTabelPage'
import { toXlsx } from './toXlsx'

const row = (date: string, over: Partial<DailyRow> = {}): DailyRow => ({
  date,
  daily: { positive: 1, recovered: 2, deceased: 3, active: 4 },
  cumulative: { positive: 10, recovered: 20, deceased: 30, active: 40 },
  rt: { value: 0.95, lower: 0.81, upper: 1.1 },
  odp: null,
  pdp: null,
  ...over,
})
const desc = (n: number) => Array.from({ length: n }, (_, i) => row(new Date(Date.UTC(2021, 0, 1) + (n - 1 - i) * 864e5).toISOString().slice(0, 10)))

describe('paging', () => {
  it('counts pages, never fewer than one', () => {
    expect([pageCount(0), pageCount(50), pageCount(51), pageCount(1414)]).toEqual([1, 1, 2, 29])
  })
  it('clamps and parses the page', () => {
    expect([clampPage(0, 120), clampPage(9, 120), clampPage(2.7, 120)]).toEqual([1, 3, 2])
    expect([parsePage('3'), parsePage('0'), parsePage('x'), parsePage(['4']), parsePage(undefined), parsePage('-2')]).toEqual([3, 1, 1, 4, 1, 1])
  })
  it('slices 50 rows', () => {
    const rows = desc(120)
    expect(slicePage(rows, 3)).toHaveLength(20)
    expect(slicePage(rows, 1)[0]).toBe(rows[0])
  })
  it('finds the page of a date, with out of range dates at the ends', () => {
    const rows = desc(120) // newest first
    expect(pageOfDate(rows, rows[0]!.date)).toBe(1)
    expect(pageOfDate(rows, rows[49]!.date)).toBe(1)
    expect(pageOfDate(rows, rows[50]!.date)).toBe(2)
    expect(pageOfDate(rows, '2030-01-01')).toBe(1)
    expect(pageOfDate(rows, '1999-01-01')).toBe(3)
    expect(pageOfDate([], '2021-01-01')).toBe(1)
  })
  it('shows the ends and the neighbours, with gaps', () => {
    expect(pageNumbers(1, 3)).toEqual([1, 2, 3])
    expect(pageNumbers(10, 29)).toEqual([1, null, 8, 9, 10, 11, 12, null, 29])
    expect(pageNumbers(1, 29)).toEqual([1, 2, 3, null, 29])
  })
})

describe('columns', () => {
  const opts = { windowFrom: '2020-03-02', observationUntil: '2022-05-08' }
  it('hides dirawat for a kabupaten and ODP/PDP for Indonesia', () => {
    expect(columnsFor('indonesia', opts).map((c) => c.key)).toEqual(['dailyPositive', 'dailyRecovered', 'dailyDeceased', 'dailyActive', 'cumPositive', 'cumRecovered', 'cumDeceased', 'cumActive', 'rt'])
    expect(columnsFor('kabupaten', opts).map((c) => c.key)).toEqual(['dailyPositive', 'dailyRecovered', 'dailyDeceased', 'cumPositive', 'cumRecovered', 'cumDeceased', 'rt', 'odp', 'pdp'])
    expect(columnsFor('provinsi', opts).map((c) => c.key).slice(-2)).toEqual(['odp', 'pdp'])
  })
  it('shows ODP/PDP only when the window starts on or before the cut-off', () => {
    expect(columnsFor('provinsi', { ...opts, windowFrom: '2022-05-08' }).some((c) => c.key === 'odp')).toBe(true)
    expect(columnsFor('provinsi', { ...opts, windowFrom: '2022-05-09' }).some((c) => c.key === 'odp')).toBe(false)
    expect(columnsFor('provinsi', { ...opts, observationUntil: null }).some((c) => c.key === 'odp')).toBe(false)
  })
  it('reads ODP/PDP after the cut-off as not available, not zero', () => {
    const [odp] = columnsFor('provinsi', opts).filter((c) => c.key === 'odp')
    const o = { active: 0, finished: 0, total: 0 }
    expect(numberFor(odp!, row('2022-05-08', { odp: { ...o, total: 7 } }))).toBe(7)
    expect(numberFor(odp!, row('2022-05-09', { odp: o }))).toBeNull()
  })
  it('groups the header cells', () => {
    expect(groupSpans(columnsFor('kabupaten', opts))).toEqual([{ group: 'daily', span: 3 }, { group: 'cumulative', span: 3 }, { group: 'rt', span: 1 }, { group: 'observation', span: 2 }])
  })
  it('finds the last real ODP/PDP day, not a row of zeros', () => {
    const o = (total: number) => ({ active: 0, finished: 0, total })
    expect(observationUntil([row('2022-05-07', { odp: o(5) }), row('2022-05-08', { pdp: o(1) }), row('2022-05-09', { odp: o(0), pdp: o(0) })])).toBe('2022-05-08')
    expect(observationUntil([row('2022-05-09')])).toBeNull()
  })
})

describe('query state', () => {
  it('falls back to defaults', () => {
    expect(parseLevel('kabupaten')).toBe('kabupaten')
    expect(parseLevel('x')).toBe('provinsi')
    expect(resolveArea('provinsi', undefined).slug).toBe('sulawesi-tengah')
    expect(resolveArea('kabupaten', 'sigi').slug).toBe('sigi')
    expect(resolveArea('kabupaten', 'bali').slug).toBe('kota-palu') // a province slug at kabupaten level
    expect(resolveArea('indonesia', 'bali').slug).toBe('indonesia')
  })
})

describe('export', () => {
  it('matches the table: Rt as three columns, null as an empty cell', () => {
    const cols = columnsFor('kabupaten', { windowFrom: '2021-01-01', observationUntil: null })
    const { header, rows } = exportTable([row('2021-01-02', { rt: null }), row('2021-01-01')], cols)
    expect(header).toEqual(['date', 'positive_daily', 'recovered_daily', 'deceased_daily', 'positive_cumulative', 'recovered_cumulative', 'deceased_cumulative', 'rt', 'rt_lower', 'rt_upper'])
    expect(rows[0]).toEqual(['2021-01-02', 1, 2, 3, 10, 20, 30, null, null, null])
    const csv = toCsv(header, rows).split('\r\n')
    expect(csv[1]).toBe('2021-01-02,1,2,3,10,20,30,,,')
    expect(csv[2]).toBe('2021-01-01,1,2,3,10,20,30,0.95,0.81,1.1')
  })
  it('xlsx reads back to the same rows as the csv', async () => {
    const cols = columnsFor('provinsi', { windowFrom: '2021-01-01', observationUntil: null })
    const { header, rows } = exportTable([row('2021-01-02', { rt: null }), row('2021-01-01')], cols)
    const blob = await toXlsx('Sulawesi Tengah', header, rows)
    const XLSX = await import('xlsx')
    const wb = XLSX.read(new Uint8Array(await blob.arrayBuffer()), { type: 'array' })
    const back = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]!]!, { header: 1 })
    expect(back[0]).toEqual(header)
    expect(back[1]).toEqual(['2021-01-02', 1, 2, 3, 4, 10, 20, 30, 40])
    expect(back[1]).toHaveLength(9) // trailing empty cells are dropped by sheet_to_json
  })
})
