<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { isLiveMode } from '@/api/config'
import { usePartners } from '@/api/useContent'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'

const { t } = useI18n()
const { localize } = useLocale()
const fmt = useFormat()
const partners = usePartners()
// the last day of the record (README, PRODUCT.md)
const ARCHIVE_END = '2024-01-14'
const archive = !isLiveMode()
const link = 'inline-flex min-h-touch items-center'
</script>

<template>
  <footer class="mt-8 bg-surface" :aria-label="t('footer.label')">
    <!-- selvedge: decorative woven border (DESIGN.md), indigo band with sky and primary warp blocks and one crimson knot -->
    <div class="selvedge" aria-hidden="true" />
    <div class="mx-auto grid max-w-6xl gap-6 px-5 py-6 text-sm md:grid-cols-3">
      <div>
        <h2 class="text-md">{{ t('footer.links') }}</h2>
        <ul class="m-0 list-none p-0">
          <li><a :class="link" href="https://pico-api.banuacoder.com/api/v1" rel="noopener">{{ t('footer.api') }}</a></li>
          <li><a :class="link" href="https://pico-api.banuacoder.com/swagger/index.html" rel="noopener">{{ t('footer.swagger') }}</a></li>
          <li><RouterLink :class="link" :to="localize('/metodologi')">{{ t('footer.methodology') }}</RouterLink></li>
        </ul>
      </div>
      <div>
        <h2 class="text-md">{{ t('footer.partners') }}</h2>
        <!-- partners are in the prerendered HTML and in the page's initial state -->
        <ul class="m-0 list-none p-0">
          <li v-for="p in partners.data.value?.filter((x) => x.inFooter)" :key="p.id">
            <a v-if="p.href" :class="link" :href="p.href" rel="noopener">{{ p.name }}</a>
            <span v-else :class="link">{{ p.name }}</span>
          </li>
        </ul>
      </div>
      <div class="text-ink-muted">
        <p>{{ t('footer.culture') }}</p>
        <p v-if="archive" class="mt-3">{{ t('footer.archive', { date: fmt.date(ARCHIVE_END) }) }}</p>
      </div>
    </div>
  </footer>
</template>
