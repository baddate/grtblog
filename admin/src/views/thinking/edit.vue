<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import {
  NButton,
  NCard,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NSwitch,
  useMessage,
} from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { publishFederationActivityPub } from '@/services/federation-admin'
import { createThinking, getThinking, updateThinking } from '@/services/thinking'

import type { FormInst } from 'naive-ui'

defineOptions({ name: 'ThinkingEdit' })

const route = useRoute()
const router = useRouter()
const message = useMessage()

const formRef = ref<FormInst | null>(null)
const formValue = ref({
  content: '',
  allowComment: true,
  createdAt: Date.now() as number | null,
})
const saving = ref(false)
const apPublishing = ref(false)
const activityPubObjectId = ref<string | null>(null)
const activityPubLastPublishedAt = ref<string | null>(null)

const id = computed(() => route.params.id as string | undefined)
const isCreating = computed(() => !id.value)

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) return '-'
  return new Date(timestamp).toLocaleString()
}

const apStatusText = computed(() => {
  if (isCreating.value) return t('admin.federation.status_not_created')
  return activityPubObjectId.value ? t('admin.federation.status_published') : t('admin.federation.status_not_published')
})

const apLastPublishedAtText = computed(() => formatDateTime(activityPubLastPublishedAt.value))

onMounted(() => {
  if (id.value) {
    getThinking(Number(id.value)).then((res) => {
      formValue.value.content = res.content
      formValue.value.allowComment = res.allowComment
      formValue.value.createdAt = res.createdAt ? new Date(res.createdAt).getTime() : null
      activityPubObjectId.value = res.activityPubObjectId ?? null
      activityPubLastPublishedAt.value = res.activityPubLastPublishedAt ?? null
    })
  }
})

async function handleSave() {
  try {
    saving.value = true
    if (isCreating.value) {
      await createThinking({
        content: formValue.value.content,
        allowComment: formValue.value.allowComment,
        createdAt: formValue.value.createdAt
          ? new Date(formValue.value.createdAt).toISOString()
          : null,
      })
      message.success(t('admin.common.create_success'))
    } else {
      await updateThinking(Number(id.value), {
        content: formValue.value.content,
        allowComment: formValue.value.allowComment,
      })
      message.success(t('admin.common.update_success'))
    }
    router.push({ name: 'thinkingList' })
  } catch (error) {
    message.error((error as Error).message)
  } finally {
    saving.value = false
  }
}

async function handleRepublishActivityPub() {
  const thinkingId = Number(id.value)
  if (!Number.isFinite(thinkingId) || thinkingId <= 0) return
  apPublishing.value = true
  try {
    const resp = await publishFederationActivityPub({
      source_type: 'thinking',
      source_id: thinkingId,
    })
    activityPubObjectId.value = resp.object_id || activityPubObjectId.value
    activityPubLastPublishedAt.value = resp.published_at
    message.success(t('admin.service.republish_result', { success: resp.success_count, failure: resp.failure_count }))
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('admin.service.republish_failed'))
  } finally {
    apPublishing.value = false
  }
}

</script>

<template>
  <div class="flex h-full min-h-0 flex-col p-10">
    <NCard>
      <NForm
        ref="formRef"
        :model="formValue"
        label-placement="top"
      >
        <NFormItem
          :label="$t('admin.form.content')"
          path="content"
        >
          <NInput
            v-model:value="formValue.content"
            type="textarea"
            :placeholder="$t('admin.placeholder.thinking_content')"
            :autosize="{ minRows: 5, maxRows: 15 }"
          />
        </NFormItem>
        <NFormItem :label="$t('admin.form.extra_options')">
          <div class="flex w-full flex-col gap-3">
            <div class="flex items-center gap-2">
              <span class="text-sm">{{ $t('admin.form.allow_comment') }}</span>
              <NSwitch v-model:value="formValue.allowComment" />
            </div>
            <div class="rounded-lg px-3 py-2">
              <div class="text-sm">{{ $t('admin.federation.activitypub_status', { status: apStatusText }) }}</div>
              <div class="text-xs opacity-70">{{ $t('admin.federation.last_published', { time: apLastPublishedAtText }) }}</div>
              <div
                v-if="activityPubObjectId"
                class="mt-1 text-xs break-all opacity-70"
              >
                {{ activityPubObjectId }}
              </div>
              <NButton
                class="mt-2"
                size="small"
                secondary
                :loading="apPublishing"
                :disabled="isCreating || apPublishing"
                @click="handleRepublishActivityPub"
              >
                {{ t('admin.action.republish') }}
              </NButton>
            </div>
          </div>
        </NFormItem>
        <NFormItem
          v-if="isCreating"
          :label="$t('admin.form.publish_time')"
        >
          <NDatePicker
            v-model:value="formValue.createdAt"
            type="datetime"
            clearable
            style="width: 100%"
            :placeholder="$t('admin.placeholder.default_time')"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end">
          <NButton
            type="primary"
            :loading="saving"
            @click="handleSave"
          >
            {{ isCreating ? t('admin.common.create') : t('admin.common.update') }}
          </NButton>
        </div>
      </template>
    </NCard>
  </div>
</template>
