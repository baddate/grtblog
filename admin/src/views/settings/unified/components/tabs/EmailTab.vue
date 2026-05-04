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
    :title="t('admin.settings.email_config')"
    :description="t('admin.settings.email_config_desc')"
    :filter-groups="['notification/email']"
    :on-dirty-change="(dirty: boolean) => emit('dirty-change', dirty)"
  />
</template>
