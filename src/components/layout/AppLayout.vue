<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { START_LOCATION, useRouter } from 'vue-router'
import AppFooter from './AppFooter.vue'
import AppHeader from './AppHeader.vue'
import SkipLink from './SkipLink.vue'

const router = useRouter()
const announced = ref('')

// Marks the page as interactive. End-to-end tests wait for it before they press keys or inject nodes.
onMounted(() => {
  document.body.dataset.hydrated = 'true'
})

// After a client-side navigation: focus moves to the page's <h1> and a polite live region says where we are.
router.afterEach(async (to, from, failure) => {
  if (failure || from === START_LOCATION || to.path === from.path) return
  await nextTick()
  await nextTick()
  const h1 = document.querySelector<HTMLElement>('#konten h1')
  if (!h1) return
  h1.setAttribute('tabindex', '-1')
  h1.focus({ preventScroll: true })
  announced.value = ''
  await nextTick()
  announced.value = h1.textContent?.trim() ?? ''
})
</script>

<template>
  <SkipLink />
  <AppHeader />
  <main id="konten" tabindex="-1" class="mx-auto w-full max-w-6xl outline-none">
    <slot />
  </main>
  <AppFooter />
  <div role="status" aria-live="polite" class="sr-only" data-testid="route-announcer">{{ announced }}</div>
</template>
