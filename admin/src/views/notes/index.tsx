import {
  NCard,
  NDataTable,
  NButton,
  NTag,
  NPagination,
  NSpace,
  NPopconfirm,
  NTooltip,
  NDropdown,
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { defineComponent, onMounted, ref, Transition } from 'vue'
import { useRouter } from 'vue-router'

import { ScrollContainer } from '@/components'
import { useTable } from '@/composables/table/use-table'
import { useDiscreteApi } from '@/composables/useDiscreteApi'
import {
  listMoments,
  deleteMoment,
  batchSetMomentPublished,
  batchSetMomentTop,
  batchDeleteMoments,
} from '@/services/moments'
import { listWebsiteInfo } from '@/services/website-info'

import type { MomentListItem } from '@/services/moments'
import type { DataTableColumns, DataTableRowKey } from 'naive-ui'

export default defineComponent({
  name: 'NoteList',
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const { message } = useDiscreteApi()
    const { data, loading, pagination, refresh } = useTable<MomentListItem>(listMoments)
    const checkedRowKeys = ref<DataTableRowKey[]>([])
    const publicUrl = ref('')

    function normalizePublicUrl(value: string) {
      return value.trim().replace(/\/+$/, '')
    }

    function buildMomentPath(shortUrl: string, createdAt: string) {
      const matched = createdAt.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (!matched) return `/moments/${encodeURIComponent(shortUrl)}`
      const [, year, month, day] = matched
      return `/moments/${year}/${month}/${day}/${encodeURIComponent(shortUrl)}`
    }

    async function fetchWebsiteInfo() {
      try {
        const list = await listWebsiteInfo()
        const item = list?.find((info) => info.key === 'public_url')
        publicUrl.value = item?.value?.trim() ?? ''
      } catch (err) {
        message.error(err instanceof Error ? err.message : t('admin.service.load_site_url_failed'))
      }
    }

    onMounted(() => {
      fetchWebsiteInfo()
    })

    const handleEdit = (id: number) => {
      router.push({ name: 'noteEdit', params: { id } })
    }

    const handleCreate = () => {
      router.push({ name: 'noteCreate' })
    }

    const handleDelete = async (id: number) => {
      try {
        await deleteMoment(id)
        message.success(t('admin.service.delete_success'))
        refresh()
      } catch (err) {
        message.error(err instanceof Error ? err.message : t('admin.service.delete_failed'))
      }
    }

    const handleCheck = (rowKeys: DataTableRowKey[]) => {
      checkedRowKeys.value = rowKeys
    }

    const handleTogglePublished = async (row: MomentListItem) => {
      try {
        await batchSetMomentPublished({ ids: [row.id], isPublished: !row.isPublished })
        row.isPublished = !row.isPublished
        message.success(
          row.isPublished ? t('admin.service.published') : t('admin.service.set_draft'),
        )
      } catch (err) {
        message.error(err instanceof Error ? err.message : t('admin.service.operation_failed'))
      }
    }

    const handleToggleTop = async (row: MomentListItem) => {
      try {
        await batchSetMomentTop({ ids: [row.id], isTop: !row.isTop })
        row.isTop = !row.isTop
        message.success(row.isTop ? t('admin.service.pinned') : t('admin.service.unpinned'))
      } catch (err) {
        message.error(err instanceof Error ? err.message : t('admin.service.operation_failed'))
      }
    }

    const handleBatchPublish = async (isPublished: boolean) => {
      const ids = checkedRowKeys.value as number[]
      if (ids.length === 0) return
      try {
        await batchSetMomentPublished({ ids, isPublished })
        data.value.forEach((item) => {
          if (ids.includes(item.id)) item.isPublished = isPublished
        })
        checkedRowKeys.value = []
        message.success(
          isPublished
            ? t('admin.service.batch_publish_success')
            : t('admin.service.batch_unpublish_success'),
        )
      } catch (err) {
        message.error(err instanceof Error ? err.message : t('admin.service.operation_failed'))
      }
    }

    const handleBatchDelete = async () => {
      const ids = checkedRowKeys.value as number[]
      if (ids.length === 0) return
      try {
        await batchDeleteMoments({ ids })
        checkedRowKeys.value = []
        message.success(t('admin.service.batch_delete_success'))
        refresh()
      } catch (err) {
        message.error(err instanceof Error ? err.message : t('admin.service.operation_failed'))
      }
    }

    const batchPublishOptions = [
      { label: t('admin.action.mark_published'), key: 'publish' },
      { label: t('admin.action.mark_draft'), key: 'unpublish' },
    ]

    const handleBatchPublishSelect = (key: string) => {
      handleBatchPublish(key === 'publish')
    }

    const columns: DataTableColumns<MomentListItem> = [
      {
        type: 'selection',
      },
      {
        title: t('admin.table.title'),
        key: 'title',
        minWidth: 280,
        render: (row) => (
          <div class='font-medium text-gray-700 dark:text-gray-200'>
            <span>{row.title}</span>
            {row.isHot && (
              <NTooltip trigger='hover'>
                {{
                  trigger: () => (
                    <span class='ml-2 iconify size-4 cursor-help align-middle text-red-500 ph--fire-fill' />
                  ),
                  default: () => (
                    <div class='flex flex-col gap-y-0.5'>
                      <span class='font-bold'>{t('admin.badge.hot')}</span>
                      <span class='text-xs opacity-80'>{t('admin.badge.hot_tip')}</span>
                    </div>
                  ),
                }}
              </NTooltip>
            )}
            <div
              class='inline-block cursor-pointer'
              onClick={() => {
                window.open(
                  `${normalizePublicUrl(publicUrl.value)}${buildMomentPath(row.shortUrl, row.createdAt)}`,
                  '_blank',
                )
              }}
            >
              <span class='ml-2 iconify size-4 cursor-pointer align-middle text-black/50 ph--link-simple dark:text-gray-400' />
            </div>
          </div>
        ),
        sorter: 'default',
      },
      {
        title: t('admin.table.column'),
        key: 'columnName',
        width: 140,
        render: (row) => row.columnName || <span class='text-gray-400'>-</span>,
      },
      {
        title: t('admin.table.topic'),
        key: 'topics',
        minWidth: 160,
        render: (row) => {
          if (!row.topics || row.topics.length === 0) return '-'
          return (
            <NSpace size={4}>
              {row.topics.map((topic) => (
                <NTag
                  size='small'
                  type='info'
                  bordered={false}
                >
                  {topic}
                </NTag>
              ))}
            </NSpace>
          )
        },
      },
      {
        title: t('admin.table.is_published'),
        key: 'isPublished',
        width: 100,
        render: (row) => (
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => handleTogglePublished(row)}
          >
            <NTag
              size='small'
              type={row.isPublished ? 'success' : 'default'}
              bordered={false}
            >
              {{
                default: () =>
                  row.isPublished ? t('admin.status.published') : t('admin.status.draft'),
                icon: () => (
                  <span
                    class={`iconify ${row.isPublished ? 'ph--check-circle' : 'ph--circle-dashed'} size-3.5`}
                  />
                ),
              }}
            </NTag>
          </span>
        ),
        sorter: (row1, row2) => Number(row1.isPublished) - Number(row2.isPublished),
      },
      {
        title: t('admin.table.attributes'),
        key: 'attributes',
        width: 160,
        render: (row) => (
          <NSpace size={4}>
            <span
              style={{ cursor: 'pointer' }}
              onClick={() => handleToggleTop(row)}
            >
              <NTag
                size='small'
                type={row.isTop ? 'warning' : 'default'}
                bordered={false}
              >
                {{
                  default: () =>
                    row.isTop ? t('admin.status.pinned') : t('admin.status.unpinned'),
                  icon: () => (
                    <span
                      class={`iconify ${row.isTop ? 'ph--push-pin-fill' : 'ph--push-pin'} size-3.5`}
                    />
                  ),
                }}
              </NTag>
            </span>
            {row.isOriginal ? (
              <NTag
                size='small'
                type='success'
                bordered={false}
              >
                {t('admin.status.original')}
              </NTag>
            ) : (
              <NTag
                size='small'
                type='default'
                bordered={false}
              >
                {t('admin.status.reprint')}
              </NTag>
            )}
          </NSpace>
        ),
      },
      {
        title: t('admin.table.views'),
        key: 'views',
        width: 80,
        render: (row) => <span class='font-mono text-xs text-gray-500'>{row.views}</span>,
        sorter: 'default',
      },
      {
        title: t('admin.table.likes'),
        key: 'likes',
        width: 80,
        render: (row) => <span class='font-mono text-xs text-gray-500'>{row.likes}</span>,
        sorter: 'default',
      },
      {
        title: t('admin.table.created_at'),
        key: 'createdAt',
        width: 180,
        render: (row) => new Date(row.createdAt).toLocaleString(),
        sorter: (row1, row2) =>
          new Date(row1.createdAt).getTime() - new Date(row2.createdAt).getTime(),
      },
      {
        title: t('admin.table.updated_at'),
        key: 'updatedAt',
        width: 180,
        render: (row) => new Date(row.updatedAt).toLocaleString(),
        sorter: (row1, row2) =>
          new Date(row1.updatedAt).getTime() - new Date(row2.updatedAt).getTime(),
      },
      {
        title: t('admin.table.actions'),
        key: 'actions',
        width: 160,
        fixed: 'right',
        render: (row) => (
          <NSpace>
            <NButton
              size='small'
              type='primary'
              secondary
              onClick={() => handleEdit(row.id)}
            >
              {t('admin.common.edit')}
            </NButton>
            <NPopconfirm
              onPositiveClick={() => handleDelete(row.id)}
              v-slots={{
                trigger: () => (
                  <NButton
                    size='small'
                    type='error'
                    secondary
                  >
                    {t('admin.common.delete')}
                  </NButton>
                ),
              }}
            >
              {t('admin.confirm.delete_confirm')}
            </NPopconfirm>
          </NSpace>
        ),
      },
    ]

    onMounted(() => {
      refresh()
    })

    return () => (
      <ScrollContainer wrapperClass='flex flex-col gap-y-4'>
        <NCard bordered={false}>
          <div class='flex items-center justify-between'>
            <div class='text-lg font-medium'>{t('admin.card.moment_list')}</div>
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
                          t('admin.confirm.batch_delete_moments', {
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
                {t('admin.action.create_moment')}
              </NButton>
            </NSpace>
          </div>
        </NCard>

        <NCard
          bordered={false}
          contentStyle={{ padding: '0' }}
        >
          <NDataTable
            columns={columns}
            data={data.value}
            loading={loading.value}
            rowKey={(row) => row.id}
            checkedRowKeys={checkedRowKeys.value}
            onUpdateCheckedRowKeys={handleCheck}
            bordered={false}
            scrollX={1360}
          />

          <div class='flex justify-end p-4'>
            <NPagination
              v-model:page={pagination.page}
              v-model:pageSize={pagination.pageSize}
              itemCount={pagination.itemCount}
              pageSizes={pagination.pageSizes}
              showSizePicker={pagination.showSizePicker}
              onUpdatePage={pagination.onChange}
              onUpdatePageSize={pagination.onUpdatePageSize}
            />
          </div>
        </NCard>
      </ScrollContainer>
    )
  },
})
