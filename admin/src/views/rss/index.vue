<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import * as echarts from 'echarts'
import { NCard, NDataTable, NSelect, NSpace, NStatistic, NTag, useMessage } from 'naive-ui'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import { ScrollContainer } from '@/components'
import { getRssAccessStats } from '@/services/rss'

import type { RssAccessBucket, RssAccessStats } from '@/types/rss'
import type { ECharts } from 'echarts'
import type { DataTableColumns } from 'naive-ui'

defineOptions({
  name: 'RssAccessStats',
})

const message = useMessage()
const loading = ref(false)
const stats = ref<RssAccessStats | null>(null)
const days = ref(7)
const topN = ref(12)
const topTab = ref<
  'clients' | 'ips' | 'platforms' | 'browsers' | 'locations' | 'hints' | 'userAgents'
>('clients')

const daysOptions = [
  { label: t('admin.rss.last_7_days'), value: 7 },
  { label: t('admin.rss.last_30_days'), value: 30 },
  { label: t('admin.rss.last_90_days'), value: 90 },
]

const topOptions = [
  { label: 'Top 8', value: 8 },
  { label: 'Top 12', value: 12 },
  { label: 'Top 20', value: 20 },
]

const topData = computed(() => {
  if (!stats.value) return []
  if (topTab.value === 'ips') return stats.value.topIps
  if (topTab.value === 'platforms') return stats.value.topPlatforms
  if (topTab.value === 'browsers') return stats.value.topBrowsers
  if (topTab.value === 'locations') return stats.value.topLocations
  if (topTab.value === 'hints') return stats.value.topHints
  if (topTab.value === 'userAgents') return stats.value.topUserAgents
  return stats.value.topClients
})

const topLabel = computed(() => {
  if (topTab.value === 'ips') return t('admin.visitor.ip')
  if (topTab.value === 'platforms') return t('admin.visitor.os')
  if (topTab.value === 'browsers') return t('admin.visitor.browser')
  if (topTab.value === 'locations') return t('admin.visitor.location')
  if (topTab.value === 'hints') return t('admin.rss.hint')
  if (topTab.value === 'userAgents') return 'User-Agent'
  return t('admin.rss.client')
})

const trendChartRef = ref<HTMLDivElement | null>(null)
const topChartRef = ref<HTMLDivElement | null>(null)
let trendChart: ECharts | null = null
let topChart: ECharts | null = null

const topTableColumns = computed<DataTableColumns<RssAccessBucket>>(() => [
  {
    title: topLabel.value,
    key: 'name',
    minWidth: 240,
    ellipsis: { tooltip: true },
  },
  {
    title: t('admin.rss.request_count'),
    key: 'count',
    width: 120,
  },
])

async function loadStats() {
  loading.value = true
  try {
    stats.value = await getRssAccessStats(days.value, topN.value)
    await nextTick()
    renderCharts()
  } catch (error: any) {
    message.error(error?.message || t('admin.rss.load_failed'))
  } finally {
    loading.value = false
  }
}

function renderTrendChart() {
  if (!trendChartRef.value || !stats.value) return
  trendChart?.dispose()
  trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { top: 4, data: [t('admin.rss.request_volume'), t('admin.rss.unique_ip')] },
    grid: { left: 28, right: 20, top: 32, bottom: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: stats.value.trend.map((item) => item.hour.slice(5)),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: t('admin.rss.request_volume'),
        type: 'line',
        smooth: true,
        data: stats.value.trend.map((item) => item.requests),
      },
      {
        name: t('admin.rss.unique_ip'),
        type: 'line',
        smooth: true,
        data: stats.value.trend.map((item) => item.uniqueIp),
      },
    ],
  })
}

function renderTopChart() {
  if (!topChartRef.value) return
  topChart?.dispose()
  topChart = echarts.init(topChartRef.value)
  const data = [...topData.value].slice(0, topN.value).reverse()
  topChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 120, right: 20, top: 12, bottom: 20, containLabel: false },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: data.map((item) => item.name),
      axisLabel: {
        width: 110,
        overflow: 'truncate',
      },
    },
    series: [
      {
        type: 'bar',
        data: data.map((item) => item.count),
      },
    ],
  })
}

function renderCharts() {
  renderTrendChart()
  renderTopChart()
}

watch([days, topN], async () => {
  await loadStats()
})

watch(topTab, async () => {
  if (!stats.value) return
  await nextTick()
  renderTopChart()
})

onMounted(async () => {
  await loadStats()
  window.addEventListener('resize', renderCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', renderCharts)
  trendChart?.dispose()
  topChart?.dispose()
})
</script>

<template>
  <ScrollContainer
    wrapper-class="p-4"
    :scrollbar-props="{ trigger: 'none' }"
  >
    <NCard
      :title="$t('admin.card.rss_stats')"
      class="mb-4"
    >
      <template #header-extra>
        <NSpace align="center">
          <NTag
            size="small"
            :bordered="false"
            >{{ $t('admin.visitor.event_aggregation') }}</NTag
          >
          <NSelect
            v-model:value="days"
            :options="daysOptions"
            style="width: 132px"
          />
          <NSelect
            v-model:value="topN"
            :options="topOptions"
            style="width: 110px"
          />
        </NSpace>
      </template>

      <div
        v-if="stats"
        class="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2"
      >
        <NCard size="small">
          <NStatistic
            :label="$t('admin.rss.total_requests')"
            :value="stats.total"
          />
        </NCard>
        <NCard size="small">
          <NStatistic
            :label="$t('admin.rss.unique_ip')"
            :value="stats.uniqueIp"
          />
        </NCard>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NCard
          size="small"
          :title="$t('admin.rss.trend_title')"
          :loading="loading"
        >
          <div
            ref="trendChartRef"
            style="height: 300px"
          />
        </NCard>

        <NCard
          size="small"
          :title="$t('admin.rss.top_chart_title', { label: topLabel })"
          :loading="loading"
        >
          <template #header-extra>
            <NSelect
              v-model:value="topTab"
              style="width: 140px"
              :options="[
                { label: $t('admin.rss.client'), value: 'clients' },
                { label: $t('admin.visitor.ip'), value: 'ips' },
                { label: $t('admin.visitor.os'), value: 'platforms' },
                { label: $t('admin.visitor.browser'), value: 'browsers' },
                { label: $t('admin.visitor.location'), value: 'locations' },
                { label: 'Hint', value: 'hints' },
                { label: 'User-Agent', value: 'userAgents' },
              ]"
            />
          </template>
          <div
            ref="topChartRef"
            style="height: 300px"
          />
        </NCard>
      </div>
    </NCard>

    <NCard
      size="small"
      :title="$t('admin.rss.top_detail', { label: topLabel })"
      :loading="loading"
    >
      <NDataTable
        :columns="topTableColumns"
        :data="topData"
        :bordered="false"
        :max-height="420"
      />
    </NCard>
  </ScrollContainer>
</template>
