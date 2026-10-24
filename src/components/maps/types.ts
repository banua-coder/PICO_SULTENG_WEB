import type { Role } from '../charts/types'

// Contract C4 (map part)
export type MapItem = { code: string; name: string; value: number | null }
export type MapMetric = { label: string; role: Role }
