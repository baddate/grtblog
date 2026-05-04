<script setup lang="ts">
import { NButton, NCard, NForm, NFormItem, NInput, NModal } from 'naive-ui'

import type { NewCategoryModalState } from '../composables/use-taxonomy-select'

const modal = defineModel<NewCategoryModalState>('modal', { required: true })

defineEmits<{
  create: []
}>()
</script>

<template>
  <NModal
    v-model:show="modal.show"
    style="width: 420px; max-width: 90vw"
  >
    <NCard
      :title="$t('admin.category.create')"
      size="small"
    >
      <NForm
        label-placement="top"
        label-width="auto"
        class="space-y-3"
      >
        <NFormItem
          :label="$t('admin.common.name')"
          :show-feedback="false"
        >
          <NInput
            v-model:value="modal.name"
            :placeholder="$t('admin.placeholder.category_name_example')"
          />
        </NFormItem>
        <NFormItem
          :label="$t('admin.table.short_url')"
          :show-feedback="false"
        >
          <NInput
            v-model:value="modal.slug"
            :placeholder="$t('admin.placeholder.category_slug_example')"
          />
        </NFormItem>
      </NForm>
      <div class="mt-4 flex justify-end gap-2">
        <NButton
          quaternary
          @click="modal.show = false"
          >{{ $t('admin.common.cancel') }}</NButton
        >
        <NButton
          type="primary"
          :loading="modal.loading"
          @click="$emit('create')"
          >{{ $t('admin.action.create_and_select') }}</NButton
        >
      </div>
    </NCard>
  </NModal>
</template>
