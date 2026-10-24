<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronsDown, ChevronsUp } from '@lucide/vue'
import type { VaccinationDay, VaccinationGroupKey } from '@/api/types'
import { useFormat } from '@/app/useFormat'

// The owner's CardVaccineHome (legacy Vue 2 `components/CardVaccineHome.vue`), ported: title, the day's doses with the change in percent,
// the big cumulative figure, "Dosis telah diberikan", one bar made of five coloured segments (one per group, each against the total
// target), the percentage and "x dari y telah divaksin", then one coloured line per group with its own percentage.
// Additions: the segments are named in the lines under the bar (a swatch in the group colour, the name and the percent as text), and the
// bar has a text alternative. Percentages above 100 are shown as they are (the source lets a group pass its target); the bar stops at 100.
const props = defineProps<{ day: VaccinationDay; dose: 'dose1' | 'dose2'; title: string }>()
const { t } = useI18n()
const f = useFormat()

// legacy order of the group lines and of the segments
const ORDER: VaccinationGroupKey[] = ['elderly', 'public_officer', 'health_worker', 'public', 'teenager']
const total = computed(() => props.day.total.cumulative[props.dose])
const addition = computed(() => props.day.total.daily[props.dose])
const growth = computed(() => {
  const prev = props.day.previousDaily?.[props.dose]
  return prev && prev > 0 ? ((addition.value - prev) / prev) * 100 : null
})
const share = (value: number, target: number) => (target > 0 ? Math.min(100, (value / target) * 100) : 0)
const pct = (value: number, target: number) => (target > 0 ? f.pct(Math.min(100, (value / target) * 100), 2) : t('format.notAvailable'))
const groups = computed(() =>
  ORDER.flatMap((key) => {
    const g = props.day.groups.find((x) => x.key === key)
    return g ? [{ key, value: g.cumulative[props.dose], target: g.target }] : []
  }),
)
const barLabel = computed(() => t('vaksin.card.barLabel', { title: props.title, pct: pct(total.value, props.day.target) }))
const sign = (n: number) => (n >= 0 ? '+' : '−')
</script>

<template>
  <div class="w-full rounded-lg bg-card p-4 text-ink shadow-lg" :data-dose="dose" data-testid="vaccine-card">
    <h4 class="m-0 mb-2 text-sm font-semibold md:text-[1.5rem]">{{ title }}</h4>
    <p class="num m-0 font-semibold" style="color: var(--pico-vg-total-ink)">
      {{ sign(addition) }}{{ f.num(Math.abs(addition)) }}
      <span v-if="growth !== null" class="text-sm">
        (
        <component :is="growth < 0 ? ChevronsDown : ChevronsUp" class="inline size-3.5 align-baseline" aria-hidden="true" />
        <span class="sr-only">{{ growth < 0 ? t('vaksin.card.down') : t('vaksin.card.up') }}</span>{{ f.pct(Math.abs(growth), 2) }} )
      </span>
    </p>
    <p class="num my-4 text-center text-[3rem] leading-none font-semibold md:text-[6rem]" style="color: var(--pico-vg-total-ink)" data-figure>{{ f.num(total) }}</p>
    <p class="m-0 text-right text-xs text-ink-muted md:text-base">{{ t('vaksin.card.given') }}</p>
    <div class="my-4 flex flex-row items-center justify-between gap-2">
      <div class="flex h-8 w-5/6 flex-row overflow-hidden rounded-md" style="background-color: var(--pico-track)" role="img" :aria-label="barLabel" data-bar>
        <div
          v-for="g in groups"
          :key="g.key"
          class="h-full border-r border-card last:border-r-0"
          :style="{ width: `${share(g.value, day.target)}%`, backgroundColor: `var(--pico-vg-${g.key})` }"
          :data-segment="g.key"
        />
      </div>
      <p class="num m-0 w-1/6 text-center text-xs font-semibold md:text-[1.25rem] lg:text-[1.5rem]" style="color: var(--pico-vg-total-ink)">{{ pct(total, day.target) }}</p>
    </div>
    <p class="num m-0 text-xs text-ink-muted md:text-base">
      <b class="text-ink">{{ pct(total, day.target) }}</b> {{ t('vaksin.card.of') }} <b class="text-ink">{{ f.num(day.target) }}</b> {{ t('vaksin.card.vaccinated') }}
    </p>
    <ul class="m-0 mt-3 list-none p-0">
      <li v-for="g in groups" :key="g.key" class="flex flex-row items-center justify-between gap-2 text-sm font-semibold lg:text-[1.25rem]" :style="{ color: `var(--pico-vg-${g.key}-ink)` }" :data-group="g.key">
        <span class="flex items-center gap-2"><span class="inline-block size-3 shrink-0 rounded-sm" :style="{ backgroundColor: `var(--pico-vg-${g.key})` }" aria-hidden="true" />{{ t(`vaksin.card.groups.${g.key}`) }}</span>
        <span class="num">{{ pct(g.value, g.target) }}</span>
      </li>
    </ul>
  </div>
</template>
