<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { useQuery } from '@tanstack/vue-query'
import { NDataTable, NButton, NTag, NInput, NCard, NSelect, NPagination } from 'naive-ui'
import { h, ref } from 'vue'

import { ScrollContainer } from '@/components'
import { listEmailOutbox } from '@/services/email'

import DetailDrawer from './DetailDrawer.vue'

import type { EmailOutbox } from '@/services/email'
import type { DataTableColumns } from 'naive-ui'

const page = ref(1)
const pageSize = ref(20)
const filterStatus = ref<string | null>(null)
const filterEventName = ref<string | null>(null)
const searchKeyword = ref('')

const queryParams = () => ({
  page: page.value,
  pageSize: pageSize.value,
  status: filterStatus.value || undefined,
  eventName: filterEventName.value || undefined,
  search: searchKeyword.value || undefined,
})

const { data, isPending } = useQuery({
  queryKey: ['email-outbox', page, pageSize, filterStatus, filterEventName, searchKeyword],
  queryFn: () => listEmailOutbox(queryParams()),
})

function statusTagType(status: string) {
  switch (status) {
    case 'sent':
      return 'success'
    case 'failed':
      return 'error'
    case 'sending':
      return 'warning'
    case 'pending':
      return 'info'
    default:
      return 'default'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'pending':
      return t('admin.email.status_pending')
    case 'sending':
      return t('admin.email.status_sending')
    case 'sent':
      return t('admin.status.sent')
    case 'failed':
      return t('admin.status.failed')
    default:
      return status
  }
}

const columns: DataTableColumns<EmailOutbox> = [
  { title: t('admin.table.id'), key: 'id', width: 70 },
  {
    title: t('admin.table.subject'),
    key: 'subject',
    minWidth: 180,
    ellipsis: { tooltip: true },
  },
  {
    title: t('admin.table.template_code'),
    key: 'templateCode',
    width: 160,
    ellipsis: { tooltip: true },
  },
  {
    title: t('admin.email.template_event'),
    key: 'eventName',
    width: 160,
    render(row) {
      return h(
        NTag,
        { type: 'info', bordered: false, size: 'small' },
        { default: () => row.eventName },
      )
    },
  },
  {
    title: t('admin.table.recipient'),
    key: 'toEmails',
    width: 180,
    ellipsis: { tooltip: true },
    render(row) {
      return row.toEmails?.join(', ') || '-'
    },
  },
  {
    title: t('admin.common.status'),
    key: 'status',
    width: 90,
    render(row) {
      return h(
        NTag,
        { type: statusTagType(row.status), bordered: false, size: 'small' },
        { default: () => statusLabel(row.status) },
      )
    },
  },
  {
    title: t('admin.table.retry_count'),
    key: 'retryCount',
    width: 60,
    render: (row) => `${row.retryCount}`,
  },
  {
    title: t('admin.common.created_at'),
    key: 'createdAt',
    width: 170,
    render: (row) => new Date(row.createdAt).toLocaleString(),
  },
  {
    title: t('admin.common.actions'),
    key: 'actions',
    width: 80,
    render(row) {
      return h(
        NButton,
        { size: 'small', onClick: () => openDetail(row) },
        { default: () => t('admin.action.view_details') },
      )
    },
  },
]

const showDrawer = ref(false)
const currentOutbox = ref<EmailOutbox | undefined>(undefined)

function openDetail(row: EmailOutbox) {
  currentOutbox.value = row
  showDrawer.value = true
}

const statusOptions = [
  { label: t('admin.filter.all_status'), value: null },
  { label: t('admin.email.status_pending'), value: 'pending' },
  { label: t('admin.email.status_sending'), value: 'sending' },
  { label: t('admin.status.sent'), value: 'sent' },
  { label: t('admin.status.failed'), value: 'failed' },
] as any

</script>

<template>
  <ScrollContainer wrapper-class="flex flex-col gap-y-4">
    <NCard :bordered="false">
      <div class="flex items-center justify-between">
        <div class="text-lg font-medium">{{ $t('admin.card.email_outbox') }}</div>
        <div class="flex items-center gap-2">
          <NInput
            v-model:value="searchKeyword"
            :placeholder="$t('admin.email.placeholder_search_subject')"
            clearable
            class="w-60"
          />
          <NInput
            v-model:value="filterEventName"
            :placeholder="$t('admin.email.placeholder_event_name')"
            clearable
            class="w-40"
          />
          <NSelect
            v-model:value="filterStatus"
            :options="statusOptions"
            class="w-32"
            :placeholder="$t('admin.placeholder.select')"
            clearable
          />
        </div>
      </div>
    </NCard>

    <NCard
      :bordered="false"
      content-style="padding: 0;"
    >
      <NDataTable
        remote
        :columns="columns"
        :data="data?.items || []"
        :loading="isPending"
        :bordered="false"
        :row-key="(row: EmailOutbox) => row.id"
        :scroll-x="1100"
      />
      <div class="flex justify-end p-4">
        <NPagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :item-count="data?.total || 0"
          show-size-picker
          :page-sizes="[10, 20, 50]"
          @update:page="(p: number) => (page = p)"
          @update:page-size="
            (s: number) => {
              pageSize = s
              page = 1
            }
          "
        />
      </div>
    </NCard>

    <DetailDrawer
      v-model:show="showDrawer"
      :outbox="currentOutbox"
    />
  </ScrollContainer>
</template>
