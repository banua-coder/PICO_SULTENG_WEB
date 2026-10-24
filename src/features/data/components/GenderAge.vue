<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGenderSnapshot } from '@/api/useStats'
import { useFormat } from '@/app/useFormat'
import OptionToggle from '@/components/OptionToggle.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import StatusView from '@/components/StatusView.vue'
import { ageMax, useGenderBars } from '../useGenderTests'
import type { GenderKind } from '../useGenderTests'

// Spec 45, Sulawesi Tengah only. The API row has no date (C1 Q4), so none is shown unless the data layer has one.
const BarList = defineAsyncComponent(() => import('@/components/charts/BarList.vue'))
const { t, locale } = useI18n()
const f = useFormat()
const snap = useGenderSnapshot()
const kind = ref<GenderKind>('positive')
const KINDS: GenderKind[] = ['positive', 'pdp']

const bars = computed(() =>
  snap.data.value
    ? useGenderBars(snap.data.value, kind.value, locale.value === 'en' ? 'en' : 'id', { male: t('data.gender.male'), female: t('data.gender.female') }, (n) => f.pct(n, 1))
    : null,
)
const kindLabel = computed(() => t(`data.gender.${kind.value}`))
const max = computed(() => (bars.value ? ageMax(bars.value.male, bars.value.female) : 0))
const nf = (n: number | null) => f.nullable(n, (v: number) => f.num(v))
const sexSummary = computed(() => (bars.value ? t('data.gender.sexSummary', { kind: kindLabel.value, male: nf(bars.value.sex[0]!.value), female: nf(bars.value.sex[1]!.value) }) : ''))
const ageSummary = (sex: 'male' | 'female') => {
  const b = bars.value?.[sex] ?? []
  return t('data.gender.ageSummary', { kind: kindLabel.value, sex: t(`data.gender.${sex}`).toLocaleLowerCase(locale.value), values: b.map((x) => `${x.label} ${nf(x.value)}`).join(', ') })
}
</script>

<template>
  <section aria-labelledby="gender" data-testid="gender">
    <SectionHeading id="gender" :level="2">{{ t('data.gender.title') }}</SectionHeading>
    <p class="mt-2 text-sm text-ink-muted" data-testid="gender-caption">{{ snap.data.value?.asOf ? t('data.gender.withDate', { date: f.date(snap.data.value.asOf) }) : t('data.gender.noDate') }}</p>
    <OptionToggle v-model="kind" class="mt-3" :options="KINDS.map((k) => ({ value: k, label: t(`data.gender.${k}`) }))" :label="t('data.gender.kind')" />
    <div v-if="bars" class="mt-4 grid gap-12 rounded-lg border bg-card p-4 shadow-card lg:grid-cols-2">
      <div class="lg:col-span-2">
        <BarList :items="bars.sex" orientation="horizontal" :a11y="{ title: t('data.gender.sexTitle', { kind: kindLabel }), summary: sexSummary }" />
      </div>
      <BarList :items="bars.male" orientation="vertical" :max="max" :a11y="{ title: t('data.gender.ageTitleMale', { kind: kindLabel }), summary: ageSummary('male') }" />
      <BarList :items="bars.female" orientation="vertical" :max="max" :a11y="{ title: t('data.gender.ageTitleFemale', { kind: kindLabel }), summary: ageSummary('female') }" />
    </div>
    <StatusView v-else-if="snap.status.value === 'error'" class="mt-4" kind="error" compact @retry="snap.refresh" />
    <div v-else class="mt-4 min-h-[12rem]"><StatusView kind="loading" compact /></div>
  </section>
</template>
