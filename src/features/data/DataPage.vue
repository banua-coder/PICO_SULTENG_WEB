<script setup lang="ts">
import { provide, toRef } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowRight } from '@lucide/vue'
import { useLocale } from '@/app/useLocale'
import { Card } from '@/components/ui/card'
import type { AreaRef } from '@/api/types'
import { usePageHead } from '@/app/head'
import { SULTENG } from '@/app/areas'
import SectionHeading from '@/components/SectionHeading.vue'
import CaseCurves from './components/CaseCurves.vue'
import RtSection from './components/RtSection.vue'
import GenderAge from './components/GenderAge.vue'
import SubAreaMap from './components/SubAreaMap.vue'
import TestsByType from './components/TestsByType.vue'
import AreaSummary from './components/AreaSummary.vue'
import DataToolbar from './components/DataToolbar.vue'
import OdpPdpNote from './components/OdpPdpNote.vue'
import ShareLink from './components/ShareLink.vue'
import { areaPath, DataPageKey, useDataPage } from './useDataPage'

// Composes the sections and provides the page state (spec 40). The sections read the state only through inject.
const props = defineProps<{ area: AreaRef; isRoot?: boolean }>()
const { t } = useI18n()
const { localize } = useLocale()
const state = useDataPage(toRef(props, 'area'))
// gender, age and tests exist for Sulawesi Tengah only (spec 45)
const isSulteng = props.area.level === 'provinsi' && props.area.code === SULTENG.code
provide(DataPageKey, state)

usePageHead({
  // /data and the Sulawesi Tengah page are one view: its own short title, and the canonical points at the real page
  title: () => (props.isRoot ? t('data.rootTitle') : t('data.title', { area: props.area.name })),
  description: () => t('data.description', { area: props.area.name }),
  canonicalPath: () => (props.isRoot ? areaPath(props.area) : undefined),
  dataset: () => ({ name: t('data.title', { area: props.area.name }), description: t('data.description', { area: props.area.name }), areaName: props.area.name }),
})
</script>

<template>
  <div class="flex flex-col gap-8 px-4 py-6">
    <header>
      <h1 class="text-xl md:text-2xl">{{ t('data.areaTitle', { area: area.name }) }}</h1>
      <p class="m-0 mt-1 text-ink-muted">{{ t('data.dashboard', { area: area.name }) }}</p>
    </header>
    <DataToolbar />
    <section aria-labelledby="ringkasan">
      <SectionHeading id="ringkasan" :level="2">{{ t('data.summary') }}</SectionHeading>
      <AreaSummary class="mt-3" />
    </section>
    <template v-if="isSulteng"><TestsByType /></template>
    <SubAreaMap />
    <CaseCurves />
    <RtSection />
    <OdpPdpNote />
    <template v-if="isSulteng"><GenderAge /></template>
    <section aria-labelledby="akses-data">
      <SectionHeading id="akses-data" :level="2">{{ t('data.links') }}</SectionHeading>
      <div class="mt-3 grid gap-3 md:grid-cols-2">
        <Card class="py-0"><RouterLink :to="localize('/tabel-data')" class="flex min-h-touch items-center justify-between gap-3 p-5 font-bold text-ink no-underline hover:bg-accent">{{ t('data.linkTable') }}<ArrowRight class="size-5" aria-hidden="true" /></RouterLink></Card>
        <Card class="py-0"><RouterLink :to="`${localize('/mulai')}#api`" class="flex min-h-touch items-center justify-between gap-3 p-5 font-bold text-ink no-underline hover:bg-accent">{{ t('data.linkApi') }}<ArrowRight class="size-5" aria-hidden="true" /></RouterLink></Card>
      </div>
    </section>
    <ShareLink />
  </div>
</template>
