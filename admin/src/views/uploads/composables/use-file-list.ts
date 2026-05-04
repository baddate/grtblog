import { computed, onMounted, ref } from 'vue'

import i18n from '@/plugins/i18n'

import {
  deleteFile,
  downloadFile,
  listUploads,
  renameFile,
  syncUploads,
  uploadFile,
} from '@/services/uploads'
import { listWebsiteInfo } from '@/services/website-info'

import type { FileType, UploadFileResponse } from '@/services/uploads'
import type { UploadCustomRequestOptions } from 'naive-ui'

export type UploadFilterType = 'all' | FileType
export type UploadTaskStatus = 'uploading' | 'success' | 'error'

export interface UploadTaskItem {
  id: string
  name: string
  type: FileType
  percentage: number
  status: UploadTaskStatus
  size: number
  error?: string
}

export function useFileList(message: {
  error: (m: string) => void
  success: (m: string) => void
  warning: (m: string) => void
}) {
  const files = ref<UploadFileResponse[]>([])
  const uploadTasks = ref<UploadTaskItem[]>([])
  const loading = ref(false)
  const uploading = ref(false)
  const uploadPendingCount = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const uploadType = ref<FileType>('picture')
  const activeFilter = ref<UploadFilterType>('all')
  const syncing = ref(false)
  const publicUrl = ref('')

  // Rename
  const renameModalVisible = ref(false)
  const renamingFile = ref<UploadFileResponse | null>(null)
  const newFileName = ref('')

  // Delete
  const deleteModalVisible = ref(false)
  const deletingFile = ref<UploadFileResponse | null>(null)

  // Preview
  const previewVisible = ref(false)
  const previewImageUrl = ref('')

  const filteredFiles = computed(() => {
    if (activeFilter.value === 'all') {
      return files.value
    }
    return files.value.filter((item) => item.type === activeFilter.value)
  })

  const isEmpty = computed(() => filteredFiles.value.length === 0 && !loading.value)
  const activeUploadTasks = computed(() =>
    uploadTasks.value.filter((task) => task.status === 'uploading'),
  )

  function upsertUploadTask(task: UploadTaskItem) {
    const idx = uploadTasks.value.findIndex((item) => item.id === task.id)
    if (idx >= 0) {
      uploadTasks.value[idx] = task
      return
    }
    uploadTasks.value.unshift(task)
  }

  function normalizePublicUrl(value: string) {
    return value.trim().replace(/\/+$/, '')
  }

  async function fetchPublicUrl() {
    try {
      const list = await listWebsiteInfo()
      const item = list?.find((info) => info.key === 'public_url')
      publicUrl.value = item?.value?.trim() ?? ''
    } catch (error) {
      console.error(error)
    }
  }

  async function fetchFiles(showError = true) {
    loading.value = true
    try {
      const response = await listUploads({ page: page.value, pageSize: pageSize.value })
      files.value = response.items
      total.value = response.total
    } catch (error) {
      if (showError) {
        message.error(i18n.global.t('admin.upload.load_failed'))
      }
      console.error(error)
    } finally {
      loading.value = false
    }
  }

  async function handleUpload(options: UploadCustomRequestOptions) {
    const rawFile = options.file.file
    if (!rawFile) return

    const taskId = `${options.file.id}`
    const baseTask: UploadTaskItem = {
      id: taskId,
      name: options.file.name,
      type: uploadType.value,
      percentage: 0,
      status: 'uploading',
      size: rawFile.size,
    }

    upsertUploadTask(baseTask)
    uploadPendingCount.value += 1
    uploading.value = uploadPendingCount.value > 0
    try {
      const response = await uploadFile(rawFile, uploadType.value, (event) => {
        upsertUploadTask({
          ...baseTask,
          percentage: event.percent,
          status: 'uploading',
        })
        options.onProgress?.({ percent: event.percent })
      })
      upsertUploadTask({
        ...baseTask,
        percentage: 100,
        status: 'success',
      })
      options.onFinish?.()
      message.success(
        response.duplicated
          ? i18n.global.t('admin.upload.exist_reuse', { name: response.name })
          : i18n.global.t('admin.upload.upload_success', { name: response.name }),
      )
      await fetchFiles(false)
    } catch (error) {
      upsertUploadTask({
        ...baseTask,
        percentage: 0,
        status: 'error',
        error: error instanceof Error ? error.message : i18n.global.t('admin.upload.failed'),
      })
      options.onError?.()
      message.error(error instanceof Error ? error.message : i18n.global.t('admin.upload.failed'))
      console.error(error)
    } finally {
      uploadPendingCount.value = Math.max(0, uploadPendingCount.value - 1)
      uploading.value = uploadPendingCount.value > 0
    }
  }

  async function handleSync() {
    syncing.value = true
    try {
      const result = await syncUploads()
      message.success(
        i18n.global.t('admin.upload.sync_result', {
          scanned: result.scanned,
          indexed: result.indexed,
          created: result.created,
          updated: result.updated,
          deleted: result.deleted,
          skipped: result.skippedDuplicates,
        }),
      )
      await fetchFiles()
    } catch (error) {
      message.error(i18n.global.t('admin.upload.sync_failed'))
      console.error(error)
    } finally {
      syncing.value = false
    }
  }

  async function handleCopyUrl(file: UploadFileResponse) {
    try {
      const base = publicUrl.value ? normalizePublicUrl(publicUrl.value) : window.location.origin
      await navigator.clipboard.writeText(`${base}${file.publicUrl}`)
      message.success(i18n.global.t('admin.upload.copy_success'))
    } catch (error) {
      message.error(i18n.global.t('admin.upload.copy_failed'))
      console.error(error)
    }
  }

  function openRenameModal(file: UploadFileResponse) {
    renamingFile.value = file
    newFileName.value = file.name
    renameModalVisible.value = true
  }

  async function handleRename() {
    if (!renamingFile.value || !newFileName.value.trim()) {
      message.warning(i18n.global.t('admin.upload.rename_required'))
      return
    }
    try {
      await renameFile(renamingFile.value.id, { name: newFileName.value.trim() })
      message.success(i18n.global.t('admin.upload.rename_success'))
      renameModalVisible.value = false
      await fetchFiles()
    } catch (error) {
      message.error(i18n.global.t('admin.upload.rename_failed'))
      console.error(error)
    }
  }

  function openDeleteModal(file: UploadFileResponse) {
    deletingFile.value = file
    deleteModalVisible.value = true
  }

  async function handleDelete() {
    if (!deletingFile.value) return
    try {
      await deleteFile(deletingFile.value.id)
      message.success(i18n.global.t('admin.common.delete_success'))
      deleteModalVisible.value = false
      if (files.value.length === 1 && page.value > 1) page.value--
      await fetchFiles()
    } catch (error) {
      message.error(i18n.global.t('admin.upload.delete_failed'))
      console.error(error)
    }
  }

  async function handleDownload(file: UploadFileResponse) {
    try {
      await downloadFile(file.id, file.name)
      message.success(i18n.global.t('admin.upload.download_start'))
    } catch (error) {
      message.error(i18n.global.t('admin.upload.download_failed'))
      console.error(error)
    }
  }

  function handlePageChange(newPage: number) {
    page.value = newPage
    fetchFiles()
  }

  function handlePageSizeChange(newPageSize: number) {
    pageSize.value = newPageSize
    page.value = 1
    fetchFiles()
  }

  function openPreview(url: string) {
    previewImageUrl.value = url
    previewVisible.value = true
  }
  onMounted(() => {
    fetchFiles()
    fetchPublicUrl()
  })

  return {
    files,
    uploadTasks,
    activeUploadTasks,
    loading,
    uploading,
    page,
    pageSize,
    total,
    uploadType,
    activeFilter,
    syncing,
    renameModalVisible,
    renamingFile,
    newFileName,
    deleteModalVisible,
    deletingFile,
    previewVisible,
    previewImageUrl,
    filteredFiles,
    isEmpty,
    fetchFiles,
    handleSync,
    handleUpload,
    handleCopyUrl,
    openRenameModal,
    handleRename,
    openDeleteModal,
    handleDelete,
    handleDownload,
    handlePageChange,
    handlePageSizeChange,
    openPreview,
  }
}
