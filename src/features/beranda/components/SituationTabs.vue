<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { DailyRow, HomeLatest } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import CaseCard from '@/components/CaseCard.vue'
import type { CaseColumn } from '@/components/CaseCard.vue'
import type { DataState } from '@/components/StateMark.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import RtNow from './RtNow.vue'
import VaccineSummary from './VaccineSummary.vue'

// Spec 30, old order: the case cards (Sulawesi Tengah, then Indonesia) and the vaccination tab. Figures are the last day with real counts.
const props = defineProps<{ home: HomeLatest }>()
const { t } = useI18n()
const f = useFormat()
const { localize } = useLocale()

const ORDER: DataState[] = ['positive', 'active', 'recovered', 'deceased'] // the old order: Positif, Dirawat, Sembuh, Meninggal
const col = (title: string, row: DailyRow | null, key: DataState): CaseColumn | null =>
  row ? { title, value: row.cumulative[key as 'positive'], delta: row.daily[key as 'positive'], asOf: row.date } : null
const cards = computed(() =>
  ORDER.map((key) => ({
    key,
    columns: [col(t('beranda.sulteng'), props.home.lastReal['sulawesi-tengah'], key), col(t('beranda.indonesia'), props.home.lastReal.indonesia, key)].filter((c): c is CaseColumn => c !== null),
  })),
)
const updated = computed(() => props.home.lastReal['sulawesi-tengah']?.date)
</script>

<template>
  <div>
    <p v-if="updated" class="m-0 text-ink-muted">
      <span>{{ t('beranda.situationUpdated') }}:</span> <time :datetime="updated" class="font-semibold text-ink">{{ f.date(updated) }}</time>
    </p>
    <Tabs default-value="stats" class="mt-3">
      <TabsList class="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="stats">{{ t('beranda.tabStats') }}</TabsTrigger>
        <TabsTrigger value="vaccine">{{ t('beranda.tabVaccine') }}</TabsTrigger>
      </TabsList>
      <TabsContent value="stats" class="mt-4">
        <div class="grid gap-4 sm:grid-cols-2" data-testid="headline">
          <CaseCard v-for="c in cards" :key="c.key" :state="c.key" :label="t(`state.${c.key}`)" :columns="c.columns" />
        </div>
        <RtNow class="mt-4" :home="home" />
        <p class="mt-3"><RouterLink :to="localize('/data')">{{ t('beranda.seeMore') }}</RouterLink></p>
      </TabsContent>
      <TabsContent value="vaccine" class="mt-4">
        <VaccineSummary :home="home" />
      </TabsContent>
    </Tabs>
  </div>
</template>
