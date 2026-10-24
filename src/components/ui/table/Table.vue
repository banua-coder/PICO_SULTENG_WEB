<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "cn"

// `scroll: false` leaves the scrolling to a parent region (a table with a sticky header inside a fixed-height box).
defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  class?: HTMLAttributes["class"]
  scroll?: boolean
}>(), { scroll: true })
</script>

<template>
  <div data-slot="table-container" :class="props.scroll ? 'relative w-full overflow-auto' : 'relative w-full'" :tabindex="props.scroll ? 0 : undefined">
    <table v-bind="$attrs" data-slot="table" :class="cn('w-full caption-bottom text-sm', props.class)">
      <slot />
    </table>
  </div>
</template>
