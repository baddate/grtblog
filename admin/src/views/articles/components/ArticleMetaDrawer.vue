<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import {
  NAlert,
  NAutoComplete,
  NButton,
  NDivider,
  NDrawer,
  NDrawerContent,
  NDynamicTags,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NPopconfirm,
  NSelect,
  NSkeleton,
  NSwitch,
  NTag,
} from 'naive-ui'

import ImageInput from '@/components/image-picker/ImageInput.vue'
import AiSummaryAssist from '@/views/shared/content-editor/components/AiSummaryAssist.vue'

import type { ArticleEditorForm } from '../composables/use-article-form'
import type { NewCategoryModalState } from '../composables/use-taxonomy-select'
import type { ArticleDetail } from '@/services/articles'
import type { FederationOutboundInteractionResp } from '@/types/federation'
import type { SelectOption } from 'naive-ui'

type FederationSignalType = 'mention' | 'citation'

export interface FederationSignalRow {
  key: string
  type: FederationSignalType
  instance: string
  target: string
  marker: string
  inContent: boolean
  deliveredAt: string | null
  outbound: FederationOutboundInteractionResp | null
}

const show = defineModel<boolean>('show', { required: true })
const form = defineModel<ArticleEditorForm>('form', { required: true })

defineProps<{
  categoryOptions: SelectOption[]
  dynamicTags: string[]
  tagSearchValue: string
  autoCompleteOptions: { label: string; value: string }[]
  newCategoryModal: NewCategoryModalState
  aiSummaryLoading: boolean
  aiSummaryResult: string
  aiSummaryDone: boolean
  isYearSummary: boolean
  yearSummaryYear: number
  apStatusText: string
  apLastPublishedAtText: string
  loadedArticle: ArticleDetail | null
  canRepublishToActivityPub: boolean
  apPublishing: boolean
  isCreating: boolean
  federationInteractionsError: string
  federationInteractionsLoading: boolean
  federationSignalRows: FederationSignalRow[]
  resetAllFederationLoading: boolean
  resetSignalLoadingKeys: Record<string, boolean>
  formatDateTime: (value?: string | null) => string
  signalStatusText: (row: FederationSignalRow) => string
}>()

const emit = defineEmits<{
  'update:tagSearchValue': [value: string]
  'update:isYearSummary': [value: boolean]
  'update:yearSummaryYear': [value: number | null]
  openCategoryModal: []
  tagsChange: [value: string[]]
  addTag: [value: string]
  generateAiSummary: []
  adoptAiSummary: []
  dismissAiSummary: []
  republishActivityPub: []
  resetAllFederationSignals: []
  resetFederationSignal: [row: FederationSignalRow]
}>()

function onTagEnter(event: KeyboardEvent, value: string) {
  if (event.key === 'Enter') {
    event.preventDefault()
    emit('addTag', value)
  }
}

function outboundStatusTagType(status?: string | null) {
  const normalized = (status || '').trim().toLowerCase()
  if (normalized === 'approved' || normalized === 'accepted') return 'success'
  if (normalized === 'queued' || normalized === 'sending') return 'warning'
  if (
    normalized === 'rejected' ||
    normalized === 'failed' ||
    normalized === 'timeout' ||
    normalized === 'dead'
  ) {
    return 'error'
  }
  return 'default'
}

function emitResetRow(row: FederationSignalRow) {
  emit('resetFederationSignal', row)
}

</script>

<template>
  <NDrawer
    v-model:show="show"
    placement="right"
    width="400"
  >
    <NDrawerContent
      :title="$t('admin.article.settings')"
      :native-scrollbar="false"
      closable
      header-style="padding: 24px;"
      body-style="padding: 24px;"
    >
      <div class="flex flex-col gap-6">
        <div class="space-y-4">
          <div class="flex items-center gap-2 text-sm font-medium">
            <div class="iconify ph--tag" />
            <span>{{ $t('admin.article.category_tags') }}</span>
          </div>
          <NForm
            label-placement="top"
            label-width="auto"
            class="space-y-4"
          >
            <NFormItem
              :label="$t('admin.form.category')"
              :show-feedback="false"
            >
              <div class="flex w-full items-center gap-2">
                <NSelect
                  v-model:value="form.categoryId"
                  :options="categoryOptions"
                  :placeholder="$t('admin.placeholder.select_category')"
                  clearable
                  filterable
                  class="flex-1"
                />
                <NButton
                  quaternary
                  size="small"
                  @click="$emit('openCategoryModal')"
                  >{{ $t('admin.common.create') }}</NButton
                >
              </div>
            </NFormItem>
            <NFormItem
              :label="$t('admin.form.tags')"
              :show-feedback="false"
            >
              <div class="flex w-full flex-col gap-2">
                <NDynamicTags
                  :value="dynamicTags"
                  @update:value="$emit('tagsChange', $event)"
                />
                <div class="flex items-center gap-2">
                  <NAutoComplete
                    :value="tagSearchValue"
                    :options="autoCompleteOptions"
                    :placeholder="$t('admin.placeholder.search_tag')"
                    class="flex-1"
                    :input-props="{
                      onKeydown: (event: KeyboardEvent) => onTagEnter(event, tagSearchValue),
                    }"
                    @update:value="$emit('update:tagSearchValue', $event)"
                    @select="$emit('addTag', $event)"
                  />
                  <NButton
                    quaternary
                    size="small"
                    @click="$emit('addTag', tagSearchValue)"
                    >{{ $t('admin.common.add') }}</NButton
                  >
                </div>
              </div>
            </NFormItem>
          </NForm>
        </div>

        <NDivider style="margin: 0" />

        <div class="space-y-4">
          <div class="flex items-center gap-2 text-sm font-medium">
            <div class="iconify ph--article" />
            <span>{{ $t('admin.article.meta_info') }}</span>
          </div>
          <NForm
            label-placement="top"
            label-width="auto"
            class="space-y-4"
          >
            <NFormItem :show-feedback="false">
              <template #label>
                <span>{{ $t('admin.article.summary') }}</span>
                <span class="ml-1 text-xs opacity-50">{{ $t('admin.placeholder.summary_tip') }}</span>
              </template>
              <NInput
                v-model:value="form.summary"
                type="textarea"
                :placeholder="$t('admin.placeholder.summary_external')"
                :autosize="{ minRows: 2, maxRows: 4 }"
              />
            </NFormItem>
            <AiSummaryAssist
              :model-value="form.aiSummary"
              :loading="aiSummaryLoading"
              :result="aiSummaryResult"
              :done="aiSummaryDone"
              :placeholder="$t('admin.placeholder.ai_summary_guide')"
              :disabled="!form.content?.trim()"
              @update:model-value="form.aiSummary = $event"
              @generate="$emit('generateAiSummary')"
              @adopt="$emit('adoptAiSummary')"
              @dismiss="$emit('dismissAiSummary')"
            />
            <NFormItem
              :label="$t('admin.article.lead_in')"
              :show-feedback="false"
            >
              <NInput
                v-model:value="form.leadIn"
                type="textarea"
                :placeholder="$t('admin.placeholder.lead_in')"
                :autosize="{ minRows: 2, maxRows: 4 }"
              />
            </NFormItem>
            <NFormItem
              :label="$t('admin.form.cover')"
              :show-feedback="false"
            >
              <ImageInput v-model:value="form.cover" />
            </NFormItem>
          </NForm>
        </div>

        <NDivider style="margin: 0" />

        <div class="space-y-4">
          <div class="flex items-center gap-2 text-sm font-medium">
            <div class="iconify ph--toggle-left" />
            <span>{{ $t('admin.article.properties') }}</span>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center justify-between rounded-lg px-4 py-3">
              <span class="text-sm">{{ $t('admin.article.is_top') }}</span>
              <NSwitch
                v-model:value="form.isTop"
                size="small"
              />
            </div>
            <div class="flex items-center justify-between rounded-lg px-4 py-3">
              <span class="text-sm">{{ $t('admin.form.allow_comment') }}</span>
              <NSwitch
                v-model:value="form.allowComment"
                size="small"
              />
            </div>
            <div class="flex items-center justify-between rounded-lg px-4 py-3">
              <span class="text-sm">{{ $t('admin.form.is_original') }}</span>
              <NSwitch
                v-model:value="form.isOriginal"
                size="small"
              />
            </div>
            <div class="col-span-2 rounded-lg px-4 py-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm">{{ $t('admin.article.is_year_summary') }}</span>
                <NSwitch
                  :value="isYearSummary"
                  size="small"
                  @update:value="$emit('update:isYearSummary', $event)"
                />
              </div>
              <div
                v-if="isYearSummary"
                class="mt-3"
              >
                <NInputNumber
                  :value="yearSummaryYear"
                  :min="1900"
                  :max="3000"
                  :precision="0"
                  class="w-full"
                  :placeholder="$t('admin.article.year_placeholder')"
                  @update:value="$emit('update:yearSummaryYear', $event)"
                />
              </div>
            </div>
            <div class="col-span-2 rounded-lg px-4 py-3">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 space-y-1">
                  <div class="text-sm">{{ $t('admin.federation.activitypub_status', { status: apStatusText }) }}</div>
                  <div class="text-xs opacity-70">{{ $t('admin.federation.last_published', { time: apLastPublishedAtText }) }}</div>
                  <div
                    v-if="loadedArticle?.activityPubObjectId"
                    class="text-xs break-all opacity-70"
                  >
                    {{ loadedArticle.activityPubObjectId }}
                  </div>
                </div>
                <NButton
                  size="small"
                  secondary
                  :loading="apPublishing"
                  :disabled="!canRepublishToActivityPub || apPublishing"
                  @click="$emit('republishActivityPub')"
                >
                  {{ $t('admin.action.republish') }}
                </NButton>
              </div>
            </div>
          </div>
        </div>

        <NDivider style="margin: 0" />

        <div class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 text-sm font-medium">
              <div class="iconify ph--circles-three" />
              <span>{{ $t('admin.article.federation_status') }}</span>
            </div>
            <NPopconfirm
              trigger="click"
              @positive-click="$emit('resetAllFederationSignals')"
            >
              <template #trigger>
                <NButton
                  size="small"
                  secondary
                  :loading="resetAllFederationLoading"
                  :disabled="
                    isCreating || federationSignalRows.length === 0 || resetAllFederationLoading
                  "
                >
                  {{ $t('admin.article.federation_reset_all') }}
                </NButton>
              </template>
              {{ $t('admin.article.federation_confirm_reset_all') }}
            </NPopconfirm>
          </div>

          <NAlert
            v-if="isCreating"
            type="info"
            :show-icon="false"
          >
            {{ $t('admin.article.federation_creating_hint') }}
          </NAlert>

          <NAlert
            v-else-if="federationInteractionsError"
            type="warning"
            :show-icon="false"
          >
            {{ federationInteractionsError }}
          </NAlert>

          <div
            v-else-if="federationInteractionsLoading"
            class="space-y-3"
          >
            <NSkeleton
              text
              :repeat="2"
            />
            <NSkeleton
              text
              :repeat="2"
            />
          </div>

          <NEmpty
            v-else-if="federationSignalRows.length === 0"
            size="small"
            :description="$t('admin.article.federation_empty')"
          />

          <div
            v-else
            class="space-y-3"
          >
            <div
              v-for="row in federationSignalRows"
              :key="row.key"
              class="rounded-lg border border-current/10 p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <NTag
                      size="small"
                      :bordered="false"
                      :type="row.type === 'mention' ? 'info' : 'warning'"
                    >
                      {{ row.type === 'mention' ? $t('admin.article.federation_mention') : $t('admin.article.federation_citation') }}
                    </NTag>
                    <NTag
                      size="small"
                      :bordered="false"
                      :type="outboundStatusTagType(row.outbound?.status)"
                    >
                      {{ signalStatusText(row) }}
                    </NTag>
                    <NTag
                      v-if="!row.inContent"
                      size="small"
                      :bordered="false"
                      type="default"
                    >
                      {{ $t('admin.article.federation_not_in_content') }}
                    </NTag>
                  </div>
                  <div class="font-mono text-xs break-all opacity-80">
                    {{ row.marker }}
                  </div>
                  <div class="text-xs opacity-70">{{ $t('admin.article.federation_target', { instance: row.instance, target: row.target }) }}</div>
                  <div
                    v-if="row.deliveredAt"
                    class="text-xs opacity-70"
                  >
                    {{ $t('admin.article.federation_delivered_at', { time: formatDateTime(row.deliveredAt) }) }}
                  </div>
                  <div
                    v-if="row.outbound?.updated_at"
                    class="text-xs opacity-70"
                  >
                    {{ $t('admin.article.federation_outbound_updated', { time: formatDateTime(row.outbound.updated_at) }) }}
                  </div>
                </div>

                <NPopconfirm
                  trigger="click"
                  @positive-click="emitResetRow(row)"
                >
                  <template #trigger>
                    <NButton
                      size="tiny"
                      secondary
                      :loading="!!resetSignalLoadingKeys[row.key]"
                      :disabled="!!resetSignalLoadingKeys[row.key]"
                    >
                      {{ $t('admin.action.reset') }}
                    </NButton>
                  </template>
                  {{ $t('admin.article.federation_confirm_reset_single') }}
                </NPopconfirm>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>
