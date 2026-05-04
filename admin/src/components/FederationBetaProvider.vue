<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { useDialog } from 'naive-ui'
import { onMounted, onUnmounted } from 'vue'

import {
  federationBetaMessage,
  federationBetaTitle,
  markFederationBetaAcknowledged,
  registerFederationBetaConfirmHandler,
} from '@/utils/federation-beta'

const dialog = useDialog()

function confirmFederationBeta() {
  return new Promise<boolean>((resolve) => {
    dialog.warning({
      title: federationBetaTitle,
      content: federationBetaMessage,
      positiveText: t('admin.federation_beta.try_now'),
      negativeText: t('admin.federation_beta.look_around'),
      maskClosable: false,
      closable: false,
      onPositiveClick: () => {
        markFederationBetaAcknowledged()
        resolve(true)
      },
      onNegativeClick: () => resolve(false),
      onClose: () => resolve(false),
    })
  })
}

onMounted(() => {
  registerFederationBetaConfirmHandler(confirmFederationBeta)
})

onUnmounted(() => {
  registerFederationBetaConfirmHandler(null)
})
</script>

<template>
  <slot />
</template>
