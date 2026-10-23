<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DailyRow } from '@/api/types'
import { useFormat } from '@/app/useFormat'
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
const cell = 'px-4 py-3 text-right tabular-nums'
const head = 'bg-tint px-4 py-3 text-sm font-strong'
</script>

<template>
  <div role="region" tabindex="0" :aria-label="t('tabel.region')" class="max-w-full overflow-auto rounded-md border border-line" style="max-height: 32rem">
    <table class="w-full border-collapse text-sm" :aria-rowcount="total + 2">
      <caption class="p-4 text-left font-strong">{{ caption }}</caption>
      <colgroup>
        <col>
        <col v-for="c in columns" :key="c.key">
      </colgroup>
      <thead class="sticky top-0 z-[2]">
        <tr>
          <th scope="col" rowspan="2" :class="[head, 'sticky left-0 z-[3] text-left']">{{ t('tabel.colDate') }}</th>
          <template v-for="g in groups" :key="g.group">
            <th v-if="g.group === 'rt'" scope="col" rowspan="2" :class="[head, 'text-right']"><StateMark state="rt" :size="2" /> {{ t('tabel.colRt') }}</th>
            <th v-else scope="colgroup" :colspan="g.span" :class="[head, 'border-b border-line text-center']">{{ groupLabel(g.group) }}</th>
          </template>
        </tr>
        <tr>
          <th v-for="c in sub" :key="c.key" scope="col" :class="[head, 'text-right']">
            <StateMark v-if="c.state" :state="c.state" :size="2" /> {{ label(c) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in rows" :key="r.date" :aria-rowindex="start + i + 2" class="border-t border-line">
          <th scope="row" class="sticky left-0 whitespace-nowrap bg-surface px-4 py-3 text-left font-normal">{{ f.date(r.date, 'short') }}</th>
          <td v-for="c in columns" :key="c.key" :class="cell">
            <template v-if="c.key === 'rt'">
              <template v-if="r.rt">{{ t('tabel.rtCell', { value: f.num(r.rt.value, 2), lo: f.num(r.rt.lower, 2), hi: f.num(r.rt.upper, 2) }) }}</template>
              <template v-else>{{ t('format.notAvailable') }}</template>
            </template>
            <template v-else>{{ f.nullable(numberFor(c, r), (n) => f.num(n)) }}</template>
          </td>
        </tr>
        <tr v-if="rows.length === 0"><td :colspan="columns.length + 1" class="p-5 text-center text-ink-muted">{{ t('tabel.noRows') }}</td></tr>
      </tbody>
    </table>
  </div>
</template>
