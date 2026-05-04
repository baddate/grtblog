<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { NButton, NCard, NForm, NFormItem, NInput, NSelect, useMessage } from 'naive-ui'
import { onMounted, reactive, ref } from 'vue'

import { ScrollContainer } from '@/components'
import TemplateEditor from '@/components/template-editor/TemplateEditor.vue'
import { usePreviewData } from '@/composables/email/use-preview-data'
import { listEmailTemplates, testEmailTemplate } from '@/services/email'
import { getEventCatalogItem } from '@/services/events'

import type { EmailTemplate } from '@/services/email'

const message = useMessage()

const loading = ref(false)
const templateOptions = ref<{ label: string; value: string }[]>([])
const templatesList = ref<EmailTemplate[]>([])

const { generatePreviewData } = usePreviewData()
const currentEventName = ref('')

const form = reactive({
  code: '',
  toEmail: '',
  variables: '{\n  "Name": "Test User"\n}',
})

async function fetchTemplates() {
  const list = await listEmailTemplates()
  templatesList.value = list

  templateOptions.value = list.map((t) => ({ label: `${t.name} (${t.code})`, value: t.code }))
  const first = list[0]
  if (first) {
    form.code = first.code
    handleTemplateChange(form.code)
  }
}

async function handleTemplateChange(code: string) {
  const t = templatesList.value.find((i) => i.code === code)
  if (t && t.eventName) {
    currentEventName.value = t.eventName
    try {
      const details = await getEventCatalogItem(t.eventName)
      if (details && details.fields) {
        form.variables = generatePreviewData(details.fields)
      }
    } catch (e) {
      // ignore
    }
  }
}

async function handleSend() {
  if (!form.code || !form.toEmail) {
    message.error(t('admin.common.fill_required'))
    return
  }
  loading.value = true
  try {
    let variables = {}
    try {
      if (form.variables) {
        variables = JSON.parse(form.variables)
      }
    } catch (e) {
      message.error(t('admin.email.invalid_json_variables'))
      loading.value = false
      return
    }

    await testEmailTemplate(form.code, {
      toEmails: [form.toEmail],
      variables: variables,
    })
    message.success(t('admin.email.send_test_submitted'))
  } catch (err) {
    //
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTemplates()
})

</script>

<template>
  <ScrollContainer wrapper-class="p-4">
    <NCard
      :title="$t('admin.email.test_title')"
      class="mx-auto max-w-2xl"
    >
      <div class="mb-4 text-sm text-[var(--text-color-3)]">
        {{ $t('admin.email.test_description') }}
      </div>

      <NForm
        label-placement="top"
        :disabled="loading"
      >
        <NFormItem :label="$t('admin.email.select_template')">
          <NSelect
            v-model:value="form.code"
            :options="templateOptions"
            filterable
            :placeholder="$t('admin.placeholder.select')"
            @update:value="handleTemplateChange"
          />
        </NFormItem>
        <NFormItem :label="$t('admin.form.recipient')">
          <NInput
            v-model:value="form.toEmail"
            placeholder="target@example.com"
          />
        </NFormItem>
        <NFormItem :label="$t('admin.email.template_variables_json')">
          <TemplateEditor v-model="form.variables" />
        </NFormItem>
        <NButton
          type="primary"
          block
          :loading="loading"
          @click="handleSend"
        >
          {{ $t('admin.action.send_test') }}
        </NButton>
      </NForm>
    </NCard>
  </ScrollContainer>
</template>
