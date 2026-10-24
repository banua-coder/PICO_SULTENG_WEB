<script setup lang="ts">
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AreaLevel, AreaRef } from '@/api/types'
import { areaBySlug, INDONESIA, KABUPATEN_AREAS, PROVINCE_AREAS } from '@/app/areas'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'

const props = withDefaults(defineProps<{ modelValue: AreaRef; levels: AreaLevel[]; label?: string }>(), { label: undefined })
const emit = defineEmits<{ 'update:modelValue': [AreaRef] }>()

const { t } = useI18n()
const id = useId()
const key = (a: AreaRef) => `${a.level}:${a.slug}`
// Sulawesi Tengah first: its kabupaten/kota, then its province, then the other provinces and Indonesia (by name inside a group)
const sorted = (list: AreaRef[]) => [...list].sort((a, b) => a.name.localeCompare(b.name, 'id'))
const LEVEL_ORDER: AreaLevel[] = ['kabupaten', 'provinsi', 'indonesia']
const groups = computed(() =>
  LEVEL_ORDER.filter((l) => props.levels.includes(l)).map((level) => ({
    level,
    label: t(`area.${level}`),
    areas: level === 'indonesia' ? [INDONESIA] : sorted(level === 'provinsi' ? PROVINCE_AREAS : KABUPATEN_AREAS),
  })),
)

function onChange(v: unknown) {
  const [level, slug] = String(v).split(':') as [AreaLevel, string]
  const area = areaBySlug(level, slug)
  if (area) emit('update:modelValue', area)
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <Label :for="id" class="text-sm font-semibold text-ink-muted">{{ label ?? t('area.label') }}</Label>
    <Select :model-value="key(modelValue)" @update:model-value="onChange">
      <SelectTrigger :id="id" class="w-full min-w-56 sm:w-72"><SelectValue>{{ modelValue.name }}</SelectValue></SelectTrigger>
      <SelectContent class="max-h-80">
        <SelectGroup v-for="g in groups" :key="g.level">
          <SelectLabel>{{ g.label }}</SelectLabel>
          <SelectItem v-for="a in g.areas" :key="key(a)" :value="key(a)">{{ a.name }}</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>
