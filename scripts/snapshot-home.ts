/**
 * Build-time cut for the home page -> public/data/home-latest.json (C2 `HomeLatest`): last Rt, last vaccination day, newest
 * infographics. The series are too big for a page's initial state, and the home page must make no series request, so the build
 * reads them (from the same disk cache as the other build scripts) and keeps only the few numbers the page shows.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { fetchJson } from '../src/api/client'
import { ENDPOINTS } from '../src/api/endpoints'
import { isArrayOf, isWireInfographic, isWireVaccinationDay } from '../src/api/guards'
import { infographics } from '../src/api/normalize/content'
import { vaccinationSeries } from '../src/api/normalize/vaccination'
import { INDONESIA, SULTENG } from '../src/app/areas'
import { buildHomeLatest } from '../src/app/homeLatest'
import { loadSeries, withRetries } from './lib/series'

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const vacc = (path: string) => withRetries(() => fetchJson(path, { guard: isArrayOf(isWireVaccinationDay) })).then(vaccinationSeries)
    const home = buildHomeLatest({
      national: (await loadSeries(INDONESIA)).rows,
      sulteng: (await loadSeries(SULTENG)).rows,
      vaccination: { indonesia: await vacc(ENDPOINTS.vaccinationNational.path), 'sulawesi-tengah': await vacc(ENDPOINTS.vaccinationProvince.path) },
      infographics: await withRetries(() => fetchJson(ENDPOINTS.infographics.path, { guard: isArrayOf(isWireInfographic) })).then(infographics),
    })
    const dir = fileURLToPath(new URL('../public/data/', import.meta.url))
    mkdirSync(dir, { recursive: true })
    writeFileSync(`${dir}home-latest.json`, JSON.stringify(home) + '\n')
    console.log(`home-latest.json: Rt ${home.rt.indonesia?.date} / ${home.rt['sulawesi-tengah']?.date}, vaccination ${home.vaccination.indonesia?.date}, ${home.infographics.length} infographics`)
  } catch (e) {
    console.error(`snapshot-home failed: ${(e as Error).message}`)
    process.exit(1)
  }
}
