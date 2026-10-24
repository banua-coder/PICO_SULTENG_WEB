<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useVaccineLocations } from '@/api/useStats'
import { usePageHead } from '@/app/head'
import OptionToggle from '@/components/OptionToggle.vue'
import StatusView from '@/components/StatusView.vue'
import VaccineLocations from './components/VaccineLocations.vue'
import VaksinBody from './components/VaksinBody.vue'
import { parseScope } from './useVaksin'
import type { Scope } from './useVaksin'

// Spec 60. Scope in the URL (?wilayah=indonesia, default Sulawesi Tengah). Locations are a small resource: prerendered.
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const scope = computed(() => parseScope(route.query.wilayah))
const locations = useVaccineLocations()
usePageHead({ title: () => t('vaksin.title'), description: () => t('vaksin.description') })

const SCOPES: { key: Scope; label: string }[] = [
  { key: 'sulawesi-tengah', label: 'vaksin.sulteng' },
  { key: 'indonesia', label: 'vaksin.indonesia' },
]
function setScope(s: Scope) {
  const query = { ...route.query }
  if (s === 'indonesia') query.wilayah = 'indonesia'
  else delete query.wilayah
  void router.replace({ query })
}
</script>

<template>
  <div class="px-4 py-6">
    <h1 class="text-xl md:text-2xl">{{ t('vaksin.heading') }}</h1>
    <OptionToggle class="mt-4" :model-value="scope" :options="SCOPES.map((x) => ({ value: x.key, label: t(x.label) }))" :label="t('vaksin.scope')" @update:model-value="setScope" />
    <div class="mt-8"><VaksinBody :key="scope" :scope="scope" /></div>
    <div class="mt-8">
      <VaccineLocations v-if="locations.data.value" :items="locations.data.value" />
      <StatusView v-else-if="locations.status.value === 'error'" kind="error" compact @retry="locations.refresh" />
      <div v-else class="min-h-[12rem]"><StatusView kind="loading" compact /></div>
    </div>
  </div>
</template>
