<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { IsoDate } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import type { Point } from './types'

// The table view of the same data the plot shows. Every value, never downsampled.
defineProps<{ caption: string; columns: { id: string; label: string }[]; dates: IsoDate[]; values: Point[][]; /** decimals of every value (Rt has 2) */ digits?: number }>()

const { t } = useI18n()
const fmt = useFormat()
const lookup = (pts: Point[]) => new Map(pts.map((p) => [p.x, p.y]))
</script>

<template>
  <div role="region" tabindex="0" :aria-label="caption" class="max-h-[24rem] overflow-auto rounded-md border border-line bg-surface">
    <table class="w-full border-collapse text-sm">
      <caption class="sr-only">{{ caption }}</caption>
      <thead class="sticky top-0 bg-surface">
        <tr>
          <th scope="col" class="border-b border-line-strong p-3 text-left font-strong">{{ t('chart.date') }}</th>
          <th v-for="c in columns" :key="c.id" scope="col" class="border-b border-line-strong p-3 text-right font-strong">{{ c.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="d in dates" :key="d">
          <th scope="row" class="num whitespace-nowrap border-b border-line p-3 text-left font-regular"><time :datetime="d">{{ fmt.date(d, 'short') }}</time></th>
          <td v-for="(pts, i) in values" :key="columns[i]!.id" class="num border-b border-line p-3 text-right" :data-series="columns[i]!.id" :data-date="d">
            {{ fmt.nullable(lookup(pts).get(d), (n: number) => fmt.num(n, digits)) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
