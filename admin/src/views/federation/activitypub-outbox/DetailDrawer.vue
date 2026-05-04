<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { useWindowSize } from '@vueuse/core'
import {
  NDrawer,
  NDrawerContent,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NCode,
  NButton,
  NDataTable,
  useMessage,
} from 'naive-ui'
import { computed, h, ref, watch } from 'vue'

import { getActivityPubOutboxDetail, retryActivityPubOutbox } from '@/services/federation-admin'

import type { ActivityPubDeliveryDetailResp, ActivityPubOutboxItemResp } from '@/types/federation'
import type { DataTableColumns } from 'naive-ui'

const props = defineProps<{ show: boolean; item?: ActivityPubOutboxItemResp }>()
const emit = defineEmits<{ (e: 'update:show', value: boolean): void; (e: 'refresh'): void }>()
const message = useMessage()

const { width } = useWindowSize()
const drawerWidth = computed(() => (width.value < 640 ? '100%' : 860))

const detail = ref<ActivityPubOutboxItemResp | undefined>()
const loading = ref(false)
const retrying = ref(false)

watch(
  () => [props.show, props.item?.id],
  async () => {
    if (props.show && props.item?.id) {
      loading.value = true
      try {
        detail.value = await getActivityPubOutboxDetail(props.item.id)
      } catch {
        detail.value = props.item
      } finally {
        loading.value = false
      }
    }
  },
)

const displayItem = computed(() => detail.value ?? props.item)
const canRetry = computed(
  () => displayItem.value?.status === 'failed' || displayItem.value?.status === 'partial',
)
const activityCode = computed(() => {
  const raw = displayItem.value?.activity
  if (!raw) return '{}'
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
})

function statusTagType(status?: string) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'partial':
      return 'warning'
    case 'failed':
      return 'error'
    case 'sending':
      return 'info'
    default:
      return 'default'
  }
}

const columns: DataTableColumns<ActivityPubDeliveryDetailResp> = [
  { title: t('admin.table.inbox'), key: 'inbox', minWidth: 220, ellipsis: { tooltip: true } },
  { title: t('admin.federation.actor_id'), key: 'actor_id', minWidth: 220, ellipsis: { tooltip: true } },
  {
    title: t('admin.common.status'),
    key: 'status',
    width: 90,
    render(row) {
      return h(
        NTag,
        { size: 'small', type: row.status === 'success' ? 'success' : 'error' },
        { default: () => row.status || '-' },
      )
    },
  },
  { title: 'HTTP', key: 'http_status', width: 80 },
  { title: t('admin.table.error_message'), key: 'error', minWidth: 220, ellipsis: { tooltip: true } },
  {
    title: t('admin.federation.delivered_at'),
    key: 'delivered_at',
    width: 170,
    render(row) {
      return row.delivered_at ? new Date(row.delivered_at).toLocaleString() : '-'
    },
  },
]

async function handleRetry() {
  if (!displayItem.value?.id) return
  retrying.value = true
  try {
    detail.value = await retryActivityPubOutbox(displayItem.value.id)
    message.success(t('admin.service.operation_success'))
    emit('refresh')
  } catch (err: any) {
    message.error(err?.message || t('admin.service.operation_failed'))
  } finally {
    retrying.value = false
  }
}

</script>

<template>
  <NDrawer
    :show="show"
    :width="drawerWidth"
    @update:show="(v) => emit('update:show', v)"
  >
    <NDrawerContent
      :title="$t('admin.federation.activity_detail')"
      closable
    >
      <div
        v-if="displayItem"
        class="space-y-6"
      >
        <NDescriptions
          bordered
          :column="2"
          label-placement="left"
          :title="$t('admin.federation.basic_info')"
        >
          <NDescriptionsItem :label="$t('admin.table.id')">{{ displayItem.id }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.common.status')"
            ><NTag
              :type="statusTagType(displayItem.status)"
              size="small"
              >{{ displayItem.status }}</NTag
            ></NDescriptionsItem
          >
          <NDescriptionsItem :label="$t('admin.federation.source_type')">{{ displayItem.source_type }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.federation.trigger_source')">{{
            displayItem.trigger_source
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.federation.activity_id')">{{ displayItem.activity_id }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.federation.object_id')">{{ displayItem.object_id }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.federation.delivery_stats')"
            >{{ displayItem.success_count }}/{{ displayItem.total_targets }}</NDescriptionsItem
          >
          <NDescriptionsItem :label="$t('admin.federation.duration_ms')">{{
            displayItem.duration_ms ?? '-'
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.federation.started_at')">{{
            displayItem.started_at ? new Date(displayItem.started_at).toLocaleString() : '-'
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.federation.finished_at')">{{
            displayItem.finished_at ? new Date(displayItem.finished_at).toLocaleString() : '-'
          }}</NDescriptionsItem>
        </NDescriptions>

        <div>
          <div class="mb-2 flex items-center justify-between">
            <h3 class="font-medium">{{ $t('admin.federation.delivery_details') }}</h3>
            <NButton
              v-if="canRetry"
              type="warning"
              :loading="retrying"
              @click="handleRetry"
              >{{ $t('admin.action.retry_failed') }}</NButton
            >
          </div>
          <NDataTable
            :columns="columns"
            :data="displayItem.deliveries || []"
            :loading="loading"
            :scroll-x="1000"
          />
        </div>

        <div>
          <h3 class="mb-2 font-medium">{{ $t('admin.federation.activity_json') }}</h3>
          <NCode
            :code="activityCode"
            language="json"
            word-wrap
          />
        </div>
      </div>
      <template #footer>
        <NButton @click="emit('update:show', false)">{{ $t('admin.common.close') }}</NButton>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
