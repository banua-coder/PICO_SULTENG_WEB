<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AreaLevel, AreaRef, IsoDate } from '@/api/types'
import AreaPicker from '@/components/AreaPicker.vue'
import DateRange from '@/components/DateRange.vue'

defineProps<{ level: AreaLevel; area: AreaRef; window: { from: IsoDate; to: IsoDate }; min: IsoDate; max: IsoDate }>()
const emit = defineEmits<{ 'update:level': [AreaLevel]; 'update:area': [AreaRef]; 'update:window': [{ from: IsoDate; to: IsoDate }] }>()
const { t } = useI18n()
const LEVELS: AreaLevel[] = ['indonesia', 'provinsi', 'kabupaten']
</script>

<template>
  <div class="flex flex-wrap items-end gap-6">
    <fieldset class="m-0 flex flex-wrap gap-3 border-0 p-0">
      <legend class="mb-2 text-sm font-strong text-ink-muted">{{ t('tabel.level') }}</legend>
      <label v-for="l in LEVELS" :key="l" class="inline-flex min-h-touch cursor-pointer items-center gap-2">
        <input type="radio" name="tabel-level" :value="l" :checked="level === l" @change="emit('update:level', l)">
        {{ t(`tabel.level${l[0]!.toUpperCase()}${l.slice(1)}`) }}
      </label>
    </fieldset>
    <AreaPicker v-if="level !== 'indonesia'" :model-value="area" :levels="[level]" @update:model-value="emit('update:area', $event)" />
    <DateRange :model-value="window" :min="min" :max="max" @update:model-value="emit('update:window', $event)" />
  </div>
</template>
