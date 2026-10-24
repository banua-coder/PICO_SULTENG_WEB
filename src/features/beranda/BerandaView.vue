<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useBanners, useHospitals } from '@/api/useContent'
import { useHomeLatest, useKabupatenLatest, useProvincesLatest } from '@/api/useSeries'
import { FACTS } from '@/app/facts'
import { usePageHead } from '@/app/head'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import SectionHeading from '@/components/SectionHeading.vue'
import { Button } from '@/components/ui/button'
import HomeTop from './components/HomeTop.vue'
import HospitalTeaser from './components/HospitalTeaser.vue'
import KabupatenList from './components/KabupatenList.vue'
import LatestInfographics from './components/LatestInfographics.vue'
import PracticalInfo from './components/PracticalInfo.vue'
import ProvinceGrid from './components/ProvinceGrid.vue'
import SituationTabs from './components/SituationTabs.vue'
import ResourceBlock from './ResourceBlock.vue'

// Spec 30, in the order of the old PICO home: banners and emergency cards, the situation (statistics and vaccination), what to do, what to know,
// referral hospitals, practical information. Sulawesi Tengah first, then its 13 kabupaten/kota, then the other provinces.
// Every number comes from a small resource that is in the prerendered HTML and in the page's initial state, so the page makes no series request.
const { t } = useI18n()
const f = useFormat()
const { localize } = useLocale()
const provinces = useProvincesLatest()
const kabupaten = useKabupatenLatest()
const home = useHomeLatest()
const banners = useBanners()
const hospitals = useHospitals()
usePageHead({ title: () => t('beranda.title'), description: () => t('beranda.description') })
</script>

<template>
  <div class="flex flex-col gap-6 px-4 py-5 md:gap-8 md:py-6">
    <header>
      <h1 class="text-lg md:text-2xl">{{ t('beranda.heroTitle') }}</h1>
      <p class="m-0 mt-1 max-w-prose text-ink-muted" data-testid="archive-line">{{ t('beranda.archive', { range: f.range(FACTS.recordFirst, FACTS.recordLast) }) }}</p>
    </header>

    <HomeTop :banners="banners.data.value ?? []" />

    <section aria-labelledby="situasi">
      <SectionHeading id="situasi" :level="2">{{ t('beranda.situationTitle') }}</SectionHeading>
      <div class="mt-3"><ResourceBlock :resource="home" min-height="20rem"><template #default="{ data }"><SituationTabs :home="data" /></template></ResourceBlock></div>
    </section>

    <section aria-labelledby="kabupaten">
      <SectionHeading id="kabupaten" :level="2">{{ t('beranda.kabTitle') }}</SectionHeading>
      <p class="m-0 mt-1 text-ink-muted">{{ t('beranda.kabNote') }}</p>
      <div class="mt-3"><ResourceBlock :resource="kabupaten" min-height="12rem"><template #default="{ data }"><KabupatenList :rows="data" /></template></ResourceBlock></div>
    </section>

    <PracticalInfo />

    <section aria-labelledby="rs-home">
      <SectionHeading id="rs-home" :level="2">{{ t('beranda.hospitalsTitle') }}</SectionHeading>
      <div class="mt-3"><ResourceBlock :resource="hospitals" min-height="10rem"><template #default="{ data }"><HospitalTeaser :hospitals="data" /></template></ResourceBlock></div>
    </section>

    <section aria-labelledby="infografis-home">
      <SectionHeading id="infografis-home" :level="2">{{ t('beranda.infoTitle') }}</SectionHeading>
      <div class="mt-3"><ResourceBlock :resource="home" min-height="10rem"><template #default="{ data }"><LatestInfographics :items="data.infographics" /></template></ResourceBlock></div>
    </section>

    <section :aria-label="t('beranda.otherProvinces')">
      <details class="rounded-lg border bg-card p-4 shadow-card">
        <summary class="flex min-h-touch cursor-pointer items-center font-heading text-lg text-ink">{{ t('beranda.otherProvinces') }}</summary>
        <p class="mt-2 text-ink-muted">{{ t('beranda.provincesNote') }}</p>
        <div class="mt-3"><ResourceBlock :resource="provinces" min-height="20rem"><template #default="{ data }"><ProvinceGrid :provinces="data" /></template></ResourceBlock></div>
      </details>
    </section>

    <p class="m-0 text-center"><Button as-child variant="outline"><a :href="localize('/data')" class="text-primary-strong no-underline">{{ t('beranda.seeMore') }}</a></Button></p>
  </div>
</template>
