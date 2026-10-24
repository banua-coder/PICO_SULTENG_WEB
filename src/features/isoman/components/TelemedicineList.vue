<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Telemedicine } from '@/api/types'
import { useScheduleFilter } from '../useScheduleFilter'
import TelemedicineCard from './TelemedicineCard.vue'

const props = defineProps<{ items: Telemedicine[] }>()
const { t } = useI18n()
const { day, rows } = useScheduleFilter(() => props.items)
</script>

<template>
  <div>
    <div class="flex flex-col gap-2">
      <label for="isoman-day" class="text-sm font-strong text-ink-muted">{{ t('isoman.day') }}</label>
      <select id="isoman-day" v-model.number="day" class="min-h-touch max-w-xs rounded-sm border border-line-strong bg-surface px-4 text-ink">
        <option :value="0">{{ t('isoman.allDays') }}</option>
        <option v-for="d in 7" :key="d" :value="d">{{ t(`isoman.days.${d}`) }}</option>
      </select>
    </div>
    <p role="status" aria-live="polite" class="mt-3 text-sm text-ink-muted">{{ t('isoman.shownDoctors', { shown: rows.length, total: items.length }) }}</p>
    <p v-if="rows.length === 0" class="mt-3">{{ t('isoman.noMatch') }}</p>
    <div class="mt-4 grid gap-5 md:grid-cols-2" data-testid="telemedicine-grid">
      <TelemedicineCard v-for="i in rows" :key="i.id" :item="i" />
    </div>
  </div>
</template>
