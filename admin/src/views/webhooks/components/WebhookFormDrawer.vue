<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import {
  NButton,
  NCheckbox,
  NCheckboxGroup,
  NCollapse,
  NCollapseItem,
  NDivider,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NSpace,
  NSwitch,
  NTag,
} from 'naive-ui'

import { ScrollContainer } from '@/components'
import TemplateEditor from '@/components/template-editor/TemplateEditor.vue'

import type { HeaderRow } from '../composables/use-webhook-form'
import type { AdminEventGroupResp } from '@/services/events'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<{
  name: string
  url: string
  events: string[]
  headers: HeaderRow[]
  payloadTemplate: string
  isEnabled: boolean
}>('form', { required: true })

defineProps<{
  title: string
  actionLabel: string
  saving: boolean
  eventGroups: AdminEventGroupResp[]
  validVariables: string[]
}>()

const emit = defineEmits<{
  save: []
  formatPayload: []
  addHeader: []
  removeHeader: [index: number]
}>()
</script>

<template>
  <NDrawer
    :show="visible"
    placement="right"
    width="min(680px, 100%)"
    @update:show="visible = $event"
  >
    <NDrawerContent
      :title="title"
      closable
      header-style="padding: 20px 24px"
      body-style="padding: 0"
    >
      <ScrollContainer wrapper-class="flex flex-col gap-5">
        <NForm label-placement="top">
          <NGrid
            cols="1 640:2"
            x-gap="16"
            y-gap="12"
          >
            <NGi>
              <NFormItem :label="$t('admin.common.name')">
                <NInput
                  v-model:value="form.name"
                  :placeholder="t('admin.webhooks.name_placeholder')"
                />
              </NFormItem>
            </NGi>
            <NGi>
              <NFormItem :label="$t('admin.common.url')">
                <NInput
                  v-model:value="form.url"
                  :placeholder="t('admin.webhooks.url_placeholder')"
                />
              </NFormItem>
            </NGi>
          </NGrid>

          <NDivider
            class="!-mx-4 !mb-0 !w-[calc(100%+2rem)] max-sm:!-mx-2 max-sm:!w-[calc(100%+1rem)]"
            >{{ $t('admin.webhooks.event_subscription') }}</NDivider
          >
          <NFormItem :label="$t('admin.webhooks.subscribe_events')"
            :show-label="false"
          >
            <NCheckboxGroup
              v-model:value="form.events"
              class="w-full"
            >
              <NCollapse
                arrow-placement="right"
                class="mt-4 w-full"
              >
                <NCollapseItem
                  v-for="group in eventGroups"
                  :key="group.category"
                  :title="group.category"
                  :name="group.category"
                >
                  <NGrid
                    cols="1 640:2"
                    x-gap="16"
                    y-gap="8"
                    class="pl-6"
                  >
                    <NGi
                      v-for="item in group.events"
                      :key="item"
                    >
                      <NCheckbox
                        :value="item"
                        :label="item"
                      />
                    </NGi>
                  </NGrid>
                </NCollapseItem>
              </NCollapse>
            </NCheckboxGroup>
          </NFormItem>
          <NFormItem :label="$t('admin.common.enabled')">
            <NSwitch v-model:value="form.isEnabled" />
          </NFormItem>

          <NDivider
            class="!-mx-4 !mb-0 !w-[calc(100%+2rem)] max-sm:!-mx-2 max-sm:!w-[calc(100%+1rem)]"
            >{{ $t('admin.webhooks.request_config') }}</NDivider
          >
          <NFormItem :label="$t('admin.webhooks.headers')">
            <div class="flex w-full flex-col gap-2">
              <div
                v-for="(row, index) in form.headers"
                :key="`${row.key}-${index}`"
                class="flex items-center gap-2"
              >
                <div class="w-40">
                  <NInput
                    v-model:value="row.key"
                    :placeholder="t('admin.webhooks.header_key_placeholder')"
                    class="w-full"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <NInput
                    v-model:value="row.value"
                    :placeholder="t('admin.webhooks.header_value_placeholder')"
                    class="w-full"
                  />
                </div>
                <NButton
                  tertiary
                  size="small"
                  @click="emit('removeHeader', index)"
                  >{{ $t('admin.common.delete') }}</NButton
                >
              </div>
              <div>
                <NButton
                  size="small"
                  @click="emit('addHeader')"
                  >{{ $t('admin.webhooks.add_header') }}</NButton
                >
              </div>
            </div>
          </NFormItem>
          <NFormItem :label="$t('admin.webhooks.payload_template')">
            <div class="flex w-full flex-col gap-2">
              <div class="flex justify-end">
                <NButton
                  size="small"
                  tertiary
                  @click="emit('formatPayload')"
                  >{{ $t('admin.webhooks.format') }}</NButton
                >
              </div>
              <TemplateEditor
                v-model="form.payloadTemplate"
                :valid-variables="validVariables"
              />
              <div
                v-if="validVariables.length > 0"
                class="rounded border bg-gray-50 p-3 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              >
                <div class="mb-2 text-gray-500">{{ $t('admin.webhooks.available_variables') }}</div>
                <NSpace size="small">
                  <NTag
                    v-for="v in validVariables"
                    :key="v"
                    size="small"
                    type="info"
                    dashed
                    :bordered="false"
                    class="cursor-pointer bg-white select-all dark:bg-neutral-900"
                  >
                    {{ v }}
                  </NTag>
                </NSpace>
              </div>
              <div
                v-else
                class="rounded border bg-gray-50 p-3 text-xs text-gray-400 dark:border-neutral-700 dark:bg-neutral-800"
              >
                * {{ $t('admin.webhooks.select_event_hint') }}
              </div>
            </div>
          </NFormItem>
        </NForm>
        <div class="flex justify-end gap-2">
          <NButton @click="visible = false">{{ $t('admin.common.cancel') }}</NButton>
          <NButton
            type="primary"
            :loading="saving"
            @click="emit('save')"
          >
            {{ actionLabel }}
          </NButton>
        </div>
      </ScrollContainer>
    </NDrawerContent>
  </NDrawer>
</template>
