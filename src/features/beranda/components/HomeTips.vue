<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TipFigure from '@/components/TipFigure.vue'
import distance from '@/assets/brand/illustrations/pico-tip-keep-distance.svg?raw'
import vaccinated from '@/assets/brand/illustrations/pico-tip-vaccinated.svg?raw'
import wash from '@/assets/brand/illustrations/pico-tip-wash-hands.svg?raw'
import mask from '@/assets/brand/illustrations/pico-tip-wear-mask.svg?raw'

// The four tip illustrations (22 KB of SVG). PracticalInfo loads this file after the page is up, so it is not in the first load.
const { t } = useI18n()
</script>

<template>
  <div class="grid grid-cols-2 gap-5 lg:grid-cols-4">
    <TipFigure :svg="wash" :caption="t('beranda.tipWash')" />
    <TipFigure :svg="mask" :caption="t('beranda.tipMask')" />
    <TipFigure :svg="distance" :caption="t('beranda.tipDistance')" />
    <TipFigure :svg="vaccinated" :caption="t('beranda.tipVaccine')" />
  </div>
</template>
