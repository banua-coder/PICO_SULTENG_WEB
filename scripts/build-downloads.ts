/**
 * Full download files (ADR-0100, spec 15), built from the same normalisers as the site so they match it:
 *   public/unduh/indonesia.csv          national series
 *   public/unduh/provinsi.csv           all 34 provinces, long format
 *   public/unduh/kabupaten-sulteng.csv  the 13 kabupaten/kota of Sulawesi Tengah, long format
 * and the same three as .xlsx (SheetJS, built here at deploy time. The on-click export in the table stays a lazy chunk).
 * Exits non-zero when the API stays down after 3 attempts.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'
import { INDONESIA, KABUPATEN_AREAS, PROVINCE_AREAS } from '../src/app/areas'
import { DOWNLOAD_HEADER, seriesRows, toCsv } from '../src/app/csv'
import type { Cell } from '../src/app/csv'
import { loadSeries } from './lib/series'

export type DownloadFile = { name: string; rows: Cell[][] }

export async function buildFiles(): Promise<DownloadFile[]> {
  const national = seriesRows(await loadSeries(INDONESIA))
  const provinces: Cell[][] = []
  for (const a of PROVINCE_AREAS) provinces.push(...seriesRows(await loadSeries(a)))
  const kabupaten: Cell[][] = []
  for (const a of KABUPATEN_AREAS) kabupaten.push(...seriesRows(await loadSeries(a)))
  return [
    { name: 'indonesia', rows: national },
    { name: 'provinsi', rows: provinces },
    { name: 'kabupaten-sulteng', rows: kabupaten },
  ]
}

export function toXlsx(sheet: string, rows: Cell[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet([DOWNLOAD_HEADER, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheet)
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', compression: true }) as Buffer
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const dir = fileURLToPath(new URL('../public/unduh/', import.meta.url))
    mkdirSync(dir, { recursive: true })
    for (const f of await buildFiles()) {
      writeFileSync(`${dir}${f.name}.csv`, toCsv(DOWNLOAD_HEADER, f.rows))
      writeFileSync(`${dir}${f.name}.xlsx`, toXlsx(f.name.slice(0, 31), f.rows))
      console.log(`unduh/${f.name}: ${f.rows.length} rows (csv + xlsx)`)
    }
  } catch (e) {
    console.error(`build-downloads failed: ${(e as Error).message}`)
    process.exit(1)
  }
}
