/**
 * Build-time file public/data/last-real.json: the last real day of each province and kabupaten/kota (map date rule, see
 * src/app/homeLatest.ts). The series come from the same one-day disk cache as the other build scripts.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { KABUPATEN_AREAS, PROVINCE_AREAS } from '../src/app/areas'
import { lastRealDate } from '../src/app/homeLatest'
import type { LastRealDates } from '../src/app/homeLatest'
import { loadSeries } from './lib/series'

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const out: LastRealDates = { provinsi: {}, kabupaten: {} }
    for (const a of PROVINCE_AREAS) {
      const d = lastRealDate((await loadSeries(a)).rows)
      if (d) out.provinsi[a.code] = d
    }
    for (const a of KABUPATEN_AREAS) {
      const d = lastRealDate((await loadSeries(a)).rows)
      if (d) out.kabupaten[a.code] = d
    }
    const dir = fileURLToPath(new URL('../public/data/', import.meta.url))
    mkdirSync(dir, { recursive: true })
    writeFileSync(`${dir}last-real.json`, JSON.stringify(out) + '\n')
    const all = [...Object.values(out.provinsi), ...Object.values(out.kabupaten)].sort()
    console.log(`last-real.json: ${all.length} areas, ${all[0]} to ${all.at(-1)}`)
  } catch (e) {
    console.error(`snapshot-lastreal failed: ${(e as Error).message}`)
    process.exit(1)
  }
}
