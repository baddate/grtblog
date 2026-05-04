<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { listSysConfigs, updateSysConfigs } from '@/services/sysconfig'

import ConfigPanel from '../ConfigPanel'

const emit = defineEmits<{ 'dirty-change': [dirty: boolean] }>()
</script>

<template>
  <ConfigPanel
    :list-fn="listSysConfigs"
    :update-fn="updateSysConfigs"
    :title="t('admin.settings.webhook')"
    :description="t('admin.settings.webhook_desc')"
    :filter-groups="['webhook']"
    :on-dirty-change="(dirty: boolean) => emit('dirty-change', dirty)"
  />
</template>
