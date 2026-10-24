<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { KABUPATEN_AREAS, areaBySlug } from '@/app/areas'
import { usePageHead } from '@/app/head'
import ArchiveNotice from '@/components/ArchiveNotice.vue'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Illustration from '@/components/Illustration.vue'
import StatusView from '@/components/StatusView.vue'
import HospitalCard from './components/HospitalCard.vue'
import TaskForceList from './components/TaskForceList.vue'
import { useKontakPage } from './useKontakPage'

// Spec 71. Both lists are small, so they are prerendered through the initial state like the rest of the small resources.
const { t } = useI18n()
const s = useKontakPage()
usePageHead({ title: () => t('kontak.title'), description: () => t('kontak.description') })
const sorted = [...KABUPATEN_AREAS].sort((a, b) => a.name.localeCompare(b.name, 'id'))
const onFilter = (v: unknown) => s.setKabupaten(areaBySlug('kabupaten', String(v)) ?? null)
const failed = () => s.hospitals.status.value === 'error' || s.taskForces.status.value === 'error'
const retry = () => Promise.all([s.hospitals.refresh(), s.taskForces.refresh()])
</script>

<template>
  <div class="px-4 py-6">
    <h1 class="text-xl md:text-2xl">{{ t('kontak.title') }}</h1>
    <ArchiveNotice class="mt-4">
      <p class="m-0">{{ t('kontak.notice') }}</p>
      <p class="m-0 flex items-center gap-3 font-strong"><Illustration name="telepon-119" :width="72" />{{ t('kontak.emergency') }}</p>
    </ArchiveNotice>
    <div class="mt-6 flex flex-col gap-1">
      <Label for="kontak-kabupaten" class="text-sm font-semibold text-ink-muted">{{ t('kontak.filter') }}</Label>
      <Select :model-value="s.kabupaten.value?.slug ?? 'all'" @update:model-value="onFilter">
        <SelectTrigger id="kontak-kabupaten" class="w-full sm:w-72"><SelectValue>{{ s.kabupaten.value?.name ?? t('kontak.all') }}</SelectValue></SelectTrigger>
        <SelectContent class="max-h-80">
          <SelectItem value="all">{{ t('kontak.all') }}</SelectItem>
          <SelectItem v-for="k in sorted" :key="k.code" :value="k.slug">{{ k.name }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <StatusView v-if="failed()" class="mt-8" kind="error" @retry="retry" />
    <StatusView v-else-if="!s.hospitals.data.value || !s.taskForces.data.value" class="mt-8" kind="loading" />
    <template v-else>
      <section class="mt-8" aria-labelledby="rumah-sakit">
        <h2 id="rumah-sakit" class="flex items-center gap-3 text-xl"><Illustration name="rumah-sakit" :width="72" />{{ t('kontak.hospitals') }}</h2>
        <p v-if="s.hospitalRows.value.length === 0" class="mt-2 flex flex-col items-center gap-2 text-ink-muted"><Illustration name="state-kosong" :width="96" />{{ t('kontak.hospitalsEmpty') }}</p>
        <div v-else class="mt-3 grid gap-4 md:grid-cols-2">
          <HospitalCard v-for="h in s.hospitalRows.value" :key="h.code" :hospital="h" />
        </div>
      </section>
      <section class="mt-8" aria-labelledby="satgas">
        <h2 id="satgas" class="text-xl">{{ t('kontak.taskForces') }}</h2>
        <p v-if="s.taskForceRows.value.length === 0" class="mt-2 text-ink-muted">{{ t('kontak.taskForcesEmpty') }}</p>
        <TaskForceList v-else class="mt-3" :groups="s.taskForceRows.value" />
      </section>
    </template>
  </div>
</template>
