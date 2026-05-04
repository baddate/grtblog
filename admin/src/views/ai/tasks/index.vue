<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { useQuery } from '@tanstack/vue-query'
import { NDataTable, NButton, NTag, NInput, NCard, NSelect, NPagination } from 'naive-ui'
import { h, ref } from 'vue'

import { ScrollContainer } from '@/components'
import { listAITaskLogs } from '@/services/ai'

import DetailDrawer from './DetailDrawer.vue'

import type { AITaskLog } from '@/services/ai'
import type { DataTableColumns } from 'naive-ui'

const page = ref(1)
const pageSize = ref(20)
const filterTaskType = ref<string | null>(null)
const filterStatus = ref<string | null>(null)
const searchKeyword = ref('')

const queryParams = () => ({
  page: page.value,
  pageSize: pageSize.value,
  taskType: filterTaskType.value || undefined,
  status: filterStatus.value || undefined,
  search: searchKeyword.value || undefined,
})

const { data, isPending } = useQuery({
  queryKey: ['ai-task-logs', page, pageSize, filterTaskType, filterStatus, searchKeyword],
  queryFn: () => listAITaskLogs(queryParams()),
})

function statusTagType(status: string) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'failed':
      return 'error'
    case 'interrupted':
      return 'warning'
    case 'running':
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
      return t('admin.ai_tasks.status_pending')
    case 'running':
      return t('admin.ai_tasks.status_running')
    case 'completed':
      return t('admin.ai_tasks.status_completed')
    case 'failed':
      return t('admin.ai_tasks.status_failed')
    case 'interrupted':
      return t('admin.ai_tasks.status_interrupted')
    default:
      return status
  }
}

function taskTypeLabel(type_: string) {
  switch (type_) {
    case 'comment_moderation':
      return t('admin.ai_tasks.task_type_comment_moderation')
    case 'title_generation':
      return t('admin.ai_tasks.task_type_title_generation')
    case 'content_rewrite':
      return t('admin.ai_tasks.task_type_content_rewrite')
    case 'summary_generation':
      return t('admin.ai_tasks.task_type_summary_generation')
    default:
      return type_
  }
}

function triggerLabel(trigger: string) {
  switch (trigger) {
    case 'manual':
      return t('admin.ai_tasks.trigger_manual')
    case 'auto':
      return t('admin.ai_tasks.trigger_auto')
    default:
      return trigger
  }
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const columns: DataTableColumns<AITaskLog> = [
  { title: t('admin.table.id'), key: 'id', width: 70 },
  {
    title: t('admin.ai_tasks.task_type'),
    key: 'taskType',
    width: 120,
    render(row) {
      return h(
        NTag,
        { type: 'info', bordered: false, size: 'small' },
        { default: () => taskTypeLabel(row.taskType) },
      )
    },
  },
  {
    title: t('admin.ai.model'),
    key: 'modelName',
    width: 150,
    ellipsis: { tooltip: true },
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
    title: t('admin.table.duration'),
    key: 'durationMs',
    width: 90,
    render: (row) => formatDuration(row.durationMs),
  },
  {
    title: t('admin.ai_tasks.trigger_source'),
    key: 'triggerSource',
    width: 90,
    render(row) {
      return h(
        NTag,
        {
          type: row.triggerSource === 'auto' ? 'warning' : 'default',
          bordered: false,
          size: 'small',
        },
        { default: () => triggerLabel(row.triggerSource) },
      )
    },
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
        { default: () => t('admin.ai_tasks.detail') },
      )
    },
  },
]

const showDrawer = ref(false)
const currentLog = ref<AITaskLog | undefined>(undefined)

function openDetail(row: AITaskLog) {
  currentLog.value = row
  showDrawer.value = true
}

const taskTypeOptions = [
  { label: t('admin.ai_tasks.all_types'), value: null },
  { label: t('admin.ai_tasks.task_type_comment_moderation'), value: 'comment_moderation' },
  { label: t('admin.ai_tasks.task_type_title_generation'), value: 'title_generation' },
  { label: t('admin.ai_tasks.task_type_content_rewrite'), value: 'content_rewrite' },
  { label: t('admin.ai_tasks.task_type_summary_generation'), value: 'summary_generation' },
] as any

const statusOptions = [
  { label: t('admin.ai_tasks.all_status'), value: null },
  { label: t('admin.ai_tasks.status_pending'), value: 'pending' },
  { label: t('admin.ai_tasks.status_running'), value: 'running' },
  { label: t('admin.ai_tasks.status_completed'), value: 'completed' },
  { label: t('admin.ai_tasks.status_failed'), value: 'failed' },
  { label: t('admin.ai_tasks.status_interrupted'), value: 'interrupted' },
] as any

</script>

<template>
  <ScrollContainer wrapper-class="flex flex-col gap-y-4">
    <NCard :bordered="false">
      <div class="flex items-center justify-between">
        <div class="text-lg font-medium">{{ $t('admin.ai_tasks.log_page_title') }}</div>
        <div class="flex items-center gap-2">
          <NInput
            v-model:value="searchKeyword"
            :placeholder="$t('admin.ai_tasks.search_placeholder')"
            clearable
            class="w-52"
          />
          <NSelect
            v-model:value="filterTaskType"
            :options="taskTypeOptions"
            class="w-32"
            :placeholder="$t('admin.ai_tasks.task_type')"
            clearable
          />
          <NSelect
            v-model:value="filterStatus"
            :options="statusOptions"
            class="w-32"
            :placeholder="$t('admin.common.status')"
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
        :row-key="(row: AITaskLog) => row.id"
        :scroll-x="1000"
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
      :task-log="currentLog"
    />
  </ScrollContainer>
</template>
