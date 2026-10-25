// Summarises a contrast audit run (playwright.audit.config.ts): `tsx scripts/contrast-report.ts <label> [--json]`.
// Prints every distinct failing pair (state, kind, colours, note) with the runs it fails in, the axe results and the small touch targets.
import { readdirSync, readFileSync } from 'node:fs'

type Pair = { kind: string; selector: string; sample: string; fg: string; bg: string; ratio: number; need: number; exempt?: string; note?: string; state: string; shot?: string }
type Run = { route: string; theme: string; width: number; pairs: Pair[]; axe: { violations: { id: string; nodes: { target: string }[] }[]; incomplete: unknown[] }; early: { target: string }[]; targets: { sel: string; w: number; h: number; inline: boolean }[] }

const label = process.argv[2] ?? 'after'
const dir = `audit-results/contrast/${label}/`
const runs: Run[] = readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('modes')).map((f) => JSON.parse(readFileSync(dir + f, 'utf8')))

const group = (p: Pair) => [p.state.split(':')[0], p.kind, p.fg, p.bg, (p.note ?? '').replace(/ \d+$/, '').replace(/over .*/, 'over shape')].join(' | ')
const failing = new Map<string, { p: Pair; runs: Set<string>; n: number }>()
let total = 0
let pairs = 0
for (const r of runs) {
  pairs += r.pairs.length
  for (const p of r.pairs) {
    if (p.exempt || p.ratio >= p.need) continue
    total++
    const k = group(p)
    const e = failing.get(k) ?? { p, runs: new Set(), n: 0 }
    e.runs.add(`${r.route} ${r.theme} ${r.width}`)
    e.n++
    failing.set(k, e)
  }
}
const axe = runs.flatMap((r) => r.axe.violations.map((v) => `${r.route} ${r.theme} ${r.width}: ${v.id} ${v.nodes.map((n) => n.target).join(' | ')}`))
const early = runs.flatMap((r) => r.early.map((n) => `${r.route} ${r.theme} ${r.width}: ${n.target}`))
const targets = new Map<string, string>()
for (const r of runs) for (const t of r.targets) if (!t.inline && t.w > 1 && (t.w < 24 || t.h < 24)) targets.set(t.sel, `${t.w}x${t.h} ${r.route} ${r.width}`)

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ runs: runs.length, pairs, failing: total, distinct: [...failing].map(([k, v]) => ({ k, ratio: v.p.ratio, need: v.p.need, n: v.n, runs: [...v.runs], selector: v.p.selector, sample: v.p.sample, shot: v.p.shot })), axe, early, targets: [...targets] }, null, 1))
} else {
  console.log(`${runs.length} runs, ${pairs} pairs checked, ${total} failing pair instances, ${failing.size} distinct`)
  for (const [k, v] of [...failing].sort((a, b) => a[1].p.ratio - b[1].p.ratio))
    console.log(`${v.p.ratio.toFixed(2)}/${v.p.need} x${v.n} [${v.runs.size} runs] ${k}\n    ${v.p.selector.slice(-110)} "${v.p.sample}" e.g. ${[...v.runs][0]}`)
  console.log(`\naxe violations: ${axe.length}`)
  axe.forEach((a) => console.log('  ' + a))
  console.log(`axe colour-contrast without the animation wait: ${early.length}`)
  early.forEach((a) => console.log('  ' + a))
  const alt = new Map<string, number>()
  for (const r of runs) for (const p of r.pairs) if (p.exempt?.startsWith('alt:') && p.ratio < p.need) alt.set(`${p.exempt} | ${p.fg} on ${p.bg} ${p.ratio}`, (alt.get(`${p.exempt} | ${p.fg} on ${p.bg} ${p.ratio}`) ?? 0) + 1)
  console.log(`graphics under 3:1 with a declared alternative (data-contrast-alt): ${alt.size} distinct`)
  ;[...alt].sort().forEach(([k, n]) => console.log(`  x${n} ${k}`))
  console.log(`targets under 24 px (not inline): ${targets.size}`)
  targets.forEach((v, k) => console.log(`  ${k} ${v}`))
}
