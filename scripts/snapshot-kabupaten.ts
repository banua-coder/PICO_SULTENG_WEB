/**
 * Build-time snapshot of the latest row of the 13 kabupaten/kota -> public/data/kabupaten-latest.json (C2 `LatestByArea[]`).
 * Workaround for API ask A3 (`/regencies?include_latest_case=true`, PR #91, not deployed everywhere). Delete this script and
 * set VITE_REGENCY_LATEST=api once the API ships it.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { KABUPATEN_AREAS } from '../src/app/areas'
import type { LatestByArea } from '../src/api/types'
import { loadSeries } from './lib/series'

export async function snapshotKabupaten(): Promise<LatestByArea[]> {
  const out: LatestByArea[] = []
  for (const area of KABUPATEN_AREAS) {
    const s = await loadSeries(area)
    const latest = s.rows.at(-1)
    if (!latest) throw new Error(`no rows for ${area.name}`)
    out.push({ area, latest })
  }
  return out
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const rows = await snapshotKabupaten()
    const dir = fileURLToPath(new URL('../public/data/', import.meta.url))
    mkdirSync(dir, { recursive: true })
    writeFileSync(`${dir}kabupaten-latest.json`, JSON.stringify(rows) + '\n')
    console.log(`kabupaten-latest.json: ${rows.length} rows, latest ${[...new Set(rows.map((r) => r.latest.date))].join(', ')}`)
  } catch (e) {
    console.error(`snapshot-kabupaten failed: ${(e as Error).message}`)
    process.exit(1)
  }
}
