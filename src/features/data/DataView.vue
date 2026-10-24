<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NotFoundView from '@/app/NotFoundView.vue'
import { areaBySlug, INDONESIA, SULTENG } from '@/app/areas'
import { useLocale } from '@/app/useLocale'
import DataPage from './DataPage.vue'
import { areaFromLevelQuery, areaPath } from './useDataPage'

// C5: /data shows Sulawesi Tengah, /data/indonesia the country, and the slug routes a province or kabupaten.
// A slug that is not in the table is the 404 page (C1 Q9: the table decides, not the API).
const route = useRoute()
const router = useRouter()
const { localize } = useLocale()
// A shared link may carry the level and the area as query (?tingkat=nasional|provinsi|kabupaten&wilayah=<slug>): it moves to that area's
// page and keeps the other filters. The area pages themselves are the canonical, prerendered URLs.
const wanted = areaFromLevelQuery(route.query)
if (wanted) {
  const { tingkat: _t, wilayah: _w, ...rest } = route.query
  void router.replace({ path: localize(areaPath(wanted)), query: rest })
}
const area = computed(() => {
  const name = String(route.name).replace(/\.en$/, '')
  if (name === 'data') return SULTENG
  if (name === 'data-nasional') return INDONESIA
  return areaBySlug(name === 'data-provinsi' ? 'provinsi' : 'kabupaten', String(route.params.slug))
})
const isDataRoot = computed(() => String(route.name).replace(/\.en$/, '') === 'data')
</script>

<template>
  <NotFoundView v-if="!area" />
  <DataPage v-else :key="`${area.level}:${area.code}`" :area="area" :is-root="isDataRoot" />
</template>
