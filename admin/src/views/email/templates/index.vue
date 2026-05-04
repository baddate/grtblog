<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { NButton, NCard, NDataTable, NPopconfirm, NSpace, NTag, useMessage } from 'naive-ui'
import { h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ScrollContainer } from '@/components'
import { deleteEmailTemplate, listEmailTemplates } from '@/services/email'

import type { EmailTemplate } from '@/services/email'
import type { DataTableColumns } from 'naive-ui'

const message = useMessage()
const router = useRouter()

const loading = ref(false)
const items = ref<EmailTemplate[]>([])

const columns: DataTableColumns<EmailTemplate> = [
  {
    title: t('admin.common.name'),
    key: 'name',
    width: 200,
    render: (row) =>
      h('span', { class: 'inline-flex items-center gap-1.5' }, [
        row.name,
        row.isInternal
          ? h(
              NTag,
              { size: 'tiny', type: 'default', bordered: false, round: true },
              { default: () => t('admin.badge.builtin') },
            )
          : null,
      ]),
  },
  {
    title: t('admin.email.template_code'),
    key: 'code',
    width: 150,
    render: (row) =>
      h(NTag, { type: 'info', size: 'small', bordered: false }, { default: () => row.code }),
  },
  {
    title: t('admin.email.template_event'),
    key: 'eventName',
    width: 150,
  },
  {
    title: t('admin.common.status'),
    key: 'isEnabled',
    width: 100,
    render: (row) =>
      h(
        NTag,
        { type: row.isEnabled ? 'success' : 'warning', size: 'small', bordered: false },
        { default: () => (row.isEnabled ? t('admin.status.enabled') : t('admin.status.disabled')) },
      ),
  },
  {
    title: t('admin.common.updated_at'),
    key: 'updatedAt',
    width: 180,
    render: (row) => new Date(row.updatedAt).toLocaleString(),
  },
  {
    title: t('admin.common.actions'),
    key: 'actions',
    width: 150,
    render: (row) =>
      h(NSpace, { size: 'small' }, () => [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            secondary: true,
            onClick: () => router.push(`/email/templates/${row.code}`),
          },
          { default: () => t('admin.common.edit') },
        ),
        row.isInternal
          ? null
          : h(
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
                      type: 'error',
                      secondary: true,
                    },
                    { default: () => t('admin.common.delete') },
                  ),
                default: () => t('admin.confirm.delete_confirm'),
              },
            ),
      ]),
  },
]

async function fetchData() {
  loading.value = true
  try {
    items.value = await listEmailTemplates()
  } finally {
    loading.value = false
  }
}

async function handleDelete(row: EmailTemplate) {
  try {
    await deleteEmailTemplate(row.code)
    message.success(t('admin.common.delete_success'))
    fetchData()
  } catch (err) {
    //
  }
}

function handleCreate() {
  router.push('/email/templates/new')
}

onMounted(() => {
  fetchData()
})

</script>

<template>
  <ScrollContainer>
    <NCard :title="$t('admin.card.email_template_list')">
      <template #header-extra>
        <NButton
          type="primary"
          @click="handleCreate"
        >
          {{ $t('admin.email.new_template') }}
        </NButton>
      </template>

      <NDataTable
        :columns="columns"
        :data="items"
        :loading="loading"
        :row-key="(row: EmailTemplate) => row.id"
        :scroll-x="960"
      />
    </NCard>
  </ScrollContainer>
</template>
