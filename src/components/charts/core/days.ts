import type { IsoDate } from '@/api/types'

const DAY = 86_400_000

/** UTC day number of 'YYYY-MM-DD'. Calendar dates only: no time zone can move a day (C1 Q1). */
export const dayNumber = (iso: IsoDate): number => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / DAY

export const isoFromDay = (n: number): IsoDate => new Date(Math.round(n) * DAY).toISOString().slice(0, 10)
