import type { IsoDate } from '../types'

/** First 10 characters of an API timestamp (C1 Q1). Never re-zoned, never compared as an instant. */
export const isoDate = (stamp: string): IsoDate => stamp.slice(0, 10)
