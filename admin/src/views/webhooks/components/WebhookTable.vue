<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import {
  NButton,
  NButtonGroup,
  NCard,
  NDataTable,
  NDivider,
  NEmpty,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NPopconfirm,
  NSelect,
  NSpace,
  NTag,
} from 'naive-ui'
import { computed, h } from 'vue'

import { formatDate } from '@/utils/format'

import type { WebhookItem } from '@/services/webhooks'
import type { DataTableColumns, SelectOption } from 'naive-ui'

const listFilters = defineModel<{
  keyword: string
  status: 'all' | 'enabled' | 'disabled'
  event: string | null
}>('listFilters', { required: true })

const props = defineProps<{
  webhooks: WebhookItem[]
  loading: boolean
  eventOptions: SelectOption[]
  statusOptions: SelectOption[]
}>()

const emit = defineEmits<{
  edit: [item: WebhookItem]
  test: [item: WebhookItem]
  delete: [item: WebhookItem]
  resetFilters: []
}>()

const filteredWebhooks = computed(() => {
  const keyword = listFilters.value.keyword.trim().toLowerCase()
  return props.webhooks.filter((item) => {
    if (listFilters.value.status === 'enabled' && !item.isEnabled) return false
    if (listFilters.value.status === 'disabled' && item.isEnabled) return false
    if (listFilters.value.event && !item.events?.includes(listFilters.value.event)) return false
    if (!keyword) return true
    return item.name.toLowerCase().includes(keyword) || item.url.toLowerCase().includes(keyword)
  })
})

const columns = computed<DataTableColumns<WebhookItem>>(() => [
  {
    title: t('admin.common.name'),
    key: 'name',
    width: 160,
    render: (row) => h('div', { class: 'font-medium' }, row.name),
  },
  {
    title: t('admin.webhooks.url'),
    key: 'url',
    minWidth: 200,
    ellipsis: { tooltip: true },
    render: (row) => h('div', { class: 'text-xs text-[var(--text-color-3)]' }, row.url),
  },
  {
    title: t('admin.webhooks.event'),
    key: 'events',
    minWidth: 200,
    render: (row) => {
      if (!row.events || row.events.length === 0) return '-'
      return h(
        'div',
        { class: 'flex flex-wrap gap-1' },
        row.events.map((item) =>
          h(NTag, { size: 'small', type: 'info', bordered: false }, { default: () => item }),
        ),
      )
    },
  },
  {
    title: t('admin.common.status'),
    key: 'isEnabled',
    width: 90,
    render: (row) =>
      h(
        NTag,
        { size: 'small', type: row.isEnabled ? 'success' : 'warning', bordered: false },
        { default: () => (row.isEnabled ? t('admin.webhooks.enabled_status') : t('admin.webhooks.disabled_status')) },
      ),
  },
  {
    title: t('admin.common.updated_at'),
    key: 'updatedAt',
    width: 180,
    render: (row) => formatDate(row.updatedAt),
  },
  {
    title: t('admin.common.actions'),
    key: 'actions',
    width: 220,
    render: (row) =>
      h(
        NButtonGroup,
        { size: 'small' },
        {
          default: () => [
            h(
              NButton,
              { type: 'primary', secondary: true, onClick: () => emit('edit', row) },
              { default: () => t('admin.common.edit') },
            ),
            h(
              NButton,
              { tertiary: true, onClick: () => emit('test', row) },
              { default: () => t('admin.webhooks.test') },
            ),
            h(
              NPopconfirm,
              {
                positiveText: t('admin.common.delete'),
                negativeText: t('admin.common.cancel'),
                onPositiveClick: () => emit('delete', row),
              },
              {
                trigger: () =>
                  h(NButton, { type: 'error', secondary: true }, { default: () => t('admin.common.delete') }),
                default: () => t('admin.webhooks.delete_confirm'),
              },
            ),
          ],
        },
      ),
  },
])

</script>

<template>
  <NCard :title="t('admin.webhooks.list')">
    <template #header-extra>
      <NTag
        size="small"
        type="info"
        :bordered="false"
      >
        {{ t('admin.webhooks.total_count', { count: filteredWebhooks.length }) }}
      </NTag>
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
          <NFormItem :label="t('admin.webhooks.keyword')">
            <NInput
              :value="listFilters.keyword"
              clearable
              :placeholder="t('admin.webhooks.keyword_placeholder')"
              @update:value="listFilters.keyword = $event"
            />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem :label="$t('admin.common.status')">
            <NSelect
              :value="listFilters.status"
              :options="statusOptions"
              @update:value="listFilters.status = $event"
            />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem :label="t('admin.webhooks.event')">
            <NSelect
              :value="listFilters.event"
              :options="eventOptions"
              clearable
              :placeholder="t('admin.webhooks.all_placeholder')"
              @update:value="listFilters.event = $event"
            />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem :label="$t('admin.common.actions')">
            <NSpace>
              <NButton
                secondary
                @click="emit('resetFilters')"
                >{{ $t('admin.common.reset') }}</NButton
              >
            </NSpace>
          </NFormItem>
        </NGi>
      </NGrid>
    </NForm>
    <NDivider class="my-3" />
    <div
      v-if="filteredWebhooks.length === 0 && !loading"
      class="py-10"
    >
      <NEmpty :description="t('admin.webhooks.no_data')" />
    </div>
    <NDataTable
      v-else
      :columns="columns"
      :data="filteredWebhooks"
      :loading="loading"
      :row-key="(row: WebhookItem) => row.id"
      striped
      :scroll-x="1000"
    />
  </NCard>
</template>
