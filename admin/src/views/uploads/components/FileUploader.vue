<script setup lang="ts">
import {
  ChevronDown24Regular,
  CloudArrowUp24Regular,
  Document24Regular,
  Image24Regular,
} from '@vicons/fluent'
import { NButton, NDropdown, NIcon, NSpace, NUpload } from 'naive-ui'
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'

import type { FileType } from '@/services/uploads'
import type { DropdownOption, UploadCustomRequestOptions } from 'naive-ui'

const { t } = useI18n()

defineProps<{
  uploadType: FileType
  uploading: boolean
}>()

const emit = defineEmits<{
  'update:uploadType': [value: FileType]
  upload: [payload: UploadCustomRequestOptions]
}>()

const typeOptions = computed<DropdownOption[]>(() => [
  { label: t('admin.upload.tab_image'), key: 'picture', icon: renderIcon(Image24Regular) },
  { label: t('admin.upload.tab_file'), key: 'file', icon: renderIcon(Document24Regular) },
])

function renderIcon(icon: typeof Image24Regular | typeof Document24Regular) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

function getTypeLabel(value: FileType) {
  return value === 'picture' ? t('admin.upload.tab_image') : t('admin.upload.tab_file')
}
</script>

<template>
  <NSpace align="center">
    <NDropdown
      :options="typeOptions"
      @select="emit('update:uploadType', $event)"
    >
      <NButton secondary>
        <span class="upload-type-option">
          <NIcon
            ><Image24Regular v-if="uploadType === 'picture'" /><Document24Regular v-else
          /></NIcon>
          <span>{{ getTypeLabel(uploadType) }}</span>
          <NIcon><ChevronDown24Regular /></NIcon>
        </span>
      </NButton>
    </NDropdown>
    <NUpload
      multiple
      :accept="uploadType === 'picture' ? 'image/*' : undefined"
      :show-file-list="false"
      :custom-request="(options) => emit('upload', options)"
      :disabled="uploading"
    >
      <NButton
        type="primary"
        :loading="uploading"
      >
        <template #icon
          ><NIcon><CloudArrowUp24Regular /></NIcon
        ></template>
        {{ $t('admin.common.upload') }}{{ getTypeLabel(uploadType) }}
      </NButton>
    </NUpload>
  </NSpace>
</template>

<style scoped>
.upload-type-option {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  line-height: 1;
}
</style>
