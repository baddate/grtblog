<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import {
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NFormItem,
  NInput,
  NModal,
  NPopconfirm,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui'
import { computed, h, ref } from 'vue'

import { FormModal } from '@/components'
import { useTable } from '@/composables/table/use-table'
import { createAdminToken, deleteAdminToken, listAdminTokens } from '@/services/admin-tokens'
import { formatDate } from '@/utils/format'

import type { AdminTokenItem } from '@/services/admin-tokens'
import type { DataTableColumns } from 'naive-ui'

const message = useMessage()
const { loading, data: tableData, pagination, refresh } = useTable<AdminTokenItem>(listAdminTokens)

const columns = computed<DataTableColumns<AdminTokenItem>>(() => [
  {
    title: t('admin.table.id'),
    key: 'id',
    width: 70,
  },
  {
    title: t('admin.common.description'),
    key: 'description',
    render: (row) => row.description || '-',
  },
  {
    title: t('admin.common.creator'),
    key: 'username',
    width: 140,
  },
  {
    title: t('admin.table.expires_at'),
    key: 'expireAt',
    width: 180,
    render: (row) => formatDate(row.expireAt),
  },
  {
    title: t('admin.common.status'),
    key: 'isExpired',
    width: 90,
    render: (row) =>
      h(
        NTag,
        { type: row.isExpired ? 'warning' : 'success', size: 'small', bordered: false },
        { default: () => (row.isExpired ? t('admin.status.expired') : t('admin.status.valid')) },
      ),
  },
  {
    title: t('admin.common.actions'),
    key: 'actions',
    width: 90,
    render: (row) =>
      h(
        NPopconfirm,
        { onPositiveClick: () => handleDelete(row) },
        {
          trigger: () =>
            h(NButton, { size: 'small', type: 'error', tertiary: true }, { default: () => t('admin.common.delete') }),
          default: () => t('admin.confirm.delete_token'),
        },
      ),
  },
])

const createVisible = ref(false)
const revealVisible = ref(false)
const saving = ref(false)
const createdToken = ref('')
const formParams = ref({
  description: '',
  expireAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
})

function openCreate() {
  formParams.value = {
    description: '',
    expireAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
  }
  createVisible.value = true
}

async function handleCreate() {
  if (!formParams.value.expireAt) {
    message.error(t('admin.validation.expire_time_required'))
    return
  }
  saving.value = true
  try {
    const payload = {
      description: formParams.value.description.trim(),
      expireAt: new Date(formParams.value.expireAt).toISOString(),
    }
    const result = await createAdminToken(payload)
    createdToken.value = result.token
    createVisible.value = false
    revealVisible.value = true
    message.success(t('admin.common.create_success'))
    refresh()
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: AdminTokenItem) {
  await deleteAdminToken(row.id)
  message.success(t('admin.common.delete_success'))
  refresh()
}

</script>

<template>
  <NCard :title="$t('admin.settings.api_tokens')">
    <template #header-extra>
      <NButton
        type="primary"
        @click="openCreate"
        >{{ $t('admin.action.create') }}</NButton
      >
    </template>

    <NDataTable
      remote
      :loading="loading"
      :columns="columns"
      :data="tableData"
      :pagination="pagination"
      class="mt-4"
    />
  </NCard>

  <FormModal
    v-model:show="createVisible"
    :title="$t('admin.table.new_token')"
    :loading="saving"
    :label-width="96"
    :confirm-text="$t('admin.common.create')"
    @confirm="handleCreate"
  >
    <NFormItem :label="$t('admin.common.description')">
      <NInput
        v-model:value="formParams.description"
        maxlength="200"
        :placeholder="$t('admin.table.description_optional')"
      />
    </NFormItem>
    <NFormItem
      :label="$t('admin.table.expires_at')"
      required
    >
      <NDatePicker
        v-model:value="formParams.expireAt"
        type="datetime"
        style="width: 100%"
      />
    </NFormItem>
  </FormModal>

  <NModal
    v-model:show="revealVisible"
    preset="card"
    :title="$t('admin.table.token_generated')"
    style="width: 560px"
  >
    <div class="mb-3 text-sm text-[var(--text-color-2)]">{{ $t('admin.table.token_generated_hint') }}</div>
    <NInput
      :value="createdToken"
      type="textarea"
      :rows="3"
      readonly
    />
    <template #footer>
      <NSpace justify="end">
        <NButton @click="revealVisible = false">{{ $t('admin.common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
