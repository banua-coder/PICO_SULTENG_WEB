import type { Hospital, LatestByArea } from '@/api/types'
import { SULTENG } from '@/app/areas'

/** The 34 provinces by cumulative positive (descending), Sulawesi Tengah pinned first, optionally filtered by name. Pure. */
export function provinceRows(list: LatestByArea[], filter = ''): LatestByArea[] {
  const needle = filter.trim().toLowerCase()
  const sorted = [...list].sort((a, b) => b.latest.cumulative.positive - a.latest.cumulative.positive || a.area.name.localeCompare(b.area.name, 'id'))
  const pinned = sorted.filter((l) => l.area.code === SULTENG.code)
  const rest = sorted.filter((l) => l.area.code !== SULTENG.code)
  return [...pinned, ...rest].filter((l) => !needle || l.area.name.toLowerCase().includes(needle))
}

/** 32-bit FNV-1a, enough to shuffle a few dozen codes. */
function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return h >>> 0
}

/** `n` hospitals chosen by a seed (the day): the same ones for the whole day and on the server and the client. */
export function dailyPick(list: Hospital[], day: string, n = 3): Hospital[] {
  return [...list].sort((a, b) => hash(`${day}:${a.code}`) - hash(`${day}:${b.code}`) || a.code.localeCompare(b.code)).slice(0, n)
}

/** Today's calendar day in Asia/Jakarta, YYYY-MM-DD. */
export const jakartaDay = (now = new Date()): string => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now)
