<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import {
  NAlert,
  NCard,
  NCode,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NSpace,
  NTabPane,
  NTable,
  NTag,
  NTabs,
} from 'naive-ui'

import { ScrollContainer } from '@/components'
import { formatDate } from '@/utils/format'

import type { StatusTagType } from '../composables/use-webhook-form'
import type { WebhookHistoryItem } from '@/services/webhooks'

defineProps<{
  visible: boolean
  activeHistory: WebhookHistoryItem | null
  detailStatus: { label: string; type: StatusTagType }
  webhookMap: Map<number, string>
  formatHeaders: (headers?: Record<string, string>) => string
  formatBody: (body?: string) => string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()
</script>

<template>
  <NDrawer
    :show="visible"
    placement="right"
    width="640"
    @update:show="emit('update:visible', $event)"
  >
    <NDrawerContent
      :title="$t('admin.webhooks.history.detail_title')"
      closable
      header-style="padding: 20px 24px"
      body-style="padding: 0"
    >
      <ScrollContainer wrapper-class="flex flex-col gap-4">
        <NEmpty
          v-if="!activeHistory"
          :description="$t('admin.webhooks.history.no_detail')"
        />
        <template v-else>
          <NCard :title="$t('admin.webhooks.history.overview')">
            <NTable
              size="small"
              :bordered="false"
              :single-line="false"
            >
              <tbody>
                <tr>
                  <th class="w-24 text-xs text-[var(--text-color-3)]">{{ $t('admin.webhooks.event') }}</th>
                  <td class="font-medium">{{ activeHistory.eventName || '-' }}</td>
                </tr>
                <tr>
                  <th class="text-xs text-[var(--text-color-3)]">{{ $t('admin.webhooks.history.webhook') }}</th>
                  <td>
                    {{ webhookMap.get(activeHistory.webhookId) || `#${activeHistory.webhookId}` }}
                  </td>
                </tr>
                <tr>
                  <th class="text-xs text-[var(--text-color-3)]">{{ $t('admin.webhooks.history.request_url') }}</th>
                  <td class="font-mono text-xs break-words">
                    {{ activeHistory.requestUrl || '-' }}
                  </td>
                </tr>
                <tr>
                  <th class="text-xs text-[var(--text-color-3)]">{{ $t('admin.common.status') }}</th>
                  <td>
                    <NTag
                      size="small"
                      :bordered="false"
                      :type="detailStatus.type === 'default' ? undefined : detailStatus.type"
                    >
                      {{ detailStatus.label }}
                    </NTag>
                  </td>
                </tr>
                <tr>
                  <th class="text-xs text-[var(--text-color-3)]">{{ $t('admin.webhooks.history.is_test') }}</th>
                  <td>
                    <NTag
                      v-if="activeHistory.isTest"
                      size="small"
                      type="warning"
                      :bordered="false"
                      >{{ $t('admin.common.yes') }}</NTag
                    >
                    <span v-else>{{ $t('admin.common.no') }}</span>
                  </td>
                </tr>
                <tr>
                  <th class="text-xs text-[var(--text-color-3)]">{{ $t('admin.webhooks.history.time') }}</th>
                  <td>{{ formatDate(activeHistory.createdAt) }}</td>
                </tr>
              </tbody>
            </NTable>
          </NCard>

          <NCard>
            <NTabs
              type="segment"
              animated
            >
              <NTabPane
                name="request"
                :tab="$t('admin.webhooks.history.tab_request')"
              >
                <NSpace
                  vertical
                  size="large"
                >
                  <NCard
                    size="small"
                    title="Headers"
                  >
                    <NCode
                      :code="formatHeaders(activeHistory.requestHeaders)"
                      word-wrap
                    />
                  </NCard>
                  <NCard
                    size="small"
                    title="Body"
                  >
                    <NCode
                      :code="formatBody(activeHistory.requestBody)"
                      language="json"
                      word-wrap
                    />
                  </NCard>
                </NSpace>
              </NTabPane>
              <NTabPane
                name="response"
                :tab="$t('admin.webhooks.history.tab_response')"
              >
                <NSpace
                  vertical
                  size="large"
                >
                  <NCard
                    size="small"
                    title="Headers"
                  >
                    <NCode
                      :code="formatHeaders(activeHistory.responseHeaders)"
                      word-wrap
                    />
                  </NCard>
                  <NCard
                    size="small"
                    title="Body"
                  >
                    <NCode
                      :code="formatBody(activeHistory.responseBody)"
                      language="json"
                      word-wrap
                    />
                  </NCard>
                  <NAlert
                    v-if="activeHistory.errorMessage"
                    type="error"
                    :show-icon="false"
                  >
                    {{ activeHistory.errorMessage }}
                  </NAlert>
                  <NAlert
                    v-else
                    type="info"
                    :show-icon="false"
                    >{{ $t('admin.webhooks.history.no_error') }}</NAlert
                  >
                </NSpace>
              </NTabPane>
            </NTabs>
          </NCard>
        </template>
      </ScrollContainer>
    </NDrawerContent>
  </NDrawer>
</template>
