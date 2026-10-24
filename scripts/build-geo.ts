/**
 * Build-time maps (ADR-0098, spec 22): read the two GeoJSON files, join every feature to a BPS code through the
 * slug table of contract C5, project with d3-geo, simplify to about 0.5 px, and write SVG path data.
 *
 *   pnpm build:geo      writes src/components/maps/geo/{sulteng,indonesia}.paths.json
 *
 * Exits non-zero when a feature has no match, matches twice, or a province or kabupaten has no feature.
 * d3-geo is a dev dependency only: the browser receives path strings and no map library.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { geoMercator } from 'd3-geo'
import { KABUPATEN_AREAS, PROVINCE_AREAS, kabupatenApiName } from '../src/app/areas'

type Pos = number[]
type MultiPolygon = { type: 'MultiPolygon'; coordinates: Pos[][][] }
type Polygon = { type: 'Polygon'; coordinates: Pos[][] }
type Feature = { properties: Record<string, unknown>; geometry: MultiPolygon | Polygon }
type Collection = { features: Feature[] }
export type Joined = { code: string; geometry: MultiPolygon }
export type PathItem = { code: string; d: string; cx: number; cy: number; labelX: number; labelY: number }

/** Names in indonesia.json that differ from the API names once upper-cased. */
export const INDONESIA_ALIASES: Record<string, string> = { 'DI YOGYAKARTA': '34' }

const asMulti = (g: Feature['geometry']): MultiPolygon => (g.type === 'Polygon' ? { type: 'MultiPolygon', coordinates: [g.coordinates] } : g)

function join(src: Collection, lookup: (f: Feature) => { key: string; code: string | undefined }, expected: string[]): Joined[] {
  const out: Joined[] = []
  const seen = new Set<string>()
  const unmatched: string[] = []
  const dups: string[] = []
  for (const f of src.features) {
    const { key, code } = lookup(f)
    if (!code) unmatched.push(key)
    else if (seen.has(code)) dups.push(key)
    else {
      seen.add(code)
      out.push({ code, geometry: asMulti(f.geometry) })
    }
  }
  const missing = expected.filter((c) => !seen.has(c))
  const problems = [
    unmatched.length && `unmatched feature(s): ${unmatched.join(', ')}`,
    dups.length && `duplicate feature(s): ${dups.join(', ')}`,
    missing.length && `missing code(s) with no feature: ${missing.join(', ')}`,
  ].filter(Boolean)
  if (problems.length) throw new Error(`geo join failed: ${problems.join('; ')}`)
  return out
}

export function joinSulteng(src: Collection): Joined[] {
  const byApiName = new Map(KABUPATEN_AREAS.map((a) => [kabupatenApiName(a.code), a.code]))
  return join(src, (f) => ({ key: String(f.properties.id), code: byApiName.get(String(f.properties.id)) }), KABUPATEN_AREAS.map((a) => a.code))
}

export function joinIndonesia(src: Collection): Joined[] {
  const byName = new Map(PROVINCE_AREAS.map((a) => [a.name.toUpperCase(), a.code]))
  for (const [name, code] of Object.entries(INDONESIA_ALIASES)) byName.set(name, code)
  return join(src, (f) => ({ key: String(f.properties.name), code: byName.get(String(f.properties.name).toUpperCase()) }), PROVINCE_AREAS.map((a) => a.code))
}

/** Signed shoelace area of a ring. */
export function polygonArea(ring: Pos[]): number {
  let a = 0
  for (let i = 0; i < ring.length - 1; i++) a += ring[i]![0]! * ring[i + 1]![1]! - ring[i + 1]![0]! * ring[i]![1]!
  return a / 2
}

function centroid(ring: Pos[]): Pos {
  const area = polygonArea(ring)
  if (Math.abs(area) < 1e-9) return [ring[0]![0]!, ring[0]![1]!]
  let cx = 0
  let cy = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const k = ring[i]![0]! * ring[i + 1]![1]! - ring[i + 1]![0]! * ring[i]![1]!
    cx += (ring[i]![0]! + ring[i + 1]![0]!) * k
    cy += (ring[i]![1]! + ring[i + 1]![1]!) * k
  }
  return [cx / (6 * area), cy / (6 * area)]
}

function distToSegment(p: Pos, a: Pos, b: Pos): number {
  const dx = b[0]! - a[0]!
  const dy = b[1]! - a[1]!
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0]! - a[0]!) * dx + (p[1]! - a[1]!) * dy) / len2))
  return Math.hypot(p[0]! - (a[0]! + t * dx), p[1]! - (a[1]! + t * dy))
}

function dp(pts: Pos[], tol: number, lo: number, hi: number, keep: boolean[]) {
  let far = -1
  let max = tol
  for (let i = lo + 1; i < hi; i++) {
    const d = distToSegment(pts[i]!, pts[lo]!, pts[hi]!)
    if (d > max) {
      max = d
      far = i
    }
  }
  if (far >= 0) {
    keep[far] = true
    dp(pts, tol, lo, far, keep)
    dp(pts, tol, far, hi, keep)
  }
}

/** Douglas-Peucker. A closed ring is anchored at its first point and the point farthest from it. */
export function simplify(pts: Pos[], tol: number): Pos[] {
  if (pts.length < 3) return pts
  const keep = new Array<boolean>(pts.length).fill(false)
  keep[0] = true
  keep[pts.length - 1] = true
  const closed = pts[0]![0] === pts.at(-1)![0] && pts[0]![1] === pts.at(-1)![1]
  if (closed) {
    let far = 1
    let max = -1
    for (let i = 1; i < pts.length - 1; i++) {
      const d = Math.hypot(pts[i]![0]! - pts[0]![0]!, pts[i]![1]! - pts[0]![1]!)
      if (d > max) {
        max = d
        far = i
      }
    }
    keep[far] = true
    dp(pts, tol, 0, far, keep)
    dp(pts, tol, far, pts.length - 1, keep)
  } else dp(pts, tol, 0, pts.length - 1, keep)
  return pts.filter((_, i) => keep[i])
}

const round1 = (n: number) => Math.round(n * 10) / 10
const fmt = (n: number) => String(round1(n))

export type BuildOptions = { tolerance?: number; minArea?: number; smallArea?: number; leader?: number }

/**
 * Project, simplify and write path data. `box` is the viewBox size. Rings under `minArea` px² are dropped, but the
 * largest polygon of an area always stays. An area whose polygons add up to less than `smallArea` px² gets its label pushed outwards, away from the middle of the map.
 */
export function buildPaths(joined: Joined[], box: [number, number], opts: BuildOptions = {}): PathItem[] {
  const { tolerance = 0.5, minArea = 2, smallArea = 0, leader = 44 } = opts
  const everything: Pos[] = joined.flatMap((j) => j.geometry.coordinates.flatMap((poly) => poly.flat()))
  // fit with points, not polygons: d3-geo reads polygons as spherical shapes and cares about winding order
  const projection = geoMercator().fitSize(box, { type: 'MultiPoint', coordinates: everything })
  const project = (ring: Pos[]): Pos[] => ring.map((p) => projection(p as [number, number]) as Pos)

  const built = joined.map((j) => {
    const polys = j.geometry.coordinates.map((poly) => poly.map((ring) => simplify(project(ring), tolerance)).filter((r) => r.length >= 4))
    const sized = polys.filter((p) => p.length > 0).map((p) => ({ p, area: Math.abs(polygonArea(p[0]!)) }))
    const largest = sized.reduce((a, b) => (b.area > a.area ? b : a))
    const kept = sized.filter((s) => s === largest || s.area >= minArea)
    return { code: j.code, kept, largest }
  })

  const all = built.flatMap((b) => b.kept.flatMap((k) => k.p[0]!))
  const mid: Pos = [(Math.min(...all.map((p) => p[0]!)) + Math.max(...all.map((p) => p[0]!))) / 2, (Math.min(...all.map((p) => p[1]!)) + Math.max(...all.map((p) => p[1]!))) / 2]

  return built
    .map(({ code, kept, largest }): PathItem => {
      const d = kept.map((k) => k.p.map((ring) => `M${ring.map((p) => `${fmt(p[0]!)} ${fmt(p[1]!)}`).join('L')}Z`).join('')).join('')
      const [cx = 0, cy = 0] = centroid(largest.p[0]!)
      const small = kept.reduce((sum, k) => sum + k.area, 0) < smallArea
      let lx = cx
      let ly = cy
      if (small) {
        const vx = cx - mid[0]!
        const vy = cy - mid[1]!
        const n = Math.hypot(vx, vy) || 1
        lx = Math.min(box[0] - 8, Math.max(8, cx + (vx / n) * leader))
        ly = Math.min(box[1] - 8, Math.max(8, cy + (vy / n) * leader))
      }
      return { code, d, cx: round1(cx), cy: round1(cy), labelX: round1(lx), labelY: round1(ly) }
    })
    .sort((a, b) => a.code.localeCompare(b.code))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const read = (n: string) => JSON.parse(readFileSync(fileURLToPath(new URL(`./geo-src/${n}.json`, import.meta.url)), 'utf8')) as Collection
  const outDir = fileURLToPath(new URL('../src/components/maps/geo/', import.meta.url))
  mkdirSync(outDir, { recursive: true })
  try {
    const jobs: [string, Joined[], [number, number]][] = [
      ['sulteng', joinSulteng(read('sulteng')), [800, 600]],
      ['indonesia', joinIndonesia(read('indonesia')), [1000, 420]],
    ]
    for (const [name, joined, box] of jobs) {
      const paths = buildPaths(joined, box, name === 'sulteng' ? { smallArea: 4000, leader: 46 } : { smallArea: 250, leader: 30 })
      writeFileSync(`${outDir}${name}.paths.json`, JSON.stringify(paths) + '\n')
      console.log(`${name}: ${paths.length} areas, ${JSON.stringify(paths).length} bytes`)
    }
  } catch (e) {
    console.error((e as Error).message)
    process.exit(1)
  }
}
