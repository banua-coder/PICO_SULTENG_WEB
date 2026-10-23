<script setup lang="ts">
import { computed } from 'vue'
import { useVaccination } from '@/api/useStats'
import StatusView from '@/components/StatusView.vue'
import type { Scope } from '../useVaksin'
import { lastDay } from '../useVaksin'
import CoverageByGroup from './CoverageByGroup.vue'
import CoverageNow from './CoverageNow.vue'
import DosesOverTime from './DosesOverTime.vue'

// The three sections that depend on the scope. The series is client-side only (it is big), so the shell shows a loading state first.
// VaksinView keys this component by scope, so the resource is created once per scope.
const props = defineProps<{ scope: Scope }>()
const series = useVaccination(props.scope)
const day = computed(() => (series.data.value ? lastDay(series.data.value) : undefined))
</script>

<template>
  <div v-if="series.data.value && day" class="flex flex-col gap-8">
    <CoverageNow :day="day" />
    <CoverageByGroup :day="day" />
    <DosesOverTime :days="series.data.value" />
  </div>
  <StatusView v-else-if="series.status.value === 'error'" kind="error" compact @retry="series.refresh" />
  <div v-else class="min-h-[24rem]"><StatusView kind="loading" compact /></div>
</template>
