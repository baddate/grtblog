<script setup lang="ts">
import { useDialog } from 'naive-ui'
import { useI18n } from 'vue-i18n'

import { ButtonAnimation } from '@/components'
import { useComponentModifier } from '@/composables'
import { useUserStore } from '@/stores'

const { cleanup } = useUserStore()
const { t } = useI18n()

const dialog = useDialog()

const { getModalModifier } = useComponentModifier()

const handleSignOutClick = () => {
  dialog.info({
    ...getModalModifier(),
    title: t('admin.header.sign_out'),
    content: t('admin.header.sign_out_confirm'),
    positiveText: t('admin.common.confirm'),
    negativeText: t('admin.common.cancel'),
    onPositiveClick: () => cleanup(),
  })
}
</script>
<template>
  <ButtonAnimation
    @click="handleSignOutClick"
    :title="$t('admin.header.sign_out')"
  >
    <span class="iconify ph--sign-out" />
  </ButtonAnimation>
</template>
