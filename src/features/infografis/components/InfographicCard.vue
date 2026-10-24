<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Infographic } from '@/api/types'
import PicoImage from '@/components/PicoImage.vue'

defineProps<{ item: Infographic }>()
const emit = defineEmits<{ open: [] }>()
const { t } = useI18n()
// the picture is on another host: when it cannot load, the tile collapses to its title and count (no broken-image box)
const failed = ref(false)
</script>

<template>
  <button type="button" class="flex w-full flex-col gap-2 rounded-lg border bg-card p-2 text-left text-card-foreground shadow-card hover:bg-accent" :data-id="item.id" @click="emit('open')">
    <!-- decoration only: the button is named by the title below -->
    <div v-if="!failed" aria-hidden="true">
      <PicoImage :src="item.images[0] ?? null" :alt="item.title" ratio="4/5" @failed="failed = true" />
    </div>
    <span class="font-semibold text-ink">{{ item.title }}</span>
    <span class="text-sm text-ink-muted">{{ item.images.length ? t('infografis.images', { n: item.images.length }) : t('infografis.cardNoImage') }}</span>
  </button>
</template>
