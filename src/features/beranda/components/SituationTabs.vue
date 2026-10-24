<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { DailyRow, HomeLatest } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import CaseCardGroup from '@/components/CaseCardGroup.vue'
import type { CaseCardData } from '@/components/CaseCardGroup.vue'
import type { CaseColumn } from '@/components/CaseCard.vue'
import type { DataState } from '@/components/StateMark.vue'
import LegacyTabs from '@/components/LegacyTabs.vue'
import SuspectCards from '@/components/SuspectCards.vue'
import RtNow from './RtNow.vue'

// The old home "Situasi Terkini": the tab strip Statistik / Vaksinasi (legacy DataTabs), the four case cards with Sulawesi Tengah and
// Indonesia side by side, and under the Vaksinasi tab the two vaccine cards (dose 1, dose 2) with a Sulawesi Tengah / Nasional tab strip.
// Figures are the last day with real counts.
// the Vaksinasi tab is not the open one: its card code loads as its own chunk, after the first paint
const VaccineCard = defineAsyncComponent(() => import('@/components/vaccine/VaccineCard.vue'))
const props = defineProps<{ home: HomeLatest }>()
const { t } = useI18n()
const f = useFormat()
const { localize } = useLocale()

const ORDER: DataState[] = ['positive', 'active', 'recovered', 'deceased'] // Positif, Dirawat, Sembuh, Meninggal
const col = (title: string, row: DailyRow | null, key: DataState): CaseColumn | null =>
  row ? { title, value: row.cumulative[key as 'positive'], delta: row.daily[key as 'positive'], asOf: row.date } : null
const cards = computed<CaseCardData[]>(() =>
  ORDER.map((key) => ({
    key,
    label: t(`state.${key}`),
    columns: [col(t('beranda.sulteng'), props.home.lastReal['sulawesi-tengah'], key), col(t('beranda.indonesia'), props.home.lastReal.indonesia, key)].filter((c): c is CaseColumn => c !== null),
  })),
)
const updated = computed(() => props.home.lastReal['sulawesi-tengah']?.date)

const tab = ref<'stats' | 'vaccine'>('stats')
const tabs = computed(() => [
  { value: 'stats' as const, label: t('beranda.tabStats') },
  { value: 'vaccine' as const, label: t('beranda.tabVaccine') },
])
const scope = ref<'sulawesi-tengah' | 'indonesia'>('sulawesi-tengah')
const scopes = computed(() => [
  { value: 'sulawesi-tengah' as const, label: t('beranda.sulteng') },
  { value: 'indonesia' as const, label: t('vaksin.card.national') },
])
</script>

<template>
  <div>
    <p v-if="updated" class="m-0 text-ink-muted">
      <span>{{ t('beranda.situationUpdated') }}:</span> <time :datetime="updated" class="font-semibold text-ink">{{ f.date(updated) }}</time>
    </p>
    <LegacyTabs v-model="tab" class="mt-3" :tabs="tabs" :label="t('beranda.situationTitle')">
      <template #stats>
        <CaseCardGroup :cards="cards" />
        <SuspectCards v-if="home.observation" class="mt-5 block" :date="home.observation.date" :odp="home.observation.odp" :pdp="home.observation.pdp" />
        <RtNow class="mt-5" :home="home" />
        <p class="mt-3"><RouterLink :to="localize('/data')">{{ t('beranda.seeMore') }}</RouterLink></p>
      </template>
      <template #vaccine>
        <LegacyTabs v-model="scope" :tabs="scopes" :label="t('vaksin.card.scopeLabel')">
          <template v-for="s in scopes" :key="s.value" #[s.value]>
            <template v-if="home.vaccination[s.value]">
              <p class="m-0 text-ink-muted">
                <span>{{ t('vaksin.card.updated') }}</span><br>
                <time :datetime="home.vaccination[s.value]!.date" class="text-ink">{{ f.date(home.vaccination[s.value]!.date) }}</time>
              </p>
              <p class="m-0 text-xs italic text-ink-muted">{{ t('beranda.vaccineAsOf', { date: f.date(home.vaccination[s.value]!.date) }) }}</p>
              <div class="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2" data-testid="vaccine-summary">
                <VaccineCard :day="home.vaccination[s.value]!" dose="dose1" :title="t('vaksin.card.dose1')" />
                <VaccineCard :day="home.vaccination[s.value]!" dose="dose2" :title="t('vaksin.card.dose2')" />
              </div>
            </template>
          </template>
        </LegacyTabs>
        <p class="mt-3"><RouterLink :to="localize('/vaksin')">{{ t('beranda.vaccineMore') }}</RouterLink></p>
      </template>
    </LegacyTabs>
  </div>
</template>
