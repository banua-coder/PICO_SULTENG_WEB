<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { HomeLatest } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import StateMark from '@/components/StateMark.vue'
import { Card } from '@/components/ui/card'

// Rt is shown at its last non-null day, never as 0 (C1 Q6).
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
  <Card class="gap-2 border-t-4 border-t-rt py-4">
    <div class="px-4">
      <h3 class="m-0 flex items-center gap-2 text-lg"><StateMark state="rt" :size="3" />{{ t('beranda.rtTitle') }}</h3>
      <ul class="num m-0 mt-2 list-none p-0" data-testid="rt-now">
        <li v-for="a in AREAS" :key="a.key" class="mt-1">
          <template v-if="home.rt[a.key]">{{ t('beranda.rtLast', { area: t(a.label), value: f.num(home.rt[a.key]!.value, 2), date: f.date(home.rt[a.key]!.date) }) }}</template>
          <template v-else>{{ t('beranda.rtNone', { area: t(a.label) }) }}</template>
        </li>
      </ul>
      <p class="mb-0 mt-2 text-sm"><RouterLink :to="`${localize('/metodologi')}#rt`">{{ t('beranda.rtMethod') }}</RouterLink></p>
    </div>
  </Card>
</template>
