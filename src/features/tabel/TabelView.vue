<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageHead } from '@/app/head'
import { useFormat } from '@/app/useFormat'
import StatusView from '@/components/StatusView.vue'
import DailyTable from './components/DailyTable.vue'
import ExportBar from './components/ExportBar.vue'
import Pager from './components/Pager.vue'
import TableToolbar from './components/TableToolbar.vue'
import { useTabelPage } from './useTabelPage'

// Spec 50. State lives in the URL (C5); the series is read client-side because it is too big to prerender.
const { t } = useI18n()
const f = useFormat()
const s = useTabelPage()

usePageHead({
  title: () => t('tabel.title'),
  description: () => t('tabel.description'),
  dataset: () => ({ name: t('tabel.title'), description: t('tabel.description'), areaName: s.area.value.name }),
})

const caption = computed(() => t('tabel.caption', { area: s.area.value.name, range: f.range(s.window.value.from, s.window.value.to), count: f.num(s.rows.value.length) }))
const status = computed(() => (s.series.status.value === 'error' ? 'error' : s.series.data.value ? null : 'loading'))
</script>

<template>
  <div class="px-4 py-6">
    <h1 class="text-xl md:text-2xl">{{ t('tabel.title') }}</h1>
    <TableToolbar
      class="mt-6"
      :level="s.level.value"
      :area="s.area.value"
      :window="s.window.value"
      :min="s.bounds.value.from"
      :max="s.bounds.value.to"
      @update:level="s.setLevel"
      @update:area="s.setArea"
      @update:window="s.setWindow"
    />
    <StatusView v-if="status" class="mt-12" :kind="status" @retry="s.series.refresh()" />
    <template v-else>
      <DailyTable class="mt-6" :rows="s.pageRows.value" :columns="s.columns.value" :caption="caption" :total="s.rows.value.length" :start="(s.page.value - 1) * s.pageSize + 1" />
      <Pager class="mt-4" :page="s.page.value" :pages="s.pages.value" :min="s.window.value.from" :max="s.window.value.to" @update:page="s.setPage" @jump="s.jumpTo" />
    </template>
    <div class="mt-12">
      <ExportBar :rows="s.rows.value" :columns="s.columns.value" :slug="s.area.value.slug" :from="s.window.value.from" :to="s.window.value.to" :sheet="s.area.value.name" />
    </div>
  </div>
</template>
