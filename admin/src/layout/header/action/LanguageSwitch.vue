<script setup lang="ts">
import { NButton } from 'naive-ui'
import { useLocaleStore } from '@/stores/locale'

defineOptions({ name: 'LanguageSwitch' })

const localeStore = useLocaleStore()
</script>

<template>
  <n-button
    text
    size="tiny"
    @click="localeStore.toggle()"
    style="font-size: 14px; padding: 0 6px"
  >
    {{ localeStore.isZh ? 'EN' : '中文' }}
  </n-button>
</template>
