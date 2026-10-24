<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { LatestByArea } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import { Input } from '@/components/ui/input'
import { provinceRows } from '../useBeranda'

const props = defineProps<{ provinces: LatestByArea[] }>()
const { t } = useI18n()
const f = useFormat()
const { localize } = useLocale()
const q = ref('')
const rows = computed(() => provinceRows(props.provinces, q.value))
</script>

<template>
  <div>
    <div class="flex flex-col gap-1">
      <label for="province-q" class="text-sm font-strong text-ink-muted">{{ t('beranda.provinceFilter') }}</label>
      <Input id="province-q" v-model="q" type="search" autocomplete="off" class="max-w-xs" />
    </div>
    <p role="status" aria-live="polite" class="mt-2 text-sm text-ink-muted">{{ t('beranda.provinceShown', { shown: rows.length, total: provinces.length }) }}</p>
    <p v-if="rows.length === 0" class="mt-2">{{ t('beranda.provinceNone') }}</p>
    <ol class="m-0 mt-2 grid list-none gap-1 p-0 sm:grid-cols-2 lg:grid-cols-3" data-testid="province-list">
      <li v-for="p in rows" :key="p.area.code">
        <RouterLink :to="localize(`/data/provinsi/${p.area.slug}`)" class="flex min-h-touch items-center justify-between gap-2 rounded-sm border border-line bg-surface px-3 no-underline">
          <span class="text-ink">{{ p.area.name }}</span>
          <span class="num text-sm text-ink-muted">{{ t('beranda.provinceTotal', { n: f.num(p.latest.cumulative.positive) }) }}</span>
        </RouterLink>
      </li>
    </ol>
  </div>
</template>
