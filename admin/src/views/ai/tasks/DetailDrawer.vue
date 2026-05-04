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
} from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { getAITaskLog } from '@/services/ai'

import type { AITaskLog } from '@/services/ai'

const props = defineProps<{
  show: boolean
  taskLog?: AITaskLog
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const { width } = useWindowSize()
const drawerWidth = computed(() => (width.value < 640 ? '100%' : 600))

const detail = ref<AITaskLog | undefined>(undefined)
const loadingDetail = ref(false)

watch(
  () => [props.show, props.taskLog?.id],
  async () => {
    if (props.show && props.taskLog?.id) {
      loadingDetail.value = true
      try {
        detail.value = await getAITaskLog(props.taskLog.id)
      } catch {
        detail.value = props.taskLog
      } finally {
        loadingDetail.value = false
      }
    }
  },
)

const displayItem = computed(() => detail.value ?? props.taskLog)

function statusTagType(status?: string) {
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

function statusLabel(status?: string) {
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
      return status ?? '-'
  }
}

function taskTypeLabel(type_?: string) {
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
      return type_ ?? '-'
  }
}

function triggerLabel(trigger?: string) {
  switch (trigger) {
    case 'manual':
      return t('admin.ai_tasks.trigger_manual')
    case 'auto':
      return t('admin.ai_tasks.trigger_auto')
    default:
      return trigger ?? '-'
  }
}

function formatDuration(ms?: number) {
  if (ms == null) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
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
      :title="$t('admin.ai_tasks.task_detail')"
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
          :title="$t('admin.ai_tasks.basic_info')"
        >
          <NDescriptionsItem :label="$t('admin.table.id')">{{ displayItem.id }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.ai_tasks.task_type')">
            <NTag
              type="info"
              size="small"
              >{{ taskTypeLabel(displayItem.taskType) }}</NTag
            >
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.ai.model')">{{ displayItem.modelName || '-' }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.ai.provider')">{{
            displayItem.providerName || '-'
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.common.status')">
            <NTag
              :type="statusTagType(displayItem.status)"
              size="small"
              >{{ statusLabel(displayItem.status) }}</NTag
            >
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.ai_tasks.trigger_source')">
            <NTag
              :type="displayItem.triggerSource === 'auto' ? 'warning' : 'default'"
              size="small"
              >{{ triggerLabel(displayItem.triggerSource) }}</NTag
            >
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.table.duration')">{{
            formatDuration(displayItem.durationMs)
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.common.created_at')">{{
            new Date(displayItem.createdAt).toLocaleString()
          }}</NDescriptionsItem>
        </NDescriptions>

        <div v-if="displayItem.inputText">
          <h3 class="mb-2 font-bold">{{ $t('admin.ai_tasks.input_text') }}</h3>
          <NCode
            :code="displayItem.inputText"
            language="text"
            word-wrap
          />
        </div>

        <div v-if="displayItem.outputText">
          <h3 class="mb-2 font-bold">{{ $t('admin.ai_tasks.output_text') }}</h3>
          <NCode
            :code="displayItem.outputText"
            language="text"
            word-wrap
          />
        </div>

        <div v-if="displayItem.errorMessage">
          <h3 class="mb-2 font-bold text-red-500">{{ $t('admin.ai_tasks.error_message') }}</h3>
          <NCode
            :code="displayItem.errorMessage"
            language="text"
            word-wrap
          />
        </div>
      </div>
      <template #footer>
        <NButton @click="handleClose">{{ $t('admin.common.close') }}</NButton>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
