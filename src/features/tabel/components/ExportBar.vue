<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDownloadSizes } from '@/api/useSeries'
import type { DailyRow } from '@/api/types'
import { toCsv } from '@/app/csv'
import { useFormat } from '@/app/useFormat'
import type { Column } from '../columns'
import { exportFileName, exportTable, saveBlob } from '../exportRows'

// Exports every filtered row, not just the page. XLSX is imported on click, so SheetJS is never part of the page's first load.
const props = defineProps<{ rows: DailyRow[]; columns: Column[]; slug: string; from: string; to: string; sheet: string }>()
const { t } = useI18n()
const f = useFormat()
const sizes = useDownloadSizes()

const busy = ref(false)
const message = ref('')
const disabled = computed(() => busy.value || props.rows.length === 0)

function csv() {
  const { header, rows } = exportTable(props.rows, props.columns)
  const name = exportFileName(props.slug, props.from, props.to, 'csv')
  saveBlob(new Blob([toCsv(header, rows)], { type: 'text/csv;charset=utf-8' }), name)
  message.value = t('tabel.ready', { name })
}

async function xlsx() {
  busy.value = true
  message.value = t('tabel.preparing')
  try {
    const { toXlsx } = await import('../toXlsx')
    const { header, rows } = exportTable(props.rows, props.columns)
    const name = exportFileName(props.slug, props.from, props.to, 'xlsx')
    saveBlob(await toXlsx(props.sheet, header, rows), name)
    message.value = t('tabel.ready', { name })
  } catch {
    message.value = t('tabel.failed')
  } finally {
    busy.value = false
  }
}

const mb = (n: number) => (n >= 1e6 ? `${f.num(n / 1e6, 1)} MB` : `${f.num(Math.max(1, Math.round(n / 1e3)))} KB`)
const FULL = [
  { file: 'indonesia', label: 'tabel.fullIndonesia' },
  { file: 'provinsi', label: 'tabel.fullProvinsi' },
  { file: 'kabupaten-sulteng', label: 'tabel.fullKabupaten' },
] as const
const btn = 'min-h-touch min-w-touch rounded-sm border border-line-strong bg-surface px-4 text-sm font-strong text-primary-strong disabled:opacity-50'
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center gap-3">
      <button type="button" :class="btn" :disabled="disabled" @click="csv">{{ t('tabel.csv') }}</button>
      <button type="button" :class="btn" :disabled="disabled" :aria-busy="busy" @click="xlsx">{{ t('tabel.xlsx') }}</button>
      <p role="status" aria-live="polite" class="m-0 text-sm text-ink-muted">{{ message }}</p>
    </div>
    <section aria-labelledby="tabel-full">
      <h2 id="tabel-full" class="text-lg">{{ t('tabel.full') }}</h2>
      <p class="mt-2 text-ink-muted">{{ t('tabel.fullNote') }}</p>
      <ul class="mt-3 flex list-none flex-col gap-2 p-0">
        <li v-for="x in FULL" :key="x.file">
          {{ t(x.label) }}:
          <a :href="`/unduh/${x.file}.csv`" download>CSV<template v-if="sizes.data.value?.[x.file]"> ({{ mb(sizes.data.value[x.file]!.csv) }})</template></a>,
          <a :href="`/unduh/${x.file}.xlsx`" download>XLSX<template v-if="sizes.data.value?.[x.file]"> ({{ mb(sizes.data.value[x.file]!.xlsx) }})</template></a>
        </li>
      </ul>
      <p class="mt-4">
        {{ t('tabel.api') }}:
        <a href="https://pico-api.banuacoder.com/api/v1" rel="noopener">API</a>,
        <a href="https://pico-api.banuacoder.com/swagger/index.html" rel="noopener">{{ t('tabel.apiDocs') }}</a>.
      </p>
    </section>
  </div>
</template>
