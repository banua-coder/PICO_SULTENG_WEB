<script setup lang="ts">
import { onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useLocale } from '@/app/useLocale'
import { useTheme } from '@/app/useTheme'

const { init } = useTheme()
const { locale } = useLocale()
onMounted(init)
useHead({ htmlAttrs: { lang: locale } })
</script>

<template>
  <RouterView />
</template>
