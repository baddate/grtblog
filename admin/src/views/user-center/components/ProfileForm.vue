<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { NButton, NForm, NFormItem, NGi, NGrid, NInput } from 'naive-ui'

import type { FormInst, FormItemRule } from 'naive-ui'

const form = defineModel<{ nickname: string; email: string; avatar: string }>('form', {
  required: true,
})

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
  <div class="max-w-2xl">
    <NForm
      :ref="(el: any) => emit('update:formRef', el)"
      :model="form"
      :rules="rules"
      label-placement="top"
    >
      <NGrid
        cols="1 m:2"
        x-gap="24"
      >
        <NGi>
          <NFormItem
            :label="$t('admin.form.nickname')"
            path="nickname"
          >
            <NInput
              v-model:value="form.nickname"
              :placeholder="$t('admin.placeholder.nickname')"
            />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem
            :label="$t('admin.form.email')"
            path="email"
          >
            <NInput
              v-model:value="form.email"
              :placeholder="$t('admin.placeholder.email')"
            />
          </NFormItem>
        </NGi>
      </NGrid>
      <NFormItem :label="$t('admin.user.avatar_url')">
        <NInput
          v-model:value="form.avatar"
          type="textarea"
          :rows="2"
          :placeholder="$t('admin.placeholder.avatar_external')"
        />
      </NFormItem>
      <div class="mt-4">
        <NButton
          type="primary"
          size="large"
          strong
          @click="emit('submit')"
          >{{ t('admin.action.save_profile') }}</NButton
        >
      </div>
    </NForm>
  </div>
</template>
