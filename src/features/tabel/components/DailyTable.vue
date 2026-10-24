<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DailyRow } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Illustration from '@/components/Illustration.vue'
import StateMark from '@/components/StateMark.vue'
import { groupSpans, numberFor } from '../columns'
import type { Column } from '../columns'

// One page of the daily record as a real table (spec 50). The scroll region is the only thing that scrolls sideways.
const props = defineProps<{ rows: DailyRow[]; columns: Column[]; caption: string; /** rows in the whole filtered set, for aria-rowcount */ total: number; /** 1-based position of the first row on this page */ start: number }>()
const { t } = useI18n()
const f = useFormat()

const groups = computed(() => groupSpans(props.columns))
const sub = computed(() => props.columns.filter((c) => c.group !== 'rt'))
const label = (c: Column) => (c.key === 'odp' ? t('tabel.colOdp') : c.key === 'pdp' ? t('tabel.colPdp') : t(`state.${c.state}`))
const groupLabel = (g: string) => t(g === 'daily' ? 'tabel.groupDaily' : g === 'cumulative' ? 'tabel.groupCumulative' : 'tabel.groupObservation')
</script>

<template>
  <div role="region" tabindex="0" :aria-label="t('tabel.region')" class="max-w-full overflow-auto rounded-lg border bg-card text-card-foreground shadow-card" style="max-height: 32rem">
    <Table :scroll="false" :aria-rowcount="total + 2">
      <TableCaption class="p-3 text-left font-semibold" style="caption-side: top">{{ caption }}</TableCaption>
      <colgroup>
        <col>
        <col v-for="c in columns" :key="c.key">
      </colgroup>
      <TableHeader class="sticky top-0 z-[2] bg-cotton-deep">
        <TableRow>
          <TableHead scope="col" rowspan="2" class="sticky left-0 z-[3] bg-cotton-deep">{{ t('tabel.colDate') }}</TableHead>
          <template v-for="g in groups" :key="g.group">
            <TableHead v-if="g.group === 'rt'" scope="col" rowspan="2" class="text-right"><StateMark state="rt" :size="2" /> {{ t('tabel.colRt') }}</TableHead>
            <TableHead v-else scope="colgroup" :colspan="g.span" class="border-b text-center">{{ groupLabel(g.group) }}</TableHead>
          </template>
        </TableRow>
        <TableRow>
          <TableHead v-for="c in sub" :key="c.key" scope="col" class="text-right">
            <StateMark v-if="c.state" :state="c.state" :size="2" /> {{ label(c) }}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="(r, i) in rows" :key="r.date" :aria-rowindex="start + i + 2">
          <TableHead scope="row" class="sticky left-0 whitespace-nowrap bg-card font-normal">{{ f.date(r.date, 'short') }}</TableHead>
          <TableCell v-for="c in columns" :key="c.key" class="num text-right">
            <template v-if="c.key === 'rt'">
              <template v-if="r.rt">{{ t('tabel.rtCell', { value: f.num(r.rt.value, 2), lo: f.num(r.rt.lower, 2), hi: f.num(r.rt.upper, 2) }) }}</template>
              <template v-else>{{ t('format.notAvailable') }}</template>
            </template>
            <template v-else>{{ f.nullable(numberFor(c, r), (n) => f.num(n)) }}</template>
          </TableCell>
        </TableRow>
        <TableRow v-if="rows.length === 0"><TableCell :colspan="columns.length + 1" class="p-4 text-center text-ink-muted"><Illustration name="state-periode-kosong" :width="96" class="mb-2" /><br>{{ t('tabel.noRows') }}</TableCell></TableRow>
      </TableBody>
    </Table>
  </div>
</template>
