<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IsoDate } from '@/api/types'
import { isoFromDay, dayNumber } from '@/components/charts/core/days'
import OptionToggle from '@/components/OptionToggle.vue'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type DateWindow = { from: IsoDate; to: IsoDate }

// Time frame filters: the last 30, 90 or 180 days or everything (counted back from the last day with real data), a year, or two dates in a calendar.
const props = defineProps<{ modelValue: DateWindow; min: IsoDate; max: IsoDate }>()
const emit = defineEmits<{ 'update:modelValue': [DateWindow] }>()

const DateRangeCalendar = defineAsyncComponent(() => import('./DateRangeCalendar.vue'))
const { t } = useI18n()
const clamp = (d: IsoDate) => (d < props.min ? props.min : d > props.max ? props.max : d)
const lastN = (n: number): DateWindow => ({ from: clamp(isoFromDay(dayNumber(props.max) - (n - 1))), to: props.max })
const all = computed<DateWindow>(() => ({ from: props.min, to: props.max }))
const yearWindow = (y: number): DateWindow => ({ from: clamp(`${y}-01-01`), to: clamp(`${y}-12-31`) })
const years = computed(() => {
  const out: number[] = []
  for (let y = Number(props.min.slice(0, 4)); y <= Number(props.max.slice(0, 4)); y++) out.push(y)
  return out
})
const same = (a: DateWindow, b: DateWindow) => a.from === b.from && a.to === b.to
const FRAMES = [30, 90, 180] as const
const frame = computed(() => {
  const v = props.modelValue
  if (same(v, all.value)) return 'all'
  const hit = FRAMES.find((n) => same(v, lastN(n)))
  return hit ? String(hit) : ''
})
const year = computed(() => {
  if (same(props.modelValue, all.value)) return 'all'
  const hit = years.value.find((y) => same(props.modelValue, yearWindow(y)))
  return hit ? String(hit) : ''
})
const frameOptions = computed(() => [
  { value: '30', label: t('range.last30') },
  { value: '90', label: t('range.last90') },
  { value: '180', label: t('range.last180') },
  { value: 'all', label: t('range.all') },
])
const pickFrame = (v: string) => emit('update:modelValue', v === 'all' ? all.value : lastN(Number(v)))
const pickYear = (v: unknown) => emit('update:modelValue', v === 'all' ? all.value : yearWindow(Number(v)))

</script>

<template>
  <div class="flex flex-wrap items-end gap-4" role="group" :aria-label="t('range.group')">
    <OptionToggle :model-value="frame" :options="frameOptions" :label="t('range.frame')" @update:model-value="pickFrame" />
    <div class="flex flex-col gap-1">
      <Label class="text-sm font-semibold text-ink-muted">{{ t('range.year') }}</Label>
      <Select :model-value="year" @update:model-value="pickYear">
        <SelectTrigger :aria-label="t('range.year')" class="w-36"><SelectValue :placeholder="t('range.allYears')">{{ year === 'all' ? t('range.allYears') : year || t('range.year') }}</SelectValue></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ t('range.allYears') }}</SelectItem>
          <SelectItem v-for="y in years" :key="y" :value="String(y)">{{ y }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="flex w-full flex-col gap-1 sm:w-auto">
      <Label class="text-sm font-semibold text-ink-muted">{{ t('range.pickRange') }}</Label>
      <DateRangeCalendar :model-value="modelValue" :min="min" :max="max" @update:model-value="emit('update:modelValue', $event)" />
    </div>
  </div>
</template>
