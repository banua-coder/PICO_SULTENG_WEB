<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AreaLevel, AreaRef } from '@/api/types'
import { INDONESIA, KABUPATEN_AREAS, SULTENG } from '@/app/areas'
import AreaPicker from '@/components/AreaPicker.vue'
import OptionToggle from '@/components/OptionToggle.vue'

// The legacy site let the visitor look at the country, at a province, or at a kabupaten/kota. This is that choice for the whole Data
// page (cards, map, charts follow the area): a level switch (Nasional, Provinsi, Kabupaten/Kota) and, under it, the list of the areas of
// that level (any of the 34 provinces; the 13 kabupaten/kota of Sulawesi Tengah, the only ones the API serves). Changing the level moves
// to a sensible area of that level (Sulawesi Tengah, or its biggest kabupaten/kota); the page keeps the filters in the query.
const props = defineProps<{ area: AreaRef }>()
const emit = defineEmits<{ select: [AreaRef] }>()
const { t } = useI18n()

const LEVELS: AreaLevel[] = ['indonesia', 'provinsi', 'kabupaten']
const options = computed(() => LEVELS.map((l) => ({ value: l, label: t(`data.level.${l}`) })))
function setLevel(l: AreaLevel) {
  if (l === props.area.level) return
  emit('select', l === 'indonesia' ? INDONESIA : l === 'provinsi' ? SULTENG : KABUPATEN_AREAS.find((a) => a.slug === 'kota-palu')!)
}
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end" data-testid="level-switch">
    <OptionToggle :model-value="area.level" :options="options" :label="t('data.level.label')" @update:model-value="setLevel" />
    <AreaPicker v-if="area.level !== 'indonesia'" :model-value="area" :levels="[area.level]" :label="t(`data.level.pick.${area.level}`)" @update:model-value="emit('select', $event)" />
  </div>
</template>
