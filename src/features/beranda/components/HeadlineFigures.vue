<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LatestByArea } from '@/api/types'
import { SULTENG } from '@/app/areas'
import DataFreshness from '@/components/DataFreshness.vue'
import StatFigure from '@/components/StatFigure.vue'

const props = defineProps<{ provinces: LatestByArea[]; national: LatestByArea }>()
const { t } = useI18n()
const sulteng = computed(() => props.provinces.find((p) => p.area.code === SULTENG.code))
const groups = computed(() => [
  { key: 'sulteng', title: t('beranda.sulteng'), row: sulteng.value?.latest },
  { key: 'indonesia', title: t('beranda.indonesia'), row: props.national.latest },
])
</script>

<template>
  <div class="grid gap-8 lg:grid-cols-2" data-testid="headline">
    <section v-for="g in groups" :key="g.key" :data-group="g.key" :aria-labelledby="`hf-${g.key}`">
      <template v-if="g.row">
        <h3 :id="`hf-${g.key}`" class="text-lg">{{ g.title }}</h3>
        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <StatFigure state="positive" :label="t('state.positive')" :value="g.row.cumulative.positive" :delta="g.row.daily.positive" :as-of="g.row.date" emphasis />
          <StatFigure state="recovered" :label="t('state.recovered')" :value="g.row.cumulative.recovered" :delta="g.row.daily.recovered" :as-of="g.row.date" />
          <StatFigure state="deceased" :label="t('state.deceased')" :value="g.row.cumulative.deceased" :delta="g.row.daily.deceased" :as-of="g.row.date" />
          <StatFigure state="active" :label="t('state.active')" :value="g.row.cumulative.active" :delta="g.row.daily.active" :as-of="g.row.date" />
        </div>
        <DataFreshness class="mt-3" :as-of="g.row.date" :source="t('footer.thirdParty')" />
      </template>
    </section>
  </div>
</template>
