<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { HomeLatest } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'

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
    <ul class="num m-0 list-none p-0" data-testid="rt-now">
      <li v-for="a in AREAS" :key="a.key" class="mt-2">
        <template v-if="home.rt[a.key]">{{ t('beranda.rtLast', { area: t(a.label), value: f.num(home.rt[a.key]!.value, 2), date: f.date(home.rt[a.key]!.date) }) }}</template>
        <template v-else>{{ t('beranda.rtNone', { area: t(a.label) }) }}</template>
      </li>
    </ul>
    <p class="mt-3"><RouterLink :to="`${localize('/metodologi')}#rt`">{{ t('beranda.rtMethod') }}</RouterLink></p>
  </div>
</template>
