import { describe, expect, it } from 'vitest'
import { fx, type WireProvinceCase } from '../../test/fixtures/load'
import { provinceSeries } from '@/api/normalize/series'
import { SULTENG } from './areas'
import { DOWNLOAD_HEADER, seriesRows, toCsv } from './csv'

describe('toCsv', () => {
  it('starts with a UTF-8 BOM, uses CRLF, and writes null as an empty cell', () => {
    const csv = toCsv(['a', 'b'], [[1, null], [2, 3]])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv.slice(1)).toBe('a,b\r\n1,\r\n2,3\r\n')
  })
  it('quotes a comma, a quote and a newline, and doubles the quotes', () => {
    const csv = toCsv(['name'], [['Toli-Toli, Sulteng'], ['say "hi"'], ['two\nlines'], ['plain']])
    expect(csv).toContain('"Toli-Toli, Sulteng"')
    expect(csv).toContain('"say ""hi"""')
    expect(csv).toContain('"two\nlines"')
    expect(csv).toContain('\r\nplain\r\n')
  })
  it('keeps numbers raw (no grouping) and 0 as 0', () => {
    expect(toCsv(['n'], [[1234567.5], [0]]).slice(1)).toBe('n\r\n1234567.5\r\n0\r\n')
  })
  it('neutralises spreadsheet formulas in text cells', () => {
    expect(toCsv(['t'], [['=SUM(A1)'], ['+1'], ['@x'], ['-5 apples']]).slice(1)).toBe("t\r\n'=SUM(A1)\r\n'+1\r\n'@x\r\n'-5 apples\r\n")
    expect(toCsv(['n'], [[-5]]).slice(1)).toBe('n\r\n-5\r\n') // a real negative number is fine
  })
})

describe('seriesRows', () => {
  const series = provinceSeries(SULTENG, fx<WireProvinceCase[]>('province-72-cases'))
  const rows = seriesRows(series)

  it('one row per date, ascending, with ISO dates and the area code and name first', () => {
    expect(rows).toHaveLength(series.rows.length)
    expect(rows[0]!.slice(0, 3)).toEqual(['72', 'Sulawesi Tengah', '2020-03-02'])
    const dates = rows.map((r) => r[2] as string)
    expect(dates).toEqual([...dates].sort())
  })
  it('every row has one cell per header column', () => {
    for (const r of rows) expect(r).toHaveLength(DOWNLOAD_HEADER.length)
  })
  it('null Rt and ODP become null cells (empty in the file), never 0', () => {
    const last = rows.at(-1)!
    const col = (name: string) => DOWNLOAD_HEADER.indexOf(name)
    expect(last[col('rt')]).toBeNull()
    expect(last[col('odp_total')]).toBeNull()
    expect(last[col('active_daily')]).toBe(0) // a real zero stays 0
  })
  it('the header is machine-friendly English and fixed', () => {
    expect(DOWNLOAD_HEADER.slice(0, 5)).toEqual(['area_code', 'area_name', 'date', 'positive_daily', 'recovered_daily'])
    expect(DOWNLOAD_HEADER).toContain('rt_lower')
    expect(DOWNLOAD_HEADER).toContain('pdp_finished')
  })
})
