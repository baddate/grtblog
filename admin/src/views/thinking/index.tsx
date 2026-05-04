import {
  NCard,
  NDataTable,
  NButton,
  NTag,
  NPagination,
  NSpace,
  NPopconfirm,
  useDialog,
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { defineComponent, onMounted, ref, Transition } from 'vue'
import { useRouter } from 'vue-router'

import { ScrollContainer } from '@/components'
import { useTable } from '@/composables/table/use-table'
import { useDiscreteApi } from '@/composables/useDiscreteApi'
import { deleteThinking, listThinkings, batchDeleteThinkings } from '@/services/thinking'

import type { ThinkingListItem } from '@/services/thinking'
import type { DataTableColumns, DataTableRowKey } from 'naive-ui'

export default defineComponent({
  name: 'ThinkingList',
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const dialog = useDialog()
    const { message } = useDiscreteApi()
    const { data, loading, pagination, refresh } = useTable<ThinkingListItem>(listThinkings)
    const checkedRowKeys = ref<DataTableRowKey[]>([])

    const handleEdit = (id: number) => {
      router.push({ name: 'thinkingEdit', params: { id } })
    }

    const handleCreate = () => {
      router.push({ name: 'thinkingCreate' })
    }

    const handleDelete = (id: number) => {
      dialog.warning({
        title: t('admin.common.delete_confirm'),
        content: t('admin.common.delete_confirm_content'),
        positiveText: t('admin.common.confirm'),
        negativeText: t('admin.common.cancel'),
        onPositiveClick: async () => {
          await deleteThinking(id)
          await refresh()
        },
      })
    }

    const handleCheck = (rowKeys: DataTableRowKey[]) => {
      checkedRowKeys.value = rowKeys
    }

    const handleBatchDelete = async () => {
      const ids = checkedRowKeys.value as number[]
      if (ids.length === 0) return
      try {
        await batchDeleteThinkings({ ids })
        checkedRowKeys.value = []
        message.success(t('admin.service.batch_delete_success'))
        refresh()
      } catch (err) {
        message.error(err instanceof Error ? err.message : t('admin.service.operation_failed'))
      }
    }

    const columns: DataTableColumns<ThinkingListItem> = [
      {
        type: 'selection',
      },
      {
        title: t('admin.table.content'),
        key: 'content',
        minWidth: 300,
        ellipsis: { tooltip: true },
        render: (row) => (
          <div class='font-medium text-gray-700 dark:text-gray-200'>{row.content}</div>
        ),
      },
      {
        title: t('admin.table.author'),
        key: 'authorName',
        width: 140,
        render: (row) => row.authorName || <span class='text-gray-400'>-</span>,
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
            <NButton
              size='small'
              type='error'
              secondary
              onClick={() => handleDelete(row.id)}
            >
              {t('admin.common.delete')}
            </NButton>
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
            <div class='text-lg font-medium'>{t('admin.card.thinking_list')}</div>
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
                          t('admin.confirm.batch_delete_thinkings', {
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
                {t('admin.action.create_thinking')}
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
