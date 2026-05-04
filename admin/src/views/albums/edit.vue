<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

import {
  NButton,
  NButtonGroup,
  NDivider,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NForm,
  NFormItem,
  NImage,
  NInput,
  NModal,
  NPopconfirm,
  NSpace,
  NSpin,
  NSwitch,
  NTag,
  NTooltip,
} from 'naive-ui'
import { ref, watch } from 'vue'

import { ScrollContainer } from '@/components'
import ImageInput from '@/components/image-picker/ImageInput.vue'
import ImagePickerModal from '@/components/image-picker/ImagePickerModal.vue'
import { uploadFile } from '@/services/uploads'

import { useAlbumForm } from './composables/useAlbumForm'
import {
  extractExif,
  exifDevice,
  exifShootingInfo,
  exifLocation,
} from './composables/usePhotoUtils'

import type { PhotoItem } from '@/services/albums'

const {
  isEdit,
  loading,
  saving,
  form,
  photos,
  save,
  uploadPhotos,
  updatePhoto,
  deletePhoto,
  handleReorder,
  markDirty,
} = useAlbumForm()

const uploading = ref(false)
const showMeta = ref(false)
const showPhotoPicker = ref(false)
const editingPhoto = ref<PhotoItem | null>(null)
const showPhotoModal = ref(false)
const photoForm = ref({
  description: '',
  caption: '',
})
watch(
  () => [
    form.title,
    form.description,
    form.cover,
    form.shortUrl,
    form.isPublished,
    form.allowComment,
  ],
  () => markDirty(),
  { deep: true },
)

async function handlePhotoUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  uploading.value = true
  try {
    const items: { url: string; exif?: Record<string, unknown> | null }[] = []
    for (const file of Array.from(input.files)) {
      const [res, exif] = await Promise.all([uploadFile(file, 'picture'), extractExif(file)])
      // Merge backend imageMeta (width/height/dominantColor) into exif
      const merged = { ...(exif || {}) }
      if (res.imageMeta) {
        if (res.imageMeta.width) merged.imageWidth = res.imageMeta.width
        if (res.imageMeta.height) merged.imageHeight = res.imageMeta.height
        if (res.imageMeta.dominantColor) merged.dominantColor = res.imageMeta.dominantColor
      }
      items.push({ url: res.publicUrl, exif: Object.keys(merged).length ? merged : null })
    }
    await uploadPhotos(items)
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function handlePickFromGallery(url: string) {
  await uploadPhotos([{ url }])
}

function openPhotoEdit(photo: PhotoItem) {
  editingPhoto.value = photo
  photoForm.value = {
    description: photo.description ?? '',
    caption: photo.caption ?? '',
  }
  showPhotoModal.value = true
}

async function savePhotoEdit() {
  if (!editingPhoto.value) return
  await updatePhoto(editingPhoto.value.id, {
    description: photoForm.value.description || null,
    caption: photoForm.value.caption || null,
  } as any)
  showPhotoModal.value = false
}

function movePhoto(index: number, direction: -1 | 1) {
  const ids = photos.value.map((p) => p.id)
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= ids.length) return
  const a = ids[index]!
  const b = ids[targetIndex]!
  ids[index] = b
  ids[targetIndex] = a
  handleReorder(ids)
}

function thumbUrl(photo: PhotoItem): string {
  return photo.thumbnailUrl || photo.url
}
</script>

<template>
  <div class="relative flex h-full min-h-0 flex-col">
    <div
      v-if="loading"
      class="bg-naive-body/35 absolute inset-0 z-30 grid place-items-center backdrop-blur-[1px]"
    >
      <NSpin size="large" />
    </div>
    <header
      class="z-10 flex shrink-0 flex-col gap-3 px-6 py-6 backdrop-blur sm:h-20 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-0"
    >
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <NInput
          v-model:value="form.title"
          :bordered="false"
          :placeholder="$t('admin.placeholder.album_title')"
          class="flex-1 text-xl font-bold sm:text-2xl"
          :style="{ '--n-caret-color': 'var(--primary-color)', backgroundColor: 'transparent' }"
        />
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
        <div class="flex items-center gap-1 text-[11px] opacity-50">
          <div class="iconify ph--link-simple" />
          <span>/albums/</span>
          <input
            v-model="form.shortUrl"
            class="w-20 border-b border-current/20 bg-transparent transition-colors outline-none focus:border-current/50 sm:w-28"
            placeholder="auto"
          />
        </div>

        <NButtonGroup size="small">
          <NButton
            :type="form.isPublished ? 'default' : 'primary'"
            :ghost="form.isPublished"
            @click="form.isPublished = false"
          >
            {{ $t('admin.status.draft') }}
          </NButton>
          <NButton
            :type="form.isPublished ? 'primary' : 'default'"
            :ghost="!form.isPublished"
            @click="form.isPublished = true"
          >
            {{ $t('admin.status.published') }}
          </NButton>
        </NButtonGroup>

        <NTooltip>
          <template #trigger>
            <NButton
              quaternary
              circle
              size="small"
              @click="showMeta = !showMeta"
            >
              <template #icon><div class="iconify ph--sliders-horizontal" /></template>
            </NButton>
          </template>
          {{ $t('admin.album.metadata') }}
        </NTooltip>

        <NButton
          type="primary"
          :loading="saving"
          @click="save"
        >
          <template #icon><div class="iconify ph--floppy-disk" /></template>
          {{ isEdit ? $t('admin.common.save') : $t('admin.common.create') }}
        </NButton>
      </div>
    </header>

    <main class="flex min-h-0 flex-1 overflow-hidden">
      <div class="flex min-h-0 flex-1 flex-col px-6 sm:px-10">
        <div class="mb-6 shrink-0">
          <NInput
            v-model:value="form.description"
            type="textarea"
            :bordered="false"
            :placeholder="$t('admin.placeholder.album_description')"
            :autosize="{ minRows: 2, maxRows: 5 }"
            :style="{ backgroundColor: 'transparent' }"
          />
        </div>

        <div class="mb-4 flex shrink-0 items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="iconify text-lg opacity-50 ph--images" />
            <span class="text-sm font-medium">{{ $t('admin.album.photos') }}</span>
            <NTag
              v-if="photos.length > 0"
              size="small"
              round
              :bordered="false"
            >
              {{ photos.length }}
            </NTag>
          </div>
          <NSpace
            v-if="isEdit"
            size="small"
          >
            <NButton
              size="small"
              quaternary
              @click="showPhotoPicker = true"
            >
              <template #icon><div class="iconify ph--folder-open" /></template>
              {{ $t('admin.album.gallery') }}
            </NButton>
            <NButton
              size="small"
              :loading="uploading"
              tag="label"
              style="cursor: pointer"
            >
              <template #icon><div class="iconify ph--upload-simple" /></template>
              {{ $t('admin.common.upload') }}
              <input
                type="file"
                accept="image/*"
                multiple
                style="display: none"
                @change="handlePhotoUpload"
              />
            </NButton>
          </NSpace>
        </div>

        <NEmpty
          v-if="!isEdit"
          :description="$t('admin.album.create_first_hint')"
          class="py-16"
        />
        <NEmpty
          v-else-if="photos.length === 0"
          :description="$t('admin.album.add_photos_hint')"
          class="py-16"
        >
          <template #icon>
            <div class="iconify text-4xl opacity-20 ph--camera" />
          </template>
        </NEmpty>

        <div
          v-else
          class="min-h-0 flex-1 overflow-hidden"
        >
          <ScrollContainer
            class="h-full"
            wrapper-class="!p-0 !pr-1"
          >
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <div
                v-for="(photo, index) in photos"
                :key="photo.id"
                class="group overflow-hidden rounded-lg border border-current/5 transition-all hover:border-current/15 hover:shadow-sm"
              >
                <div class="relative aspect-square overflow-hidden bg-current/3">
                  <NImage
                    :src="thumbUrl(photo)"
                    :preview-src="photo.url"
                    object-fit="cover"
                    :img-props="{ class: 'h-full w-full object-cover' }"
                    class="h-full w-full"
                  />
                  <div
                    class="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-[10px] font-medium text-white"
                  >
                    {{ index + 1 }}
                  </div>
                </div>

                <div class="px-2.5 py-2">
                  <div
                    class="min-h-[1.25rem] cursor-pointer truncate text-xs opacity-60"
                    @click="openPhotoEdit(photo)"
                  >
                    <template v-if="photo.caption">{{ photo.caption }}</template>
                    <template v-else-if="exifDevice(photo.exif)">{{
                      exifDevice(photo.exif)
                    }}</template>
                    <template v-else><span class="italic opacity-40">{{ $t('admin.album.click_to_edit') }}</span></template>
                  </div>

                  <div class="mt-1.5 flex items-center justify-between">
                    <NSpace :size="2">
                      <NTooltip>
                        <template #trigger>
                          <NButton
                            quaternary
                            circle
                            size="tiny"
                            :disabled="index === 0"
                            @click="movePhoto(index, -1)"
                          >
                            <template #icon><div class="iconify ph--caret-left" /></template>
                          </NButton>
                        </template>
                        {{ $t('admin.action.move_forward') }}
                      </NTooltip>
                      <NTooltip>
                        <template #trigger>
                          <NButton
                            quaternary
                            circle
                            size="tiny"
                            :disabled="index === photos.length - 1"
                            @click="movePhoto(index, 1)"
                          >
                            <template #icon><div class="iconify ph--caret-right" /></template>
                          </NButton>
                        </template>
                        {{ $t('admin.action.move_backward') }}
                      </NTooltip>
                      <NTooltip>
                        <template #trigger>
                          <NButton
                            quaternary
                            circle
                            size="tiny"
                            @click="openPhotoEdit(photo)"
                          >
                            <template #icon><div class="iconify ph--pencil-simple" /></template>
                          </NButton>
                        </template>
                        {{ $t('admin.common.edit') }}
                      </NTooltip>
                    </NSpace>
                    <NPopconfirm @positive-click="deletePhoto(photo.id)">
                      <template #trigger>
                        <NButton
                          quaternary
                          circle
                          size="tiny"
                          type="error"
                        >
                          <template #icon><div class="iconify ph--trash" /></template>
                        </NButton>
                      </template>
                      {{ $t('admin.album.confirm_delete_photo') }}
                    </NPopconfirm>
                  </div>
                </div>
              </div>
            </div>
          </ScrollContainer>
        </div>
      </div>
    </main>

    <NDrawer
      v-model:show="showMeta"
      placement="right"
      :width="380"
    >
      <NDrawerContent
        :title="$t('admin.album.settings')"
        :native-scrollbar="false"
        closable
      >
        <div class="flex flex-col gap-6">
          <div class="space-y-4">
            <div class="flex items-center gap-2 text-sm font-medium">
              <div class="iconify ph--image" />
              <span>{{ $t('admin.album.cover') }}</span>
            </div>
            <ImageInput v-model:value="form.cover" />
          </div>

          <NDivider style="margin: 0" />

          <div class="space-y-4">
            <div class="flex items-center gap-2 text-sm font-medium">
              <div class="iconify ph--gear-six" />
              <span>{{ $t('admin.album.properties') }}</span>
            </div>
            <NForm
              label-placement="left"
              label-width="auto"
              :show-feedback="false"
              class="space-y-3"
            >
              <NFormItem :label="$t('admin.form.allow_comment')">
                <NSwitch v-model:value="form.allowComment" />
              </NFormItem>
            </NForm>
          </div>
        </div>
      </NDrawerContent>
    </NDrawer>

    <NModal
      v-model:show="showPhotoModal"
      preset="card"
      :title="$t('admin.album.edit_photo')"
      style="width: 520px; max-width: 90vw"
    >
      <div class="flex flex-col gap-4">
        <div
          v-if="editingPhoto?.exif"
          class="rounded-lg bg-current/3 p-3 text-xs"
        >
          <div class="mb-2 flex items-center gap-1.5 text-sm font-medium opacity-70">
            <div class="iconify ph--info" />
            {{ $t('admin.album.exif_info') }}
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 opacity-60">
            <div v-if="exifDevice(editingPhoto.exif)">
              <span class="mr-1 iconify inline-block align-[-2px] ph--camera" />{{
                exifDevice(editingPhoto.exif)
              }}
            </div>
            <div v-if="editingPhoto.exif.lensModel">
              <span class="mr-1 iconify inline-block align-[-2px] ph--aperture" />{{
                editingPhoto.exif.lensModel
              }}
            </div>
            <div
              v-if="exifShootingInfo(editingPhoto.exif)"
              class="col-span-2"
            >
              {{ exifShootingInfo(editingPhoto.exif) }}
            </div>
            <div v-if="exifLocation(editingPhoto.exif)">
              <span class="mr-1 iconify inline-block align-[-2px] ph--map-pin" />{{
                exifLocation(editingPhoto.exif)
              }}
            </div>
            <div v-if="editingPhoto.exif.dateTimeOriginal">
              <span class="mr-1 iconify inline-block align-[-2px] ph--clock" />{{
                editingPhoto.exif.dateTimeOriginal
              }}
            </div>
            <div v-if="editingPhoto.exif.imageWidth && editingPhoto.exif.imageHeight">
              {{ editingPhoto.exif.imageWidth }} × {{ editingPhoto.exif.imageHeight }}
            </div>
          </div>
        </div>

        <NForm
          label-placement="top"
          :show-feedback="false"
          class="space-y-3"
        >
          <NFormItem :label="$t('admin.album.caption')">
            <NInput
              v-model:value="photoForm.caption"
              :placeholder="$t('admin.placeholder.photo_caption')"
            />
          </NFormItem>
          <NFormItem :label="$t('admin.album.detailed_description')">
            <NInput
              v-model:value="photoForm.description"
              type="textarea"
              :rows="3"
              :placeholder="$t('admin.placeholder.more_description')"
            />
          </NFormItem>
        </NForm>
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showPhotoModal = false">{{ $t('admin.common.cancel') }}</NButton>
          <NButton
            type="primary"
            @click="savePhotoEdit"
          >
            <template #icon><div class="iconify ph--check" /></template>
            {{ $t('admin.common.save') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <ImagePickerModal
      v-model:show="showPhotoPicker"
      @select="handlePickFromGallery"
    />
  </div>
</template>
