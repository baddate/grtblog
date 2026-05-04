<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { NModal, NSelect } from 'naive-ui'

import type { SelectOption } from 'naive-ui'

defineProps<{
  visible: boolean
  testEventName: string | null
  eventOptions: SelectOption[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:testEventName': [value: string | null]
  confirm: []
}>()
</script>

<template>
  <NModal
    :show="visible"
    preset="dialog"
    :title="$t('admin.webhooks.test_webhook')"
    :positive-text="$t('admin.webhooks.send')"
    :negative-text="$t('admin.common.cancel')"
    @positive-click="emit('confirm')"
    @update:show="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-3 py-2">
      <div class="text-xs text-[var(--text-color-3)]">{{ $t('admin.webhooks.test_instruction') }}</div>
      <NSelect
        :value="testEventName"
        :options="eventOptions"
        :placeholder="$t('admin.webhooks.select_event_placeholder')"
        clearable
        @update:value="emit('update:testEventName', $event)"
      />
    </div>
  </NModal>
</template>
