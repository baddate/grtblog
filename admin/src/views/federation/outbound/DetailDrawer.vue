<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useWindowSize } from '@vueuse/core'
import {
  NDrawer,
  NDrawerContent,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NCode,
  NButton,
  useMessage,
} from 'naive-ui'
import { ref, computed } from 'vue'

import { retryFederationOutboundLog } from '@/services/federation-admin'

import type { FederationOutboundDeliveryResp } from '@/types/federation'

const props = defineProps<{
  // We use a modelValue to control visibility
  show: boolean
  delivery?: FederationOutboundDeliveryResp
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const message = useMessage()
const queryClient = useQueryClient()
const { width } = useWindowSize()

const drawerWidth = computed(() => {
  return width.value < 640 ? '100%' : 600
})

const { mutate: retry, isPending: isRetrying } = useMutation({
  mutationFn: retryFederationOutboundLog,
  onSuccess: () => {
    message.success(t('admin.service.retry_queued'))
    queryClient.invalidateQueries({ queryKey: ['federation-outbound-logs'] })
    emit('update:show', false)
  },
  onError: (err: any) => {
    message.error(t('admin.service.operation_failed') + ': ' + (err.message || 'Unknown error'))
  },
})

function handleRetry() {
  if (props.delivery?.id) {
    retry(props.delivery.id)
  }
}

function handleClose() {
  emit('update:show', false)
}

</script>

<template>
  <NDrawer
    :show="show"
    @update:show="(val) => emit('update:show', val)"
    :width="drawerWidth"
  >
    <NDrawerContent
      :title="$t('admin.federation.outbound_detail')"
      closable
    >
      <div
        v-if="delivery"
        class="space-y-6"
      >
        <div
          class="flex justify-end"
          v-if="delivery.status !== 'success'"
        >
          <NButton
            type="warning"
            size="small"
            :loading="isRetrying"
            @click="handleRetry"
          >
            {{ $t('admin.action.retry') }}
          </NButton>
        </div>

        <NDescriptions
          bordered
          :column="1"
          label-placement="left"
          :title="$t('admin.federation.basic_info')"
        >
          <NDescriptionsItem :label="$t('admin.table.id')">{{ delivery.id }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.federation.request_id')">{{ delivery.request_id }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.common.type')">
            <NTag>{{ delivery.type }}</NTag>
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.common.status')">
            <NTag :type="delivery.status === 'success' ? 'success' : 'error'">{{
              delivery.status
            }}</NTag>
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.federation.target')">{{ delivery.target_instance_url }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.common.created_at')">{{
            new Date(delivery.created_at).toLocaleString()
          }}</NDescriptionsItem>
        </NDescriptions>

        <NDescriptions
          bordered
          :column="1"
          label-placement="left"
          :title="$t('admin.federation.delivery_status')"
        >
          <NDescriptionsItem :label="$t('admin.federation.attempt_count')"
            >{{ delivery.attempt_count }} / {{ delivery.max_attempts }}</NDescriptionsItem
          >
          <NDescriptionsItem :label="$t('admin.federation.next_retry')">{{
            delivery.next_retry_at ? new Date(delivery.next_retry_at).toLocaleString() : '-'
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.federation.http_status')">{{
            delivery.http_status || '-'
          }}</NDescriptionsItem>
        </NDescriptions>

        <div v-if="delivery.error_message">
          <h3 class="mb-2 font-bold">{{ $t('admin.table.error_message') }}</h3>
          <NCode
            :code="delivery.error_message"
            language="text"
            word-wrap
            class="rounded bg-red-50 p-2"
          />
        </div>

        <div v-if="delivery.response_body">
          <h3 class="mb-2 font-bold">{{ $t('admin.federation.response_body') }}</h3>
          <NCode
            :code="delivery.response_body"
            language="json"
            word-wrap
            class="rounded bg-gray-100 p-2 dark:bg-gray-800"
          />
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>
