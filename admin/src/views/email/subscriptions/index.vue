<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NGrid,
  NGi,
  NInput,
  NPopconfirm,
  NSelect,
  NTag,
  useMessage,
} from 'naive-ui'
import { h, reactive, computed } from 'vue'

import { ScrollContainer } from '@/components'
import { batchUpdateEmailSubscriptionStatus, listEmailSubscriptions } from '@/services/email'

import type { EmailSubscription } from '@/services/email'
import type { DataTableColumns } from 'naive-ui'

const message = useMessage()
const queryClient = useQueryClient()

const params = reactive({
  page: 1,
  pageSize: 20,
  eventName: undefined as string | undefined,
  status: undefined as string | undefined,
  search: undefined as string | undefined,
})

const statusOptions = [
  { label: t('admin.filter.all_status'), value: undefined },
  { label: t('admin.email.status_subscribed'), value: 'active' },
  { label: t('admin.email.status_unsubscribed'), value: 'unsubscribed' },
  { label: t('admin.email.status_blocked'), value: 'blocked' },
]

const { data, isLoading, refetch } = useQuery({
  queryKey: ['emailSubscriptions', params],
  queryFn: () => listEmailSubscriptions(params),
})

const updateStatusMutation = useMutation({
  mutationFn: ({ id, status }: { id: number; status: string }) =>
    batchUpdateEmailSubscriptionStatus({ ids: [id], status }),
  onSuccess: async (_, vars) => {
    message.success(vars.status === 'blocked' ? t('admin.email.blocked_message') : t('admin.email.unblocked_message'))
    await queryClient.invalidateQueries({ queryKey: ['emailSubscriptions'] })
  },
  onError: (err: unknown) => {
    message.error(err instanceof Error ? err.message : t('admin.service.update_status_failed'))
  },
})

function toStatusLabel(status: string) {
  switch (status) {
    case 'active':
      return t('admin.email.status_subscribed')
    case 'blocked':
      return t('admin.email.status_blocked')
    case 'unsubscribed':
      return t('admin.email.status_unsubscribed')
    default:
      return status
  }
}

function toStatusTagType(status: string): 'default' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'active':
      return 'success'
    case 'blocked':
      return 'error'
    case 'unsubscribed':
      return 'warning'
    default:
      return 'default'
  }
}

function toggleBlocked(row: EmailSubscription) {
  const nextStatus = row.status === 'blocked' ? 'active' : 'blocked'
  updateStatusMutation.mutate({ id: row.id, status: nextStatus })
}

const columns: DataTableColumns<EmailSubscription> = [
  {
    title: t('admin.table.id'),
    key: 'id',
    width: 80,
  },
  {
    title: t('admin.form.email'),
    key: 'email',
    width: 250,
  },
  {
    title: t('admin.email.subscription_event'),
    key: 'eventName',
    width: 200,
    render: (row) =>
      h(NTag, { type: 'info', size: 'small', bordered: false }, { default: () => row.eventName }),
  },
  {
    title: t('admin.common.status'),
    key: 'status',
    width: 120,
    render: (row) => {
      return h(
        NTag,
        { type: toStatusTagType(row.status), size: 'small', bordered: false },
        { default: () => toStatusLabel(row.status) },
      )
    },
  },
  {
    title: t('admin.table.source_ip'),
    key: 'sourceIp',
    width: 150,
    render: (row) => h('div', { class: 'text-xs text-[var(--text-color-3)]' }, row.sourceIp),
  },
  {
    title: t('admin.common.created_at'),
    key: 'createdAt',
    width: 180,
    render: (row) => new Date(row.createdAt).toLocaleString(),
  },
  {
    title: t('admin.common.actions'),
    key: 'actions',
    width: 120,
    render: (row) =>
      h(
        NPopconfirm,
        {
          onPositiveClick: () => toggleBlocked(row),
        },
        {
          trigger: () =>
            h(
              NButton,
              {
                size: 'small',
                type: row.status === 'blocked' ? 'success' : 'error',
                ghost: true,
                loading: updateStatusMutation.isPending.value,
              },
              { default: () => (row.status === 'blocked' ? t('admin.email.action_unblock') : t('admin.email.action_block')) },
            ),
          default: () =>
            row.status === 'blocked' ? t('admin.email.confirm_unblock') : t('admin.email.confirm_block'),
        },
      ),
  },
]

const pagination = computed(() => ({
  page: params.page,
  pageSize: params.pageSize,
  itemCount: data.value?.total || 0,
  onChange: (page: number) => {
    params.page = page
  },
  onUpdatePageSize: (pageSize: number) => {
    params.pageSize = pageSize
    params.page = 1
  },
}))

function handleRefresh() {
  refetch()
}

function handleReset() {
  params.eventName = undefined
  params.status = undefined
  params.search = undefined
  params.page = 1
}

</script>

<template>
  <ScrollContainer>
    <NCard :title="$t('admin.card.email_subscriptions')">
      <template #header-extra>
        <NButton
          secondary
          @click="handleRefresh"
          >{{ $t('admin.common.refresh') }}</NButton
        >
      </template>

      <NForm
        label-placement="left"
        label-width="auto"
        class="mb-4"
        :show-feedback="false"
      >
        <NGrid
          cols="1 640:2 900:4"
          :x-gap="16"
          :y-gap="8"
        >
          <NGi>
            <NFormItem :label="$t('admin.common.search')">
              <NInput
                v-model:value="params.search"
                :placeholder="$t('admin.placeholder.search')"
                clearable
              />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem :label="$t('admin.common.status')">
              <NSelect
                v-model:value="params.status"
                :options="statusOptions"
                :placeholder="$t('admin.filter.all')"
                clearable
              />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem :label="$t('admin.email.template_event')">
              <NInput
                v-model:value="params.eventName"
                :placeholder="$t('admin.email.placeholder_event_name')"
                clearable
              />
            </NFormItem>
          </NGi>
          <NGi>
            <div class="flex justify-end">
              <NButton @click="handleReset">{{ $t('admin.common.reset') }}</NButton>
            </div>
          </NGi>
        </NGrid>
      </NForm>

      <NDataTable
        remote
        :columns="columns"
        :data="data?.items || []"
        :loading="isLoading"
        :pagination="pagination"
        :row-key="(row: EmailSubscription) => row.id"
        :scroll-x="1000"
      />
    </NCard>
  </ScrollContainer>
</template>
