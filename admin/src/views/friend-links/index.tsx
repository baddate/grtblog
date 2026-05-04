import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NPopconfirm,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  useMessage,
} from 'naive-ui'
import { defineComponent, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { ScrollContainer } from '@/components'
import { useTable } from '@/composables/table/use-table'
import { friendLinkService } from '@/services/friend-links'

import type {
  FriendLink,
  FriendLinkCreateReq,
  FriendLinkFederationRequestReq,
  FriendLinkUpdateReq,
} from '@/types/friend-link'
import type { DataTableColumns } from 'naive-ui'

export default defineComponent({
  name: 'FriendLinkList',
  setup() {
    const { t } = useI18n()
    const message = useMessage()

    const typeLabelMap: Record<FriendLink['type'], string> = {
      federation: t('admin.filter.type_federation'),
      rss: t('admin.filter.type_rss'),
      norss: t('admin.filter.type_norss'),
    }

    const typeTagMap: Record<FriendLink['type'], 'default' | 'info' | 'success'> = {
      federation: 'info',
      rss: 'success',
      norss: 'default',
    }

    const linksFilter = reactive({
      keyword: '',
      type: undefined as FriendLink['type'] | undefined,
    })

    const {
      data: links,
      loading: linksLoading,
      pagination: linksPagination,
      refresh: refreshLinks,
    } = useTable<FriendLink>(friendLinkService.getFriendLinks, linksFilter as any)

    const showEditModal = ref(false)
    const modalTitle = ref(t('admin.action.create_friend'))
    const editFormRef = ref<InstanceType<typeof NForm> | null>(null)
    const editingId = ref<number | null>(null)
    const formModel = reactive<FriendLinkCreateReq>({
      name: '',
      url: '',
      logo: '',
      description: '',
      rssUrl: '',
      type: 'norss',
      instanceId: undefined,
      isActive: true,
      syncInterval: 60,
    })

    const showRequestModal = ref(false)
    const requestForm = reactive<FriendLinkFederationRequestReq>({
      target_url: '',
      message: '',
      rss_url: '',
    })
    const requestLoading = ref(false)

    const rules = {
      name: { required: true, message: t('admin.form.validate_name_required'), trigger: 'blur' },
      url: { required: true, message: t('admin.form.validate_url_required'), trigger: 'blur' },
    }

    const normalizeOptional = (value?: string) => {
      const trimmed = (value || '').trim()
      return trimmed || undefined
    }

    const buildPayload = (): FriendLinkCreateReq => {
      const payload: FriendLinkCreateReq = {
        name: formModel.name.trim(),
        url: formModel.url.trim(),
        logo: normalizeOptional(formModel.logo),
        description: normalizeOptional(formModel.description),
        rssUrl: normalizeOptional(formModel.rssUrl),
        type: formModel.type,
        instanceId: formModel.instanceId,
        syncInterval:
          formModel.syncInterval && formModel.syncInterval > 0 ? formModel.syncInterval : undefined,
        isActive: formModel.isActive,
      }
      if (payload.type !== 'federation') {
        payload.instanceId = undefined
      }
      return payload
    }

    const toUpdatePayload = (row: FriendLink, isActive = row.isActive): FriendLinkUpdateReq => ({
      name: row.name,
      url: row.url,
      logo: row.logo,
      description: row.description,
      rssUrl: row.rssUrl,
      type: row.type,
      instanceId: row.instanceId,
      syncInterval: row.syncInterval,
      isActive,
    })

    const resetRequestForm = () => {
      requestForm.target_url = ''
      requestForm.message = ''
      requestForm.rss_url = ''
    }

    const handleSave = async () => {
      editFormRef.value?.validate(async (errors) => {
        if (!errors) {
          try {
            const payload = buildPayload()
            if (editingId.value) {
              await friendLinkService.updateFriendLink(editingId.value, payload)
              message.success(t('admin.service.update_success'))
            } else {
              await friendLinkService.createFriendLink(payload)
              message.success(t('admin.service.create_success'))
            }
            showEditModal.value = false
            refreshLinks()
          } catch (e: any) {
            message.error(e.message || t('admin.service.save_failed'))
          }
        }
      })
    }

    const handleFederationRequest = async () => {
      const targetURL = requestForm.target_url.trim()
      if (!targetURL) {
        message.warning(t('admin.service.invalid_target'))
        return
      }
      try {
        requestLoading.value = true
        await friendLinkService.requestFederationFriendLink({
          target_url: targetURL,
          message: normalizeOptional(requestForm.message),
          rss_url: normalizeOptional(requestForm.rss_url),
        })
        message.success(t('admin.service.request_sent'))
        showRequestModal.value = false
        resetRequestForm()
      } catch (e: any) {
        message.error(e.message || t('admin.service.send_failed'))
      } finally {
        requestLoading.value = false
      }
    }

    const handleAction = async (id: number, action: 'delete' | 'block') => {
      try {
        if (action === 'delete') {
          await friendLinkService.deleteFriendLink(id)
          message.success(t('admin.service.delete_success'))
        } else if (action === 'block') {
          await friendLinkService.blockFriendLink(id)
          message.success(t('admin.service.block_success'))
        }
        refreshLinks()
      } catch (e: any) {
        message.error(e.message || t('admin.service.operation_failed'))
      }
    }

    const openCreate = () => {
      editingId.value = null
      modalTitle.value = t('admin.action.create_friend')
      Object.assign(formModel, {
        name: '',
        url: '',
        logo: '',
        description: '',
        rssUrl: '',
        type: 'norss',
        instanceId: undefined,
        isActive: true,
        syncInterval: 60,
      } satisfies FriendLinkCreateReq)
      showEditModal.value = true
    }

    const openEdit = (row: FriendLink) => {
      editingId.value = row.id
      modalTitle.value = t('admin.action.edit_friend')
      Object.assign(formModel, {
        name: row.name,
        url: row.url,
        logo: row.logo || '',
        description: row.description || '',
        rssUrl: row.rssUrl || '',
        type: row.type,
        instanceId: row.instanceId,
        isActive: row.isActive,
        syncInterval: row.syncInterval,
      } satisfies FriendLinkCreateReq)
      showEditModal.value = true
    }

    const linkColumns: DataTableColumns<FriendLink> = [
      {
        title: t('admin.table.logo'),
        key: 'logo',
        width: 60,
        render: (row) => {
          if (!row.logo) return null
          return (
            <img
              src={row.logo}
              class='h-8 w-8 rounded object-cover'
            />
          )
        },
      },
      {
        title: t('admin.table.name'),
        key: 'name',
        render: (row) => (
          <a
            href={row.url}
            target='_blank'
            class='font-medium text-primary hover:underline'
          >
            {row.name}
          </a>
        ),
      },
      {
        title: t('admin.table.type'),
        key: 'type',
        width: 110,
        render: (row) => (
          <NTag
            type={typeTagMap[row.type]}
            size='small'
          >
            {{ default: () => typeLabelMap[row.type] }}
          </NTag>
        ),
      },
      {
        title: t('admin.table.sync_source'),
        key: 'syncSource',
        minWidth: 180,
        render: (row) => (
          <span class='truncate text-sm text-neutral-500'>
            {row.type === 'federation'
              ? `${t('admin.table.instance')} #${row.instanceId || '-'}`
              : row.rssUrl || '-'}
          </span>
        ),
      },
      {
        title: t('admin.table.status'),
        key: 'isActive',
        width: 80,
        render: (row) => (
          <NSwitch
            value={row.isActive}
            size='small'
            onUpdateValue={async (val: boolean) => {
              try {
                await friendLinkService.updateFriendLink(row.id, toUpdatePayload(row, val))
                row.isActive = val
                message.success(t('admin.service.status_updated'))
              } catch (e: any) {
                message.error(e.message || t('admin.service.status_update_failed'))
              }
            }}
          />
        ),
      },
      {
        title: t('admin.table.actions'),
        key: 'actions',
        width: 150,
        render: (row) => (
          <NSpace>
            <NButton
              size='tiny'
              secondary
              onClick={() => openEdit(row)}
            >
              {t('admin.common.edit')}
            </NButton>
            <NPopconfirm onPositiveClick={() => handleAction(row.id, 'delete')}>
              {{
                default: () => t('admin.confirm.delete_friend'),
                trigger: () => (
                  <NButton
                    size='tiny'
                    type='error'
                    secondary
                  >
                    {t('admin.common.delete')}
                  </NButton>
                ),
              }}
            </NPopconfirm>
            <NPopconfirm onPositiveClick={() => handleAction(row.id, 'block')}>
              {{
                default: () => t('admin.confirm.block_friend'),
                trigger: () => (
                  <NButton
                    size='tiny'
                    type='error'
                    secondary
                  >
                    {t('admin.action.block')}
                  </NButton>
                ),
              }}
            </NPopconfirm>
          </NSpace>
        ),
      },
    ]

    return () => (
      <ScrollContainer wrapper-class='p-4'>
        <NCard
          title={t('admin.card.friend_list')}
          class='h-full'
        >
          {{
            'header-extra': () => (
              <NSpace>
                <NButton
                  secondary
                  size='small'
                  onClick={() => (showRequestModal.value = true)}
                >
                  {t('admin.action.federation_request')}
                </NButton>
                <NButton
                  type='primary'
                  size='small'
                  onClick={openCreate}
                >
                  {t('admin.action.create_friend')}
                </NButton>
              </NSpace>
            ),
            default: () => (
              <>
                <div class='mb-4 flex gap-2'>
                  <NInput
                    value={linksFilter.keyword}
                    placeholder={t('admin.placeholder.search_name_url')}
                    class='max-w-xs'
                    clearable
                    onUpdateValue={(v) => (linksFilter.keyword = v)}
                    onKeydown={(e) => {
                      if (e.key === 'Enter') refreshLinks()
                    }}
                  />
                  <NSelect
                    value={linksFilter.type}
                    clearable
                    class='w-40'
                    placeholder={t('admin.placeholder.type')}
                    options={[
                      { label: t('admin.filter.type_federation'), value: 'federation' },
                      { label: t('admin.filter.type_rss'), value: 'rss' },
                      { label: t('admin.filter.type_norss'), value: 'norss' },
                    ]}
                    onUpdateValue={(v) => (linksFilter.type = v as FriendLink['type'] | undefined)}
                  />
                  <NButton
                    secondary
                    onClick={refreshLinks}
                  >
                    {t('admin.common.search')}
                  </NButton>
                </div>
                <NDataTable
                  remote
                  columns={linkColumns}
                  data={links.value}
                  loading={linksLoading.value}
                  row-key={(row: FriendLink) => row.id}
                  scrollX={860}
                />
                <div class='mt-4 flex justify-end'>
                  <NPagination
                    page={linksPagination.page}
                    page-size={linksPagination.pageSize}
                    item-count={linksPagination.itemCount}
                    show-size-picker={linksPagination.showSizePicker}
                    page-sizes={linksPagination.pageSizes}
                    onUpdatePage={linksPagination.onChange}
                    onUpdatePageSize={linksPagination.onUpdatePageSize}
                  />
                </div>
              </>
            ),
          }}
        </NCard>

        <NModal
          show={showEditModal.value}
          preset='card'
          title={modalTitle.value}
          class='max-w-lg'
          onUpdateShow={(v) => (showEditModal.value = v)}
        >
          {{
            default: () => (
              <NForm
                ref={editFormRef}
                model={formModel}
                rules={rules}
                label-placement='left'
                label-width='80'
              >
                <NFormItem
                  label={t('admin.form.name')}
                  path='name'
                >
                  <NInput
                    value={formModel.name}
                    placeholder={t('admin.placeholder.site_name')}
                    onUpdateValue={(v) => (formModel.name = v)}
                  />
                </NFormItem>
                <NFormItem
                  label={t('admin.form.url')}
                  path='url'
                >
                  <NInput
                    value={formModel.url}
                    placeholder={t('admin.placeholder.site_url')}
                    onUpdateValue={(v) => (formModel.url = v)}
                  />
                </NFormItem>
                <NFormItem
                  label={t('admin.form.logo')}
                  path='logo'
                >
                  <NInput
                    value={formModel.logo}
                    placeholder={t('admin.placeholder.logo_url')}
                    onUpdateValue={(v) => (formModel.logo = v)}
                  />
                </NFormItem>
                <NFormItem
                  label={t('admin.form.description')}
                  path='description'
                >
                  <NInput
                    value={formModel.description}
                    type='textarea'
                    placeholder={t('admin.placeholder.site_desc')}
                    onUpdateValue={(v) => (formModel.description = v)}
                  />
                </NFormItem>
                <NFormItem
                  label={t('admin.form.type')}
                  path='type'
                >
                  <NSelect
                    value={formModel.type}
                    options={[
                      { label: t('admin.filter.type_federation'), value: 'federation' },
                      { label: t('admin.filter.type_rss'), value: 'rss' },
                      { label: t('admin.filter.type_norss'), value: 'norss' },
                    ]}
                    onUpdateValue={(v) => {
                      formModel.type = v as FriendLink['type']
                      if (formModel.type !== 'federation') formModel.instanceId = undefined
                    }}
                  />
                </NFormItem>
                <NFormItem
                  label={t('admin.form.rss')}
                  path='rssUrl'
                >
                  <NInput
                    value={formModel.rssUrl}
                    placeholder={
                      formModel.type === 'rss'
                        ? t('admin.placeholder.rss_required')
                        : t('admin.placeholder.rss_optional')
                    }
                    onUpdateValue={(v) => (formModel.rssUrl = v)}
                  />
                </NFormItem>

                {formModel.type === 'federation' && (
                  <NFormItem
                    label={t('admin.form.instance_id')}
                    path='instanceId'
                  >
                    <NInput
                      value={formModel.instanceId?.toString() || ''}
                      allowInput={(v) => !v || /^\d+$/.test(v)}
                      placeholder={t('admin.placeholder.instance_id_required')}
                      onUpdateValue={(v) =>
                        (formModel.instanceId = v ? Number.parseInt(v, 10) : undefined)
                      }
                    />
                  </NFormItem>
                )}

                {formModel.type !== 'norss' && (
                  <NFormItem
                    label={t('admin.form.sync_interval')}
                    path='syncInterval'
                  >
                    <NInput
                      value={formModel.syncInterval?.toString() || ''}
                      allowInput={(v) => !v || /^\d+$/.test(v)}
                      placeholder={t('admin.placeholder.unit_minutes')}
                      onUpdateValue={(v) =>
                        (formModel.syncInterval = v ? Number.parseInt(v, 10) : undefined)
                      }
                    >
                      {{ suffix: () => t('admin.badge.minutes') }}
                    </NInput>
                  </NFormItem>
                )}

                <NFormItem
                  label={t('admin.form.enabled')}
                  path='isActive'
                >
                  <NSwitch
                    value={formModel.isActive}
                    onUpdateValue={(v) => (formModel.isActive = v)}
                  />
                </NFormItem>
              </NForm>
            ),
            footer: () => (
              <div class='flex justify-end gap-2'>
                <NButton onClick={() => (showEditModal.value = false)}>
                  {t('admin.common.cancel')}
                </NButton>
                <NButton
                  type='primary'
                  loading={linksLoading.value}
                  onClick={handleSave}
                >
                  {t('admin.common.save')}
                </NButton>
              </div>
            ),
          }}
        </NModal>

        <NModal
          show={showRequestModal.value}
          preset='card'
          title={t('admin.action.federation_request')}
          class='max-w-lg'
          onUpdateShow={(v) => (showRequestModal.value = v)}
        >
          {{
            default: () => (
              <NForm
                label-placement='left'
                label-width='100'
              >
                <NFormItem
                  label={t('admin.form.target_url')}
                  required
                >
                  <NInput
                    value={requestForm.target_url}
                    placeholder={t('admin.placeholder.target_url')}
                    onUpdateValue={(v) => (requestForm.target_url = v)}
                  />
                </NFormItem>
                <NFormItem label={t('admin.form.my_rss')}>
                  <NInput
                    value={requestForm.rss_url}
                    placeholder={t('admin.placeholder.my_rss')}
                    onUpdateValue={(v) => (requestForm.rss_url = v)}
                  />
                </NFormItem>
                <NFormItem label={t('admin.form.message')}>
                  <NInput
                    value={requestForm.message}
                    type='textarea'
                    placeholder={t('admin.placeholder.federation_message')}
                    onUpdateValue={(v) => (requestForm.message = v)}
                  />
                </NFormItem>
              </NForm>
            ),
            footer: () => (
              <div class='flex justify-end gap-2'>
                <NButton onClick={() => (showRequestModal.value = false)}>
                  {t('admin.common.cancel')}
                </NButton>
                <NButton
                  type='primary'
                  loading={requestLoading.value}
                  onClick={handleFederationRequest}
                >
                  {t('admin.action.send_request')}
                </NButton>
              </div>
            ),
          }}
        </NModal>
      </ScrollContainer>
    )
  },
})
