<script setup lang="ts" generic="T extends string">
import { useId } from 'vue'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// One choice out of a few (case type, view, metric): a shadcn toggle group with a visible label. A choice cannot be switched off.
defineProps<{ modelValue: T; options: { value: T; label: string }[]; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [T] }>()
const id = useId()
</script>

<template>
  <div role="group" :aria-labelledby="id">
    <p :id="id" class="m-0 mb-1 text-sm font-semibold text-ink-muted">{{ label }}</p>
    <ToggleGroup type="single" variant="outline" :spacing="2" class="flex-wrap" :model-value="modelValue" @update:model-value="(v) => v && emit('update:modelValue', v as T)">
      <ToggleGroupItem v-for="o in options" :key="o.value" :value="o.value" :data-value="o.value">{{ o.label }}</ToggleGroupItem>
    </ToggleGroup>
  </div>
</template>
