<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import {
  NButton,
  NCard,
  NDataTable,
  NInput,
  NSelect,
  NSpace,
  NStatistic,
  NTag,
  useMessage,
} from 'naive-ui'
import { computed, h, ref } from 'vue'

import { ScrollContainer } from '@/components'
import { useTable } from '@/composables/table/use-table'
import { getVisitorProfile, listVisitors } from '@/services/visitors'
import { formatDate } from '@/utils/format'

import VisitorDetailDrawer from './components/VisitorDetailDrawer.vue'
import { useVisitorInsights } from './composables/use-visitor-insights'

import type { VisitorProfile, VisitorRecentComment } from '@/types/visitors'
import type { DataTableColumns } from 'naive-ui'

defineOptions({
  name: 'VisitorProfileList',
})

const message = useMessage()
const keyword = ref('')
const queryState = ref({ keyword: '' })

const {
  loading,
  data: tableData,
  pagination,
  refresh,
} = useTable<VisitorProfile>(listVisitors, queryState.value)

const detailVisible = ref(false)
const detailLoading = ref(false)
const currentProfile = ref<VisitorProfile | null>(null)
const recentComments = ref<VisitorRecentComment[]>([])

const {
  insightDays,
  sourceTab,
  insightsLoading,
  insights,
  sourceChartRef,
  trendChartRef,
  funnelChartRef,
  daysOptions,
  dataSourceLabel,
  toPercent,
} = useVisitorInsights(message)

const columns = computed<DataTableColumns<VisitorProfile>>(() => [
  {
    title: t('admin.visitor.visitor_id'),
    key: 'visitorId',
    minWidth: 220,
    ellipsis: { tooltip: true },
    render: (row) => h('code', {}, row.visitorId),
  },
  { title: t('admin.user.nickname'), key: 'nickName', width: 120, render: (row) => row.nickName || '-' },
  {
    title: t('admin.user.email'),
    key: 'email',
    minWidth: 180,
    ellipsis: { tooltip: true },
    render: (row) => row.email || '-',
  },
  { title: t('admin.visitor.location'), key: 'location', width: 140, render: (row) => row.location || '-' },
  {
    title: t('admin.visitor.device'),
    key: 'device',
    minWidth: 180,
    render: (row) => [row.browser, row.platform].filter(Boolean).join(' / ') || '-',
  },
  { title: t('admin.table.views'), key: 'totalViews', width: 90 },
  { title: t('admin.table.likes'), key: 'totalLikes', width: 90 },
  { title: t('admin.table.comments'), key: 'totalComments', width: 90 },
  { title: t('admin.visitor.last_visit'), key: 'lastSeenAt', width: 180, render: (row) => formatDate(row.lastSeenAt) },
  {
    title: t('admin.common.actions'),
    key: 'actions',
    width: 96,
    render: (row) =>
      h(
        NButton,
        { size: 'small', tertiary: true, onClick: () => openProfile(row.visitorId) },
        { default: () => t('admin.action.view_details') },
      ),
  },
])

function doSearch() {
  queryState.value.keyword = keyword.value.trim()
  pagination.page = 1
  refresh()
}

function resetSearch() {
  keyword.value = ''
  queryState.value.keyword = ''
  pagination.page = 1
  refresh()
}

async function openProfile(visitorId: string) {
  detailVisible.value = true
  detailLoading.value = true
  currentProfile.value = null
  recentComments.value = []
  try {
    const detail = await getVisitorProfile(visitorId, 20)
    currentProfile.value = detail.profile
    recentComments.value = detail.recentComments || []
  } catch (error: any) {
    message.error(error?.message || t('admin.service.load_failed'))
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

</script>

<template>
  <ScrollContainer
    wrapper-class="p-4"
    :scrollbar-props="{ trigger: 'none' }"
  >
    <NCard
      :title="$t('admin.visitor.profile_management')"
      class="mb-4"
    >
      <template #header-extra>
        <NSpace align="center">
          <NTag
            size="small"
            :bordered="false"
            >{{ $t('admin.visitor.data_source') }}{{ dataSourceLabel }}</NTag
          >
          <NSelect
            v-model:value="insightDays"
            :options="daysOptions"
            style="width: 132px"
          />
        </NSpace>
      </template>

      <div
        v-if="insights"
        class="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-4"
      >
        <NCard size="small"
          ><NStatistic
            :label="$t('admin.visitor.active_1d')"
            :value="insights.segments.active1d"
        /></NCard>
        <NCard size="small"
          ><NStatistic
            :label="$t('admin.visitor.active_7d')"
            :value="insights.segments.active7d"
        /></NCard>
        <NCard size="small"
          ><NStatistic
            :label="$t('admin.visitor.active_30d')"
            :value="insights.segments.active30d"
        /></NCard>
        <NCard size="small"
          ><NStatistic
            :label="$t('admin.visitor.highly_engaged')"
            :value="insights.segments.highlyEngaged"
        /></NCard>
      </div>

      <div
        v-if="insights"
        class="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <NCard
          size="small"
          :title="$t('admin.visitor.source_distribution')"
        >
          <template #header-extra>
            <NSpace align="center">
              <NTag
                size="tiny"
                :bordered="false"
                >{{ $t('admin.visitor.event_aggregation') }}</NTag
              >
              <NSelect
                v-model:value="sourceTab"
                style="width: 120px"
                :options="[
                  { label: $t('admin.visitor.os'), value: 'platform' },
                  { label: $t('admin.visitor.browser'), value: 'browser' },
                  { label: $t('admin.visitor.location'), value: 'location' },
                ]"
              />
            </NSpace>
          </template>
          <div
            ref="sourceChartRef"
            style="height: 280px"
          />
        </NCard>

        <NCard
          size="small"
          :title="$t('admin.visitor.behavior_funnel')"
        >
          <template #header-extra>
            <NTag
              size="tiny"
              :bordered="false"
              >{{ $t('admin.visitor.event_aggregation') }}</NTag
            >
          </template>
          <div
            ref="funnelChartRef"
            style="height: 280px"
          />
          <NSpace class="mt-2">
            <NTag type="info">{{ $t('admin.visitor.like_rate') }} {{ toPercent(insights.funnel.likeRate) }}</NTag>
            <NTag type="warning"
              >{{ $t('admin.visitor.comment_rate_by_view') }} {{ toPercent(insights.funnel.commentRateByView) }}</NTag
            >
            <NTag type="success"
              >{{ $t('admin.visitor.comment_rate_by_like') }} {{ toPercent(insights.funnel.commentRateByLike) }}</NTag
            >
          </NSpace>
        </NCard>
      </div>

      <NCard
        v-if="insights"
        size="small"
        :title="$t('admin.visitor.activity_trend')"
        class="mt-4"
      >
        <template #header-extra>
          <NTag
            size="tiny"
            :bordered="false"
            >{{ $t('admin.visitor.event_aggregation') }}</NTag
          >
        </template>
        <div
          ref="trendChartRef"
          style="height: 320px"
        />
      </NCard>
    </NCard>

    <NCard :title="$t('admin.card.visitor_list')">
      <NSpace
        class="mb-4"
        align="center"
      >
        <NInput
          v-model:value="keyword"
          :placeholder="$t('admin.placeholder.search_visitor')"
          clearable
          style="width: 380px"
          @keyup.enter="doSearch"
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
        :loading="loading || insightsLoading"
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :scroll-x="1400"
      />
    </NCard>

    <VisitorDetailDrawer
      :visible="detailVisible"
      :loading="detailLoading"
      :profile="currentProfile"
      :recent-comments="recentComments"
      @update:visible="detailVisible = $event"
    />
  </ScrollContainer>
</template>
