import type { Role } from '../charts/types'

// Contract C4 (map part)
/** The four case numbers of an area, for the tooltip. null = the source has no number (a kabupaten has no "dirawat"). */
export type MapDetail = { positive: number | null; active: number | null; recovered: number | null; deceased: number | null }
/** `date`: the area's own last real day, the day its numbers are from */
export type MapItem = { code: string; name: string; value: number | null; date?: string; detail?: MapDetail }
export type MapMetric = { label: string; role: Role }
export type MapMode = 'choropleth' | 'points'

/** Props both maps (kabupaten, province) hand to GeoMap. */
export type MapProps = {
  items: MapItem[]
  metric: MapMetric
  selected?: string
  hrefFor?: (code: string) => string
  /** Sebaran (default): areas filled by class. Titik: proportional marks. */
  mode?: MapMode
  /** the area the map shows, for the title "Peta sebaran kasus ... di {area}" */
  areaName?: string
  /** ISO date of the numbers (the oldest last real day of the areas), for the legend title */
  date?: string
  /** the newest last real day when the areas differ: the legend title then says "from to" */
  dateEnd?: string
  /** an area code listed first in the table (Sulawesi Tengah) */
  pin?: string
}
