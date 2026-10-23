import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * A full-length provincial series (1,414 days, 2020-03-02 to 2024-01-14) in the wire shape, built from one fixture row.
 * The recorded fixtures keep only the edges of a series, and a table needs the real length. Positive is day % 7 so values differ.
 */
export function synthProvinceSeries(days = 1414): string {
  const fx = JSON.parse(readFileSync(fileURLToPath(new URL('../../test/fixtures/api/province-72-cases.json', import.meta.url)), 'utf8'))
  const tpl = fx.data[0]
  const start = Date.UTC(2020, 2, 2)
  const data = Array.from({ length: days }, (_, i) => {
    const date = new Date(start + i * 864e5).toISOString().slice(0, 10)
    const r = structuredClone(tpl)
    r.day = i + 1
    r.date = `${date}T00:00:00+07:00`
    r.daily.positive = i % 7
    r.cumulative.positive = i * 3
    // ODP/PDP are reported until 2022-05-08 (day 798)
    const reported = i < 798
    r.cumulative.odp.total = reported ? 10 + (i % 5) : 0
    r.cumulative.pdp.total = reported ? 4 : 0
    return r
  })
  return JSON.stringify({ ...fx, data: data.reverse() })
}
