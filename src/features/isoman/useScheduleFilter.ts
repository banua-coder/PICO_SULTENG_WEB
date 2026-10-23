import { computed, ref } from 'vue'
import type { Telemedicine } from '@/api/types'

export const DAY_NAMES = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'] as const
const index = (name: string): number | undefined => {
  const i = DAY_NAMES.indexOf(name.toLowerCase().replace(/[^a-z]/g, '') as (typeof DAY_NAMES)[number])
  return i === -1 ? undefined : i + 1
}

/** Weekdays 1 (Senin) to 7 (Minggu) from a free-text `operational_day`, or null when the text does not parse. */
export function parseDays(text: string): Set<number> | null {
  const t = text.trim().toLowerCase()
  if (/^(setiap|tiap)\s+hari$/.test(t)) return new Set([1, 2, 3, 4, 5, 6, 7])
  const days = new Set<number>()
  for (const part of t.split(/\s*(?:,|&|\bdan\b)\s*/)) {
    const range = /^([a-z']+)\s*(?:-|–|s\.?d\.?|sampai)\s*([a-z']+)$/.exec(part)
    if (range) {
      const a = index(range[1]!)
      const b = index(range[2]!)
      if (!a || !b) return null
      for (let d = a; ; d = (d % 7) + 1) { // "Jumat-Senin" wraps around the week
        days.add(d)
        if (d === b) break
      }
    } else {
      const d = index(part)
      if (!d) return null
      days.add(d)
    }
  }
  return days.size ? days : null
}

/** True when the doctor can be reached on `day` (1 to 7). Anything that does not parse stays visible under every filter. */
export function worksOn(t: Pick<Telemedicine, 'schedules'>, day: number): boolean {
  if (t.schedules.length === 0) return true
  return t.schedules.some((s) => {
    const days = parseDays(s.days)
    return days === null || days.has(day)
  })
}

/** Day filter state: 0 is "all days". */
export function useScheduleFilter(list: () => Telemedicine[]) {
  const day = ref(0)
  const rows = computed(() => (day.value === 0 ? list() : list().filter((t) => worksOn(t, day.value))))
  return { day, rows }
}
