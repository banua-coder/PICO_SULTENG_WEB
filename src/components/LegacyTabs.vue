<script setup lang="ts" generic="T extends string">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// The owner's tab strip (legacy DataTabs.vue / VaccineData.vue): plain words in a row, the open one blue with a blue bottom rule, the rest
// quiet; the content sits under a gray rule. Built on the shadcn Tabs primitives (roles, arrow keys, aria) with the legacy look.
defineProps<{ tabs: { value: T; label: string }[]; label: string }>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <Tabs v-model="model" class="w-full gap-0">
    <TabsList :aria-label="label" class="h-auto w-full max-w-xl justify-start gap-0 rounded-none border-b-2 bg-transparent p-0 pt-3">
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        class="-mb-0.5 min-h-touch rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 py-2 text-xs font-semibold text-ink-muted shadow-none data-[state=active]:border-primary-strong data-[state=active]:bg-transparent data-[state=active]:text-primary-strong data-[state=active]:shadow-none md:text-[1.25rem]"
      >
        {{ tab.label }}
      </TabsTrigger>
    </TabsList>
    <TabsContent v-for="tab in tabs" :key="tab.value" :value="tab.value" class="py-5">
      <slot :name="tab.value" />
    </TabsContent>
  </Tabs>
</template>
