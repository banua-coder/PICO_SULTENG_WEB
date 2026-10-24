<script setup lang="ts">
import type { Donation } from '@/api/types'
import DonationCard from './DonationCard.vue'

defineProps<{ items: Donation[] }>()
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2" data-testid="donation-grid">
    <DonationCard v-for="d in items" :key="d.id" :donation="d" />
  </div>
</template>
