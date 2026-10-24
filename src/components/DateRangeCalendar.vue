<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarDate } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { CalendarRange } from '@lucide/vue'
import type { IsoDate } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RangeCalendar } from '@/components/ui/range-calendar'

// Two dates in a calendar popover (shadcn Popover + Range Calendar). Loaded as its own chunk by DateRange: the calendar and its date library
// are not in a page's first load.
const props = defineProps<{ modelValue: { from: IsoDate; to: IsoDate }; min: IsoDate; max: IsoDate }>()
const emit = defineEmits<{ 'update:modelValue': [{ from: IsoDate; to: IsoDate }] }>()
const { locale } = useI18n()
const f = useFormat()
const clamp = (d: IsoDate) => (d < props.min ? props.min : d > props.max ? props.max : d)

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
</template>
