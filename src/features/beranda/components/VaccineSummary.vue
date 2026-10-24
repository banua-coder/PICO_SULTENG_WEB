<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { HomeLatest } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import ProgressBar from '@/components/charts/ProgressBar.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    <div class="grid gap-4 lg:grid-cols-2" data-testid="vaccine-summary">
      <template v-for="a in AREAS" :key="a.key">
        <Card v-if="home.vaccination[a.key]" :aria-labelledby="`vs-${a.key}`" role="group">
          <CardHeader><CardTitle :id="`vs-${a.key}`" class="text-lg">{{ t(a.label) }}</CardTitle></CardHeader>
          <CardContent class="grid gap-4">
            <ProgressBar :value="home.vaccination[a.key]!.total.cumulative.dose1" :target="home.vaccination[a.key]!.target" :label="t('vaksin.dose1')" role="active" />
            <ProgressBar :value="home.vaccination[a.key]!.total.cumulative.dose2" :target="home.vaccination[a.key]!.target" :label="t('vaksin.dose2')" role="active" />
            <p class="m-0 text-sm text-ink-muted">{{ t('beranda.vaccineAsOf', { date: f.date(home.vaccination[a.key]!.date) }) }}</p>
          </CardContent>
        </Card>
      </template>
    </div>
    <p class="mt-3"><RouterLink :to="localize('/vaksin')">{{ t('beranda.vaccineMore') }}</RouterLink></p>
  </div>
</template>
