<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarDate } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { CalendarRange } from '@lucide/vue'
import type { IsoDate } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import { isoFromDay, dayNumber } from '@/components/charts/core/days'
import OptionToggle from '@/components/OptionToggle.vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type DateWindow = { from: IsoDate; to: IsoDate }

// Time frame filters: the last 30, 90 or 180 days or everything (counted back from the last day with real data), a year, or two dates in a calendar.
const props = defineProps<{ modelValue: DateWindow; min: IsoDate; max: IsoDate }>()
const emit = defineEmits<{ 'update:modelValue': [DateWindow] }>()

const { t, locale } = useI18n()
const f = useFormat()
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

// the calendar
const open = ref(false)
const toCal = (d: IsoDate) => new CalendarDate(+d.slice(0, 4), +d.slice(5, 7), +d.slice(8, 10))
const fromCal = (d: DateValue): IsoDate => `${String(d.year).padStart(4, '0')}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
const calValue = computed(() => ({ start: toCal(props.modelValue.from), end: toCal(props.modelValue.to) }))
function onRange(v: { start?: DateValue; end?: DateValue }) {
  if (!v.start || !v.end) return // wait for the second click
  emit('update:modelValue', { from: clamp(fromCal(v.start)), to: clamp(fromCal(v.end)) })
  open.value = false
}
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
    <div class="flex flex-col gap-1">
      <Label class="text-sm font-semibold text-ink-muted">{{ t('range.pickRange') }}</Label>
      <Popover v-model:open="open">
        <PopoverTrigger as-child>
          <Button variant="outline" class="justify-start font-normal" data-testid="range-trigger">
            <CalendarRange aria-hidden="true" /><span class="num">{{ f.range(modelValue.from, modelValue.to) }}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0" align="start">
          <RangeCalendar :model-value="calValue" :min-value="toCal(min)" :max-value="toCal(max)" :locale="locale === 'en' ? 'en-US' : 'id-ID'" :number-of-months="1" :placeholder="toCal(modelValue.to)" initial-focus @update:model-value="onRange" />
        </PopoverContent>
      </Popover>
    </div>
  </div>
</template>
