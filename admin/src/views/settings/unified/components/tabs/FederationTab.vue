<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { NButton, NModal, useMessage } from 'naive-ui'
import { ref } from 'vue'

import {
  exportFederationConfigs,
  importFederationConfigs,
  listActivityPubConfigs,
  listFederationConfigs,
  updateActivityPubConfigs,
  updateFederationConfigs,
} from '@/services/sysconfig'

import ConfigPanel from '../ConfigPanel'

import type { ConfigExportData } from '@/services/sysconfig'

const emit = defineEmits<{ 'dirty-change': [dirty: boolean] }>()
const message = useMessage()

const federationDirty = ref(false)
const activityPubDirty = ref(false)

type ConfigPanelExposed = {
  fetch: () => Promise<void>
}

const federationPanelRef = ref<ConfigPanelExposed | null>(null)
const activityPubPanelRef = ref<ConfigPanelExposed | null>(null)

const exporting = ref(false)
const importing = ref(false)
const showImportConfirm = ref(false)
const pendingImportData = ref<ConfigExportData | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

function updateDirty(source: 'federation' | 'activitypub', dirty: boolean) {
  if (source === 'federation') federationDirty.value = dirty
  else activityPubDirty.value = dirty
  emit('dirty-change', federationDirty.value || activityPubDirty.value)
}

async function handleExport() {
  exporting.value = true
  try {
    const data = await exportFederationConfigs()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const date = new Date().toISOString().slice(0, 10)
    const a = document.createElement('a')
    a.href = url
    a.download = `federation-config-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
    message.success(t('admin.federation.export_success'))
  } catch (e: any) {
    message.error(e?.message || t('admin.federation.export_failed'))
  } finally {
    exporting.value = false
  }
}

function triggerImport() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string) as ConfigExportData
      if (!data.version || !Array.isArray(data.configs) || data.configs.length === 0) {
        message.error(t('admin.federation.invalid_config_file'))
        return
      }
      pendingImportData.value = data
      showImportConfirm.value = true
    } catch {
      message.error(t('admin.federation.json_parse_failed'))
    }
  }
  reader.readAsText(file)
}

async function confirmImport() {
  if (!pendingImportData.value) return
  importing.value = true
  try {
    await importFederationConfigs(pendingImportData.value)
    message.success(t('admin.federation.import_success'))
    showImportConfirm.value = false
    pendingImportData.value = null
    federationPanelRef.value?.fetch()
    activityPubPanelRef.value?.fetch()
  } catch (e: any) {
    message.error(e?.message || t('admin.federation.import_failed'))
  } finally {
    importing.value = false
  }
}

</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-2">
      <NButton
        size="small"
        secondary
        :loading="exporting"
        @click="handleExport"
      >
{{ t('admin.federation.export_config') }}
      </NButton>
      <NButton
        size="small"
        secondary
        @click="triggerImport"
      >
{{ t('admin.federation.import_config') }}
      </NButton>
      <input
        ref="fileInputRef"
        type="file"
        accept=".json"
        class="hidden"
        @change="handleFileChange"
      />
    </div>

    <ConfigPanel
      ref="federationPanelRef"
      :list-fn="listFederationConfigs"
      :update-fn="updateFederationConfigs"
      :title="t('admin.settings.federation')"
      :description="t('admin.settings.federation_desc')"
      :on-dirty-change="(dirty: boolean) => updateDirty('federation', dirty)"
    />

    <ConfigPanel
      ref="activityPubPanelRef"
      :list-fn="listActivityPubConfigs"
      :update-fn="updateActivityPubConfigs"
      :title="t('admin.settings.activitypub')"
      :description="t('admin.settings.activitypub_desc')"
      :on-dirty-change="(dirty: boolean) => updateDirty('activitypub', dirty)"
    />

    <NModal
      v-model:show="showImportConfirm"
      preset="dialog"
      :title="t('admin.settings.import_confirm')"
      :positive-text="t('admin.common.confirm')"
      :negative-text="t('admin.common.cancel')"
      :positive-button-props="{ loading: importing }"
      @positive-click="confirmImport"
    >
      <template v-if="pendingImportData">
        <p>
          <span v-html="t('admin.federation.import_confirm_message', { count: pendingImportData.configs.length })"></span>
        </p>
        <p class="mt-1 text-xs text-neutral-500">{{ t('admin.federation.export_date', { time: pendingImportData.exportedAt }) }}</p>
      </template>
    </NModal>
  </div>
</template>
