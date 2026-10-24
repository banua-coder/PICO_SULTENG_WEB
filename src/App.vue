<script setup lang="ts">
import { onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useTheme } from '@/app/useTheme'

const { init } = useTheme()
onMounted(init)
</script>

<template>
  <AppLayout>
    <RouterView />
  </AppLayout>
</template>
