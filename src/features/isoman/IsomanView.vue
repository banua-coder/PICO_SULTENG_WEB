<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useDonations, useTelemedicines } from '@/api/useContent'
import { usePageHead } from '@/app/head'
import { useLocale } from '@/app/useLocale'
import ArchiveNotice from '@/components/ArchiveNotice.vue'
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
  <div class="px-5 py-8">
    <h1 class="text-2xl">{{ t('isoman.heading') }}</h1>
    <ArchiveNotice class="mt-5">
      <p class="m-0">{{ t('isoman.notice') }}</p>
      <p class="m-0 font-strong">{{ t('isoman.noticeMoney') }}</p>
    </ArchiveNotice>
    <component :is="locale === 'en' ? IsomanGuideEn : IsomanGuideId" class="mt-8" />
    <StatusView v-if="failed()" class="mt-8" kind="error" @retry="retry" />
    <StatusView v-else-if="!tele.data.value || !donations.data.value" class="mt-8" kind="loading" />
    <template v-else>
      <section class="mt-8" aria-labelledby="telemedicine">
        <h2 id="telemedicine" class="text-xl">{{ t('isoman.telemedicine') }}</h2>
        <p class="mt-2 max-w-prose text-ink-muted">{{ t('isoman.telemedicineIntro') }}</p>
        <p v-if="tele.data.value.length === 0" class="mt-3">{{ t('isoman.telemedicineEmpty') }}</p>
        <TelemedicineList v-else class="mt-4" :items="tele.data.value" />
      </section>
      <section class="mt-8" aria-labelledby="donasi">
        <h2 id="donasi" class="text-xl">{{ t('isoman.donations') }}</h2>
        <p class="mt-2 max-w-prose text-ink-muted">{{ t('isoman.donationsIntro') }}</p>
        <p v-if="donations.data.value.length === 0" class="mt-3">{{ t('isoman.donationsEmpty') }}</p>
        <DonationList v-else class="mt-4" :items="donations.data.value" />
      </section>
    </template>
  </div>
</template>
