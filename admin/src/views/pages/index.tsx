import {
  NCard,
  NDataTable,
  NButton,
  NTag,
  NPagination,
  NSpace,
  NPopconfirm,
  NDropdown,
  useDialog,
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { defineComponent, onMounted, ref, Transition } from 'vue'
import { useRouter } from 'vue-router'

import { ScrollContainer } from '@/components'
import { useTable } from '@/composables/table/use-table'
import { useDiscreteApi } from '@/composables/useDiscreteApi'
import { deletePage, listPages, batchSetPageEnabled, batchDeletePages } from '@/services/page'

import type { PageListItem } from '@/services/page'
import type { DataTableColumns, DataTableRowKey } from 'naive-ui'

export default defineComponent({
  name: 'PageList',
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const dialog = useDialog()
    const { message } = useDiscreteApi()
    const { data, loading, pagination, refresh } = useTable<PageListItem>(listPages)
    const checkedRowKeys = ref<DataTableRowKey[]>([])

    const handleEdit = (id: number) => {
      router.push({ name: 'pageEdit', params: { id } })
    }

    const handleCreate = () => {
      router.push({ name: 'pageCreate' })
    }

    const handleDelete = (id: number) => {
      dialog.warning({
        title: t('admin.common.delete_confirm'),
        content: t('admin.common.delete_confirm_content'),
        positiveText: t('admin.common.confirm'),
        negativeText: t('admin.common.cancel'),
        onPositiveClick: async () => {
          await deletePage(id)
          await refresh()
        },
      })
    }

    const handleCheck = (rowKeys: DataTableRowKey[]) => {
      // Exclude builtin pages from batch selection
      checkedRowKeys.value = rowKeys.filter((key) => {
        const row = data.value.find((item) => item.id === key)
        return row && !row.isBuiltin
      })
    }

    const handleToggleEnabled = async (row: PageListItem) => {
      try {
        await batchSetPageEnabled({ ids: [row.id], isEnabled: !row.isEnabled })
        row.isEnabled = !row.isEnabled
        message.success(row.isEnabled ? t('admin.service.enabled') : t('admin.service.disabled'))
      } catch (err) {
        message.error(err instanceof Error ? err.message : t('admin.service.operation_failed'))
      }
    }

    const handleBatchEnabled = async (isEnabled: boolean) => {
      const ids = checkedRowKeys.value as number[]
      if (ids.length === 0) return
      try {
        await batchSetPageEnabled({ ids, isEnabled })
        data.value.forEach((item) => {
          if (ids.includes(item.id)) item.isEnabled = isEnabled
        })
        checkedRowKeys.value = []
        message.success(
          isEnabled
            ? t('admin.service.batch_enable_success')
            : t('admin.service.batch_disable_success'),
        )
      } catch (err) {
        message.error(err instanceof Error ? err.message : t('admin.service.operation_failed'))
      }
    }

    const handleBatchDelete = async () => {
      const ids = checkedRowKeys.value as number[]
      if (ids.length === 0) return
      try {
        await batchDeletePages({ ids })
        checkedRowKeys.value = []
        message.success(t('admin.service.batch_delete_success'))
        refresh()
      } catch (err) {
        message.error(err instanceof Error ? err.message : t('admin.service.operation_failed'))
      }
    }

    const batchEnabledOptions = [
      { label: t('admin.action.enable'), key: 'enable' },
      { label: t('admin.action.disable'), key: 'disable' },
    ]

    const handleBatchEnabledSelect = (key: string) => {
      handleBatchEnabled(key === 'enable')
    }

    const columns: DataTableColumns<PageListItem> = [
      {
        type: 'selection',
      },
      {
        title: t('admin.table.title'),
        key: 'title',
        width: 260,
        render: (row) => (
          <div class='flex items-center gap-2 font-medium text-gray-700 dark:text-gray-200'>
            {row.title}
            {row.isBuiltin && (
              <NTag
                size='tiny'
                type='info'
                bordered={false}
              >
                {{
                  default: () => t('admin.badge.builtin'),
                }}
              </NTag>
            )}
          </div>
        ),
      },
      {
        title: t('admin.table.short_url'),
        key: 'shortUrl',
        width: 140,
        render: (row) => row.shortUrl || <span class='text-gray-400'>-</span>,
      },
      {
        title: t('admin.table.is_enabled'),
        key: 'isEnabled',
        width: 100,
        render: (row) => (
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => handleToggleEnabled(row)}
          >
            <NTag
              size='small'
              type={row.isEnabled ? 'success' : 'default'}
              bordered={false}
            >
              {{
                default: () =>
                  row.isEnabled ? t('admin.status.enabled') : t('admin.status.disabled'),
                icon: () => (
                  <span
                    class={`iconify ${row.isEnabled ? 'ph--check-circle' : 'ph--circle-dashed'} size-3.5`}
                  />
                ),
              }}
            </NTag>
          </span>
        ),
      },
      {
        title: t('admin.table.metrics'),
        key: 'metrics',
        width: 180,
        render: (row) => (
          <span class='font-mono text-xs text-gray-500'>
            {row.views} / {row.likes} / {row.comments}
          </span>
        ),
      },
      {
        title: t('admin.table.updated_at'),
        key: 'updatedAt',
        width: 180,
        render: (row) => new Date(row.updatedAt).toLocaleString(),
      },
      {
        title: t('admin.table.actions'),
        key: 'actions',
        width: 180,
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
            {!row.isBuiltin && (
              <NButton
                size='small'
                type='error'
                secondary
                onClick={() => handleDelete(row.id)}
              >
                {t('admin.common.delete')}
              </NButton>
            )}
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
            <div class='text-lg font-medium'>{t('admin.card.page_list')}</div>
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
                      options={batchEnabledOptions}
                      onSelect={handleBatchEnabledSelect}
                    >
                      <NButton
                        size='small'
                        secondary
                      >
                        {t('admin.action.batch_enable')}
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
                          t('admin.confirm.batch_delete_pages', { n: checkedRowKeys.value.length }),
                      }}
                    </NPopconfirm>
                  </NSpace>
                )}
              </Transition>
              <NButton
                type='primary'
                onClick={handleCreate}
              >
                {t('admin.action.create_page')}
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
            scrollX={1100}
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
