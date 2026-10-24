<script setup lang="ts">
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import type { AreaRef } from '@/api/types'
import { useLocale } from '@/app/useLocale'
import AreaPicker from '@/components/AreaPicker.vue'
import DateRange from '@/components/DateRange.vue'
import { areaPath, DataPageKey } from '../useDataPage'

const state = inject(DataPageKey)!
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { localize } = useLocale()

// the Delta wave, a named window (spec 41)
const extra = computed(() => [{ key: 'delta', label: t('data.delta'), from: '2021-06-01', to: '2021-09-30' }])

// choosing another area goes to its page and keeps the window and the view
const goTo = (a: AreaRef) => void router.push({ path: localize(areaPath(a)), query: route.query })
</script>

<template>
  <form class="flex flex-col gap-5 rounded-md border border-line bg-surface p-5" :aria-label="t('data.toolbar')" @submit.prevent>
    <AreaPicker :model-value="state.area.value" :levels="['indonesia', 'provinsi', 'kabupaten']" @update:model-value="goTo" />
    <DateRange :model-value="state.window.value" :min="state.bounds.value.from" :max="state.bounds.value.to" :extra-presets="extra" @update:model-value="state.setWindow" />
  </form>
</template>
