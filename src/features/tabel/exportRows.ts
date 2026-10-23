import type { Cell } from '@/app/csv'
import type { DailyRow } from '@/api/types'
import { numberFor } from './columns'
import type { Column } from './columns'

// Same names as the full download files (DOWNLOAD_HEADER in csv.ts), so a view and a full file can be joined.
const HEADER: Record<Exclude<Column['key'], 'rt'>, string> = {
  dailyPositive: 'positive_daily',
  dailyRecovered: 'recovered_daily',
  dailyDeceased: 'deceased_daily',
  dailyActive: 'active_daily',
  cumPositive: 'positive_cumulative',
  cumRecovered: 'recovered_cumulative',
  cumDeceased: 'deceased_cumulative',
  cumActive: 'active_cumulative',
  odp: 'odp_total',
  pdp: 'pdp_total',
}

/** Header and rows of the exported file: date first, one column per visible table column, and Rt split into value, lower and upper. */
export function exportTable(rowsDesc: DailyRow[], cols: Column[]): { header: string[]; rows: Cell[][] } {
  const header: string[] = ['date']
  for (const c of cols) {
    if (c.key === 'rt') header.push('rt', 'rt_lower', 'rt_upper')
    else header.push(HEADER[c.key])
  }
  const rows = rowsDesc.map((r) => {
    const row: Cell[] = [r.date]
    for (const c of cols) {
      if (c.key === 'rt') row.push(r.rt?.value ?? null, r.rt?.lower ?? null, r.rt?.upper ?? null)
      else row.push(numberFor(c, r))
    }
    return row
  })
  return { header, rows }
}

export const exportFileName = (slug: string, from: string, to: string, ext: 'csv' | 'xlsx') => `pico-${slug}-${from}-${to}.${ext}`

/** Save a Blob as a file through a temporary link. Browser only. */
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
