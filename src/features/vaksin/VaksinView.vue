<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useVaccineLocations } from '@/api/useStats'
import { usePageHead } from '@/app/head'
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
  <div class="px-5 py-8">
    <h1 class="text-2xl">{{ t('vaksin.heading') }}</h1>
    <fieldset class="m-0 mt-6 flex flex-wrap items-center gap-3 border-0 p-0">
      <legend class="mb-2 text-sm font-strong text-ink-muted">{{ t('vaksin.scope') }}</legend>
      <label
        v-for="s in SCOPES"
        :key="s.key"
        class="inline-flex min-h-touch min-w-touch cursor-pointer items-center justify-center rounded-sm border px-4 text-sm font-strong"
        :class="scope === s.key ? 'border-indigo bg-indigo text-on-indigo' : 'border-line-strong bg-surface text-ink'"
      >
        <input type="radio" name="vaksin-scope" class="sr-only" :value="s.key" :checked="scope === s.key" @change="setScope(s.key)">
        {{ t(s.label) }}
      </label>
    </fieldset>
    <div class="mt-8"><VaksinBody :key="scope" :scope="scope" /></div>
    <div class="mt-10">
      <VaccineLocations v-if="locations.data.value" :items="locations.data.value" />
      <StatusView v-else-if="locations.status.value === 'error'" kind="error" compact @retry="locations.refresh" />
      <div v-else class="min-h-[12rem]"><StatusView kind="loading" compact /></div>
    </div>
  </div>
</template>
