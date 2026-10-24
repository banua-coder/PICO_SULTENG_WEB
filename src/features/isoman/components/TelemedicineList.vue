<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
    <div class="flex flex-col gap-1">
      <Label for="isoman-day" class="text-sm font-semibold text-ink-muted">{{ t('isoman.day') }}</Label>
      <Select :model-value="String(day)" @update:model-value="(v) => (day = Number(v))">
        <SelectTrigger id="isoman-day" class="w-full sm:w-72"><SelectValue>{{ day === 0 ? t('isoman.allDays') : t(`isoman.days.${day}`) }}</SelectValue></SelectTrigger>
        <SelectContent>
          <SelectItem value="0">{{ t('isoman.allDays') }}</SelectItem>
          <SelectItem v-for="d in 7" :key="d" :value="String(d)">{{ t(`isoman.days.${d}`) }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <p role="status" aria-live="polite" class="mt-2 text-sm text-ink-muted">{{ t('isoman.shownDoctors', { shown: rows.length, total: items.length }) }}</p>
    <p v-if="rows.length === 0" class="mt-2">{{ t('isoman.noMatch') }}</p>
    <div class="mt-3 grid gap-4 md:grid-cols-2" data-testid="telemedicine-grid">
      <TelemedicineCard v-for="i in rows" :key="i.id" :item="i" />
    </div>
  </div>
</template>
