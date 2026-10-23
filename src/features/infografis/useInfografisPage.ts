import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInfographics } from '@/api/useContent'
import type { Infographic } from '@/api/types'

export const PAGE = 24

/** Newest first (highest id), then a case-insensitive title filter. Pure, so it is unit tested. */
export function filterInfographics(all: Infographic[], q: string): Infographic[] {
  const needle = q.trim().toLowerCase()
  return [...all].sort((a, b) => b.id - a.id).filter((i) => !needle || i.title.toLowerCase().includes(needle))
}

/** ?id as a positive integer, or null. */
export function parseId(v: unknown): number | null {
  const s = Array.isArray(v) ? v[0] : v
  return typeof s === 'string' && /^\d{1,9}$/.test(s) && Number(s) > 0 ? Number(s) : null
}

/** Search, paging by 24 and the open item (?id, C5) for the Infografis page. Opening and closing use router.replace. */
export function useInfografisPage() {
  const route = useRoute()
  const router = useRouter()
  const list = useInfographics()
  const q = ref('')
  const shown = ref(PAGE)
  watch(q, () => (shown.value = PAGE))

  const all = computed(() => list.data.value ?? [])
  const matches = computed(() => filterInfographics(all.value, q.value))
  const visible = computed(() => matches.value.slice(0, shown.value))
  const openId = computed(() => parseId(route.query.id))
  const open = computed(() => (openId.value === null ? null : (all.value.find((i) => i.id === openId.value) ?? null)))

  function setId(id: number | null) {
    const query = { ...route.query }
    if (id === null) delete query.id
    else query.id = String(id)
    void router.replace({ query })
  }
  return {
    list,
    q,
    total: computed(() => matches.value.length),
    visible,
    open,
    more: () => (shown.value += PAGE),
    openItem: (id: number) => setId(id),
    close: () => setId(null),
  }
}
