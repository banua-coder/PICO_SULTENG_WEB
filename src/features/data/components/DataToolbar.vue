<script setup lang="ts">
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import type { AreaRef } from '@/api/types'
import { useLocale } from '@/app/useLocale'
import LevelSwitch from './LevelSwitch.vue'
import DateRange from '@/components/DateRange.vue'
import { areaPath, DataPageKey } from '../useDataPage'

const state = inject(DataPageKey)!
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { localize } = useLocale()

// choosing another area goes to its page and keeps the window and the view
const goTo = (a: AreaRef) => void router.push({ path: localize(areaPath(a)), query: route.query })
</script>

<template>
  <form class="flex flex-col gap-4 rounded-lg border bg-card text-card-foreground shadow-card p-4" :aria-label="t('data.toolbar')" @submit.prevent>
    <LevelSwitch :area="state.area.value" @select="goTo" />
    <DateRange :model-value="state.window.value" :min="state.bounds.value.from" :max="state.bounds.value.to" @update:model-value="state.setWindow" />
  </form>
</template>
