import {
  NCard,
  NDataTable,
  NButton,
  NTag,
  NPagination,
  NSpace,
  NPopconfirm,
  NDropdown,
  NImage,
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { defineComponent, ref, Transition } from 'vue'
import { useRouter } from 'vue-router'

import { ScrollContainer } from '@/components'
import { useTable } from '@/composables/table/use-table'
import { useDiscreteApi } from '@/composables/useDiscreteApi'
import {
  listAlbums,
  deleteAlbum,
  batchSetAlbumPublished,
  batchDeleteAlbums,
} from '@/services/albums'

import type { AlbumListItem } from '@/services/albums'
import type { DataTableColumns, DataTableRowKey } from 'naive-ui'

export default defineComponent({
  name: 'AlbumList',
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const { message } = useDiscreteApi()
    const { data, loading, pagination, refresh } = useTable<AlbumListItem>(listAlbums)
    const checkedRowKeys = ref<DataTableRowKey[]>([])

    function handleCreate() {
      router.push({ name: 'albumCreate' })
    }

    function handleEdit(id: number) {
      router.push({ name: 'albumEdit', params: { id } })
    }

    async function handleDelete(id: number) {
      try {
        await deleteAlbum(id)
        message.success(t('admin.service.delete_success'))
        refresh()
      } catch (err) {
        message.error(err instanceof Error ? err.message : t('admin.service.delete_failed'))
      }
    }

    function handleBatchPublishSelect(key: string) {
      const ids = checkedRowKeys.value.map(Number)
      if (ids.length === 0) return
      batchSetAlbumPublished({ ids, isPublished: key === 'publish' })
        .then(() => {
          message.success(
            key === 'publish'
              ? t('admin.service.batch_publish_success')
              : t('admin.service.batch_unpublish_success'),
          )
          checkedRowKeys.value = []
          refresh()
        })
        .catch((err) => {
          message.error(err instanceof Error ? err.message : t('admin.service.operation_failed'))
        })
    }

    async function handleBatchDelete() {
      const ids = checkedRowKeys.value.map(Number)
      if (ids.length === 0) return
      try {
        await batchDeleteAlbums({ ids })
        message.success(t('admin.service.batch_delete_success'))
        checkedRowKeys.value = []
        refresh()
      } catch (err) {
        message.error(err instanceof Error ? err.message : t('admin.service.operation_failed'))
      }
    }

    const batchPublishOptions = [
      { label: t('admin.action.batch_publish'), key: 'publish' },
      { label: t('admin.action.batch_unpublish'), key: 'unpublish' },
    ]

    const columns: DataTableColumns<AlbumListItem> = [
      { type: 'selection' },
      {
        title: t('admin.table.cover'),
        key: 'cover',
        width: 72,
        render(row) {
          return row.cover ? (
            <NImage
              src={row.cover}
              width={48}
              height={48}
              objectFit='cover'
              previewDisabled
              imgProps={{ style: 'border-radius: 6px;' }}
            />
          ) : (
            <div class='flex h-12 w-12 items-center justify-center rounded-md bg-current/5'>
              <div class='iconify text-lg opacity-30 ph--image' />
            </div>
          )
        },
      },
      {
        title: t('admin.table.title'),
        key: 'title',
        minWidth: 180,
        ellipsis: { tooltip: true },
        render(row) {
          return (
            <NButton
              text
              type='primary'
              onClick={() => handleEdit(row.id)}
            >
              {row.title}
            </NButton>
          )
        },
      },
      {
        title: t('admin.table.photo_count'),
        key: 'photoCount',
        width: 80,
        align: 'center',
        render(row) {
          return (
            <NTag
              size='small'
              round
              bordered={false}
            >
              {row.photoCount}
            </NTag>
          )
        },
      },
      {
        title: t('admin.table.publish_status'),
        key: 'isPublished',
        width: 80,
        align: 'center',
        render(row) {
          return (
            <NTag
              type={row.isPublished ? 'success' : 'default'}
              size='small'
              bordered={false}
            >
              {row.isPublished ? t('admin.status.published') : t('admin.status.draft')}
            </NTag>
          )
        },
      },
      {
        title: t('admin.table.views'),
        key: 'views',
        width: 70,
        align: 'center',
      },
      {
        title: t('admin.table.likes'),
        key: 'likes',
        width: 70,
        align: 'center',
      },
      {
        title: t('admin.table.created_at'),
        key: 'createdAt',
        width: 160,
        render(row) {
          return new Date(row.createdAt).toLocaleString()
        },
        sorter: 'default',
      },
      {
        title: t('admin.table.actions'),
        key: 'actions',
        width: 120,
        align: 'center',
        render(row) {
          return (
            <NSpace
              justify='center'
              size={4}
            >
              <NButton
                text
                type='primary'
                size='small'
                onClick={() => handleEdit(row.id)}
              >
                {t('admin.common.edit')}
              </NButton>
              <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
                {{
                  trigger: () => (
                    <NButton
                      text
                      type='error'
                      size='small'
                    >
                      {t('admin.common.delete')}
                    </NButton>
                  ),
                  default: () => t('admin.confirm.delete_album'),
                }}
              </NPopconfirm>
            </NSpace>
          )
        },
      },
    ]

    return () => (
      <ScrollContainer wrapperClass='flex flex-col gap-y-4'>
        {/* 顶部操作栏 */}
        <NCard bordered={false}>
          <div class='flex items-center justify-between'>
            <div class='text-lg font-medium'>{t('admin.card.album_list')}</div>
            <NSpace
              align='center'
              size={12}
            >
              <Transition name='fade'>
                {checkedRowKeys.value.length > 0 && (
                  <NSpace
                    align='center'
                    size={8}
                  >
                    <NTag
                      type='info'
                      size='small'
                    >
                      {t('admin.badge.selected_count', { n: checkedRowKeys.value.length })}
                    </NTag>
                    <NDropdown
                      options={batchPublishOptions}
                      onSelect={handleBatchPublishSelect}
                    >
                      <NButton
                        size='small'
                        secondary
                      >
                        {t('admin.action.batch_publish')}
                      </NButton>
                    </NDropdown>
                    <NPopconfirm onPositiveClick={handleBatchDelete}>
                      {{
                        trigger: () => (
                          <NButton
                            size='small'
                            type='error'
                            secondary
                          >
                            {t('admin.action.batch_delete')}
                          </NButton>
                        ),
                        default: () =>
                          t('admin.confirm.batch_delete_albums', {
                            n: checkedRowKeys.value.length,
                          }),
                      }}
                    </NPopconfirm>
                  </NSpace>
                )}
              </Transition>
              <NButton
                type='primary'
                onClick={handleCreate}
              >
                {{
                  icon: () => <div class='iconify ph--plus' />,
                  default: () => t('admin.action.create_album'),
                }}
              </NButton>
            </NSpace>
          </div>
        </NCard>

        {/* 表格 */}
        <NCard
          bordered={false}
          contentStyle={{ padding: '0' }}
        >
          <NDataTable
            columns={columns}
            data={data.value}
            loading={loading.value}
            rowKey={(row: AlbumListItem) => row.id}
            checkedRowKeys={checkedRowKeys.value}
            onUpdateCheckedRowKeys={(keys: DataTableRowKey[]) => {
              checkedRowKeys.value = keys
            }}
            scrollX={900}
          />
          <div class='flex justify-end p-4'>
            <NPagination {...pagination} />
          </div>
        </NCard>
      </ScrollContainer>
    )
  },
})
