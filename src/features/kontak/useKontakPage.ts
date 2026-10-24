import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHospitals, useTaskForces } from '@/api/useContent'
import type { AreaRef, Hospital, TaskForceGroup } from '@/api/types'
import { areaBySlug } from '@/app/areas'

/** ?kabupaten as a known kabupaten, or null for "all". Unknown values mean all. */
export function parseKabupaten(v: unknown): AreaRef | null {
  const s = Array.isArray(v) ? v[0] : v
  return typeof s === 'string' ? (areaBySlug('kabupaten', s) ?? null) : null
}

/** Hospitals by kabupaten name then hospital name. A hospital without a known kabupaten shows only under "all". */
export function filterHospitals(all: Hospital[], k: AreaRef | null): Hospital[] {
  return all
    .filter((h) => !k || h.kabupaten?.code === k.code)
    .sort((a, b) => (a.kabupaten?.name ?? '').localeCompare(b.kabupaten?.name ?? '', 'id') || a.name.localeCompare(b.name, 'id'))
}

export function filterTaskForces(all: TaskForceGroup[], k: AreaRef | null): TaskForceGroup[] {
  return all.filter((g) => !k || g.kabupaten.code === k.code).sort((a, b) => a.kabupaten.name.localeCompare(b.kabupaten.name, 'id'))
}

/** https://www.openstreetmap.org link for a point, or null. */
export const osmUrl = (loc: Hospital['location']) => (loc ? `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lon}#map=17/${loc.lat}/${loc.lon}` : null)

export function useKontakPage() {
  const route = useRoute()
  const router = useRouter()
  const hospitals = useHospitals()
  const taskForces = useTaskForces()
  const kabupaten = computed(() => parseKabupaten(route.query.kabupaten))
  return {
    hospitals,
    taskForces,
    kabupaten,
    hospitalRows: computed(() => filterHospitals(hospitals.data.value ?? [], kabupaten.value)),
    taskForceRows: computed(() => filterTaskForces(taskForces.data.value ?? [], kabupaten.value)),
    setKabupaten(k: AreaRef | null) {
      const query = { ...route.query }
      if (k) query.kabupaten = k.slug
      else delete query.kabupaten
      void router.replace({ query })
    },
  }
}
