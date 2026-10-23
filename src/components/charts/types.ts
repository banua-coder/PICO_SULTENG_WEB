import type { IsoDate } from '@/api/types'

// Contract C4 shared types. A chart knows the data roles of DESIGN.md and nothing about the API.
export type Role = 'positive' | 'recovered' | 'deceased' | 'active' | 'rt'
export type Point = { x: IsoDate; y: number | null } // null = gap, the line breaks
export type LineSeries = { id: string; role: Role; label: string; points: Point[] }
export type BandPoint = { x: IsoDate; y: number; lo: number; hi: number } | { x: IsoDate; y: null; lo: null; hi: null }
export type BarDatum = { key: string; label: string; value: number | null; role: Role }
export type ChartA11y = { title: string; summary: string } // summary: one sentence, written by the feature, read by screen readers
