<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import {
  NButton,
  NCard,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NFormItem,
  NInput,
  NPopconfirm,
  NSpace,
  NSpin,
  NTag,
  useMessage,
} from 'naive-ui'
import { h, onMounted, reactive, ref } from 'vue'

import { FormModal, ScrollContainer } from '@/components'
import { createTag, deleteTag, getTagContents, listTags, updateTag } from '@/services/taxonomy'
import { formatDate } from '@/utils/format'

import type { TagItem, TagRelatedContents } from '@/services/taxonomy'
import type { DataTableColumns } from 'naive-ui'

defineOptions({
  name: 'TagManagement',
})

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const items = ref<TagItem[]>([])
const editVisible = ref(false)
const editingId = ref<number | null>(null)
const formModel = reactive({
  name: '',
})

// 关联内容 Drawer
const contentsDrawer = ref(false)
const contentsTag = ref<TagItem | null>(null)
const contentsLoading = ref(false)
const contentsData = ref<TagRelatedContents | null>(null)

async function openContents(row: TagItem) {
  contentsTag.value = row
  contentsDrawer.value = true
  contentsLoading.value = true
  contentsData.value = null
  try {
    contentsData.value = await getTagContents(row.id)
  } catch (e: any) {
    message.error(e?.message || t('admin.service.tag_contents_failed'))
  } finally {
    contentsLoading.value = false
  }
}

const columns: DataTableColumns<TagItem> = [
  { title: t('admin.table.id'), key: 'id', width: 80 },
  { title: t('admin.tag.name'), key: 'name', minWidth: 220 },
  {
    title: t('admin.common.updated_at'),
    key: 'updatedAt',
    width: 180,
    render: (row) => formatDate(row.updatedAt),
  },
  {
    title: t('admin.common.actions'),
    key: 'actions',
    width: 260,
    render: (row) =>
      h(NSpace, { size: 'small' }, () => [
        h(
          NButton,
          { size: 'small', tertiary: true, onClick: () => openContents(row) },
          {
            icon: () => h('div', { class: 'iconify ph--article' }),
            default: () => t('admin.tag.related_content'),
          },
        ),
        h(
          NButton,
          { size: 'small', tertiary: true, onClick: () => openEdit(row) },
          { default: () => t('admin.common.edit') },
        ),
        h(
          NPopconfirm,
          { onPositiveClick: () => handleDelete(row) },
          {
            trigger: () =>
              h(
                NButton,
                { size: 'small', type: 'error', secondary: true },
                { default: () => t('admin.common.delete') },
              ),
            default: () => t('admin.common.delete_confirm'),
          },
        ),
      ]),
  },
]

const modalTitle = ref(t('admin.action.create_tag'))

async function fetchData() {
  loading.value = true
  try {
    items.value = await listTags()
  } catch (error: any) {
    message.error(error?.message || t('admin.service.tag_list_failed'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  modalTitle.value = t('admin.action.create_tag')
  editingId.value = null
  formModel.name = ''
  editVisible.value = true
}

function openEdit(row: TagItem) {
  modalTitle.value = t('admin.action.edit_tag')
  editingId.value = row.id
  formModel.name = row.name
  editVisible.value = true
}

async function handleSubmit() {
  const name = formModel.name.trim()
  if (!name) {
    message.warning(t('admin.validation.tag_name_required'))
    return
  }

  saving.value = true
  try {
    if (editingId.value) {
      await updateTag(editingId.value, { name })
      message.success(t('admin.service.tag_updated'))
    } else {
      await createTag(name)
      message.success(t('admin.service.tag_created'))
    }
    editVisible.value = false
    await fetchData()
  } catch (error: any) {
    message.error(error?.message || t('admin.service.save_failed'))
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: TagItem) {
  try {
    await deleteTag(row.id)
    message.success(t('admin.common.delete_success'))
    await fetchData()
  } catch (error: any) {
    message.error(error?.message || t('admin.service.delete_failed'))
  }
}

onMounted(() => {
  fetchData()
})

</script>

<template>
  <ScrollContainer
    wrapper-class="p-4"
    :scrollbar-props="{ trigger: 'none' }"
  >
    <NCard :title="$t('admin.card.tag_list')">
      <template #header-extra>
        <NButton
          type="primary"
          @click="openCreate"
          >{{ $t('admin.action.create_tag') }}</NButton
        >
      </template>

      <NDataTable
        :columns="columns"
        :data="items"
        :loading="loading"
        :row-key="(row: TagItem) => row.id"
      />
    </NCard>

    <FormModal
      v-model:show="editVisible"
      :title="modalTitle"
      :loading="saving"
      @confirm="handleSubmit"
    >
      <NFormItem :label="$t('admin.tag.name')">
        <NInput
          v-model:value="formModel.name"
          :placeholder="$t('admin.placeholder.name')"
        />
      </NFormItem>
    </FormModal>

    <NDrawer
      v-model:show="contentsDrawer"
      placement="right"
      width="380"
    >
      <NDrawerContent
        :title="$t('admin.tag.related_content_with_name', { name: contentsTag?.name ?? '' })""
        :native-scrollbar="false"
        closable
        header-style="padding: 20px 24px;"
        body-style="padding: 0 24px 24px;"
      >
        <NSpin :show="contentsLoading">
          <template v-if="contentsData">
            <div class="space-y-5">
              <!-- 文章 -->
              <div>
                <div class="mb-2 flex items-center gap-2 text-sm font-medium">
                  <div class="iconify ph--article" />
                  <span>{{ $t('admin.tag.section_article') }}</span>
                  <NTag
                    size="small"
                    :bordered="false"
                    round
                    >{{ contentsData.articles?.length ?? 0 }}</NTag
                  >
                </div>
                <div
                  v-if="contentsData.articles?.length"
                  class="space-y-1"
                >
                  <router-link
                    v-for="article in contentsData.articles"
                    :key="article.id"
                    :to="{ name: 'articleEdit', params: { id: article.id } }"
                    class="flex items-start gap-2 rounded-lg px-3 py-2.5 no-underline transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    @click="contentsDrawer = false"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="truncate text-sm font-medium">{{ article.title }}</div>
                      <div class="mt-0.5 truncate text-xs opacity-50">
                        {{ formatDate(article.createdAt) }}
                      </div>
                    </div>
                  </router-link>
                </div>
                <NEmpty
                  v-else
                  :description="$t('admin.tag.no_articles')"
                  size="small"
                  class="py-3"
                />
              </div>

              <!-- 手记 -->
              <div>
                <div class="mb-2 flex items-center gap-2 text-sm font-medium">
                  <div class="iconify ph--notebook" />
                  <span>{{ $t('admin.tag.section_moment') }}</span>
                  <NTag
                    size="small"
                    :bordered="false"
                    round
                    >{{ contentsData.moments?.length ?? 0 }}</NTag
                  >
                </div>
                <div
                  v-if="contentsData.moments?.length"
                  class="space-y-1"
                >
                  <router-link
                    v-for="moment in contentsData.moments"
                    :key="moment.id"
                    :to="{ name: 'noteEdit', params: { id: moment.id } }"
                    class="flex items-start gap-2 rounded-lg px-3 py-2.5 no-underline transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    @click="contentsDrawer = false"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="truncate text-sm font-medium">{{ moment.title }}</div>
                      <div class="mt-0.5 truncate text-xs opacity-50">
                        {{ formatDate(moment.createdAt) }}
                      </div>
                    </div>
                  </router-link>
                </div>
                <NEmpty
                  v-else
                  :description="$t('admin.tag.no_moments')"
                  size="small"
                  class="py-3"
                />
              </div>
            </div>
          </template>
          <div
            v-else-if="!contentsLoading"
            class="py-8"
          >
            <NEmpty :description="$t('admin.service.load_failed')" />
          </div>
        </NSpin>
      </NDrawerContent>
    </NDrawer>
  </ScrollContainer>
</template>
