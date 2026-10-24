import { area, line } from 'd3-shape'
import { scaleLinear } from 'd3-scale'
import type { IsoDate } from '@/api/types'
import type { BandPoint } from '../types'
import { dayNumber } from './days'
import { DOWNSAMPLE_ABOVE } from './downsample'
import { MARGIN_BOTTOM, MARGIN_LEFT, MARGIN_TOP, marginRight } from './model'
import { xTicks, yTicks } from './scales'

export const RT_Y_MAX = 4

export type RtModelInput = { points: BandPoint[]; range?: [IsoDate, IsoDate]; width: number; height: number; yMax?: number }
export type ClippedRun = { date: IsoDate; value: number; x: number }

type Filled = { x: IsoDate; y: number; lo: number; hi: number }
const filled = (p: BandPoint): p is Filled => p.y !== null

/** Bucket-max reduction for a band: one point per pixel column, the one with the highest estimate (peaks survive). Gaps stay gaps. */
function reduce(points: BandPoint[], columns: number): BandPoint[] {
  if (points.length <= DOWNSAMPLE_ABOVE || points.length <= columns) return points
  const size = points.length / columns
  const out: BandPoint[] = []
  for (let c = 0; c < columns; c++) {
    const slice = points.slice(Math.floor(c * size), Math.floor((c + 1) * size))
    const best = slice.filter(filled).reduce<Filled | undefined>((m, p) => (!m || p.y > m.y ? p : m), undefined)
    const kept = best ?? slice[0]
    if (kept) out.push(kept)
  }
  return out
}

/**
 * Everything RtChart draws. The y axis is 0..4 by default. A value above it is drawn at the top edge and gets a clipped marker
 * with its number (one per run of consecutive clipped days, at the highest one). `null` breaks the thread and the band.
 */
export function buildRtModel({ points, range, width, height, yMax = RT_Y_MAX }: RtModelInput) {
  const right = marginRight(width)
  const plotW = Math.max(1, width - MARGIN_LEFT - right)
  const plotH = Math.max(1, height - MARGIN_TOP - MARGIN_BOTTOM)
  const visible = points.filter((p) => !range || (p.x >= range[0] && p.x <= range[1]))
  const dates = visible.map((p) => p.x)
  const first = range?.[0] ?? dates[0] ?? ''
  const last = range?.[1] ?? dates.at(-1) ?? ''
  const d0 = first ? dayNumber(first) : 0
  const d1 = last ? Math.max(dayNumber(last), d0 + 1) : 1
  const x = scaleLinear().domain([d0, d1]).range([0, plotW])
  const y = scaleLinear().domain([0, yMax]).range([plotH, 0])
  const clip = (v: number) => Math.min(Math.max(v, 0), yMax)

  const drawn = reduce(visible, Math.round(plotW))
  const thread = line<BandPoint>()
    .defined(filled)
    .x((p) => x(dayNumber(p.x)))
    .y((p) => y(clip(p.y as number)))
  const band = area<BandPoint>()
    .defined(filled)
    .x((p) => x(dayNumber(p.x)))
    .y0((p) => y(clip(p.lo as number)))
    .y1((p) => y(clip(p.hi as number)))

  // clipped runs are found in the full visible data, not the reduced one, so a spike is never lost
  const clipped: ClippedRun[] = []
  let run: Filled | undefined
  for (const p of [...visible, { x: '', y: null, lo: null, hi: null } as BandPoint]) {
    if (filled(p) && p.y > yMax) run = !run || p.y > run.y ? p : run
    else if (run) {
      clipped.push({ date: run.x, value: run.y, x: x(dayNumber(run.x)) })
      run = undefined
    }
  }

  const lastReal = [...visible].reverse().find(filled)
  const xt = xTicks([first || '1970-01-01', last || '1970-01-02'], plotW)
  const hasAny = visible.some(filled)
  return {
    width,
    height,
    margin: { top: MARGIN_TOP, right, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT },
    plotW,
    plotH,
    dates,
    hasAny,
    yMax,
    threshold: yMax >= 1 ? y(1) : null,
    thread: hasAny ? (thread(drawn) ?? '') : '',
    band: hasAny ? (band(drawn) ?? '') : '',
    clipped,
    end: lastReal ? { x: x(dayNumber(lastReal.x)), y: y(clip(lastReal.y)), value: lastReal.y } : null,
    x: (iso: IsoDate) => x(dayNumber(iso)),
    xInvert: (px: number) => x.invert(px),
    y: (v: number) => y(clip(v)),
    yTicks: yTicks([0, yMax]).map((v) => ({ value: v, pos: y(v) })),
    xTicks: { kind: xt.kind, ticks: xt.ticks.map((t) => ({ date: t, pos: x(dayNumber(t)) })) },
    visible,
    valueAt: (date: IsoDate): { value: number; lo: number; hi: number } | null => {
      const p = visible.find((q) => q.x === date)
      return p && filled(p) ? { value: p.y, lo: p.lo, hi: p.hi } : null
    },
  }
}

export type RtModel = ReturnType<typeof buildRtModel>
