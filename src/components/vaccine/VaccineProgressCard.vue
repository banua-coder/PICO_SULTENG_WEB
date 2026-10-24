<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronsDown, ChevronsUp } from '@lucide/vue'
import { useFormat } from '@/app/useFormat'

// The owner's CardVaccine (legacy `components/CardVaccine.vue`), ported: title, the day's doses with the change rate, the big cumulative figure,
// "Dosis telah diberikan", one single-colour bar with the percentage, and "x % dari y telah divaksin". `group` picks the legacy colour
// (total green, elderly blue, public officer purple, health worker orange, public pink-600, teenager pink-400).
// Over 100 %: the text shows the real percent, the bar stops at 100.
const props = defineProps<{ title: string; group: string; total: number; target: number; addition: number; previous?: number }>()
const { t } = useI18n()
const f = useFormat()
const growth = computed(() => (props.previous && props.previous > 0 ? ((props.addition - props.previous) / props.previous) * 100 : null))
const pct = computed(() => (props.target > 0 ? (props.total / props.target) * 100 : null))
const text = computed(() => (pct.value === null ? t('format.notAvailable') : f.pct(pct.value, 2)))
const fill = computed(() => Math.min(100, Math.max(0, pct.value ?? 0)))
const sign = (n: number) => (n >= 0 ? '+' : '−')
</script>

<template>
  <div class="w-full rounded-lg bg-card p-4 text-ink shadow-lg" :data-group="group" data-testid="vaccine-progress-card">
    <h4 class="m-0 mb-2 text-sm font-semibold md:text-[1.5rem]">{{ title }}</h4>
    <p class="num m-0 font-semibold" :style="{ color: `var(--pico-vg-${group}-ink)` }">
      {{ sign(addition) }}{{ f.num(Math.abs(addition)) }}
      <span v-if="growth !== null" class="text-sm">
        (
        <component :is="growth < 0 ? ChevronsDown : ChevronsUp" class="inline size-3.5 align-baseline" aria-hidden="true" />
        <span class="sr-only">{{ growth < 0 ? t('vaksin.card.down') : t('vaksin.card.up') }}</span>{{ f.pct(Math.abs(growth), 2) }} )
      </span>
    </p>
    <p class="num my-4 text-center text-[3rem] leading-none font-semibold md:text-[6rem]" :style="{ color: `var(--pico-vg-${group}-ink)` }" data-figure>{{ f.num(total) }}</p>
    <p class="m-0 text-right text-xs text-ink-muted md:text-base">{{ t('vaksin.card.given') }}</p>
    <div class="my-4 flex flex-row items-center justify-between gap-2">
      <div class="flex h-8 w-5/6 overflow-hidden rounded-md" style="background-color: var(--pico-track)" role="progressbar" :aria-label="title" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(fill)" :aria-valuetext="`${title}: ${text}`" data-bar>
        <div class="h-full rounded-md" :style="{ width: `${fill}%`, backgroundColor: `var(--pico-vg-${group})` }" data-fill />
      </div>
      <p class="num m-0 w-1/6 text-center text-xs font-semibold md:text-[1.25rem] lg:text-[1.5rem]" :style="{ color: `var(--pico-vg-${group}-ink)` }" data-testid="progress-text">{{ text }}</p>
    </div>
    <p class="num m-0 text-xs text-ink-muted md:text-base">
      <b class="text-ink">{{ text }}</b> {{ t('vaksin.card.of') }} <b class="text-ink">{{ f.num(target) }}</b> {{ t('vaksin.card.vaccinated') }}
    </p>
  </div>
</template>
