<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { HomeLatest } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import ProgressWeave from '@/components/charts/ProgressWeave.vue'

defineProps<{ home: HomeLatest }>()
const { t } = useI18n()
const f = useFormat()
const { localize } = useLocale()
const AREAS = [
  { key: 'sulawesi-tengah' as const, label: 'beranda.sulteng' },
  { key: 'indonesia' as const, label: 'beranda.indonesia' },
]
</script>

<template>
  <div>
    <div class="grid gap-8 lg:grid-cols-2" data-testid="vaccine-summary">
      <template v-for="a in AREAS" :key="a.key">
        <section v-if="home.vaccination[a.key]" :aria-labelledby="`vs-${a.key}`">
          <h3 :id="`vs-${a.key}`" class="text-lg">{{ t(a.label) }}</h3>
          <div class="mt-3 grid gap-4">
            <ProgressWeave :value="home.vaccination[a.key]!.total.cumulative.dose1" :target="home.vaccination[a.key]!.target" :label="t('vaksin.dose1')" role="positive" />
            <ProgressWeave :value="home.vaccination[a.key]!.total.cumulative.dose2" :target="home.vaccination[a.key]!.target" :label="t('vaksin.dose2')" role="positive" />
          </div>
          <p class="mt-2 text-sm text-ink-muted">{{ t('beranda.vaccineAsOf', { date: f.date(home.vaccination[a.key]!.date) }) }}</p>
        </section>
      </template>
    </div>
    <p class="mt-4"><RouterLink :to="localize('/vaksin')">{{ t('beranda.vaccineMore') }}</RouterLink></p>
  </div>
</template>
