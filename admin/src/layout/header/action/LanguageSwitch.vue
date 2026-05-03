<script setup lang="ts">
import { NButton, NDropdown } from 'naive-ui'
import { useLocaleStore } from '@/stores/locale'
import { LANGUAGES, getLanguageMeta } from '@/shared/languages'
import { computed } from 'vue'

defineOptions({ name: 'LanguageSwitch' })

const localeStore = useLocaleStore()

const currentMeta = computed(() => getLanguageMeta(localeStore.current))

const options = LANGUAGES.map(l => ({
  key: l.code,
  label: l.nativeName,
}))
</script>

<template>
  <n-dropdown trigger="click" :options="options" @select="(key: string) => localeStore.setLocale(key)">
    <n-button text size="tiny" style="font-size: 14px; padding: 0 6px">
      {{ currentMeta?.nativeName ?? localeStore.current }}
    </n-button>
  </n-dropdown>
</template>
