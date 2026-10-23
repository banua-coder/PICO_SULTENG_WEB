<script setup lang="ts">
import { useTheme } from '@/app/useTheme'

const { theme, cycle } = useTheme()
</script>

<template>
  <main id="konten" class="mx-auto max-w-3xl p-6">
    <h1 class="text-2xl">PICO Sulteng</h1>
    <p class="mt-4">Catatan COVID-19 Sulawesi Tengah, 2 Maret 2020 sampai 14 Januari 2024.</p>
    <p class="num mt-4 text-xl font-strong">1.234.567</p>
    <div class="mt-6 rounded-md border border-line bg-tint p-5">Plakat di atas kapas polos.</div>
    <button type="button" class="mt-6 rounded-sm bg-primary-strong px-5 py-3 text-on-primary" @click="cycle">
      Tema: {{ theme }}
    </button>
  </main>
</template>
