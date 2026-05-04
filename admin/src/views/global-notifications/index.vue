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
  NSwitch,
  NDatePicker,
  NTag,
  useMessage,
} from 'naive-ui'
import { h, ref, computed } from 'vue'

import { FormModal, ScrollContainer } from '@/components'
import { useTable } from '@/composables/table/use-table'
import {
  listGlobalNotifications,
  createGlobalNotification,
  updateGlobalNotification,
  deleteGlobalNotification,
} from '@/services/global-notifications'
import { formatDate } from '@/utils/format'

import type { GlobalNotificationItem } from '@/services/global-notifications'
import type { DataTableColumns } from 'naive-ui'

defineOptions({
  name: 'GlobalNotificationList',
})

const message = useMessage()

// Table Logic
const { loading, data: tableData, pagination, refresh } = useTable(listGlobalNotifications)

const columns = computed<DataTableColumns<GlobalNotificationItem>>(() => [
  {
    title: t('admin.table.id'),
    key: 'id',
    width: 80,
  },
  {
    title: t('admin.notification.content'),
    key: 'content',
    minWidth: 200,
    ellipsis: { tooltip: true },
    render: (row) => h('div', { class: 'truncate max-w-md' }, row.content),
  },
  {
    title: t('admin.notification.publish_at'),
    key: 'publishAt',
    width: 180,
    render: (row) => formatDate(row.publishAt),
  },
  {
    title: t('admin.notification.expire_at'),
    key: 'expireAt',
    width: 180,
    render: (row) => formatDate(row.expireAt),
  },
  {
    title: t('admin.notification.allow_close'),
    key: 'allowClose',
    width: 180,
    render: (row) =>
      h(
        NTag,
        { size: 'small', type: row.allowClose ? 'success' : 'warning', bordered: false },
        { default: () => (row.allowClose ? t('admin.common.yes') : t('admin.common.no')) },
      ),
  },
  {
    title: t('admin.common.actions'),
    key: 'actions',
    width: 150,
    render: (row) =>
      h(
        NSpace,
        { size: 'small' },
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                secondary: true,
                type: 'primary',
                onClick: () => openEdit(row),
              },
              { default: () => t('admin.common.edit') },
            ),
            h(
              NPopconfirm,
              {
                onPositiveClick: () => handleDelete(row),
              },
              {
                trigger: () =>
                  h(
                    NButton,
                    {
                      size: 'small',
                      secondary: true,
                      type: 'error',
                    },
                    { default: () => t('admin.common.delete') },
                  ),
                default: () => t('admin.notification.confirm_delete'),
              },
            ),
          ],
        },
      ),
  },
])

// Form Logic
const formVisible = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const formParams = ref({
  content: '',
  publishAt: Date.now(),
  expireAt: Date.now() + 86400000 * 7, // Default 7 days
  allowClose: true,
})

const formTitle = computed(() => (editingId.value ? t('admin.action.edit_notification') : t('admin.action.create_notification')))

function openCreate() {
  editingId.value = null
  formParams.value = {
    content: '',
    publishAt: Date.now(),
    expireAt: Date.now() + 86400000 * 7,
    allowClose: true,
  }
  formVisible.value = true
}

function openEdit(row: GlobalNotificationItem) {
  editingId.value = row.id
  formParams.value = {
    content: row.content,
    publishAt: new Date(row.publishAt).getTime(),
    expireAt: new Date(row.expireAt).getTime(),
    allowClose: row.allowClose,
  }
  formVisible.value = true
}

async function handleSave() {
  if (!formParams.value.content) {
    message.error(t('admin.validation.content_required'))
    return
  }
  saving.value = true
  try {
    const payload = {
      content: formParams.value.content,
      publishAt: new Date(formParams.value.publishAt).toISOString(),
      expireAt: new Date(formParams.value.expireAt).toISOString(),
      allowClose: formParams.value.allowClose,
    }
    if (editingId.value) {
      await updateGlobalNotification(editingId.value, payload)
      message.success(t('admin.common.update_success'))
    } else {
      await createGlobalNotification(payload)
      message.success(t('admin.common.create_success'))
    }
    formVisible.value = false
    refresh()
  } catch (e) {
    // Error handling is generic in request
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: GlobalNotificationItem) {
  try {
    await deleteGlobalNotification(row.id)
    message.success(t('admin.common.delete_success'))
    refresh()
  } catch (e) {
    // Error handling
  }
}

</script>

<template>
  <ScrollContainer wrapper-class="p-4">
    <NCard :title="$t('admin.card.notification_list')">
      <template #header-extra>
        <NButton
          type="primary"
          @click="openCreate"
          >{{ $t('admin.action.create_notification') }}</NButton
        >
      </template>

      <NDataTable
        remote
        :loading="loading"
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        class="mt-4"
        :scroll-x="900"
      />
    </NCard>

    <FormModal
      v-model:show="formVisible"
      :title="formTitle"
      :loading="saving"
      :label-width="100"
      @confirm="handleSave"
    >
      <NFormItem
        :label="$t('admin.notification.content')"
        required
      >
        <NInput
          v-model:value="formParams.content"
          type="textarea"
          :placeholder="$t('admin.notification.placeholder_content')"
        />
      </NFormItem>
      <NFormItem
        :label="$t('admin.notification.publish_at')"
        required
      >
        <NDatePicker
          v-model:value="formParams.publishAt"
          type="datetime"
          style="width: 100%"
        />
      </NFormItem>
      <NFormItem
        :label="$t('admin.notification.expire_at')"
        required
      >
        <NDatePicker
          v-model:value="formParams.expireAt"
          type="datetime"
          style="width: 100%"
        />
      </NFormItem>
      <NFormItem>
        <template #label>{{ $t('admin.notification.allow_close') }}</template>
        <NSwitch v-model:value="formParams.allowClose" />
      </NFormItem>
    </FormModal>
  </ScrollContainer>
</template>
