<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import {
  NButton,
  NCard,
  NDataTable,
  NFormItem,
  NInput,
  NPopconfirm,
  NSpace,
  useMessage,
} from 'naive-ui'
import { h, onMounted, reactive, ref } from 'vue'

import { FormModal, ScrollContainer } from '@/components'
import { createColumn, deleteColumn, listColumns, updateColumn } from '@/services/taxonomy'
import { formatDate } from '@/utils/format'

import type { ColumnItem } from '@/services/taxonomy'
import type { DataTableColumns } from 'naive-ui'

defineOptions({
  name: 'MomentColumnManagement',
})

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const items = ref<ColumnItem[]>([])
const editVisible = ref(false)
const editingId = ref<number | null>(null)
const formModel = reactive({
  name: '',
  shortUrl: '',
})

const columns: DataTableColumns<ColumnItem> = [
  { title: t('admin.table.id'), key: 'id', width: 80 },
  { title: t('admin.column.name'), key: 'name', minWidth: 200 },
  { title: t('admin.table.short_url'), key: 'shortUrl', minWidth: 180 },
  {
    title: t('admin.common.updated_at'),
    key: 'updatedAt',
    width: 180,
    render: (row) => formatDate(row.updatedAt),
  },
  {
    title: t('admin.common.actions'),
    key: 'actions',
    width: 180,
    render: (row) =>
      h(NSpace, { size: 'small' }, () => [
        h(
          NButton,
          { size: 'small', tertiary: true, onClick: () => openEdit(row) },
          { default: () => t('admin.common.edit') },
        ),
        h(
          NPopconfirm,
          { onPositiveClick: () => handleDelete(row) },
          {
            trigger: () =>
              h(
                NButton,
                { size: 'small', type: 'error', secondary: true },
                { default: () => t('admin.common.delete') },
              ),
            default: () => t('admin.confirm.delete_column'),
          },
        ),
      ]),
  },
]

const modalTitle = ref(t('admin.action.create_column'))

async function fetchData() {
  loading.value = true
  try {
    items.value = await listColumns()
  } catch (error: any) {
    message.error(error?.message || t('admin.service.column_list_failed'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  modalTitle.value = t('admin.action.create_column')
  editingId.value = null
  formModel.name = ''
  formModel.shortUrl = ''
  editVisible.value = true
}

function openEdit(row: ColumnItem) {
  modalTitle.value = t('admin.action.edit_column')
  editingId.value = row.id
  formModel.name = row.name
  formModel.shortUrl = row.shortUrl
  editVisible.value = true
}

async function handleSubmit() {
  const name = formModel.name.trim()
  const shortUrl = formModel.shortUrl.trim()
  if (!name) {
    message.warning(t('admin.validation.column_name_required'))
    return
  }
  if (!shortUrl) {
    message.warning(t('admin.validation.column_short_url_required'))
    return
  }

  saving.value = true
  try {
    if (editingId.value) {
      await updateColumn(editingId.value, { name, shortUrl })
      message.success(t('admin.service.column_updated'))
    } else {
      await createColumn({ name, shortUrl })
      message.success(t('admin.service.column_created'))
    }
    editVisible.value = false
    await fetchData()
  } catch (error: any) {
    message.error(error?.message || t('admin.service.save_failed'))
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: ColumnItem) {
  try {
    await deleteColumn(row.id)
    message.success(t('admin.common.delete_success'))
    await fetchData()
  } catch (error: any) {
    message.error(error?.message || t('admin.service.delete_failed'))
  }
}

onMounted(() => {
  fetchData()
})

</script>

<template>
  <ScrollContainer
    wrapper-class="p-4"
    :scrollbar-props="{ trigger: 'none' }"
  >
    <NCard :title="$t('admin.card.column_list')">
      <template #header-extra>
        <NButton
          type="primary"
          @click="openCreate"
          >{{ $t('admin.action.create_column') }}</NButton
        >
      </template>

      <NDataTable
        :columns="columns"
        :data="items"
        :loading="loading"
        :row-key="(row: ColumnItem) => row.id"
      />
    </NCard>

    <FormModal
      v-model:show="editVisible"
      :title="modalTitle"
      :loading="saving"
      @confirm="handleSubmit"
    >
      <NFormItem :label="$t('admin.column.name')">
        <NInput
          v-model:value="formModel.name"
          :placeholder="$t('admin.placeholder.name')"
        />
      </NFormItem>
      <NFormItem :label="$t('admin.column.short_url')">
        <NInput
          v-model:value="formModel.shortUrl"
          :placeholder="$t('admin.placeholder.short_url_example')"
        />
      </NFormItem>
    </FormModal>
  </ScrollContainer>
</template>
