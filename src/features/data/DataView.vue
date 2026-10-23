<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NotFoundView from '@/app/NotFoundView.vue'
import PagePlaceholder from '@/components/layout/PagePlaceholder.vue'
import { areaBySlug, INDONESIA, SULTENG } from '@/app/areas'

// C5: /data shows Sulawesi Tengah, /data/indonesia the country, and the slug routes a province or kabupaten.
// A slug that is not in the table is a 404 (C1 Q9: the table decides, not the API).
const route = useRoute()
const { t } = useI18n()
const area = computed(() => {
  const name = String(route.name).replace(/\.en$/, '')
  if (name === 'data') return SULTENG
  if (name === 'data-nasional') return INDONESIA
  return areaBySlug(name === 'data-provinsi' ? 'provinsi' : 'kabupaten', String(route.params.slug))
})
</script>

<template>
  <NotFoundView v-if="!area" />
  <PagePlaceholder v-else page="data" :heading="t('data.areaTitle', { area: area.name })" />
</template>
