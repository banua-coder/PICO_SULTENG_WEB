import { line } from 'd3-shape'
import { scaleLinear } from 'd3-scale'
import type { IsoDate } from '@/api/types'
import type { LineSeries, Point, Role, SeriesForm } from '../types'
import { dayNumber } from './days'
import { downsampleMax } from './downsample'
import { spreadLabels, weeklySums, xTicks, yDomain, yTicks } from './scales'

export type ModelInput = {
  series: LineSeries[]
  kind: 'line' | 'bar'
  /** A line drawn over bars (a moving average). It shares the y scale, the tooltip and the table. Ignored in line mode. */
  overlay?: LineSeries
  range?: [IsoDate, IsoDate]
  width: number
  height: number
}

export type Bar = { x: number; y: number; w: number; h: number; value: number; date: IsoDate }
export type SeriesModel = {
  id: string
  role: Role
  label: string
  form?: SeriesForm
  /** SVG path data. A null value starts a new sub-path (the line breaks). Empty when there is nothing to draw. */
  path: string
  bars: Bar[]
  /** drawn as a line over the bars */
  overlay: boolean
  end: { x: number; y: number; labelY: number; value: number } | null
}

export const MARGIN_TOP = 12
export const MARGIN_BOTTOM = 28
export const MARGIN_LEFT = 52

export const marginRight = (width: number) => (width < 480 ? 84 : 104)

/** Everything a chart draws, as numbers. Pure, so gaps, ticks and bucketing are unit tested. */
export function buildModel({ series: base, kind, overlay, range, width, height }: ModelInput) {
  const series = overlay && kind === 'bar' ? [...base, overlay] : base
  const right = marginRight(width)
  const plotW = Math.max(1, width - MARGIN_LEFT - right)
  const plotH = Math.max(1, height - MARGIN_TOP - MARGIN_BOTTOM)

  const inRange = (p: Point) => !range || (p.x >= range[0] && p.x <= range[1])
  const visible = series.map((s) => s.points.filter(inRange))
  const dates = [...new Set(visible.flatMap((pts) => pts.map((p) => p.x)))].sort()
  const first = range?.[0] ?? dates[0] ?? ''
  const last = range?.[1] ?? dates.at(-1) ?? ''

  const d0 = first ? dayNumber(first) : 0
  const d1 = last ? Math.max(dayNumber(last), d0 + 1) : 1
  const x = scaleLinear().domain([d0, d1]).range([0, plotW])
  const domain = yDomain(visible)
  const y = scaleLinear().domain(domain).range([plotH, 0])

  const weekly = kind === 'bar' && (width < 360 || plotW / Math.max(1, dates.length) < 1.5)
  const slotDays = weekly ? 7 : 1
  const slotW = Math.max(1, (plotW * slotDays) / Math.max(1, d1 - d0))

  const toPath = line<Point>()
    .defined((p) => p.y !== null)
    .x((p) => x(dayNumber(p.x)))
    .y((p) => y(p.y as number))

  const models: SeriesModel[] = series.map((s, si) => {
    const pts = visible[si]!
    const lastReal = [...pts].reverse().find((p) => p.y !== null)
    const end = lastReal ? { x: x(dayNumber(lastReal.x)), y: y(lastReal.y as number), labelY: 0, value: lastReal.y as number } : null
    if (kind === 'line' || si >= base.length) return { id: s.id, role: s.role, label: s.label, form: s.form, path: toPath(downsampleMax(pts, Math.round(plotW))) ?? '', bars: [], overlay: kind === 'bar', end }
    const src = weekly ? weeklySums(pts) : pts
    const per = base.length
    const barW = Math.max(1, (slotW * 0.8) / per)
    const zero = y(0)
    const bars = src.flatMap((p): Bar[] =>
      p.y === null || p.y <= 0
        ? []
        : [{ x: x(dayNumber(p.x)) - slotW * 0.4 + si * barW, y: y(p.y), w: barW, h: Math.max(0, zero - y(p.y)), value: p.y, date: p.x }],
    )
    return { id: s.id, role: s.role, label: s.label, form: s.form, path: '', bars, overlay: false, end }
  })

  // direct labels at the line ends, pushed apart so they never overlap
  const withEnd = models.filter((m) => m.end)
  const spread = spreadLabels(withEnd.map((m) => m.end!.y), 14, 6, plotH)
  withEnd.forEach((m, i) => (m.end!.labelY = spread[i]!))

  const xt = xTicks([first || '1970-01-01', last || '1970-01-02'], plotW)
  return {
    width,
    height,
    margin: { top: MARGIN_TOP, right, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT },
    plotW,
    plotH,
    dates,
    weekly,
    domain,
    x: (iso: IsoDate) => x(dayNumber(iso)),
    xInvert: (px: number) => x.invert(px),
    y: (v: number) => y(v),
    yTicks: yTicks(domain).map((v) => ({ value: v, pos: y(v) })),
    xTicks: { kind: xt.kind, ticks: xt.ticks.map((t) => ({ date: t, pos: x(dayNumber(t)) })) },
    series: models,
    /** Value of every series on a date, for the tooltip, the live region and the table. */
    valuesAt: (date: IsoDate) =>
      series.map((s, si) => ({ id: s.id, role: s.role, label: s.label, form: s.form, value: visible[si]!.find((p) => p.x === date)?.y ?? null })),
    visible,
  }
}

export type ChartModel = ReturnType<typeof buildModel>
