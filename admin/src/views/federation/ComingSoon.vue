<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { ComingSoon, ScrollContainer } from '@/components'

defineOptions({ name: 'FederationComingSoon' })
</script>

<template>
  <ScrollContainer wrapper-class="p-4">
    <ComingSoon
      :title="t('admin.federation.coming_soon_title')"
      :description="t('admin.federation.coming_soon_desc')"
      icon="ph--circles-three"
    />
  </ScrollContainer>
</template>
