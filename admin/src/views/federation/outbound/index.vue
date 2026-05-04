<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { useQuery } from '@tanstack/vue-query'
import { NDataTable, NButton, NTag, NInput, NSpace, NCard, NSelect } from 'naive-ui'
import { h, ref } from 'vue'

import { ScrollContainer } from '@/components'
import { getFederationOutboundLog } from '@/services/federation-admin'

import DetailDrawer from './DetailDrawer.vue'

import type {
  FederationOutboundDeliveryResp,
  FederationOutboundDeliveryListResp,
} from '@/types/federation'
import type { DataTableColumns } from 'naive-ui'

const page = ref(1)
const pageSize = ref(10)
const filterType = ref<string | null>(null)
const filterStatus = ref<string | null>(null)
const searchRequestId = ref('')

const queryParams = () => ({
  page: page.value,
  pageSize: pageSize.value,
  type: filterType.value || undefined,
  status: filterStatus.value || undefined,
  request_id: searchRequestId.value || undefined,
})

const { data, isPending } = useQuery({
  queryKey: ['federation-outbound-logs', page, pageSize, filterType, filterStatus, searchRequestId],
  queryFn: () => getFederationOutboundLog(queryParams()),
})

const columns: DataTableColumns<FederationOutboundDeliveryResp> = [
  { title: t('admin.table.id'), key: 'id', width: 80 },
  {
    title: t('admin.common.type'),
    key: 'type',
    width: 120,
    render(row) {
      return h(NTag, { type: 'info', bordered: false }, { default: () => row.type })
    },
  },
  { title: t('admin.federation.target_instance'), key: 'target_instance_url', minWidth: 200, ellipsis: { tooltip: true } },
  {
    title: t('admin.common.status'),
    key: 'status',
    width: 100,
    render(row) {
      return h(
        NTag,
        {
          type:
            row.status === 'success' ? 'success' : row.status === 'failed' ? 'error' : 'warning',
        },
        { default: () => row.status },
      )
    },
  },
  {
    title: t('admin.federation.attempt_count'),
    key: 'attempt_count',
    width: 100,
    render: (row) => `${row.attempt_count}/${row.max_attempts}`,
  },
  {
    title: t('admin.common.created_at'),
    key: 'created_at',
    width: 180,
    render: (row) => new Date(row.created_at).toLocaleString(),
  },
  {
    title: t('admin.common.actions'),
    key: 'actions',
    width: 100,
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          onClick: () => openDetail(row),
        },
        { default: () => t('admin.action.view_details') },
      )
    },
  },
]

// Detail Drawer Logic
const showDrawer = ref(false)
const currentDelivery = ref<FederationOutboundDeliveryResp | undefined>(undefined)

function openDetail(row: FederationOutboundDeliveryResp) {
  currentDelivery.value = row
  showDrawer.value = true
}

const typeOptions = [
  { label: t('admin.filter.all'), value: null },
  { label: t('admin.federation.type_friend_link'), value: 'friend_link' },
  { label: t('admin.federation.type_citation'), value: 'citation' },
  { label: t('admin.federation.type_mention'), value: 'mention' },
] as any

const statusOptions = [
  { label: t('admin.filter.all_status'), value: null },
  { label: t('admin.status.pending'), value: 'pending' },
  { label: t('admin.status.success'), value: 'success' },
  { label: t('admin.status.failed'), value: 'failed' },
  { label: t('admin.status.queued'), value: 'retrying' },
] as any

</script>

<template>
  <ScrollContainer wrapper-class="flex flex-col gap-y-4">
    <NCard :bordered="false">
      <div class="flex items-center justify-between">
        <div class="text-lg font-medium">{{ $t('admin.card.federation_outbound') }}</div>
        <div class="flex items-center gap-2">
          <NInput
            v-model:value="searchRequestId"
            :placeholder="t('admin.placeholder.search_request_id')"
            clearable
            class="w-60"
          />
          <NSelect
            v-model:value="filterType"
            :options="typeOptions"
            class="w-40"
            :placeholder="$t('admin.placeholder.type')"
            clearable
          />
          <NSelect
            v-model:value="filterStatus"
            :options="statusOptions"
            class="w-40"
            :placeholder="$t('admin.placeholder.filter_status')"
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
        :row-key="(row: FederationOutboundDeliveryResp) => row.id"
        :scroll-x="900"
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
      :delivery="currentDelivery"
    />
  </ScrollContainer>
</template>
