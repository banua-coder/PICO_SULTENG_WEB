<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { VaccineLocation } from '@/api/types'
import { areaBySlug } from '@/app/areas'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import SectionHeading from '@/components/SectionHeading.vue'
import { groupLocations, kabupatenWithSites } from '../useVaksin'

// The 2021 to 2022 list of sites (spec 60). The filter is a shadcn select.
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
    <p class="mt-2 max-w-prose text-ink-muted">{{ t('vaksin.locNote') }}</p>
    <div class="mt-3 flex flex-col gap-1">
      <Label for="loc-filter" class="text-sm font-semibold text-ink-muted">{{ t('vaksin.locFilter') }}</Label>
      <Select :model-value="slug || 'all'" @update:model-value="(v) => (slug = v === 'all' ? '' : String(v))">
        <SelectTrigger id="loc-filter" class="w-full sm:w-72"><SelectValue>{{ slug ? (options.find((k) => k.slug === slug)?.name ?? slug) : t('vaksin.locAll') }}</SelectValue></SelectTrigger>
        <SelectContent class="max-h-80">
          <SelectItem value="all">{{ t('vaksin.locAll') }}</SelectItem>
          <SelectItem v-for="k in options" :key="k.code" :value="k.slug">{{ k.name }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <p role="status" aria-live="polite" class="mt-2 text-sm text-ink-muted">{{ t('vaksin.shown', { shown: count, total: items.length }) }}</p>
    <p v-if="groups.length === 0" class="mt-2">{{ t('vaksin.locEmpty') }}</p>
    <div class="mt-3 flex flex-col gap-6">
      <section v-for="g in groups" :key="g.code" :aria-labelledby="`loc-${g.code}`">
        <h3 :id="`loc-${g.code}`" class="text-lg">{{ g.name }}</h3>
        <ul class="m-0 mt-2 grid list-none gap-3 p-0 md:grid-cols-2">
          <li v-for="s in g.sites" :key="s.id" class="rounded-lg border bg-card text-card-foreground shadow-card p-3">
            <p class="m-0 font-semibold">{{ s.name }}</p>
            <p v-if="s.address" class="m-0 mt-0.5 text-sm">{{ s.address }}</p>
            <p class="m-0 mt-0.5 text-sm text-ink-muted"><span class="font-semibold">{{ t('vaksin.hours') }}:</span> {{ s.hours }}</p>
            <p class="m-0 mt-0.5 text-sm text-ink-muted"><span class="font-semibold">{{ t('vaksin.doses') }}:</span> {{ doses(s) }}</p>
            <p v-if="s.notes" class="m-0 mt-0.5 text-sm text-ink-muted"><span class="font-semibold">{{ t('vaksin.notes') }}:</span> {{ s.notes }}</p>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
