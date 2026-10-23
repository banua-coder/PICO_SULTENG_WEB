import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { fetchJson } from '../../src/api/client'
import { isArrayOf, isWireNationalCase, isWireProvinceCase, isWireRegencyCase } from '../../src/api/guards'
import { nationalSeries, provinceSeries, regencySeries } from '../../src/api/normalize/series'
import { seriesPath } from '../../src/api/useSeries'
import type { AreaRef, Series } from '../../src/api/types'

// Build-time series loader for the snapshot and download scripts. Plain fetches with 3 attempts, a short pause between
// requests, and a one-day disk cache in .cache/ so a second build (or the e2e build) does not download 50 MB again.
// A failure after the third attempt throws, and the build stops (spec 15: with the API down the build fails).
const CACHE_DIR = fileURLToPath(new URL('../../.cache/series/', import.meta.url))
const TTL_MS = 24 * 3600_000
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function withRetries<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1500): Promise<T> {
  let last: unknown
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      last = e
      if (i < attempts) await sleep(delayMs * i)
    }
  }
  throw new Error(`${(last as Error).message} (after ${attempts} attempts)`)
}

export async function loadSeries(area: AreaRef): Promise<Series> {
  const path = seriesPath(area)
  mkdirSync(CACHE_DIR, { recursive: true })
  const file = `${CACHE_DIR}${area.level}-${area.code}.json`
  let wire: unknown
  if (!process.env.PICO_NO_CACHE && existsSync(file) && Date.now() - statSync(file).mtimeMs < TTL_MS) {
    wire = JSON.parse(readFileSync(file, 'utf8'))
  } else {
    wire = await withRetries(() =>
      fetchJson<unknown>(path, {
        guard: (area.level === 'indonesia' ? isArrayOf(isWireNationalCase) : area.level === 'provinsi' ? isArrayOf(isWireProvinceCase) : isArrayOf(isWireRegencyCase)) as (v: unknown) => v is unknown,
      }),
    )
    writeFileSync(file, JSON.stringify(wire))
    await sleep(150)
  }
  if (area.level === 'indonesia') return nationalSeries(area, wire as never)
  if (area.level === 'provinsi') return provinceSeries(area, wire as never)
  return regencySeries(area, wire as never)
}
