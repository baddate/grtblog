import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'

import i18n from '@/plugins/i18n'
const { t } = i18n.global
import { useDiscreteApi } from '@/composables/useDiscreteApi'
import {
  getAlbum,
  createAlbum,
  updateAlbum,
  addPhotos,
  updatePhoto as updatePhotoApi,
  deletePhoto as deletePhotoApi,
  reorderPhotos,
} from '@/services/albums'

import type { PhotoItem, CreatePhotoPayload, PhotoExif } from '@/services/albums'

export function useAlbumForm() {
  const route = useRoute()
  const router = useRouter()
  const { message, dialog } = useDiscreteApi()

  const isEdit = computed(() => !!route.params.id)
  const albumId = computed(() => (isEdit.value ? Number(route.params.id) : 0))

  const loading = ref(false)
  const saving = ref(false)
  const isDirty = ref(false)

  const form = reactive({
    title: '',
    description: '' as string | null,
    cover: '' as string | null,
    shortUrl: '' as string | null,
    isPublished: false,
    allowComment: true,
  })

  const photos = ref<PhotoItem[]>([])

  async function fetch() {
    if (!isEdit.value) return
    loading.value = true
    try {
      const detail = await getAlbum(albumId.value)
      form.title = detail.title
      form.description = detail.description ?? ''
      form.cover = detail.cover ?? ''
      form.shortUrl = detail.shortUrl
      form.isPublished = detail.isPublished
      form.allowComment = detail.allowComment
      photos.value = detail.photos ?? []
      isDirty.value = false
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('admin.album.load_failed'))
    } finally {
      loading.value = false
    }
  }

  async function save() {
    if (!form.title.trim()) {
      message.warning(t('admin.album.title_required'))
      return
    }

    saving.value = true
    try {
      if (isEdit.value) {
        await updateAlbum(albumId.value, {
          title: form.title,
          description: form.description || null,
          cover: form.cover || null,
          shortUrl: form.shortUrl || '',
          isPublished: form.isPublished,
          allowComment: form.allowComment,
        })
        message.success(t('admin.album.update_success'))
      } else {
        const created = await createAlbum({
          title: form.title,
          description: form.description || null,
          cover: form.cover || null,
          shortUrl: form.shortUrl || null,
          isPublished: form.isPublished,
          allowComment: form.allowComment,
        })
        message.success(t('admin.album.create_success'))
        isDirty.value = false
        router.replace({ name: 'albumEdit', params: { id: created.id } })
        return
      }
      isDirty.value = false
      await fetch()
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('admin.album.save_failed'))
    } finally {
      saving.value = false
    }
  }

  async function uploadPhotos(items: { url: string; exif?: PhotoExif | null }[]) {
    if (!isEdit.value || items.length === 0) return
    const payloads: CreatePhotoPayload[] = items.map((item, i) => ({
      url: item.url,
      exif: item.exif ?? null,
      sortOrder: photos.value.length + i,
    }))
    try {
      await addPhotos(albumId.value, { photos: payloads })
      message.success(t('admin.album.photos_added', { n: items.length }))
      await fetch()
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('admin.album.add_photos_failed'))
    }
  }

  async function updatePhoto(photoId: number, data: Partial<PhotoItem>) {
    if (!isEdit.value) return
    const existing = photos.value.find((p) => p.id === photoId)
    if (!existing) return
    try {
      await updatePhotoApi(albumId.value, photoId, {
        url: data.url ?? existing.url,
        description: data.description ?? existing.description ?? null,
        caption: data.caption ?? existing.caption ?? null,
        exif: data.exif ?? existing.exif ?? null,
        sortOrder: data.sortOrder ?? existing.sortOrder,
      })
      message.success(t('admin.album.photo_updated'))
      await fetch()
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('admin.album.update_photo_failed'))
    }
  }

  async function deletePhoto(photoId: number) {
    if (!isEdit.value) return
    try {
      await deletePhotoApi(albumId.value, photoId)
      message.success(t('admin.album.photo_deleted'))
      await fetch()
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('admin.album.delete_photo_failed'))
    }
  }

  async function handleReorder(photoIds: number[]) {
    if (!isEdit.value) return
    try {
      await reorderPhotos(albumId.value, { photoIds })
      await fetch()
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('admin.album.reorder_failed'))
    }
  }

  function markDirty() {
    isDirty.value = true
  }

  onMounted(() => {
    fetch()
  })

  onBeforeRouteLeave((_to, _from, next) => {
    if (isDirty.value) {
      dialog.warning({
        title: t('admin.album.unsaved_title'),
        content: t('admin.album.unsaved_content'),
        positiveText: t('admin.album.leave'),
        negativeText: t('admin.album.stay'),
        onPositiveClick: () => next(),
        onNegativeClick: () => next(false),
      })
    } else {
      next()
    }
  })

  return {
    isEdit,
    albumId,
    loading,
    saving,
    isDirty,
    form,
    photos,
    save,
    fetch,
    uploadPhotos,
    updatePhoto,
    deletePhoto,
    handleReorder,
    markDirty,
  }
}
