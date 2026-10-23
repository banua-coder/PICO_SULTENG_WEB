<script setup lang="ts">
import { provide, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AreaRef } from '@/api/types'
import { usePageHead } from '@/app/head'
import SectionHeading from '@/components/SectionHeading.vue'
import CaseCurves from './components/CaseCurves.vue'
import RtSection from './components/RtSection.vue'
import SubAreaMap from './components/SubAreaMap.vue'
import AreaSummary from './components/AreaSummary.vue'
import DataToolbar from './components/DataToolbar.vue'
import OdpPdpNote from './components/OdpPdpNote.vue'
import ShareLink from './components/ShareLink.vue'
import { areaPath, DataPageKey, useDataPage } from './useDataPage'

// Composes the sections and provides the page state (spec 40). The sections read the state only through inject.
const props = defineProps<{ area: AreaRef; isRoot?: boolean }>()
const { t } = useI18n()
const state = useDataPage(toRef(props, 'area'))
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
  <div class="px-5 py-8">
    <h1 class="text-2xl">{{ t('data.areaTitle', { area: area.name }) }}</h1>
    <DataToolbar class="mt-6" />
    <section class="mt-8" aria-labelledby="ringkasan">
      <SectionHeading id="ringkasan" :level="2">{{ t('data.summary') }}</SectionHeading>
      <AreaSummary class="mt-5" />
    </section>
    <CaseCurves class="mt-8" />
    <RtSection class="mt-8" />
    <SubAreaMap class="mt-8" />
    <OdpPdpNote class="mt-8" />
    <ShareLink class="mt-8" />
  </div>
</template>
