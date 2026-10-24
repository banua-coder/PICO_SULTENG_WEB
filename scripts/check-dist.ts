/**
 * Checks the built site (spec 15 and spec 80 link check):
 *  - 116 prerendered pages + 404.html, each with a unique <title>, a canonical and hreflang links, no inline state script
 *  - sitemap.xml lists the 116 URLs and each exists in dist
 *  - every internal link in every page points at a file that exists
 *  - the kabupaten snapshot has 13 rows
 * Exits 1 with the list of problems.
 */
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sitePaths } from '../src/app/siteRoutes'
import { fileForPath, read, walkHtml } from './site'

const decode = (s: string) => s.replace(/&amp;/g, '&')

/** Every `data-todo="id"` in the built pages: [id, page file]. */
export function findTodos(dist: string): [string, string][] {
  return walkHtml(dist).flatMap((f) => [...read(f).matchAll(/data-todo="([^"]+)"/g)].map((m) => [m[1]!, f.replace(dist, '')] as [string, string]))
}

/** Files in dist whose name starts with `band-`: the kabupaten band patterns (DESIGN.md), as files or as emitted chunks. */
export function findBands(dist: string): string[] {
  const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : /^band-/.test(e.name) ? [join(d, e.name)] : []))
  return existsSync(dist) ? walk(dist).map((f) => f.replace(dist, '')) : []
}

export function checkDist(dist: string, { kit = false, allowTodo = false, allowBands = false }: { kit?: boolean; allowTodo?: boolean; allowBands?: boolean } = {}): string[] {
  const problems: string[] = []
  const paths = sitePaths()
  const titles = new Map<string, string>()
  for (const p of paths) {
    const f = fileForPath(dist, p)
    if (!existsSync(f)) {
      problems.push(`missing page: ${p}`)
      continue
    }
    const html = read(f)
    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1]
    if (!title) problems.push(`no <title>: ${p}`)
    else if (titles.has(title)) problems.push(`duplicate <title> "${title}": ${titles.get(title)} and ${p}`)
    else titles.set(title, p)
    if (!/<link rel="canonical" href="https?:\/\/[^"]+"/.test(html)) problems.push(`no canonical: ${p}`)
    if (!/hreflang="x-default"/.test(html)) problems.push(`no hreflang x-default: ${p}`)
    if (html.includes('__INITIAL_STATE__')) problems.push(`inline state script: ${p}`)
  }
  if (!existsSync(join(dist, '404.html'))) problems.push('missing 404.html')

  const sm = existsSync(join(dist, 'sitemap.xml')) ? read(join(dist, 'sitemap.xml')) : ''
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!)
  if (locs.length !== paths.length) problems.push(`sitemap lists ${locs.length} URLs, expected ${paths.length}`)
  for (const l of locs) if (!existsSync(fileForPath(dist, new URL(l).pathname))) problems.push(`sitemap URL without a file: ${l}`)

  // links: only absolute paths of our own site. External links, mailto and tel are not checked here.
  const seen = new Set<string>()
  for (const f of walkHtml(dist)) {
    if (!kit && /[\\/]_kit[\\/]|_kit\.html/.test(f)) continue
    for (const m of read(f).matchAll(/\shref="(\/[^"]*)"/g)) {
      const href = decode(m[1]!)
      if (href.startsWith('//') || seen.has(href)) continue
      seen.add(href)
      if (!existsSync(fileForPath(dist, href))) problems.push(`broken link ${href} (in ${f.replace(dist, '')})`)
    }
  }

  const snap = join(dist, 'data/kabupaten-latest.json')
  if (existsSync(snap)) {
    const rows = JSON.parse(read(snap)) as { latest: { date: string } }[]
    if (rows.length !== 13) problems.push(`kabupaten snapshot has ${rows.length} rows, expected 13`)
  } else problems.push('missing data/kabupaten-latest.json')
  // Unreviewed content (open item O-5): a visible TODO marker in a page. Branch builds may carry them, releases may not.
  if (!allowTodo) for (const [id, file] of findTodos(dist)) problems.push(`unreviewed TODO "${id}" in ${file} (PICO_ALLOW_TODO=1 lets a branch build pass, a release must not)`)
  // The 14 band strips are interpretations that wait for the cultural review (pico-jlc.8): they must not be fetchable from a normal build.
  if (!allowBands) for (const f of findBands(dist)) problems.push(`band pattern in the build: ${f} (only a VITE_MAP_BANDS=1 build may have it; pico-jlc.8 is open)`)
  return problems
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = fileURLToPath(new URL('../dist/', import.meta.url))
  const todos = findTodos(dist)
  const ids = [...new Set(todos.map(([id]) => id))]
  if (ids.length) console.log(`TODO markers in the build (${ids.length}): ${ids.join(', ')}`)
  const problems = checkDist(dist, { kit: !!process.env.VITE_KIT, allowTodo: !!process.env.PICO_ALLOW_TODO, allowBands: !!process.env.VITE_MAP_BANDS })
  if (problems.length) {
    console.error(problems.join('\n') + `\n${problems.length} problem(s) in dist/`)
    process.exit(1)
  }
  console.log('dist ok: 116 pages + 404.html, unique titles, canonical and hreflang, sitemap, no broken internal link')
}
