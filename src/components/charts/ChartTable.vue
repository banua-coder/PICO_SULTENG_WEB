<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { IsoDate } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Point } from './types'

// The table view of the same data the plot shows. Every value, never downsampled. A missing value reads "tidak tersedia", never 0.
defineProps<{ caption: string; columns: { id: string; label: string }[]; dates: IsoDate[]; values: Point[][]; /** decimals of every value (Rt has 2) */ digits?: number }>()

const { t } = useI18n()
const fmt = useFormat()
const lookup = (pts: Point[]) => new Map(pts.map((p) => [p.x, p.y]))
</script>

<template>
  <div role="region" tabindex="0" :aria-label="caption" class="max-h-[24rem] overflow-auto rounded-lg border bg-card text-card-foreground shadow-card">
    <Table :scroll="false">
      <TableCaption class="sr-only">{{ caption }}</TableCaption>
      <TableHeader class="sticky top-0 bg-card">
        <TableRow>
          <TableHead scope="col">{{ t('chart.date') }}</TableHead>
          <TableHead v-for="c in columns" :key="c.id" scope="col" class="text-right">{{ c.label }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="d in dates" :key="d">
          <TableHead scope="row" class="num whitespace-nowrap text-left font-normal text-foreground"><time :datetime="d">{{ fmt.date(d, 'short') }}</time></TableHead>
          <TableCell v-for="(pts, i) in values" :key="columns[i]!.id" class="num text-right" :data-series="columns[i]!.id" :data-date="d">
            {{ fmt.nullable(lookup(pts).get(d), (n: number) => fmt.num(n, digits)) }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
