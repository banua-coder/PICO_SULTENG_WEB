<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/app/useLocale'
import TipFigure from '@/components/TipFigure.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import { Card, CardContent } from '@/components/ui/card'
import wash from '@/assets/images/wash_hands.png'
import mask from '@/assets/images/wear_mask.png'
import fever from '@/assets/images/fever.png'
import cough from '@/assets/images/caugh.png'
import headache from '@/assets/images/headache.png'

// "Apa yang harus dilakukan?" and "Apa yang harus diketahui?" of the old home page, with its own small illustrations.
const { t } = useI18n()
const { localize } = useLocale()
const SYMPTOMS = [
  { key: 'symFever', src: fever },
  { key: 'symCough', src: cough },
  { key: 'symHeadache', src: headache },
] as const
</script>

<template>
  <div class="flex flex-col gap-8">
    <section aria-labelledby="lakukan">
      <SectionHeading id="lakukan" :level="2">{{ t('beranda.whatToDo') }}</SectionHeading>
      <Card class="mt-3 border-l-4 border-l-active">
        <CardContent>
          <h3 class="m-0 text-lg">{{ t('beranda.callTitle') }}</h3>
          <p class="m-0 mt-1 font-semibold">{{ t('beranda.callText') }} <a href="tel:119">119</a></p>
          <p class="m-0 mt-1 text-sm text-ink-muted">{{ t('beranda.callArchive') }}</p>
        </CardContent>
      </Card>
      <h3 class="mb-0 mt-5 text-lg">{{ t('beranda.tipsTitle') }}</h3>
      <div class="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TipFigure :src="wash" :caption="t('beranda.tipWash')" />
        <TipFigure :src="mask" :caption="t('beranda.tipMask')" />
        <TipFigure icon="prevention.distancing" :caption="t('beranda.tipDistance')" />
        <TipFigure icon="vaccine" :caption="t('beranda.tipVaccine')" />
      </div>
    </section>

    <section aria-labelledby="ketahui">
      <SectionHeading id="ketahui" :level="2">{{ t('beranda.whatToKnow') }}</SectionHeading>
      <Card class="mt-3">
        <CardContent>
          <h3 class="m-0 text-lg">{{ t('beranda.aboutTitle') }}</h3>
          <p class="mt-1 max-w-prose">{{ t('beranda.aboutText') }}</p>
          <h3 class="m-0 mt-4 text-lg">{{ t('beranda.symptomsTitle') }}</h3>
          <ul class="m-0 mt-2 flex list-none flex-wrap gap-6 p-0">
            <li v-for="s in SYMPTOMS" :key="s.key" class="flex items-center gap-2"><img :src="s.src" alt="" width="85" height="81" loading="lazy" decoding="async" class="size-12"><span class="font-semibold">{{ t(`beranda.${s.key}`) }}</span></li>
          </ul>
          <p class="mt-3 max-w-prose">{{ t('beranda.symptomsText') }}</p>
        </CardContent>
      </Card>
      <p class="m-0 mt-4 flex flex-wrap gap-5">
        <RouterLink :to="localize('/wiki')">{{ t('beranda.wikiLink') }}</RouterLink>
        <RouterLink :to="localize('/isoman')">{{ t('beranda.isomanLink') }}</RouterLink>
      </p>
    </section>
  </div>
</template>
