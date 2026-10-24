<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Eye, Share2 } from '@lucide/vue'
import type { Infographic } from '@/api/types'
import { siteUrl } from '@/app/site-url'
import { useLocale } from '@/app/useLocale'
import { Button } from '@/components/ui/button'

// The owner's "Info Praktikal" (legacy ShareableItems): one row per infographic, its title, and "Lihat" and "Bagikan". The pictures sit on other
// hosts that are gone, so the rows need none; Lihat opens the viewer on the Infografis page, Bagikan shares the link to it (the phone's share
// sheet when there is one, else it copies the link).
defineProps<{ items: Infographic[] }>()
const { t } = useI18n()
const { localize } = useLocale()
const said = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
const canShare = ref(false)
onMounted(() => (canShare.value = typeof navigator !== 'undefined' && typeof navigator.share === 'function'))
onBeforeUnmount(() => clearTimeout(timer))
async function share(i: Infographic) {
  const url = `${siteUrl()}${localize('/infografis')}?id=${i.id}`
  try {
    if (canShare.value) await navigator.share({ title: i.title, url })
    else {
      await navigator.clipboard.writeText(url)
      said.value = t('copy.done')
      clearTimeout(timer)
      timer = setTimeout(() => (said.value = ''), 2000)
    }
  } catch {
    // cancelled, or no clipboard access: say nothing rather than claim success
  }
}
</script>

<template>
  <div>
    <p class="m-0 text-ink-muted">{{ t('beranda.infoIntro') }} <a href="https://instagram.com/sultenglawancovid" rel="noopener noreferrer" target="_blank">Sulteng Lawan COVID<span class="sr-only"> {{ t('contact.newTab') }}</span></a></p>
    <ul class="m-0 mt-2 list-none p-0" data-testid="latest-infographics">
      <li v-for="i in items" :key="i.id" class="flex items-baseline justify-between gap-3 border-b py-3 last:border-b-0">
        <span class="min-w-0 flex-1 break-words font-semibold text-ink">{{ i.title }}</span>
        <span class="flex flex-none items-center gap-1 text-sm">
          <RouterLink :to="`${localize('/infografis')}?id=${i.id}`" class="inline-flex min-h-touch items-center gap-1 rounded-md px-2 no-underline hover:bg-accent"><Eye class="size-4" aria-hidden="true" />{{ t('beranda.infoView') }}<span class="sr-only"> {{ i.title }}</span></RouterLink>
          <button type="button" class="inline-flex min-h-touch cursor-pointer items-center gap-1 rounded-md bg-transparent px-2 text-primary-strong hover:bg-accent" @click="share(i)"><Share2 class="size-4" aria-hidden="true" />{{ t('beranda.infoShare') }}<span class="sr-only"> {{ i.title }}</span></button>
        </span>
      </li>
    </ul>
    <p role="status" aria-live="polite" class="m-0 min-h-5 text-sm text-ink-muted">{{ said }}</p>
    <p class="mb-0 mt-2 text-center"><Button as-child variant="outline"><RouterLink :to="localize('/infografis')" class="text-primary-strong no-underline">{{ t('beranda.infoMore') }}</RouterLink></Button></p>
  </div>
</template>
