<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/app/useFormat'
import type { MapItem, MapMetric } from './types'

const props = defineProps<{
  items: MapItem[]
  metric: MapMetric
  selected?: string
  /** an area code listed first (Sulawesi Tengah on the province map) */
  pin?: string
  /** When given, an area name is a link to this address. Otherwise it is a button that emits `select`. */
  hrefFor?: (code: string) => string
}>()
const emit = defineEmits<{ select: [code: string] }>()

const { t } = useI18n()
const fmt = useFormat()
// the pinned area first, then biggest first, areas without a number last, then by name
const rows = computed(() =>
  [...props.items].sort(
    (a, b) => Number(b.code === props.pin) - Number(a.code === props.pin) || (b.value ?? -Infinity) - (a.value ?? -Infinity) || a.name.localeCompare(b.name, 'id'),
  ),
)
</script>

<template>
  <div class="overflow-x-auto rounded-lg border bg-card text-card-foreground shadow-card">
    <table class="w-full border-collapse text-sm" data-testid="area-table">
      <caption class="sr-only">{{ metric.label }}</caption>
      <thead>
        <tr>
          <th scope="col" class="border-b border-line-strong p-2 text-left font-strong">{{ t('map.name') }}</th>
          <th scope="col" class="border-b border-line-strong p-2 text-right font-strong">{{ metric.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r.code" :class="r.code === selected ? 'border-l-4 border-indigo bg-tint' : 'border-l-4 border-transparent'">
          <th scope="row" class="border-b border-line p-0 text-left font-regular">
            <RouterLink v-if="hrefFor" :to="hrefFor(r.code)" class="inline-flex min-h-touch w-full items-center px-2" :aria-current="r.code === selected ? 'true' : undefined" :class="{ 'font-strong': r.code === selected }">
              {{ r.name }}<span v-if="r.code === selected" class="sr-only"> ({{ t('map.selected') }})</span>
            </RouterLink>
            <button v-else type="button" class="inline-flex min-h-touch w-full items-center px-2 text-left text-primary-strong underline" :aria-current="r.code === selected ? 'true' : undefined" :class="{ 'font-strong': r.code === selected }" @click="emit('select', r.code)">
              {{ r.name }}<span v-if="r.code === selected" class="sr-only"> ({{ t('map.selected') }})</span>
            </button>
          </th>
          <td class="num border-b border-line p-2 text-right" :data-code="r.code">{{ fmt.nullable(r.value, (n: number) => fmt.num(n)) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
