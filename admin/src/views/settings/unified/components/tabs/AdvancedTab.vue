<script setup lang="ts">
import { listSysConfigs, updateSysConfigs } from '@/services/sysconfig'

import ConfigPanel from '../ConfigPanel'

const emit = defineEmits<{ 'dirty-change': [dirty: boolean] }>()
</script>

<template>
  <ConfigPanel
    :list-fn="listSysConfigs"
    :update-fn="updateSysConfigs"
    :title="$t('admin.settings.advanced')"
    :description="$t('admin.settings.advanced_desc')"
    :exclude-groups="[
      'security/turnstile',
      'interaction/comment',
      'storage/upload',
      'notification/email',
      'webhook',
      'site',
    ]"
    :exclude-root-item-keys="['article.hot']"
    :on-dirty-change="(dirty: boolean) => emit('dirty-change', dirty)"
  />
</template>
