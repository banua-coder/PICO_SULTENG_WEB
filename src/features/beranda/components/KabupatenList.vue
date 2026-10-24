<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { LatestByArea } from '@/api/types'
import { useLastReal } from '@/api/useSeries'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import { Card } from '@/components/ui/card'

// The 13 kabupaten/kota of Sulawesi Tengah by total positive, each linking to its data page. Nothing here is a 0 that stands for "unknown".
const props = defineProps<{ rows: LatestByArea[] }>()
const { t } = useI18n()
const f = useFormat()
const { localize } = useLocale()
// each kabupaten on its own last real day (a day with positive, recovered or deceased above 0), not the padded end of the record
const lastReal = useLastReal()
const dateOf = (code: string) => lastReal.data.value?.kabupaten[code]
const sorted = computed(() => [...props.rows].sort((a, b) => b.latest.cumulative.positive - a.latest.cumulative.positive || a.area.name.localeCompare(b.area.name, 'id')))
</script>

<template>
  <ol class="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3" data-testid="kabupaten-list">
    <li v-for="k in sorted" :key="k.area.code">
      <Card class="py-0">
        <RouterLink :to="localize(`/data/kabupaten/${k.area.slug}`)" class="flex min-h-touch items-center justify-between gap-3 px-4 py-3 text-ink no-underline hover:bg-accent">
          <span class="font-semibold">{{ k.area.name }}</span>
          <span class="num text-right text-sm text-ink-muted">
            {{ t('beranda.kabTotal', { n: f.num(k.latest.cumulative.positive) }) }}
            <span v-if="dateOf(k.area.code)" class="block text-xs">{{ t('map.asOf', { date: f.date(dateOf(k.area.code)!) }) }}</span>
          </span>
        </RouterLink>
      </Card>
    </li>
  </ol>
</template>
