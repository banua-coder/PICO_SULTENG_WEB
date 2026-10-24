<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AreaLevel, AreaRef, IsoDate } from '@/api/types'
import AreaPicker from '@/components/AreaPicker.vue'
import OptionToggle from '@/components/OptionToggle.vue'
import DateRange from '@/components/DateRange.vue'

defineProps<{ level: AreaLevel; area: AreaRef; window: { from: IsoDate; to: IsoDate }; min: IsoDate; max: IsoDate }>()
const emit = defineEmits<{ 'update:level': [AreaLevel]; 'update:area': [AreaRef]; 'update:window': [{ from: IsoDate; to: IsoDate }] }>()
const { t } = useI18n()
const LEVELS: AreaLevel[] = ['indonesia', 'provinsi', 'kabupaten']
</script>

<template>
  <div class="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-card md:flex-row md:flex-wrap md:items-end">
    <OptionToggle :model-value="level" :options="LEVELS.map((l) => ({ value: l, label: t(`tabel.level${l[0]!.toUpperCase()}${l.slice(1)}`) }))" :label="t('tabel.level')" @update:model-value="emit('update:level', $event)" />
    <AreaPicker v-if="level !== 'indonesia'" :model-value="area" :levels="[level]" @update:model-value="emit('update:area', $event)" />
    <DateRange :model-value="window" :min="min" :max="max" @update:model-value="emit('update:window', $event)" />
  </div>
</template>
