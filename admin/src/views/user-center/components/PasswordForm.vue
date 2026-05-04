<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { NButton, NDivider, NForm, NFormItem, NInput } from 'naive-ui'

import type { FormInst, FormItemRule } from 'naive-ui'

const form = defineModel<{ oldPassword: string; newPassword: string; confirmPassword: string }>(
  'form',
  {
    required: true,
  },
)

defineProps<{
  formRef: FormInst | null
  rules: Record<string, FormItemRule[]>
}>()

const emit = defineEmits<{
  'update:formRef': [value: FormInst | null]
  submit: []
}>()
</script>

<template>
  <div class="mx-auto max-w-lg pt-4">
    <div class="mb-8">
      <div class="text-lg font-medium">{{ t('admin.user.change_password') }}</div>
      <div class="text-sm text-neutral-400">{{ t('admin.user.password_security_hint') }}</div>
    </div>

    <NForm
      :ref="(el: any) => emit('update:formRef', el)"
      :model="form"
      :rules="rules"
      label-placement="top"
    >
      <NFormItem
        :label="$t('admin.form.current_password')"
        path="oldPassword"
      >
        <NInput
          v-model:value="form.oldPassword"
          type="password"
          show-password-on="click"
          :placeholder="$t('admin.placeholder.current_password')"
        />
      </NFormItem>
      <NDivider />
      <NFormItem
        :label="$t('admin.form.new_password')"
        path="newPassword"
      >
        <NInput
          v-model:value="form.newPassword"
          type="password"
          show-password-on="click"
          :placeholder="$t('admin.placeholder.new_password')"
        />
      </NFormItem>
      <NFormItem
        :label="$t('admin.form.confirm_password')"
        path="confirmPassword"
      >
        <NInput
          v-model:value="form.confirmPassword"
          type="password"
          show-password-on="click"
          :placeholder="$t('admin.placeholder.confirm_password')"
        />
      </NFormItem>
      <div class="mt-6">
        <NButton
          type="primary"
          block
          size="large"
          @click="emit('submit')"
          >{{ t('admin.action.change_password') }}</NButton
        >
      </div>
    </NForm>
  </div>
</template>
