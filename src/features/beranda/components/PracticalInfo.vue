<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/app/useLocale'
import { Check } from '@lucide/vue'
import SectionHeading from '@/components/SectionHeading.vue'
import { Card, CardContent } from '@/components/ui/card'
import Illustration from '@/components/Illustration.vue'

// "Apa yang harus dilakukan?" and "Apa yang harus diketahui?" of the old home page, with its own small illustrations.
const { t } = useI18n()
const { localize } = useLocale()
const CHECKS = ['wash', 'face', 'clean', 'distancing', 'meter', 'home', 'mask', 'vaccine'] as const
const SYMPTOMS = [
  { key: 'symFever', art: 'gejala-demam' },
  { key: 'symCough', art: 'gejala-batuk' },
  { key: 'symHeadache', art: 'gejala-sakit-kepala' },
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
      <!-- the owner's CardPeriksa: the blue risk block with its button (it opens the self-isolation guide, the old chatbot link is gone) -->
      <div class="mt-5 rounded-lg bg-primary p-6 text-on-primary shadow-lg" data-testid="risk-cta">
        <h3 class="m-0 text-[1.25rem] font-bold text-on-primary lg:text-[1.5rem]">{{ t('beranda.riskTitle') }}</h3>
        <div class="flex flex-col lg:flex-row">
          <p class="m-0 mt-4 w-full text-sm lg:w-3/4 lg:text-base">{{ t('beranda.riskText') }}<br><br>{{ t('beranda.riskAsk') }}</p>
          <RouterLink :to="localize('/isoman')" class="mx-auto my-2 w-full rounded-md border-2 border-on-primary p-4 text-center text-sm font-bold text-on-primary no-underline hover:bg-primary-strong lg:mx-16 lg:my-auto lg:w-1/4 lg:text-base">{{ t('beranda.riskCta') }}</RouterLink>
        </div>
      </div>
      <!-- the owner's CardLindungi: the checklist, with the brand v2 pictures in place of the old two -->
      <div class="mt-4 rounded-lg bg-card p-6 shadow-lg" data-testid="protect-card">
        <h3 class="m-0 text-[1.25rem] font-bold lg:text-[1.5rem]">{{ t('beranda.protectTitle') }}</h3>
        <div class="flex flex-row gap-6">
          <div class="mt-4 text-sm lg:w-3/4 lg:text-base">
            <p class="m-0">{{ t('beranda.protectIntro') }}</p>
            <p class="m-0 mt-3 font-semibold">{{ t('beranda.protectLead') }}</p>
            <ul class="m-0 mt-2 list-none p-0">
              <li v-for="k in CHECKS" :key="k" class="flex gap-2"><Check class="mt-1 size-4 shrink-0 text-recovered-ink" aria-hidden="true" /><span>{{ t(`beranda.check.${k}`) }}</span></li>
            </ul>
          </div>
          <div class="hidden w-1/4 flex-col justify-center gap-6 md:flex">
            <Illustration name="cuci-tangan" :width="200" :alt="t('beranda.tipWash')" />
            <Illustration name="pakai-masker" :width="200" :alt="t('beranda.tipMask')" />
          </div>
        </div>
        <p class="m-0 mt-6 text-xs italic text-ink-muted">{{ t('beranda.protectSource') }} <a href="https://pikobar.jabarprov.go.id" rel="noopener noreferrer" target="_blank">pikobar.jabarprov.go.id</a></p>
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
            <li v-for="s in SYMPTOMS" :key="s.key" class="flex items-center gap-2"><Illustration :name="s.art" :width="72" /><span class="font-semibold">{{ t(`beranda.${s.key}`) }}</span></li>
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
