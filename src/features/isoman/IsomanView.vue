<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useDonations, useTelemedicines } from '@/api/useContent'
import { usePageHead } from '@/app/head'
import { useLocale } from '@/app/useLocale'
import ArchiveNotice from '@/components/ArchiveNotice.vue'
import Illustration from '@/components/Illustration.vue'
import StatusView from '@/components/StatusView.vue'
import DonationList from './components/DonationList.vue'
import TelemedicineList from './components/TelemedicineList.vue'
import IsomanGuideEn from './IsomanGuide.en.vue'
import IsomanGuideId from './IsomanGuide.id.vue'

// Spec 73. Small lists: prerendered through the initial state. The archive notice is the first content after the h1.
const { t } = useI18n()
const { locale } = useLocale()
const tele = useTelemedicines()
const donations = useDonations()
usePageHead({ title: () => t('isoman.title'), description: () => t('isoman.description') })
const failed = () => tele.status.value === 'error' || donations.status.value === 'error'
const retry = () => Promise.all([tele.refresh(), donations.refresh()])
</script>

<template>
  <div class="px-4 py-6">
    <h1 class="text-xl md:text-2xl">{{ t('isoman.heading') }}</h1>
    <ArchiveNotice class="mt-4">
      <p class="m-0">{{ t('isoman.notice') }}</p>
      <p class="m-0">{{ t('isoman.pandemicNote') }}</p>
      <p class="m-0 font-strong">{{ t('isoman.noticeMoney') }}</p>
    </ArchiveNotice>
    <!-- the legacy page, in its order: the four cards, where to be treated, the guide sections (Tanda bahaya on top is new) -->
    <component :is="locale === 'en' ? IsomanGuideEn : IsomanGuideId" class="mt-8" />
    <StatusView v-if="failed()" class="mt-12" kind="error" @retry="retry" />
    <StatusView v-else-if="!tele.data.value || !donations.data.value" class="mt-12" kind="loading" />
    <template v-else>
      <section class="mt-8 rounded-lg bg-card p-4 shadow-lg" aria-labelledby="donasi" data-testid="isoman-donasi">
        <h2 id="donasi" class="m-0 flex items-center gap-3 text-lg font-bold"><Illustration name="bantuan-antar" :width="72" />{{ t('isoman.donations') }}</h2>
        <p class="mt-2 max-w-prose">{{ t('isoman.donationsIntro') }}</p>
        <hr class="my-4">
        <h3 class="text-center text-base font-bold">{{ t('isoman.donationsList') }}</h3>
        <p v-if="donations.data.value.length === 0" class="mt-2">{{ t('isoman.donationsEmpty') }}</p>
        <DonationList v-else class="mt-3" :items="donations.data.value" />
        <p class="mt-2 text-right text-sm text-ink-muted">{{ t('isoman.sourceVarious') }}</p>
      </section>
      <section class="mt-8 rounded-lg bg-card p-4 shadow-lg" aria-labelledby="telemedicine" data-testid="isoman-telemedicine">
        <h2 id="telemedicine" class="m-0 flex items-center gap-3 text-lg font-bold"><Illustration name="telekonsultasi" :width="72" />{{ t('isoman.telemedicine') }}</h2>
        <p class="mt-2 max-w-prose">{{ t('isoman.telemedicineIntro') }}</p>
        <p class="mb-0 mt-3 italic text-ink-muted">{{ t('isoman.teleNotesTitle') }}:</p>
        <ul class="m-0 mt-1 list-disc pl-6 italic">
          <li v-for="n in 5" :key="n">{{ t(`isoman.teleNote${n}`) }}</li>
        </ul>
        <hr class="my-4">
        <h3 class="text-center text-base font-bold">{{ t('isoman.teleList') }}</h3>
        <p v-if="tele.data.value.length === 0" class="mt-2">{{ t('isoman.telemedicineEmpty') }}</p>
        <TelemedicineList v-else class="mt-3" :items="tele.data.value" />
        <p class="mt-2 text-right text-sm text-ink-muted">{{ t('isoman.sourceVarious') }}</p>
      </section>
    </template>
  </div>
</template>
