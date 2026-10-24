import type { Series } from '@/api/types'

export type Cell = string | number | null

/** UTF-8 with BOM, comma separated, CRLF lines, `null` as an empty cell, raw numbers. Excel reads it through "Data > From Text/CSV". */
export function toCsv(header: string[], rows: Cell[][]): string {
  const cell = (v: Cell): string => {
    if (v === null) return ''
    if (typeof v === 'number') return String(v)
    // a text cell that starts like a formula would run in a spreadsheet: mark it as text
    const t = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
    return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  return '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'
}

/** The columns of the prebuilt download files, in order. Dates are ISO, numbers are raw. */
export const DOWNLOAD_HEADER = [
  'area_code',
  'area_name',
  'date',
  'positive_daily',
  'recovered_daily',
  'deceased_daily',
  'active_daily',
  'positive_cumulative',
  'recovered_cumulative',
  'deceased_cumulative',
  'active_cumulative',
  'rt',
  'rt_lower',
  'rt_upper',
  'odp_active',
  'odp_finished',
  'odp_total',
  'pdp_active',
  'pdp_finished',
  'pdp_total',
]

/** One row per date for a series, in DOWNLOAD_HEADER order. */
export function seriesRows(s: Series): Cell[][] {
  return s.rows.map((r) => [
    s.area.code,
    s.area.name,
    r.date,
    r.daily.positive,
    r.daily.recovered,
    r.daily.deceased,
    r.daily.active,
    r.cumulative.positive,
    r.cumulative.recovered,
    r.cumulative.deceased,
    r.cumulative.active,
    r.rt?.value ?? null,
    r.rt?.lower ?? null,
    r.rt?.upper ?? null,
    r.odp?.active ?? null,
    r.odp?.finished ?? null,
    r.odp?.total ?? null,
    r.pdp?.active ?? null,
    r.pdp?.finished ?? null,
    r.pdp?.total ?? null,
  ])
}
