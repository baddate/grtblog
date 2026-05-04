<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NInput, NModal } from 'naive-ui'

const { t } = useI18n()

defineProps<{
  visible: boolean
  fileName: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:fileName': [value: string]
  confirm: []
}>()
</script>

<template>
  <NModal
    :show="visible"
    preset="dialog"
    :title="t('admin.upload.rename_file')"
    :positive-text="t('admin.common.confirm')"
    :negative-text="t('admin.common.cancel')"
    @positive-click="emit('confirm')"
    @update:show="emit('update:visible', $event)"
  >
    <div style="padding: 16px 0">
      <NInput
        :value="fileName"
        :placeholder="t('admin.upload.file_name_placeholder')"
        @update:value="emit('update:fileName', $event)"
        @keyup.enter="emit('confirm')"
      />
    </div>
  </NModal>
</template>
