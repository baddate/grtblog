<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import {
  NButton,
  NCard,
  NDataTable,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  useMessage,
} from 'naive-ui'
import { computed, h, reactive, ref } from 'vue'

import { FormModal, ScrollContainer } from '@/components'
import { useTable } from '@/composables/table/use-table'
import { listSiteUsers, updateSiteUser } from '@/services/site-users'
import { toRefsUserStore } from '@/stores'
import { formatDate } from '@/utils/format'

import type { SiteUser } from '@/types/site-users'
import type { DataTableColumns } from 'naive-ui'

defineOptions({
  name: 'SiteUserManagement',
})

const message = useMessage()
const { user } = toRefsUserStore()

const keyword = ref('')
const adminFilter = ref<string>('all')
const activeFilter = ref<string>('all')
const queryState = ref({
  keyword: '',
  admin: undefined as boolean | undefined,
  active: undefined as boolean | undefined,
})

const {
  loading,
  data: tableData,
  pagination,
  refresh,
} = useTable<SiteUser>(listSiteUsers, queryState.value)

const editVisible = ref(false)
const saving = ref(false)
const editingUserId = ref<number>(0)
const formModel = reactive({
  username: '',
  nickname: '',
  email: '',
  isActive: true,
  isAdmin: false,
})

const isEditingSelf = computed(() => {
  if (!editingUserId.value || !user.value?.id) return false
  return editingUserId.value === user.value.id
})

const columns = computed<DataTableColumns<SiteUser>>(() => [
  {
    title: t('admin.table.id'),
    key: 'id',
    width: 72,
  },
  {
    title: t('admin.user.username'),
    key: 'username',
    width: 160,
  },
  {
    title: t('admin.user.nickname'),
    key: 'nickname',
    width: 140,
    render: (row) => row.nickname || '-',
  },
  {
    title: t('admin.user.email'),
    key: 'email',
    minWidth: 220,
    ellipsis: {
      tooltip: true,
    },
    render: (row) => row.email || '-',
  },
  {
    title: t('admin.user.role'),
    key: 'isAdmin',
    width: 90,
    render: (row) =>
      h(
        NTag,
        { type: row.isAdmin ? 'success' : 'default', size: 'small', bordered: false },
        { default: () => (row.isAdmin ? t('admin.user.role_admin') : t('admin.user.role_user')) },
      ),
  },
  {
    title: t('admin.common.status'),
    key: 'isActive',
    width: 90,
    render: (row) =>
      h(
        NTag,
        { type: row.isActive ? 'success' : 'warning', size: 'small', bordered: false },
        { default: () => (row.isActive ? t('admin.status.enabled') : t('admin.status.disabled')) },
      ),
  },
  {
    title: t('admin.common.created_at'),
    key: 'createdAt',
    width: 180,
    render: (row) => formatDate(row.createdAt),
  },
  {
    title: t('admin.common.actions'),
    key: 'actions',
    width: 96,
    render: (row) =>
      h(
        NButton,
        { size: 'small', tertiary: true, onClick: () => openEdit(row) },
        { default: () => t('admin.common.edit') },
      ),
  },
])

function resolveBoolFilter(raw: string): boolean | undefined {
  if (raw === 'true') return true
  if (raw === 'false') return false
  return undefined
}

function doSearch() {
  queryState.value.keyword = keyword.value.trim()
  queryState.value.admin = resolveBoolFilter(adminFilter.value)
  queryState.value.active = resolveBoolFilter(activeFilter.value)
  pagination.page = 1
  refresh()
}

function resetSearch() {
  keyword.value = ''
  adminFilter.value = 'all'
  activeFilter.value = 'all'
  queryState.value.keyword = ''
  queryState.value.admin = undefined
  queryState.value.active = undefined
  pagination.page = 1
  refresh()
}

function openEdit(row: SiteUser) {
  editingUserId.value = row.id
  formModel.username = row.username
  formModel.nickname = row.nickname
  formModel.email = row.email
  formModel.isActive = row.isActive
  formModel.isAdmin = row.isAdmin
  editVisible.value = true
}

async function saveEdit() {
  if (!editingUserId.value) return
  saving.value = true
  try {
    await updateSiteUser(editingUserId.value, {
      nickname: formModel.nickname.trim(),
      email: formModel.email.trim(),
      isActive: formModel.isActive,
      isAdmin: formModel.isAdmin,
    })
    message.success(t('admin.service.update_success'))
    editVisible.value = false
    refresh()
  } catch (error: any) {
    message.error(error?.message || t('admin.service.update_status_failed'))
  } finally {
    saving.value = false
  }
}

</script>

<template>
  <ScrollContainer
    wrapper-class="p-4"
    :scrollbar-props="{ trigger: 'none' }"
  >
    <NCard :title="$t('admin.card.user_list')">
      <NSpace
        class="mb-4"
        align="center"
      >
        <NInput
          v-model:value="keyword"
          :placeholder="$t('admin.placeholder.search_user')"
          clearable
          style="width: 280px"
          @keyup.enter="doSearch"
        />
        <NSelect
          v-model:value="adminFilter"
          style="width: 140px"
          :options="[
            { label: $t('admin.filter.all_roles'), value: 'all' },
            { label: $t('admin.user.role_admin'), value: 'true' },
            { label: $t('admin.user.role_user'), value: 'false' },
          ]"
        />
        <NSelect
          v-model:value="activeFilter"
          style="width: 140px"
          :options="[
            { label: $t('admin.filter.all_status'), value: 'all' },
            { label: $t('admin.status.active'), value: 'true' },
            { label: $t('admin.status.inactive'), value: 'false' },
          ]"
        />
        <NButton
          type="primary"
          @click="doSearch"
          >{{ $t('admin.common.search') }}</NButton
        >
        <NButton @click="resetSearch">{{ $t('admin.common.reset') }}</NButton>
      </NSpace>

      <NDataTable
        remote
        :loading="loading"
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :scroll-x="1100"
      />
    </NCard>

    <FormModal
      v-model:show="editVisible"
      :title="$t('admin.common.edit')"
      :loading="saving"
      @confirm="saveEdit"
    >
      <NFormItem :label="$t('admin.user.username')">
        <NInput
          :value="formModel.username"
          disabled
        />
      </NFormItem>
      <NFormItem :label="$t('admin.user.nickname')">
        <NInput
          v-model:value="formModel.nickname"
          :placeholder="$t('admin.placeholder.name')"
        />
      </NFormItem>
      <NFormItem :label="$t('admin.user.email')">
        <NInput
          v-model:value="formModel.email"
          :placeholder="$t('admin.placeholder.email_optional')"
        />
      </NFormItem>
      <NFormItem :label="$t('admin.common.enabled')">
        <NSwitch
          v-model:value="formModel.isActive"
          :disabled="isEditingSelf"
        />
      </NFormItem>
      <NFormItem :label="$t('admin.user.role_admin')">
        <NSwitch
          v-model:value="formModel.isAdmin"
          :disabled="isEditingSelf"
        />
      </NFormItem>
    </FormModal>
  </ScrollContainer>
</template>
