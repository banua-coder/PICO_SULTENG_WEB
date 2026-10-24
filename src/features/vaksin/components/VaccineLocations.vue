<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { VaccineLocation } from '@/api/types'
import { areaBySlug } from '@/app/areas'
import SectionHeading from '@/components/SectionHeading.vue'
import { groupLocations, kabupatenWithSites } from '../useVaksin'

// The 2021 to 2022 list of sites (spec 60). The filter is a native select: it keeps focus when the list changes.
const props = defineProps<{ items: VaccineLocation[] }>()
const { t } = useI18n()
const slug = ref('')
const options = computed(() => kabupatenWithSites(props.items))
const groups = computed(() => groupLocations(props.items, slug.value ? (areaBySlug('kabupaten', slug.value) ?? null) : null, t('vaksin.locUnknown')))
const count = computed(() => groups.value.reduce((n, g) => n + g.sites.length, 0))
const doses = (s: VaccineLocation) => [s.firstDose ? t('vaksin.dose1') : '', s.secondDose ? t('vaksin.dose2') : ''].filter(Boolean).join(', ') || t('vaksin.noDoseInfo')
</script>

<template>
  <section aria-labelledby="lokasi" data-testid="locations">
    <SectionHeading id="lokasi" :level="2">{{ t('vaksin.locTitle') }}</SectionHeading>
    <p class="mt-3 max-w-prose text-ink-muted">{{ t('vaksin.locNote') }}</p>
    <div class="mt-4 flex flex-col gap-2">
      <label for="loc-filter" class="text-sm font-strong text-ink-muted">{{ t('vaksin.locFilter') }}</label>
      <select id="loc-filter" v-model="slug" class="min-h-touch max-w-xs rounded-sm border border-line-strong bg-surface px-4 text-ink">
        <option value="">{{ t('vaksin.locAll') }}</option>
        <option v-for="k in options" :key="k.code" :value="k.slug">{{ k.name }}</option>
      </select>
    </div>
    <p role="status" aria-live="polite" class="mt-3 text-sm text-ink-muted">{{ t('vaksin.shown', { shown: count, total: items.length }) }}</p>
    <p v-if="groups.length === 0" class="mt-3">{{ t('vaksin.locEmpty') }}</p>
    <div class="mt-4 flex flex-col gap-6">
      <section v-for="g in groups" :key="g.code" :aria-labelledby="`loc-${g.code}`">
        <h3 :id="`loc-${g.code}`" class="text-lg">{{ g.name }}</h3>
        <ul class="m-0 mt-3 grid list-none gap-4 p-0 md:grid-cols-2">
          <li v-for="s in g.sites" :key="s.id" class="rounded-md border border-line bg-surface p-4">
            <p class="m-0 font-strong">{{ s.name }}</p>
            <p v-if="s.address" class="m-0 mt-1 text-sm">{{ s.address }}</p>
            <p class="m-0 mt-1 text-sm text-ink-muted"><span class="font-strong">{{ t('vaksin.hours') }}:</span> {{ s.hours }}</p>
            <p class="m-0 mt-1 text-sm text-ink-muted"><span class="font-strong">{{ t('vaksin.doses') }}:</span> {{ doses(s) }}</p>
            <p v-if="s.notes" class="m-0 mt-1 text-sm text-ink-muted"><span class="font-strong">{{ t('vaksin.notes') }}:</span> {{ s.notes }}</p>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
