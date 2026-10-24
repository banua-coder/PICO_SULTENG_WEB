<script setup lang="ts" generic="T">
import type { Resource } from '@/api/types'
import StatusView from '@/components/StatusView.vue'

// Each home section has its own loading and error state: one failed resource never blanks the page.
defineProps<{ resource: Resource<T>; minHeight?: string }>()
defineSlots<{ default(props: { data: T }): unknown }>()
</script>

<template>
  <slot v-if="resource.data.value !== undefined" :data="resource.data.value as T" />
  <StatusView v-else-if="resource.status.value === 'error'" kind="error" compact @retry="resource.refresh" />
  <div v-else :style="{ minHeight: minHeight ?? '8rem' }"><StatusView kind="loading" compact /></div>
</template>
