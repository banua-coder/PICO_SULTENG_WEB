<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { KABUPATEN_AREAS, areaBySlug } from '@/app/areas'
import { usePageHead } from '@/app/head'
import ArchiveNotice from '@/components/ArchiveNotice.vue'
import StatusView from '@/components/StatusView.vue'
import HospitalCard from './components/HospitalCard.vue'
import TaskForceList from './components/TaskForceList.vue'
import { useKontakPage } from './useKontakPage'

// Spec 71. Both lists are small, so they are prerendered through the initial state like the rest of the small resources.
const { t } = useI18n()
const s = useKontakPage()
usePageHead({ title: () => t('kontak.title'), description: () => t('kontak.description') })
const sorted = [...KABUPATEN_AREAS].sort((a, b) => a.name.localeCompare(b.name, 'id'))
const onFilter = (e: Event) => s.setKabupaten(areaBySlug('kabupaten', (e.target as HTMLSelectElement).value) ?? null)
const failed = () => s.hospitals.status.value === 'error' || s.taskForces.status.value === 'error'
const retry = () => Promise.all([s.hospitals.refresh(), s.taskForces.refresh()])
</script>

<template>
  <div class="px-5 py-8">
    <h1 class="text-2xl">{{ t('kontak.title') }}</h1>
    <ArchiveNotice class="mt-5">
      <p class="m-0">{{ t('kontak.notice') }}</p>
      <p class="m-0 font-strong">{{ t('kontak.emergency') }}</p>
    </ArchiveNotice>
    <div class="mt-6 flex flex-col gap-2">
      <label for="kontak-kabupaten" class="text-sm font-strong text-ink-muted">{{ t('kontak.filter') }}</label>
      <select id="kontak-kabupaten" class="min-h-touch max-w-xs rounded-sm border border-line-strong bg-surface px-4 text-ink" :value="s.kabupaten.value?.slug ?? ''" @change="onFilter">
        <option value="">{{ t('kontak.all') }}</option>
        <option v-for="k in sorted" :key="k.code" :value="k.slug">{{ k.name }}</option>
      </select>
    </div>
    <StatusView v-if="failed()" class="mt-8" kind="error" @retry="retry" />
    <StatusView v-else-if="!s.hospitals.data.value || !s.taskForces.data.value" class="mt-8" kind="loading" />
    <template v-else>
      <section class="mt-8" aria-labelledby="rumah-sakit">
        <h2 id="rumah-sakit" class="text-xl">{{ t('kontak.hospitals') }}</h2>
        <p v-if="s.hospitalRows.value.length === 0" class="mt-3 text-ink-muted">{{ t('kontak.hospitalsEmpty') }}</p>
        <div v-else class="mt-4 grid gap-5 md:grid-cols-2">
          <HospitalCard v-for="h in s.hospitalRows.value" :key="h.code" :hospital="h" />
        </div>
      </section>
      <section class="mt-8" aria-labelledby="satgas">
        <h2 id="satgas" class="text-xl">{{ t('kontak.taskForces') }}</h2>
        <p v-if="s.taskForceRows.value.length === 0" class="mt-3 text-ink-muted">{{ t('kontak.taskForcesEmpty') }}</p>
        <TaskForceList v-else class="mt-4" :groups="s.taskForceRows.value" />
      </section>
    </template>
  </div>
</template>
