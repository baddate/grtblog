<script setup lang="ts">
import { ComingSoon, ScrollContainer } from '@/components'

defineOptions({
  name: 'PluginList',
})
</script>

<template>
  <ScrollContainer wrapper-class="p-4">
    <ComingSoon
      :title="$t('admin.plugins.title')"
      :description="$t('admin.plugins.description')"
      icon="ph--puzzle-piece"
    />
  </ScrollContainer>
</template>
