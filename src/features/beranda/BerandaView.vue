<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useBanners, useHospitals } from '@/api/useContent'
import { useHomeLatest, useNationalLatest, useProvincesLatest } from '@/api/useSeries'
import { usePageHead } from '@/app/head'
import SectionHeading from '@/components/SectionHeading.vue'
import BannerStrip from './components/BannerStrip.vue'
import HeadlineFigures from './components/HeadlineFigures.vue'
import HomeHero from './components/HomeHero.vue'
import HospitalTeaser from './components/HospitalTeaser.vue'
import LatestInfographics from './components/LatestInfographics.vue'
import PracticalInfo from './components/PracticalInfo.vue'
import ProvinceGrid from './components/ProvinceGrid.vue'
import RtNow from './components/RtNow.vue'
import VaccineSummary from './components/VaccineSummary.vue'
import ResourceBlock from './ResourceBlock.vue'

// Spec 30. Every number here comes from a small resource that is in the prerendered HTML and in the page's initial state, so the
// page makes no series request. Each section has its own loading and error state.
const { t } = useI18n()
const provinces = useProvincesLatest()
const national = useNationalLatest()
const home = useHomeLatest()
const banners = useBanners()
const hospitals = useHospitals()
usePageHead({ title: () => t('beranda.title'), description: () => t('beranda.description') })
</script>

<template>
  <div class="px-5 py-5 sm:py-8">
    <HomeHero />

    <section class="mt-5" aria-labelledby="angka">
      <!-- the group titles below say what the figures are; on a phone this line would push the first figure under the fold -->
      <h2 id="angka" class="sr-only">{{ t('beranda.figuresTitle') }}</h2>
      <div>
        <ResourceBlock :resource="provinces" min-height="14rem">
          <template #default="{ data: provs }">
            <ResourceBlock :resource="national" min-height="14rem">
              <template #default="{ data: nat }"><HeadlineFigures :provinces="provs" :national="nat" /></template>
            </ResourceBlock>
          </template>
        </ResourceBlock>
      </div>
    </section>

    <section class="mt-8" aria-labelledby="rt-home">
      <SectionHeading id="rt-home" :level="2">{{ t('beranda.rtTitle') }}</SectionHeading>
      <div class="mt-3"><ResourceBlock :resource="home" min-height="5rem"><template #default="{ data }"><RtNow :home="data" /></template></ResourceBlock></div>
    </section>

    <section class="mt-8" aria-labelledby="provinsi">
      <SectionHeading id="provinsi" :level="2">{{ t('beranda.provincesTitle') }}</SectionHeading>
      <p class="mt-2 text-ink-muted">{{ t('beranda.provincesNote') }}</p>
      <div class="mt-4"><ResourceBlock :resource="provinces" min-height="20rem"><template #default="{ data }"><ProvinceGrid :provinces="data" /></template></ResourceBlock></div>
    </section>

    <section class="mt-8" aria-labelledby="vaksin-home">
      <SectionHeading id="vaksin-home" :level="2">{{ t('beranda.vaccineTitle') }}</SectionHeading>
      <div class="mt-4"><ResourceBlock :resource="home" min-height="10rem"><template #default="{ data }"><VaccineSummary :home="data" /></template></ResourceBlock></div>
    </section>

    <section v-if="banners.data.value?.length !== 0" class="mt-8" aria-labelledby="pengumuman">
      <SectionHeading id="pengumuman" :level="2">{{ t('beranda.bannersTitle') }}</SectionHeading>
      <div class="mt-4"><ResourceBlock :resource="banners" min-height="8rem"><template #default="{ data }"><BannerStrip :banners="data" /></template></ResourceBlock></div>
    </section>

    <section class="mt-8" aria-labelledby="infografis-home">
      <SectionHeading id="infografis-home" :level="2">{{ t('beranda.infoTitle') }}</SectionHeading>
      <div class="mt-4"><ResourceBlock :resource="home" min-height="10rem"><template #default="{ data }"><LatestInfographics :items="data.infographics" /></template></ResourceBlock></div>
    </section>

    <section class="mt-8" aria-labelledby="rs-home">
      <SectionHeading id="rs-home" :level="2">{{ t('beranda.hospitalsTitle') }}</SectionHeading>
      <div class="mt-4"><ResourceBlock :resource="hospitals" min-height="10rem"><template #default="{ data }"><HospitalTeaser :hospitals="data" /></template></ResourceBlock></div>
    </section>

    <section class="mt-8" aria-labelledby="praktis">
      <SectionHeading id="praktis" :level="2">{{ t('beranda.practicalTitle') }}</SectionHeading>
      <div class="mt-4"><PracticalInfo /></div>
    </section>
  </div>
</template>
