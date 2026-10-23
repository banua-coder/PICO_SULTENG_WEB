<script setup lang="ts">
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IsoDate } from '@/api/types'

export type DateWindow = { from: IsoDate; to: IsoDate }

const props = defineProps<{ modelValue: DateWindow; min: IsoDate; max: IsoDate }>()
const emit = defineEmits<{ 'update:modelValue': [DateWindow] }>()

const { t } = useI18n()
const uid = useId()
const clamp = (d: IsoDate) => (d < props.min ? props.min : d > props.max ? props.max : d)

// Years that overlap the data window get a preset button.
const years = computed(() => {
  const out: number[] = []
  for (let y = Number(props.min.slice(0, 4)); y <= Number(props.max.slice(0, 4)); y++) out.push(y)
  return out
})
const yearWindow = (y: number): DateWindow => ({ from: clamp(`${y}-01-01`), to: clamp(`${y}-12-31`) })
const isAll = computed(() => props.modelValue.from === props.min && props.modelValue.to === props.max)
const isYear = (y: number) => props.modelValue.from === yearWindow(y).from && props.modelValue.to === yearWindow(y).to && !isAll.value

/** A native date input gives '' while it is being edited: ignore it. A start after the end drags the end along, and the reverse. */
function setFrom(v: string) {
  if (!v) return
  const from = clamp(v)
  emit('update:modelValue', { from, to: props.modelValue.to < from ? from : props.modelValue.to })
}
function setTo(v: string) {
  if (!v) return
  const to = clamp(v)
  emit('update:modelValue', { from: props.modelValue.from > to ? to : props.modelValue.from, to })
}
const pick = (w: DateWindow) => emit('update:modelValue', w)
const btn = 'min-h-touch min-w-touch rounded-sm border px-4 text-sm font-strong'
</script>

<template>
  <fieldset class="m-0 flex flex-wrap items-end gap-5 border-0 p-0">
    <legend class="mb-2 text-sm font-strong text-ink-muted">{{ t('range.group') }}</legend>
    <div class="flex flex-col gap-2">
      <label :for="`${uid}-from`" class="text-sm text-ink-muted">{{ t('range.from') }}</label>
      <input :id="`${uid}-from`" type="date" class="min-h-touch rounded-sm border border-line-strong bg-surface px-3 text-ink" :value="modelValue.from" :min="min" :max="max" @change="setFrom(($event.target as HTMLInputElement).value)">
    </div>
    <div class="flex flex-col gap-2">
      <label :for="`${uid}-to`" class="text-sm text-ink-muted">{{ t('range.to') }}</label>
      <input :id="`${uid}-to`" type="date" class="min-h-touch rounded-sm border border-line-strong bg-surface px-3 text-ink" :value="modelValue.to" :min="min" :max="max" @change="setTo(($event.target as HTMLInputElement).value)">
    </div>
    <div role="group" :aria-label="t('range.presets')" class="flex flex-wrap gap-3">
      <button type="button" :class="[btn, isAll ? 'border-indigo bg-indigo text-on-indigo' : 'border-line-strong bg-surface text-ink']" :aria-pressed="isAll" @click="pick({ from: min, to: max })">{{ t('range.all') }}</button>
      <button v-for="y in years" :key="y" type="button" :class="[btn, isYear(y) ? 'border-indigo bg-indigo text-on-indigo' : 'border-line-strong bg-surface text-ink']" :aria-pressed="isYear(y)" @click="pick(yearWindow(y))">{{ y }}</button>
    </div>
  </fieldset>
</template>
