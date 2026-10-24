<script setup lang="ts">
// The four boxes of "Anjuran tempat perawatan pasien Covid-19 berdasarkan gejalanya" (legacy Isolation page): a blue header, the signs,
// then where to be treated. The legacy marks &#8826; and &#8827; are written as < and >.
export type Category = { name: string; signs: string[]; places: string[] }
defineProps<{ items: Category[]; signsLabel: string; placesLabel: string }>()
</script>

<template>
  <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4" data-testid="isoman-categories">
    <section v-for="c in items" :key="c.name" class="flex flex-col border border-primary-strong" :data-category="c.name">
      <h3 class="m-0 bg-primary p-2 text-base font-bold text-on-primary">{{ c.name }}</h3>
      <div class="flex-1 p-2">
        <h4 class="m-0 text-base font-bold text-primary-strong">{{ signsLabel }}</h4>
        <ul class="my-2 list-disc pl-5"><li v-for="s in c.signs" :key="s" class="my-2">{{ s }}</li></ul>
      </div>
      <hr class="m-0">
      <div class="p-2">
        <h4 class="m-0 text-base font-bold text-primary-strong">{{ placesLabel }}</h4>
        <ul class="my-2 list-disc pl-5"><li v-for="p in c.places" :key="p" class="my-2">{{ p }}</li></ul>
      </div>
    </section>
  </div>
</template>
