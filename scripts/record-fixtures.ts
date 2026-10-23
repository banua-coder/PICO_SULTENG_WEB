/**
 * Records every C1 endpoint to test/fixtures/api/<name>.json (raw envelope, series trimmed).
 *   pnpm fixtures:record           write fixtures from the live API
 *   pnpm fixtures:check            drift check, used by the nightly job (spec 80). Exits 1 on drift.
 * Drift = the endpoint fails, the envelope no longer unwraps, the payload is empty, or the key set of
 * the first row differs from the recorded fixture. W08 adds the wire guards to the check.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { ENDPOINTS } from '../src/api/endpoints'
import { unwrap } from '../src/api/envelope'
import { trimEnvelope } from './trim'

const BASE = (process.env.VITE_API_BASE_URL || 'https://pico-api.banuacoder.com/api/v1').replace(/\/+$/, '')
const DIR = fileURLToPath(new URL('../test/fixtures/api/', import.meta.url))
const check = process.argv.includes('--check')

async function get(path: string): Promise<unknown> {
  let last: unknown
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(30_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      last = e
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw last
}

const firstRow = (payload: unknown): Record<string, unknown> | undefined => {
  const p = Array.isArray(payload) ? payload[0] : payload
  return typeof p === 'object' && p !== null ? (p as Record<string, unknown>) : undefined
}
const keys = (o: Record<string, unknown> | undefined) => Object.keys(o ?? {}).sort().join(',')

let failed = 0
await mkdir(DIR, { recursive: true })
for (const ep of Object.values(ENDPOINTS)) {
  const file = `${DIR}${ep.name}.json`
  try {
    const body = await get(ep.path)
    const payload = unwrap(body)
    if (Array.isArray(payload) && payload.length === 0 && ep.name !== 'banners') throw new Error('empty list')
    if (check) {
      const recorded = unwrap(JSON.parse(await readFile(file, 'utf8')))
      if (keys(firstRow(payload)) !== keys(firstRow(recorded))) throw new Error(`row keys changed: ${keys(firstRow(payload))}`)
      console.log(`ok    ${ep.name}`)
    } else {
      await writeFile(file, JSON.stringify(trimEnvelope(body, 'trim' in ep ? ep.trim : undefined)) + '\n')
      console.log(`wrote ${ep.name}`)
    }
  } catch (e) {
    failed++
    console.error(`FAIL  ${ep.name} (${ep.path}): ${(e as Error).message}`)
  }
}
if (failed) {
  console.error(`${failed} endpoint(s) drifted or failed`)
  process.exit(1)
}
