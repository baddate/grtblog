<script setup lang="ts">
import { NButton, NFormItem, NInput } from 'naive-ui'

defineProps<{
  modelValue: string | null
  loading: boolean
  result: string
  done: boolean
  placeholder: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  generate: []
  adopt: []
  dismiss: []
}>()
</script>

<template>
  <NFormItem :show-feedback="false">
    <template #label>
      <span>{{ $t('admin.ai.ai_summary') }}</span>
      <span class="ml-1 text-xs opacity-50">{{ $t('admin.ai.summary_guide_hint') }}</span>
    </template>
    <NInput
      :value="modelValue ?? ''"
      type="textarea"
      :placeholder="placeholder"
      :autosize="{ minRows: 2, maxRows: 4 }"
      @update:value="emit('update:modelValue', $event)"
    />
  </NFormItem>
  <div class="flex flex-col gap-2">
    <NButton
      size="small"
      :loading="loading"
      :disabled="loading || disabled"
      @click="emit('generate')"
    >
      <template #icon><div class="iconify ph--sparkle" /></template>
      {{ $t('admin.ai.generate_summary') }}
    </NButton>
    <div
      v-if="loading || result"
      class="rounded-lg border border-current/10 p-3 text-sm leading-relaxed"
    >
      <span>{{ result }}</span>
      <span
        v-if="loading"
        class="inline-block w-1.5 animate-pulse bg-current"
        >&nbsp;</span
      >
    </div>
    <div
      v-if="done"
      class="flex justify-end gap-2"
    >
      <NButton
        size="small"
        quaternary
        @click="emit('dismiss')"
        >{{ $t('admin.common.cancel') }}</NButton
      >
      <NButton
        size="small"
        type="primary"
        @click="emit('adopt')"
        >{{ $t('admin.ai.adopt') }}</NButton
      >
    </div>
  </div>
</template>
