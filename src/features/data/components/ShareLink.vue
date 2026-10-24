<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { siteUrl } from '@/app/site-url'
import { Button } from '@/components/ui/button'
import CopyButton from '@/components/CopyButton.vue'

// Copies the address of this view (area, window and view are all in the URL), and uses the phone's share sheet when it has one.
const props = defineProps<{ url?: string }>()
const { t } = useI18n()
const route = useRoute()
const href = computed(() => props.url ?? `${siteUrl()}${route.fullPath}`)
const canShare = ref(false)
onMounted(() => (canShare.value = typeof navigator !== 'undefined' && typeof navigator.share === 'function'))
const share = () => navigator.share({ title: document.title, url: href.value }).catch(() => undefined)
</script>

<template>
  <div class="flex flex-wrap items-center gap-2" data-testid="share">
    <span class="text-sm font-strong text-ink-muted">{{ t('data.share') }}</span>
    <CopyButton :value="href" :label="t('data.shareCopy')" />
    <Button v-if="canShare" type="button" variant="outline" size="sm" class="text-primary-strong" @click="share">{{ t('data.shareNative') }}</Button>
  </div>
</template>
