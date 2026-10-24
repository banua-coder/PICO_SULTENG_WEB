<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { isLiveMode } from '@/api/config'
import { usePartners } from '@/api/useContent'
import { DOCS_URL } from '@/app/facts'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// The old PICO footer: one white card with "Pranala Luar" (partners), the social links and the credit line.
const { t } = useI18n()
const { localize } = useLocale()
const fmt = useFormat()
const partners = usePartners()
// the last day of the record (README, PRODUCT.md)
const ARCHIVE_END = '2024-01-14'
const archive = !isLiveMode()
const link = 'inline-flex min-h-touch items-center'
const year = new Date().getFullYear()
const SOCIAL = [
  { key: 'github', href: 'https://github.com/banua-coder', label: 'GitHub' },
  { key: 'instagram', href: 'https://instagram.com/banuacoders_', label: 'Instagram' },
  { key: 'facebook', href: 'https://www.facebook.com/banuacoder', label: 'Facebook' },
  { key: 'youtube', href: 'https://www.youtube.com/channel/UC0SrBwl_lIlvR_wpYcmCG8w', label: 'YouTube' },
] as const
</script>

<template>
  <footer class="mx-auto mt-12 w-full max-w-6xl px-4 pb-24 xl:pb-8" :aria-label="t('footer.label')">
    <Card>
      <CardContent class="grid gap-6 text-sm md:grid-cols-3">
        <div>
          <h2 class="text-lg">{{ t('footer.partners') }}</h2>
          <!-- partners are in the prerendered HTML and in the page's initial state -->
          <ul class="m-0 grid list-none p-0 sm:grid-cols-2">
            <li v-for="p in partners.data.value?.filter((x) => x.inFooter)" :key="p.id">
              <a v-if="p.href" :class="link" :href="p.href" rel="noopener">{{ p.name }}</a>
              <span v-else :class="link">{{ p.name }}</span>
            </li>
          </ul>
        </div>
        <div>
          <h2 class="text-lg">{{ t('footer.links') }}</h2>
          <ul class="m-0 list-none p-0">
            <li><RouterLink :class="link" :to="localize('/mulai')">{{ t('footer.start') }}</RouterLink></li>
            <li><a :class="link" :href="DOCS_URL" rel="noopener">{{ t('footer.docs') }}</a></li>
            <li><a :class="link" href="https://pico-api.banuacoder.com/api/v1" rel="noopener">{{ t('footer.api') }}</a></li>
            <li><a :class="link" href="https://pico-api.banuacoder.com/swagger/index.html" rel="noopener">{{ t('footer.swagger') }}</a></li>
            <li><RouterLink :class="link" :to="localize('/metodologi')">{{ t('footer.methodology') }}</RouterLink></li>
          </ul>
        </div>
        <div class="text-ink-muted">
          <p v-if="archive">{{ t('footer.archive', { date: fmt.date(ARCHIVE_END) }) }}</p>
          <p class="mt-2">{{ t('footer.source') }}</p>
        </div>
      </CardContent>
      <Separator />
      <CardContent class="flex flex-col items-center gap-3 text-center text-sm text-ink-muted">
        <ul class="m-0 flex list-none flex-wrap justify-center gap-1 p-0">
          <li v-for="s in SOCIAL" :key="s.key">
            <a :href="s.href" rel="noopener" class="inline-flex min-h-touch min-w-touch items-center justify-center px-3 font-semibold" :aria-label="t(`footer.social.${s.key}`)">{{ s.label }}</a>
          </li>
        </ul>
        <p class="m-0">{{ t('footer.made') }} <a href="https://github.com/ryanaidilp" rel="noopener">Fajrian Aidil Pratama</a></p>
        <p class="m-0">&copy; 2020 - {{ year }} BanuaCoders. {{ t('footer.licence') }}</p>
      </CardContent>
    </Card>
  </footer>
</template>
