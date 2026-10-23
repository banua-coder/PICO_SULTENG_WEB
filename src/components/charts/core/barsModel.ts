import type { BarDatum } from '../types'

export const H_ROW = 56 // label line + bar + gap
export const H_BAR = 20
const V_PLOT = 200
const V_LINE = 14
const MAX_LABEL_LINES = 3
const VALUE_ROOM = 76 // px kept free at the end of a horizontal bar for its number

/** Break a label into lines of at most `maxChars` characters at spaces (a long word stays whole). */
export function wrapLabel(label: string, maxChars: number): string[] {
  const lines: string[] = []
  for (const word of label.split(/\s+/).filter(Boolean)) {
    const last = lines.at(-1)
    if (last !== undefined && last.length + 1 + word.length <= maxChars) lines[lines.length - 1] = `${last} ${word}`
    else lines.push(word)
  }
  return lines.length ? lines : ['']
}

export type BarGeometry = {
  key: string
  label: string
  lines: string[]
  role: BarDatum['role']
  value: number | null
  /** rect of the woven bar, absent for null */
  rect: { x: number; y: number; w: number; h: number } | null
  /** where the number sits: end of the bar on plain ground, or the "not available" text */
  valueAt: { x: number; y: number; anchor: 'start' | 'middle' }
  labelAt: { x: number; y: number; anchor: 'start' | 'middle' }
}

/** Geometry of category bars. Pure: bar length is proportional to value, null has no bar, values over `max` fill the bar. */
export function buildBars(opts: { items: BarDatum[]; orientation: 'horizontal' | 'vertical'; max?: number; width: number }) {
  const { items, orientation, width } = opts
  const top = Math.max(1, opts.max ?? Math.max(1, ...items.map((i) => i.value ?? 0)))
  const frac = (v: number) => Math.min(1, Math.max(0, v / top))

  if (orientation === 'horizontal') {
    const trackW = Math.max(40, width - VALUE_ROOM)
    const bars: BarGeometry[] = items.map((it, i) => {
      const y0 = i * H_ROW
      const barY = y0 + 22
      const w = it.value === null ? 0 : Math.max(it.value > 0 ? 2 : 0, frac(it.value) * trackW)
      return {
        key: it.key,
        label: it.label,
        lines: [it.label],
        role: it.role,
        value: it.value,
        rect: it.value === null ? null : { x: 0, y: barY, w, h: H_BAR },
        valueAt: it.value === null ? { x: 0, y: barY + H_BAR / 2, anchor: 'start' } : { x: w + 8, y: barY + H_BAR / 2, anchor: 'start' },
        labelAt: { x: 0, y: y0 + 8, anchor: 'start' },
      }
    })
    return { height: Math.max(H_ROW, items.length * H_ROW), bars, orientation }
  }

  const slot = width / Math.max(1, items.length)
  const barW = Math.min(56, slot * 0.6)
  const maxChars = Math.max(6, Math.floor(slot / 6.5))
  const bars: BarGeometry[] = items.map((it, i) => {
    const cx = slot * i + slot / 2
    const h = it.value === null ? 0 : Math.max(it.value > 0 ? 2 : 0, frac(it.value) * (V_PLOT - 24))
    const lines = wrapLabel(it.label, maxChars).slice(0, MAX_LABEL_LINES)
    return {
      key: it.key,
      label: it.label,
      lines,
      role: it.role,
      value: it.value,
      rect: it.value === null ? null : { x: cx - barW / 2, y: V_PLOT - h, w: barW, h },
      valueAt: { x: cx, y: it.value === null ? V_PLOT - 8 : V_PLOT - h - 8, anchor: 'middle' },
      labelAt: { x: cx, y: V_PLOT + 16, anchor: 'middle' },
    }
  })
  return { height: V_PLOT + 10 + MAX_LABEL_LINES * V_LINE + 8, bars, orientation }
}
