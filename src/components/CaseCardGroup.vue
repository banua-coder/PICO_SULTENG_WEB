<script setup lang="ts">
import CaseCard from './CaseCard.vue'
import type { CaseColumn } from './CaseCard.vue'
import type { DataState } from './StateMark.vue'

// The legacy Statistics.vue grid: four cards in the old order (Positif, Dirawat, Sembuh, Meninggal); one column on a phone, two from
// 768 px, four from 1280 px. Cards and columns are made by the page that knows the area and its dates.
export type CaseCardData = { key: DataState; label: string; columns: CaseColumn[] }
defineProps<{ cards: CaseCardData[] }>()
</script>

<template>
  <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4" data-testid="headline">
    <CaseCard v-for="c in cards" :key="c.key" :state="c.key" :label="c.label" :columns="c.columns" />
  </div>
</template>
