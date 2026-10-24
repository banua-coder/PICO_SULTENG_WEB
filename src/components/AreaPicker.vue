<script setup lang="ts">
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AreaLevel, AreaRef } from '@/api/types'
import { areaBySlug, INDONESIA, KABUPATEN_AREAS, PROVINCE_AREAS } from '@/app/areas'

const props = withDefaults(defineProps<{ modelValue: AreaRef; levels: AreaLevel[]; label?: string }>(), { label: undefined })
const emit = defineEmits<{ 'update:modelValue': [AreaRef] }>()

const { t } = useI18n()
const id = useId()
const key = (a: AreaRef) => `${a.level}:${a.slug}`
const sorted = (list: AreaRef[]) => [...list].sort((a, b) => a.name.localeCompare(b.name, 'id'))
const groups = computed(() =>
  props.levels.map((level) => ({
    level,
    label: t(`area.${level}`),
    areas: level === 'indonesia' ? [INDONESIA] : sorted(level === 'provinsi' ? PROVINCE_AREAS : KABUPATEN_AREAS),
  })),
)

function onChange(e: Event) {
  const [level, slug] = (e.target as HTMLSelectElement).value.split(':') as [AreaLevel, string]
  const area = areaBySlug(level, slug!)
  if (area) emit('update:modelValue', area)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label :for="id" class="text-sm font-strong text-ink-muted">{{ label ?? t('area.label') }}</label>
    <select :id="id" class="min-h-touch rounded-sm border border-line-strong bg-surface px-4 text-ink" :value="key(modelValue)" @change="onChange">
      <optgroup v-for="g in groups" :key="g.level" :label="g.label">
        <option v-for="a in g.areas" :key="key(a)" :value="key(a)">{{ a.name }}</option>
      </optgroup>
    </select>
  </div>
</template>
