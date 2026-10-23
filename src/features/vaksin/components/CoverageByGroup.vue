<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import type { VaccinationDay, VaccinationGroupKey } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import SectionHeading from '@/components/SectionHeading.vue'
import { groupBars, OVER, overTarget } from '../useVaksin'

const WovenBars = defineAsyncComponent(() => import('@/components/charts/WovenBars.vue'))
const props = defineProps<{ day: VaccinationDay }>()
const { t } = useI18n()
const f = useFormat()

const name = (k: VaccinationGroupKey) => t(`vaksin.groups.${k}`)
const pct = (n: number) => f.pct(n, 1)
const max = computed(() => Math.max(OVER, ...props.day.groups.flatMap((g) => [g.coverage.dose1, g.coverage.dose2])))
const charts = computed(() =>
  (['dose1', 'dose2'] as const).map((dose) => {
    const items = groupBars(props.day, dose, name, pct)
    return { dose, items, title: t(dose === 'dose1' ? 'vaksin.groupDose1' : 'vaksin.groupDose2'), summary: t('vaksin.groupSummary', { dose: t(`vaksin.${dose}`), values: items.map((i) => i.label).join(', ') }) }
  }),
)
const over = computed(() => overTarget(props.day))
</script>

<template>
  <section aria-labelledby="kelompok" data-testid="coverage-groups">
    <SectionHeading id="kelompok" :level="2">{{ t('vaksin.groupsTitle') }}</SectionHeading>
    <p class="mt-3 max-w-prose text-ink-muted">{{ t('vaksin.groupsNote') }}</p>
    <div class="mt-5 grid gap-8 lg:grid-cols-2">
      <WovenBars v-for="c in charts" :key="c.dose" :items="c.items" orientation="horizontal" :max="max" :a11y="{ title: c.title, summary: c.summary }" />
    </div>
    <ul v-if="over.length" class="num mt-4 list-disc pl-5 text-sm" data-testid="over-notes">
      <li v-for="o in over" :key="`${o.key}${o.dose}`">{{ t('vaksin.overNote', { group: name(o.key), dose: t(`vaksin.${o.dose}`), pct: pct(o.coverage) }) }}</li>
    </ul>
  </section>
</template>
