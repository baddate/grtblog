<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import {
  NButton,
  NCard,
  NCheckbox,
  NDataTable,
  NDivider,
  NEmpty,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NPagination,
  NSelect,
  NSpace,
  NTag,
} from 'naive-ui'
import { computed, h } from 'vue'

import { formatDate } from '@/utils/format'

import type { WebhookHistoryItem } from '@/services/webhooks'
import type { DataTableColumns, SelectOption } from 'naive-ui'

const historyFilters = defineModel<{
  webhookId: number | null
  eventName: string | null
  isTest: boolean | null
}>('historyFilters', { required: true })

const isTestOnly = defineModel<boolean>('isTestOnly', { required: true })

const props = defineProps<{
  history: WebhookHistoryItem[]
  historyLoading: boolean
  historyPage: number
  historyPageSize: number
  historyTotal: number
  historyFailureCount: number
  webhookMap: Map<number, string>
  webhookOptions: SelectOption[]
  eventOptions: SelectOption[]
}>()

const emit = defineEmits<{
  'update:historyPage': [value: number]
  'update:historyPageSize': [value: number]
  applyFilters: []
  resetFilters: []
  refresh: []
  viewDetail: [item: WebhookHistoryItem]
  replay: [item: WebhookHistoryItem]
}>()

function renderHistoryStatus(row: WebhookHistoryItem) {
  const success = row.responseStatus >= 200 && row.responseStatus < 300
  const label = success ? t('admin.webhooks.history.success') : t('admin.webhooks.history.failure')
  return h(
    NTag,
    { size: 'small', type: success ? 'success' : 'error', bordered: false },
    { default: () => (row.responseStatus ? `${label} ${row.responseStatus}` : label) },
  )
}

const historyColumns = computed<DataTableColumns<WebhookHistoryItem>>(() => [
  { title: t('admin.webhooks.event'), key: 'eventName', width: 220 },
  {
    title: t('admin.webhooks.history.webhook'),
    key: 'webhookId',
    width: 180,
    render: (row) => props.webhookMap.get(row.webhookId) || `#${row.webhookId}`,
  },
  {
    title: t('admin.common.status'),
    key: 'responseStatus',
    width: 120,
    render: (row) => renderHistoryStatus(row),
  },
  {
    title: t('admin.webhooks.history.is_test'),
    key: 'isTest',
    width: 90,
    render: (row) =>
      h(
        NTag,
        { size: 'small', type: row.isTest ? 'success' : 'default', bordered: false },
        { default: () => (row.isTest ? t('admin.common.yes') : t('admin.common.no')) },
      ),
  },
  {
    title: t('admin.webhooks.history.time'),
    key: 'createdAt',
    width: 180,
    render: (row) => formatDate(row.createdAt),
  },
  {
    title: t('admin.common.actions'),
    key: 'actions',
    width: 160,
    render: (row) =>
      h('div', { class: 'flex gap-2' }, [
        h(
          NButton,
          { size: 'small', secondary: true, onClick: () => emit('viewDetail', row) },
          { default: () => t('admin.webhooks.history.detail') },
        ),
        h(
          NButton,
          { size: 'small', type: 'primary', secondary: true, onClick: () => emit('replay', row) },
          { default: () => t('admin.webhooks.history.replay') },
        ),
      ]),
  },
])

</script>

<template>
  <NCard :title="t('admin.webhooks.history.title')">
    <template #header-extra>
      <NSpace size="small">
        <NTag
          size="small"
          type="warning"
          :bordered="false"
        >
          {{ t('admin.webhooks.history.page_failures', { count: historyFailureCount }) }}
        </NTag>
        <NTag
          size="small"
          type="info"
          :bordered="false"
        >
          {{ t('admin.webhooks.total_count', { count: historyTotal }) }}
        </NTag>
      </NSpace>
    </template>
    <NForm
      label-placement="left"
      label-width="60"
      :show-feedback="false"
    >
      <NGrid
        cols="1 640:2 900:4"
        x-gap="16"
        y-gap="8"
      >
        <NGi>
          <NFormItem :label="t('admin.webhooks.history.webhook')">
            <NSelect
              :value="historyFilters.webhookId"
              :options="webhookOptions"
              clearable
              :placeholder="$t('admin.webhooks.all_placeholder')"
              @update:value="historyFilters.webhookId = $event"
            />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem :label="t('admin.webhooks.event')">
            <NSelect
              :value="historyFilters.eventName"
              :options="eventOptions"
              clearable
              :placeholder="$t('admin.webhooks.all_placeholder')"
              @update:value="historyFilters.eventName = $event"
            />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem :label="t('admin.webhooks.history.is_test')">
            <NCheckbox
              :checked="isTestOnly"
              @update:checked="isTestOnly = $event"
            >
              {{ t('admin.webhooks.history.test_only') }}
            </NCheckbox>
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem :label="$t('admin.common.actions')">
            <NSpace>
              <NButton
                type="primary"
                secondary
                @click="emit('applyFilters')"
                >{{ t('admin.webhooks.filter.apply') }}</NButton
              >
              <NButton @click="emit('resetFilters')">{{ $t('admin.common.reset') }}</NButton>
              <NButton
                tertiary
                @click="emit('refresh')"
                >{{ $t('admin.common.refresh') }}</NButton
              >
            </NSpace>
          </NFormItem>
        </NGi>
      </NGrid>
    </NForm>
    <NDivider class="my-3" />
    <div
      v-if="history.length === 0 && !historyLoading"
      class="py-10"
    >
      <NEmpty :description="t('admin.webhooks.history.no_data')" />
    </div>
    <NDataTable
      v-else
      :columns="historyColumns"
      :data="history"
      :loading="historyLoading"
      :row-key="(row: WebhookHistoryItem) => row.id"
      striped
      :scroll-x="960"
    />
    <div class="flex justify-end pt-4">
      <NPagination
        :page="historyPage"
        :page-size="historyPageSize"
        :item-count="historyTotal"
        show-size-picker
        :page-sizes="[10, 20, 50]"
        @update:page="emit('update:historyPage', $event)"
        @update:page-size="emit('update:historyPageSize', $event)"
      />
    </div>
  </NCard>
</template>
