<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AreaPicker from '@/components/AreaPicker.vue'
import ContactLink from '@/components/ContactLink.vue'
import CopyButton from '@/components/CopyButton.vue'
import DataFreshness from '@/components/DataFreshness.vue'
import DateRange from '@/components/DateRange.vue'
import type { DateWindow } from '@/components/DateRange.vue'
import LottiePlayer from '@/components/LottiePlayer.vue'
import PicoIcon from '@/components/PicoIcon.vue'
import PicoImage from '@/components/PicoImage.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import StatFigure from '@/components/StatFigure.vue'
import StateMark from '@/components/StateMark.vue'
import StatusView from '@/components/StatusView.vue'
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import type { LineSeries } from '@/components/charts/types'
import { dayNumber, isoFromDay } from '@/components/charts/core/days'
import KabupatenMap from '@/components/maps/KabupatenMap.vue'
import ProvinceMap from '@/components/maps/ProvinceMap.vue'
import { KABUPATEN_AREAS, PROVINCE_AREAS, SULTENG } from '@/app/areas'
import { ICON_KEYS } from '@/assets/brand/icon-keys'
import { useLocale } from '@/app/useLocale'
import { useTheme } from '@/app/useTheme'
import { usePageHead } from '@/app/head'
import type { AreaRef, Contact } from '@/api/types'

// Test page for the component kit (spec 12). Only in dev and in builds made with VITE_KIT=1. Never in the sitemap.
const { t } = useI18n()
const { theme, cycle } = useTheme()
usePageHead({ title: () => t('kit.title'), noindex: true })
const { switchPath, other } = useLocale()

// 4 series x 1,414 days of made-up waves, ending on the last day of the record. One series has a gap.
const DAYS = 1414
const day0 = dayNumber('2024-01-14') - (DAYS - 1)
const wave = (k: number, phase: number, gap = false) => (i: number): number | null =>
  gap && i > 600 && i < 680 ? null : Math.max(0, Math.round(40 + 38 * Math.sin(i / k + phase) + 25 * Math.sin(i / (k / 3.1) + phase * 2)))
const make = (id: string, role: LineSeries['role'], label: string, f: (i: number) => number | null): LineSeries => ({
  id,
  role,
  label,
  points: Array.from({ length: DAYS }, (_, i) => ({ x: isoFromDay(day0 + i), y: f(i) })),
})
const demo = [
  make('p', 'positive', t('state.positive'), wave(61, 0)),
  make('r', 'recovered', t('state.recovered'), wave(67, 1.2)),
  make('d', 'deceased', t('state.deceased'), (i) => Math.round((wave(83, 2)(i) ?? 0) / 8)),
  make('a', 'active', t('state.active'), wave(97, 3, true)),
]
const kind = ref<'line' | 'bar'>('line')
const chartKey = ref(0)
const renderMs = ref('')
// For the performance check: remount the chart and time the render until the DOM is patched (2 ticks: mount, then width)
async function rerender() {
  renderMs.value = ''
  await nextTick() // clear the old number in the DOM first, so an identical new number still shows
  const t0 = performance.now()
  chartKey.value++
  await nextTick()
  await nextTick()
  renderMs.value = (performance.now() - t0).toFixed(1)
}

const mapItems = KABUPATEN_AREAS.map((a, i) => ({ code: a.code, name: a.name, value: i === 4 ? null : [4210, 25830, 3170, 9100, 0, 4530, 2210, 12840, 5120, 8650, 1980, 3460, 6310][i]! }))
const provItems = PROVINCE_AREAS.map((a, i) => ({ code: a.code, name: a.name, value: (i * 7919) % 90000 }))
const pickedMap = ref('7204')
const pickedProv = ref('72')
const pickedName = (code: string) => [...KABUPATEN_AREAS, ...PROVINCE_AREAS].find((a) => a.code === code)?.name ?? ''

const area = ref<AreaRef>(SULTENG)
const win = ref<DateWindow>({ from: '2020-03-02', to: '2024-01-14' })
const states = ['positive', 'recovered', 'deceased', 'active', 'rt'] as const
const contacts: Contact[] = [
  { kind: 'phone', label: '0451 411903', href: 'tel:0451411903' },
  { kind: 'whatsapp', label: '6285256087018', href: 'https://api.whatsapp.com/send?phone=6285256087018' },
  { kind: 'email', label: 'dinkes@example.go.id', href: 'mailto:dinkes@example.go.id' },
  { kind: 'fax', label: '0451 421234', href: '' },
]
</script>

<template>
  <div class="mx-auto max-w-4xl p-6">
    <h1 class="text-2xl">{{ t('kit.title') }}</h1>
    <p class="mt-3 text-ink-muted">{{ t('kit.intro') }}</p>
    <div class="mt-5 flex flex-wrap gap-3">
      <button type="button" class="min-h-touch rounded-sm bg-primary-strong px-5 text-on-primary" @click="cycle">{{ t('theme.label') }}: {{ theme }}</button>
      <a :href="switchPath" :hreflang="other" class="inline-flex min-h-touch items-center rounded-sm border border-line-strong px-5">{{ t('locale.switchTo') }}</a>
    </div>

    <section class="mt-8" aria-labelledby="k-figures">
      <SectionHeading id="k-figures" :level="2">StatFigure, StateMark</SectionHeading>
      <div class="mt-5 grid gap-5 sm:grid-cols-2">
        <StatFigure state="positive" :label="t('state.positive')" :value="63614" :delta="12" as-of="2024-01-14" emphasis />
        <StatFigure state="recovered" :label="t('state.recovered')" :value="61854" :delta="-3" as-of="2024-01-14" />
        <StatFigure state="deceased" :label="t('state.deceased')" :value="1760" :delta="null" as-of="2024-01-14" />
        <StatFigure state="rt" label="Rt" :value="null" as-of="2024-01-14" />
      </div>
      <ul class="mt-5 flex flex-wrap gap-5">
        <li v-for="s in states" :key="s" class="flex items-center gap-3"><StateMark :state="s" :size="5" /> {{ t(`state.${s}`) }}</li>
      </ul>
      <DataFreshness class="mt-5" as-of="2024-01-14" source="situs pihak ketiga" />
    </section>

    <section class="mt-8" aria-labelledby="k-chart">
      <SectionHeading id="k-chart" :level="2">TimeSeriesChart</SectionHeading>
      <div class="mt-5 flex flex-wrap gap-3">
        <button type="button" class="min-h-touch rounded-sm border border-line-strong bg-surface px-4 text-sm font-strong" @click="kind = kind === 'line' ? 'bar' : 'line'">{{ kind === 'line' ? t('kit.bars') : t('kit.lines') }}</button>
        <button type="button" class="min-h-touch rounded-sm border border-line-strong bg-surface px-4 text-sm font-strong" @click="rerender">{{ t('kit.rerender') }}</button>
        <span class="num self-center text-sm text-ink-muted" data-testid="render-ms">{{ renderMs }}</span>
      </div>
      <div class="mt-5">
        <TimeSeriesChart :key="chartKey" :series="demo" :kind="kind" :a11y="{ title: t('kit.chartTitle'), summary: t('kit.chartSummary') }" />
      </div>
    </section>

    <section class="mt-8" aria-labelledby="k-maps">
      <SectionHeading id="k-maps" :level="2">KabupatenMap, ProvinceMap</SectionHeading>
      <p class="mt-3 text-sm text-ink-muted" data-testid="picked">{{ t('kit.picked', { name: pickedName(pickedMap) }) }}</p>
      <div class="mt-5"><KabupatenMap :items="mapItems" :metric="{ label: t('kit.mapMetric'), role: 'positive' }" :selected="pickedMap" @select="pickedMap = $event" /></div>
      <div class="mt-8"><ProvinceMap :items="provItems" :metric="{ label: t('kit.provMetric'), role: 'recovered' }" :selected="pickedProv" @select="pickedProv = $event" /></div>
    </section>

    <section class="mt-8" aria-labelledby="k-icons">
      <SectionHeading id="k-icons" :level="2">PicoIcon</SectionHeading>
      <ul class="mt-5 flex flex-wrap gap-5 text-primary-strong">
        <li v-for="k in ICON_KEYS" :key="k"><PicoIcon :name="k" :decorative="false" /></li>
      </ul>
    </section>

    <section class="mt-8" aria-labelledby="k-controls">
      <SectionHeading id="k-controls" :level="2">AreaPicker, DateRange, CopyButton, ContactLink</SectionHeading>
      <div class="mt-5 flex flex-col gap-5">
        <AreaPicker v-model="area" :levels="['indonesia', 'provinsi', 'kabupaten']" />
        <DateRange v-model="win" min="2020-03-02" max="2024-01-14" />
        <p class="num text-sm text-ink-muted">{{ area.name }} · {{ win.from }} / {{ win.to }}</p>
        <p>7921024685 <CopyButton value="7921024685" label="nomor rekening" /></p>
        <ul>
          <li v-for="c in contacts" :key="c.kind"><ContactLink :contact="c" /></li>
        </ul>
      </div>
    </section>

    <section class="mt-8" aria-labelledby="k-images">
      <SectionHeading id="k-images" :level="2">PicoImage</SectionHeading>
      <div class="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4" data-testid="images">
        <PicoImage src="/favicon.svg" alt="Logo PICO" ratio="1/1" />
        <PicoImage :src="null" alt="Banner tanpa gambar" ratio="1/1" />
        <PicoImage src="/gambar-hilang.jpg" alt="Gambar tidak ditemukan" ratio="1/1" fallback="initials" />
        <PicoImage src="https://i.ibb.co/blocked/1.jpg" alt="Infografis dari host yang diblokir" ratio="1/1" />
      </div>
    </section>

    <section class="mt-8" aria-labelledby="k-status">
      <SectionHeading id="k-status" :level="2">StatusView, LottiePlayer</SectionHeading>
      <div class="mt-5 grid gap-5 sm:grid-cols-2">
        <StatusView kind="loading" compact />
        <StatusView kind="empty" compact />
        <StatusView kind="error" compact />
        <StatusView kind="offline" compact />
        <StatusView kind="not-found" compact />
        <LottiePlayer name="success" :label="t('copy.done')" />
      </div>
    </section>
  </div>
</template>
