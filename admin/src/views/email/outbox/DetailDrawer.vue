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
  NTabs,
  NTabPane,
} from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { getEmailOutboxDetail } from '@/services/email'

import type { EmailOutbox } from '@/services/email'

const props = defineProps<{
  show: boolean
  outbox?: EmailOutbox
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const { width } = useWindowSize()
const drawerWidth = computed(() => (width.value < 640 ? '100%' : 600))

const detail = ref<EmailOutbox | undefined>(undefined)
const loadingDetail = ref(false)

watch(
  () => [props.show, props.outbox?.id],
  async () => {
    if (props.show && props.outbox?.id) {
      loadingDetail.value = true
      try {
        detail.value = await getEmailOutboxDetail(props.outbox.id)
      } catch {
        detail.value = props.outbox
      } finally {
        loadingDetail.value = false
      }
    }
  },
)

const displayItem = computed(() => detail.value ?? props.outbox)

function statusTagType(status?: string) {
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

function statusLabel(status?: string) {
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
      return status ?? '-'
  }
}

function handleClose() {
  emit('update:show', false)
}

</script>

<template>
  <NDrawer
    :show="show"
    :width="drawerWidth"
    @update:show="(val) => emit('update:show', val)"
  >
    <NDrawerContent
      :title="$t('admin.email.outbox_detail')"
      closable
    >
      <div
        v-if="displayItem"
        class="space-y-6"
      >
        <NDescriptions
          bordered
          :column="1"
          label-placement="left"
          :title="$t('admin.email.basic_info')"
        >
          <NDescriptionsItem :label="$t('admin.table.id')">{{ displayItem.id }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.form.subject')">{{ displayItem.subject }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.email.template_code')">{{ displayItem.templateCode }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.email.event_name')">
            <NTag
              type="info"
              size="small"
              >{{ displayItem.eventName }}</NTag
            >
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.form.recipient')">{{
            displayItem.toEmails?.join(', ') || '-'
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.common.status')">
            <NTag
              :type="statusTagType(displayItem.status)"
              size="small"
              >{{ statusLabel(displayItem.status) }}</NTag
            >
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.common.created_at')">{{
            new Date(displayItem.createdAt).toLocaleString()
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.email.label_sent_at')">{{
            displayItem.sentAt ? new Date(displayItem.sentAt).toLocaleString() : '-'
          }}</NDescriptionsItem>
        </NDescriptions>

        <NDescriptions
          bordered
          :column="1"
          label-placement="left"
          :title="$t('admin.email.retry_info')"
        >
          <NDescriptionsItem :label="$t('admin.email.label_retry_count')">{{ displayItem.retryCount }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.email.next_retry')">{{
            displayItem.nextRetryAt ? new Date(displayItem.nextRetryAt).toLocaleString() : '-'
          }}</NDescriptionsItem>
        </NDescriptions>

        <div v-if="displayItem.lastError">
          <h3 class="mb-2 font-bold">{{ $t('admin.email.label_error_info') }}</h3>
          <NCode
            :code="displayItem.lastError"
            language="text"
            word-wrap
          />
        </div>

        <div v-if="displayItem.htmlBody || displayItem.textBody">
          <NTabs
            type="line"
            size="small"
          >
            <NTabPane
              v-if="displayItem.htmlBody"
              name="html"
              :tab="$t('admin.email.tab_html_body')"
            >
              <div
                class="max-h-80 overflow-auto rounded border p-2"
                v-html="displayItem.htmlBody"
              />
            </NTabPane>
            <NTabPane
              v-if="displayItem.textBody"
              name="text"
              :tab="$t('admin.email.tab_text_body')"
            >
              <NCode
                :code="displayItem.textBody"
                language="text"
                word-wrap
              />
            </NTabPane>
          </NTabs>
        </div>
      </div>
      <template #footer>
        <NButton @click="handleClose">{{ $t('admin.common.close') }}</NButton>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
