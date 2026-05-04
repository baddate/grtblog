<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import {
  NButton,
  NCard,
  NDataTable,
  NDivider,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  useMessage,
} from 'naive-ui'
import { computed, h, onMounted, ref } from 'vue'

import {
  createAIModel,
  createAIProvider,
  deleteAIModel,
  deleteAIProvider,
  listAIModels,
  listAIProviders,
  updateAIModel,
  updateAIProvider,
} from '@/services/ai'
import { listSysConfigs, updateSysConfigs } from '@/services/sysconfig'

import ConfigPanel from '../ConfigPanel'

import type { AIModel, AIProvider } from '@/services/ai'
import type { DataTableColumns, SelectOption } from 'naive-ui'

const emit = defineEmits<{ 'dirty-change': [dirty: boolean] }>()
const message = useMessage()

// ── Providers ──

const providers = ref<AIProvider[]>([])
const providerLoading = ref(false)
const providerModalVisible = ref(false)
const providerSaving = ref(false)
const editingProvider = ref<AIProvider | null>(null)
const providerForm = ref({
  name: '',
  type: 'openai' as string,
  apiUrl: '',
  apiKey: '',
  isActive: true,
})

const providerTypeOptions: SelectOption[] = [
  { label: t('admin.ai.provider_type_openai'), value: 'openai' },
  { label: 'OpenRouter', value: 'openrouter' },
  { label: t('admin.ai.provider_type_gemini'), value: 'gemini' },
]

const providerColumns = computed<DataTableColumns<AIProvider>>(() => [
  { title: t('admin.table.id'), key: 'id', width: 60 },
  { title: t('admin.common.name'), key: 'name', minWidth: 120 },
  {
    title: t('admin.common.type'),
    key: 'type',
    width: 130,
    render: (row) => {
      const map: Record<string, string> = {
        openai: t('admin.ai.provider_type_openai'),
        openrouter: 'OpenRouter',
        gemini: t('admin.ai.provider_type_gemini'),
      }
      return map[row.type] || row.type
    },
  },
  { title: t('admin.ai.api_url'), key: 'apiUrl', ellipsis: { tooltip: true } },
  {
    title: t('admin.common.status'),
    key: 'isActive',
    width: 80,
    render: (row) =>
      h(
        NTag,
        { type: row.isActive ? 'success' : 'default', size: 'small', bordered: false },
        { default: () => (row.isActive ? t('admin.status.enabled') : t('admin.status.disabled')) },
      ),
  },
  {
    title: t('admin.common.actions'),
    key: 'actions',
    width: 130,
    render: (row) =>
      h(NSpace, { size: 'small' }, () => [
        h(
          NButton,
          { size: 'small', tertiary: true, onClick: () => openEditProvider(row) },
          { default: () => t('admin.common.edit') },
        ),
        h(
          NPopconfirm,
          { onPositiveClick: () => handleDeleteProvider(row) },
          {
            trigger: () =>
              h(
                NButton,
                { size: 'small', type: 'error', tertiary: true },
                { default: () => t('admin.common.delete') },
              ),
            default: () => t('admin.ai.confirm_delete_provider'),
          },
        ),
      ]),
  },
])

async function fetchProviders() {
  providerLoading.value = true
  try {
    providers.value = await listAIProviders()
  } finally {
    providerLoading.value = false
  }
}

function openCreateProvider() {
  editingProvider.value = null
  providerForm.value = { name: '', type: 'openai', apiUrl: '', apiKey: '', isActive: true }
  providerModalVisible.value = true
}

function openEditProvider(row: AIProvider) {
  editingProvider.value = row
  providerForm.value = {
    name: row.name,
    type: row.type,
    apiUrl: row.apiUrl,
    apiKey: '',
    isActive: row.isActive,
  }
  providerModalVisible.value = true
}

async function handleSaveProvider() {
  if (!providerForm.value.name.trim()) {
    message.error(t('admin.validation.required'))
    return
  }
  providerSaving.value = true
  try {
    if (editingProvider.value) {
      const data: Record<string, unknown> = {
        name: providerForm.value.name,
        type: providerForm.value.type,
        apiUrl: providerForm.value.apiUrl,
        isActive: providerForm.value.isActive,
      }
      if (providerForm.value.apiKey) {
        data.apiKey = providerForm.value.apiKey
      }
      await updateAIProvider(editingProvider.value.id, data)
      message.success(t('admin.service.update_success'))
    } else {
      await createAIProvider(providerForm.value)
      message.success(t('admin.service.create_success'))
    }
    providerModalVisible.value = false
    await fetchProviders()
    await fetchModels()
  } finally {
    providerSaving.value = false
  }
}

async function handleDeleteProvider(row: AIProvider) {
  await deleteAIProvider(row.id)
  message.success(t('admin.service.delete_success'))
  await fetchProviders()
  await fetchModels()
}

// ── Models ──

const models = ref<AIModel[]>([])
const modelLoading = ref(false)
const modelModalVisible = ref(false)
const modelSaving = ref(false)
const editingModel = ref<AIModel | null>(null)
const modelForm = ref({
  providerId: null as number | null,
  name: '',
  modelId: '',
  isActive: true,
})

const providerSelectOptions = computed<SelectOption[]>(() =>
  providers.value.map((p) => ({ label: `${p.name} (${p.type})`, value: p.id })),
)

const modelColumns = computed<DataTableColumns<AIModel>>(() => [
  { title: t('admin.table.id'), key: 'id', width: 60 },
  { title: t('admin.ai.model_name'), key: 'name', minWidth: 120 },
  { title: t('admin.ai.model_id_field'), key: 'modelId', minWidth: 140, ellipsis: { tooltip: true } },
  {
    title: t('admin.ai.provider'),
    key: 'providerName',
    width: 150,
    render: (row) => row.providerName || `#${row.providerId}`,
  },
  {
    title: t('admin.common.status'),
    key: 'isActive',
    width: 80,
    render: (row) =>
      h(
        NTag,
        { type: row.isActive ? 'success' : 'default', size: 'small', bordered: false },
        { default: () => (row.isActive ? t('admin.status.enabled') : t('admin.status.disabled')) },
      ),
  },
  {
    title: t('admin.common.actions'),
    key: 'actions',
    width: 130,
    render: (row) =>
      h(NSpace, { size: 'small' }, () => [
        h(
          NButton,
          { size: 'small', tertiary: true, onClick: () => openEditModel(row) },
          { default: () => t('admin.common.edit') },
        ),
        h(
          NPopconfirm,
          { onPositiveClick: () => handleDeleteModel(row) },
          {
            trigger: () =>
              h(
                NButton,
                { size: 'small', type: 'error', tertiary: true },
                { default: () => t('admin.common.delete') },
              ),
            default: () => t('admin.ai.confirm_delete_model'),
          },
        ),
      ]),
  },
])

async function fetchModels() {
  modelLoading.value = true
  try {
    models.value = await listAIModels()
  } finally {
    modelLoading.value = false
  }
}

function openCreateModel() {
  editingModel.value = null
  modelForm.value = { providerId: null, name: '', modelId: '', isActive: true }
  modelModalVisible.value = true
}

function openEditModel(row: AIModel) {
  editingModel.value = row
  modelForm.value = {
    providerId: row.providerId,
    name: row.name,
    modelId: row.modelId,
    isActive: row.isActive,
  }
  modelModalVisible.value = true
}

async function handleSaveModel() {
  if (!modelForm.value.name.trim()) {
    message.error(t('admin.validation.required'))
    return
  }
  if (!modelForm.value.modelId.trim()) {
    message.error(t('admin.validation.required'))
    return
  }
  if (!modelForm.value.providerId) {
    message.error(t('admin.ai.select_provider'))
    return
  }
  modelSaving.value = true
  try {
    if (editingModel.value) {
      await updateAIModel(editingModel.value.id, {
        providerId: modelForm.value.providerId,
        name: modelForm.value.name,
        modelId: modelForm.value.modelId,
        isActive: modelForm.value.isActive,
      })
      message.success(t('admin.service.update_success'))
    } else {
      await createAIModel({
        providerId: modelForm.value.providerId!,
        name: modelForm.value.name,
        modelId: modelForm.value.modelId,
        isActive: modelForm.value.isActive,
      })
      message.success(t('admin.service.create_success'))
    }
    modelModalVisible.value = false
    await fetchModels()
  } finally {
    modelSaving.value = false
  }
}

async function handleDeleteModel(row: AIModel) {
  await deleteAIModel(row.id)
  message.success(t('admin.service.delete_success'))
  await fetchModels()
}

// ── Init ──

onMounted(async () => {
  await Promise.all([fetchProviders(), fetchModels()])
})

</script>

<template>
  <!-- Providers -->
  <NCard
    :title="$t('admin.ai.provider_management')"
    class="mb-4"
  >
    <template #header-extra>
      <NButton
        type="primary"
        size="small"
        @click="openCreateProvider"
        >{{ $t('admin.action.create') }}</NButton
      >
    </template>
    <NDataTable
      :loading="providerLoading"
      :columns="providerColumns"
      :data="providers"
      :bordered="false"
      size="small"
    />
  </NCard>

  <!-- Models -->
  <NCard
    :title="$t('admin.ai.model_management')"
    class="mb-4"
  >
    <template #header-extra>
      <NButton
        type="primary"
        size="small"
        @click="openCreateModel"
        >{{ $t('admin.action.create') }}</NButton
      >
    </template>
    <NDataTable
      :loading="modelLoading"
      :columns="modelColumns"
      :data="models"
      :bordered="false"
      size="small"
    />
  </NCard>

  <!-- Task Configuration -->
  <NDivider />
  <ConfigPanel
    :list-fn="listSysConfigs"
    :update-fn="updateSysConfigs"
    :title="$t('admin.ai.task_config')"
    :description="$t('admin.ai.task_config_desc')"
    :filter-groups="['ai', 'ai/task', 'ai/prompt']"
    :on-dirty-change="(dirty: boolean) => emit('dirty-change', dirty)"
  />

  <!-- Provider Edit Modal -->
  <NModal
    v-model:show="providerModalVisible"
    preset="card"
    :title="editingProvider ? $t('admin.ai.edit_provider') : $t('admin.ai.add_provider')"
    style="width: 560px"
  >
    <NForm
      label-placement="left"
      label-width="96"
    >
      <NFormItem
        :label="$t('admin.common.name')"
        required
      >
        <NInput
          v-model:value="providerForm.name"
          :placeholder="$t('admin.ai.placeholder_provider_name')"
        />
      </NFormItem>
      <NFormItem
        :label="$t('admin.common.type')"
        required
      >
        <NSelect
          v-model:value="providerForm.type"
          :options="providerTypeOptions"
        />
      </NFormItem>
      <NFormItem :label="$t('admin.ai.api_url')">
        <NInput
          v-model:value="providerForm.apiUrl"
          :placeholder="$t('admin.ai.placeholder_api_url')"
        />
      </NFormItem>
      <NFormItem :label="editingProvider ? $t('admin.ai.api_key_unchanged') : $t('admin.ai.api_key_label')">
        <NInput
          v-model:value="providerForm.apiKey"
          type="password"
          show-password-on="click"
          :placeholder="$t('admin.ai.placeholder_api_key')"
        />
      </NFormItem>
      <NFormItem :label="$t('admin.common.enabled')">
        <NSwitch v-model:value="providerForm.isActive" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="providerModalVisible = false">{{ $t('admin.common.cancel') }}</NButton>
        <NButton
          type="primary"
          :loading="providerSaving"
          @click="handleSaveProvider"
          >{{ $t('admin.common.save') }}</NButton
        >
      </NSpace>
    </template>
  </NModal>

  <!-- Model Edit Modal -->
  <NModal
    v-model:show="modelModalVisible"
    preset="card"
    :title="editingModel ? $t('admin.ai.edit_model') : $t('admin.ai.add_model')"
    style="width: 560px"
  >
    <NForm
      label-placement="left"
      label-width="96"
    >
      <NFormItem
        :label="$t('admin.ai.provider')"
        required
      >
        <NSelect
          v-model:value="modelForm.providerId"
          :options="providerSelectOptions"
          :placeholder="$t('admin.ai.select_provider')"
        />
      </NFormItem>
      <NFormItem
        :label="$t('admin.ai.display_name')"
        required
      >
        <NInput
          v-model:value="modelForm.name"
          :placeholder="$t('admin.ai.placeholder_model_name')"
        />
      </NFormItem>
      <NFormItem
        :label="$t('admin.ai.model_id_field')"
        required
      >
        <NInput
          v-model:value="modelForm.modelId"
          :placeholder="$t('admin.ai.placeholder_model_id')"
        />
      </NFormItem>
      <NFormItem :label="$t('admin.common.enabled')">
        <NSwitch v-model:value="modelForm.isActive" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="modelModalVisible = false">{{ $t('admin.common.cancel') }}</NButton>
        <NButton
          type="primary"
          :loading="modelSaving"
          @click="handleSaveModel"
          >{{ $t('admin.common.save') }}</NButton
        >
      </NSpace>
    </template>
  </NModal>
</template>
