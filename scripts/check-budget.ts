/**
 * Size budget on dist/ (spec 80, ADR-0103). Prints a table and exits 1 when something is over, or when a heavy library
 * (xlsx, d3) is part of a page's initial JavaScript. Sizes are gzip, measured from the built files.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { fileForPath, read, walkHtml } from './site'

const KB = 1024
// The shadcn-vue redesign (reka-ui primitives, Select, Tabs, Dialog) added about 9 KB to the home page and 13 KB to the pages with a Select;
// the limits moved by that much (was 90 / 110). Calendar, sheet, d3 and xlsx stay out of the first load.
export const LIMITS = { beranda: 100 * KB, data: 160 * KB, other: 125 * KB, css: 30 * KB, fonts: 70 * KB, geo: 40 * KB, html: 60 * KB }
export type Limits = typeof LIMITS

/** Library chunks that must never be in the initial JS of a page. Named by manualChunks in vite.config.ts. */
export const FORBIDDEN_INITIAL = /^(?:xlsx|d3)[-_.]/i

const gz = (buf: Buffer | string) => gzipSync(buf, { level: 9 }).length

/** Files a page loads before it can run: its module script and its modulepreload links (entry, route chunk, shared chunks). */
export function initialScripts(html: string): string[] {
  const out = new Set<string>()
  for (const m of html.matchAll(/<script[^>]*\ssrc="(\/assets\/[^"]+\.js)"/g)) out.add(m[1]!)
  for (const m of html.matchAll(/<link[^>]*rel="modulepreload"[^>]*\shref="(\/assets\/[^"]+\.js)"/g)) out.add(m[1]!)
  return [...out]
}

export type Row = { item: string; value: number; limit: number; ok: boolean; note?: string }

const walkFiles = (dir: string): string[] =>
  existsSync(dir) ? readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walkFiles(join(dir, n)) : [join(dir, n)])) : []

export function checkBudget(dist: string, geoDir: string, limits: Partial<Limits> = {}): { rows: Row[]; problems: string[] } {
  const L = { ...LIMITS, ...limits }
  const rows: Row[] = []
  const problems: string[] = []
  const add = (item: string, value: number, limit: number, note?: string) => {
    const ok = value <= limit
    rows.push({ item, value, limit, ok, note })
    if (!ok) problems.push(`${item}: ${value} B is over the budget of ${limit} B${note ? ` (${note})` : ''}`)
  }

  const initial = (route: string) => {
    const html = fileForPath(dist, route)
    if (!existsSync(html)) {
      problems.push(`missing page for the budget: ${route}`)
      return { size: 0, files: [] as string[] }
    }
    const files = initialScripts(read(html))
    let size = 0
    for (const f of files) {
      const p = join(dist, f)
      if (!existsSync(p)) problems.push(`${route} loads a missing file: ${f}`)
      else size += gz(readFileSync(p))
      if (FORBIDDEN_INITIAL.test(f.split('/').pop()!)) problems.push(`${route} loads ${f} in its initial JS (heavy library)`)
    }
    return { size, files }
  }

  add('Beranda initial JS', initial('/').size, L.beranda)
  add('Data initial JS', initial('/data/provinsi/sulawesi-tengah').size, L.data)
  const others = walkHtml(dist)
    .map((f) => '/' + f.replace(dist, '').replace(/^[\\/]/, '').replace(/index\.html$/, '').replace(/\.html$/, '').replace(/[\\/]$/, ''))
    .filter((r) => r !== '/' && !r.startsWith('/data') && !r.startsWith('/en/data') && r !== '/en' && !/^\/(404|_kit)|\/_kit/.test(r))
  let worst = { route: '', size: 0 }
  for (const r of others) {
    const s = initial(r).size
    if (s > worst.size) worst = { route: r, size: s }
  }
  add('Other routes, largest initial JS', worst.size, L.other, worst.route)

  const assets = walkFiles(join(dist, 'assets'))
  add('CSS total', assets.filter((f) => f.endsWith('.css')).reduce((n, f) => n + gz(readFileSync(f)), 0), L.css)
  add('Fonts', assets.filter((f) => f.endsWith('.woff2')).reduce((n, f) => n + statSync(f).size, 0), L.fonts)
  add('Map path JSON (both)', walkFiles(geoDir).filter((f) => f.endsWith('.paths.json')).reduce((n, f) => n + gz(readFileSync(f)), 0), L.geo)
  const biggest = walkHtml(dist).reduce((m, f) => Math.max(m, gz(readFileSync(f))), 0)
  add('Largest prerendered HTML', biggest, L.html)
  return { rows, problems }
}

export function table(rows: Row[]): string {
  const kb = (n: number) => `${(n / KB).toFixed(1)} KB`
  const w = Math.max(...rows.map((r) => r.item.length))
  return rows.map((r) => `${r.ok ? 'ok  ' : 'OVER'}  ${r.item.padEnd(w)}  ${kb(r.value).padStart(9)} / ${kb(r.limit).padStart(8)}${r.note ? `  (${r.note})` : ''}`).join('\n')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const { rows, problems } = checkBudget(join(root, 'dist'), join(root, 'src/components/maps/geo'))
  console.log(table(rows))
  if (problems.length) {
    console.error('\n' + problems.join('\n'))
    process.exit(1)
  }
}
