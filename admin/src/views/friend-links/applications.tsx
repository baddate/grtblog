import {
  NButton,
  NCard,
  NDataTable,
  NDropdown,
  NPagination,
  NSelect,
  NTag,
  NThing,
  NTooltip,
  useMessage,
} from 'naive-ui'
import { defineComponent, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { ScrollContainer } from '@/components'
import { useTable } from '@/composables/table/use-table'
import { friendLinkService } from '@/services/friend-links'

import type { FriendLinkApplication } from '@/types/friend-link'
import type { DataTableColumns } from 'naive-ui'

export default defineComponent({
  name: 'FriendLinkApplications',
  setup() {
    const { t } = useI18n()
    const message = useMessage()

    const appsFilter = reactive({
      status: undefined as string | undefined,
    })

    const {
      data: apps,
      loading: appsLoading,
      pagination: appsPagination,
      refresh: refreshApps,
    } = useTable<FriendLinkApplication>(friendLinkService.getApplications, appsFilter as any)

    const handleAppStatusUpdate = async (id: number, status: string) => {
      try {
        await friendLinkService.updateApplicationStatus(id, status)
        message.success(t('admin.service.status_updated'))
        refreshApps()
      } catch (e: any) {
        message.error(e.message || t('admin.service.operation_failed'))
      }
    }

    const appColumns: DataTableColumns<FriendLinkApplication> = [
      {
        title: t('admin.friend.application_info'),
        key: 'info',
        render: (row) => (
          <NThing
            title={row.name}
            description={row.url}
          >
            {{
              avatar: () =>
                row.logo ? (
                  <img
                    src={row.logo}
                    class='h-10 w-10 rounded'
                  />
                ) : null,
            }}
          </NThing>
        ),
      },
      {
        title: t('admin.friend.channel'),
        key: 'channel',
        width: 100,
        render: (row) => (
          <div>
            <NTag size='small'>{row.applyChannel}</NTag>
            {row.userId && <div class='mt-1 text-xs text-neutral-400'>UID: {row.userId}</div>}
          </div>
        ),
      },
      {
        title: t('admin.friend.message'),
        key: 'message',
        minWidth: 220,
        render: (row) => {
          const content = row.message?.trim()
          if (!content) return '-'
          return (
            <NTooltip placement='top-start'>
              {{
                trigger: () => (
                  <div class='max-w-[260px] truncate text-sm text-neutral-600'>{content}</div>
                ),
                default: () => (
                  <div class='max-w-[420px] break-all whitespace-pre-wrap'>{content}</div>
                ),
              }}
            </NTooltip>
          )
        },
      },
      {
        title: t('admin.table.status'),
        key: 'status',
        width: 90,
        render: (row) => {
          const typeMap: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
            pending: 'warning',
            approved: 'success',
            rejected: 'error',
            blocked: 'error',
          }
          return (
            <NTag
              type={typeMap[row.status] || 'default'}
              size='small'
            >
              {{ default: () => row.status }}
            </NTag>
          )
        },
      },
      {
        title: t('admin.table.created_at'),
        key: 'createdAt',
        width: 160,
      },
      {
        title: t('admin.table.actions'),
        key: 'actions',
        width: 150,
        render: (row) => (
          <NDropdown
            trigger='click'
            options={[
              { label: `${t('admin.action.approve')} (Approve)`, key: 'approved' },
              { label: `${t('admin.action.reject')} (Reject)`, key: 'rejected' },
              { label: `${t('admin.action.block')} (Block)`, key: 'blocked' },
              { label: `${t('admin.action.pending')} (Pending)`, key: 'pending' },
            ]}
            onSelect={(key: string) => handleAppStatusUpdate(row.id, key)}
          >
            <NButton
              size='tiny'
              secondary
            >
              {t('admin.friend.change_status')}
            </NButton>
          </NDropdown>
        ),
      },
    ]

    return () => (
      <ScrollContainer wrapper-class='p-4'>
        <NCard
          title={t('admin.card.friend_applications')}
          class='h-full'
        >
          <div class='mb-4 flex gap-2'>
            <NSelect
              value={appsFilter.status}
              placeholder={t('admin.placeholder.filter_status')}
              clearable
              options={[
                { label: `${t('admin.filter.pending')} (Pending)`, value: 'pending' },
                { label: `${t('admin.filter.approved')} (Approved)`, value: 'approved' },
                { label: `${t('admin.filter.rejected')} (Rejected)`, value: 'rejected' },
                { label: `${t('admin.filter.blocked')} (Blocked)`, value: 'blocked' },
              ]}
              class='w-40'
              onUpdateValue={(v) => {
                appsFilter.status = v
                refreshApps()
              }}
            />
            <NButton
              secondary
              onClick={refreshApps}
            >
              {t('admin.common.refresh')}
            </NButton>
          </div>
          <NDataTable
            remote
            columns={appColumns}
            data={apps.value}
            loading={appsLoading.value}
            row-key={(row: FriendLinkApplication) => row.id}
            scrollX={800}
          />
          <div class='mt-4 flex justify-end'>
            <NPagination
              page={appsPagination.page}
              page-size={appsPagination.pageSize}
              item-count={appsPagination.itemCount}
              show-size-picker={appsPagination.showSizePicker}
              page-sizes={appsPagination.pageSizes}
              onUpdatePage={appsPagination.onChange}
              onUpdatePageSize={appsPagination.onUpdatePageSize}
            />
          </div>
        </NCard>
      </ScrollContainer>
    )
  },
})
