<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { NButton, NForm, NModal, NSpace } from 'naive-ui'

defineOptions({
  name: 'FormModal',
})

const props = withDefaults(
  defineProps<{
    show: boolean
    title: string
    loading?: boolean
    width?: number
    labelWidth?: number
    confirmText?: string
    cancelText?: string
  }>(),
  {
    loading: false,
    width: 540,
    labelWidth: 90,
  },
)

const computedConfirmText = () => props.confirmText ?? t('admin.common.save')
const computedCancelText = () => props.cancelText ?? t('admin.common.cancel')

const emit = defineEmits<{
  'update:show': [value: boolean]
  confirm: []
}>()

function close() {
  emit('update:show', false)
}

function onConfirm() {
  emit('confirm')
}

</script>

<template>
  <NModal
    :show="props.show"
    preset="card"
    :title="props.title"
    :style="{ width: `${props.width}px` }"
    @update:show="emit('update:show', $event)"
  >
    <NForm
      label-placement="left"
      :label-width="props.labelWidth"
    >
      <slot />
    </NForm>

    <template #footer>
      <slot
        name="footer"
        :close="close"
      >
        <NSpace justify="end">
          <NButton @click="close">{{ computedCancelText() }}</NButton>
          <NButton
            type="primary"
            :loading="props.loading"
            @click="onConfirm"
            >{{ computedConfirmText() }}</NButton
          >
        </NSpace>
      </slot>
    </template>
  </NModal>
</template>
