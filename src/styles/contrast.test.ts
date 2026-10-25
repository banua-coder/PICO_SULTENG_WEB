// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Every colour pair the site draws, from the tokens, in light and dark (docs/contrast-audit.md). WCAG 2.2: text 4.5:1, large text and
// non-text (UI boundaries, icons, focus rings, graphics) 3:1. The e2e scan (e2e/contrast.spec.ts) checks the rendered pages; this test
// keeps the token values themselves from drifting.
const dir = fileURLToPath(new URL('.', import.meta.url))
const css = ['palette.css', 'palette-vaccine.css', 'palette-ramps.css'].map((f) => readFileSync(`${dir}${f}`, 'utf8')).join('\n')

const blocks = (selector: RegExp) => [...css.matchAll(new RegExp(`${selector.source}\\s*\\{([^}]*)\\}`, 'g'))].map((m) => m[1]!)
const vars = (body: string) => new Map([...body.matchAll(/(--pico-[a-z0-9_-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]))
const merge = (...ms: Map<string, string>[]) => new Map(ms.flatMap((m) => [...m]))
const rootOnly = blocks(/:root(?=\s*\{)/).map(vars)
const lightSel = blocks(/:root,\s*\[data-theme='light'\]/).map(vars)
const darkSel = blocks(/\[data-theme='dark'\]/).map(vars)
const darkMedia = blocks(/:root:not\(\[data-theme='light'\]\)/).map(vars)
const light = merge(...rootOnly, ...lightSel)
const dark = merge(light, ...darkSel)

const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const rgb = (hex: string) => [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255)) as [number, number, number]
const lum = (hex: string) => {
  const [r, g, b] = rgb(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
const val = (theme: Map<string, string>, name: string): string => {
  let v = theme.get(`--pico-${name}`)
  for (let i = 0; v?.startsWith('var(') && i < 5; i++) v = theme.get(v.slice(4, -1))
  if (!v || !/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`--pico-${name} is not a 6-digit hex in this theme: ${v}`)
  return v
}

type Need = 4.5 | 3
// [foreground, background, need, where]
const TEXT_GROUNDS = ['paper', 'surface', 'cotton-deep', 'tint']
const PAIRS: [string, string, Need, string][] = [
  ...['ink', 'ink-muted', 'primary-strong'].flatMap((fg) => TEXT_GROUNDS.map((bg) => [fg, bg, 4.5, 'body text, links, muted labels (hover rows are tint)'] as [string, string, Need, string])),
  ...['positive-ink', 'active-ink', 'recovered-ink', 'deceased-ink'].map((fg) => [fg, 'surface', 4.5, 'case card name and figure'] as [string, string, Need, string]),
  ...['total', 'elderly', 'public_officer', 'health_worker', 'public', 'teenager'].map((g) => [`vg-${g}-ink`, 'surface', 4.5, 'vaccine card figures'] as [string, string, Need, string]),
  ['on-primary', 'primary', 4.5, 'primary button, blue CTA panels'],
  ['on-primary', 'primary-hover', 4.5, 'primary button and CTAs on hover'],
  ['on-indigo', 'indigo', 4.5, 'skip link'],
  ['on-bar', 'bar', 4.5, 'mobile tab bar'],
  ['on-bar-active', 'bar', 4.5, 'mobile tab bar, current page'],
  ['on-test', 'test-pcr-ground', 4.5, 'PCR panel'],
  ['on-test', 'test-rdt-ground', 4.5, 'RDT panel'],
  ['ramp-paper', 'ramp-positive-9', 4.5, 'map number on the darkest Positif fill'],
  ['ramp-ink', 'ramp-active-1', 4.5, 'map number on the lightest fill'],
  // non-text
  ...TEXT_GROUNDS.map((bg) => ['line-strong', bg, 3, 'input and control borders, map outlines'] as [string, string, Need, string]),
  ...TEXT_GROUNDS.map((bg) => ['primary-strong', bg, 3, 'focus ring'] as [string, string, Need, string]),
  ...TEXT_GROUNDS.map((bg) => ['indigo', bg, 3, 'notice borders and icons, selected map area, vaccine dose 2 line'] as [string, string, Need, string]),
  ['on-primary', 'primary', 3, 'focus ring on a blue panel (.focus-on-fill)'],
  ['on-primary', 'bar', 3, 'focus ring on the tab bar (.focus-on-fill)'],
  ['ink-muted', 'surface', 3, 'select chevrons and icons'],
  ['active-ink', 'tint', 3, 'home link-card icons on hover'],
  ['rt', 'surface', 3, 'Rt line and its bounds'],
  ['positive', 'surface', 3, 'Positif line, bars, marks'],
  ['active', 'surface', 3, 'Dirawat line, bars, marks'],
  ['ink', 'surface', 3, 'peak bar, crosshair, Rt = 1 line'],
]
/**
 * Legacy fills that keep the owner's exact hex in light mode though they are under 3:1 on white (WCAG 1.4.11 is met another way: the value
 * is printed, the series has its own line form, mark and label, the chart has a table view). Text in these hues uses the -ink step.
 * Adding to this list needs a row in docs/contrast-audit.md.
 */
const LEGACY_LIGHT_FILLS: Record<string, number> = { recovered: 2.54, deceased: 2.8 }

describe.each([
  ['light', light],
  ['dark', dark],
] as const)('%s tokens', (name, theme) => {
  it.each(PAIRS)('%s on %s >= %s (%s)', (fg, bg, need) => {
    expect(contrast(val(theme, fg), val(theme, bg))).toBeGreaterThanOrEqual(need)
  })

  it('the legacy fills: exact hex, and only the listed ones fall under 3:1 on the card', () => {
    for (const role of ['recovered', 'deceased']) {
      const r = contrast(val(theme, role), val(theme, 'surface'))
      if (name === 'light') expect(r.toFixed(2)).toBe(LEGACY_LIGHT_FILLS[role]!.toFixed(2))
      else expect(r).toBeGreaterThanOrEqual(3)
    }
    expect([val(theme, 'recovered'), val(theme, 'deceased')]).toEqual(['#10b981', '#f97316'])
    expect(val(light, 'positive')).toBe('#991b1b')
    expect(val(light, 'active')).toBe('#2563eb')
  })
})

describe('theme blocks', () => {
  it('the prefers-color-scheme dark block repeats [data-theme=dark] exactly', () => {
    expect(darkSel.length).toBe(darkMedia.length)
    darkSel.forEach((b, i) => expect(Object.fromEntries(darkMedia[i]!)).toEqual(Object.fromEntries(b)))
  })
})

// Colour-blind separation of the four case colours (Machado et al. 2009, severity 1, in linear RGB), OKLab distance x 100.
// Colour is never the only cue (mark shape, line form, label), so this guards against regressions rather than proving legibility.
const MACHADO: Record<string, number[][]> = {
  none: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
}
const oklab = ([r, g, b]: number[]) => {
  const l = Math.cbrt(0.4122214708 * r! + 0.5363325363 * g! + 0.0514459929 * b!)
  const m = Math.cbrt(0.2119034982 * r! + 0.6806995451 * g! + 0.1073969566 * b!)
  const s = Math.cbrt(0.0883024619 * r! + 0.2817188376 * g! + 0.6299787005 * b!)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}
export function cvdDistance(a: string, b: string, kind: keyof typeof MACHADO) {
  const sim = (hex: string) => MACHADO[kind]!.map((row) => Math.min(1, Math.max(0, row.reduce((s, k, i) => s + k * rgb(hex)[i]!, 0))))
  const [p, q] = [oklab(sim(a)), oklab(sim(b))]
  return Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!) * 100
}

describe('colour-blind separation of the case colours', () => {
  const roles = ['positive', 'active', 'recovered', 'deceased']
  const pairs = roles.flatMap((a, i) => roles.slice(i + 1).map((b) => [a, b] as const))
  // light is the legacy palette (worst: Sembuh / Meninggal under deuteranopia, 11.5); dark was 2.3 (Positif / Meninggal, tritanopia)
  // before the exact legacy green and orange came back to dark mode
  it.each([
    ['light', 11],
    ['dark', 6.5],
  ] as const)('%s: every pair stays at least %s apart, also under protan, deutan and tritan', (name, min) => {
    const theme = name === 'light' ? light : dark
    for (const kind of ['none', 'protan', 'deutan', 'tritan'] as const)
      for (const [a, b] of pairs) expect(cvdDistance(val(theme, a), val(theme, b), kind), `${a}/${b} ${kind}`).toBeGreaterThanOrEqual(min)
  })
  it('dark: Positif and Meninggal are clearly apart for normal vision (red-500 and orange-600 were 5.8)', () => {
    expect(cvdDistance(val(dark, 'positive'), val(dark, 'deceased'), 'none')).toBeGreaterThanOrEqual(10)
  })
})
