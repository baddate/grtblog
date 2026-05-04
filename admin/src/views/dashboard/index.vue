<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { NNumberAnimation, NSkeleton } from 'naive-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { ChartPanel, ScrollContainer } from '@/components'
import { getDashboardStats, getHitokoto } from '@/services/stats'
import { toRefsUserStore } from '@/stores/user'

import { useDashboardCharts } from './composables/use-dashboard-charts'

defineOptions({
  name: 'Dashboard',
})

const { user } = toRefsUserStore()
const { t, locale } = useI18n()

const { data: stats, isLoading } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: getDashboardStats,
  refetchInterval: 60000,
})

const { data: hitokoto, isLoading: isHitokotoLoading } = useQuery({
  queryKey: ['hitokoto'],
  queryFn: getHitokoto,
  staleTime: 1000 * 60 * 60,
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return t('admin.dashboard.greeting_late_night')
  if (hour < 9) return t('admin.dashboard.greeting_early_morning')
  if (hour < 12) return t('admin.dashboard.greeting_morning')
  if (hour < 14) return t('admin.dashboard.greeting_noon')
  if (hour < 17) return t('admin.dashboard.greeting_afternoon')
  if (hour < 19) return t('admin.dashboard.greeting_evening')
  return t('admin.dashboard.greeting_night')
})

const cardList = computed(() => {
  const s = stats.value
  if (!s) return Array.from({ length: 4 }).map(() => ({ loading: true }))
  return [
    {
      title: t('admin.dashboard.total_users'),
      value: s.overview.users,
      precision: 0,
      iconClass: 'iconify ph--users-bold text-indigo-50 dark:text-indigo-150',
      iconBgClass:
        'text-indigo-500/5 bg-indigo-400 ring-4 ring-indigo-200 dark:bg-indigo-650 dark:ring-indigo-500/30 transition-all',
      description: t('admin.dashboard.total_users_desc'),
    },
    {
      title: t('admin.dashboard.total_views'),
      value: s.interaction.viewsTotal,
      precision: 0,
      iconClass: 'iconify ph--eye-bold text-blue-50 dark:text-blue-150',
      iconBgClass:
        'text-blue-500/5 bg-blue-400 ring-4 ring-blue-200 dark:bg-blue-650 dark:ring-blue-500/30 transition-all',
      description: t('admin.dashboard.total_views_desc'),
    },
    {
      title: t('admin.dashboard.peak_online'),
      value: s.todayPeakOnline,
      precision: 0,
      iconClass: 'iconify ph--lightning-bold text-amber-50 dark:text-amber-150',
      iconBgClass:
        'text-amber-500/5 bg-amber-400 ring-4 ring-amber-200 dark:bg-amber-650 dark:ring-amber-500/30 transition-all',
      description: t('admin.dashboard.peak_online_desc'),
    },
    {
      title: t('admin.dashboard.pending_tasks'),
      value: s.pending.unviewedComments + s.pending.friendLinkApplications,
      precision: 0,
      iconClass: 'iconify ph--list-checks-bold text-orange-50 dark:text-orange-150',
      iconBgClass:
        'text-orange-500/5 bg-orange-400 ring-4 ring-orange-200 dark:bg-orange-650 dark:ring-orange-500/30 transition-all',
      description: t('admin.dashboard.pending_tasks_desc'),
    },
  ]
})

const {
  mainTrendTab,
  distributionTab,
  sourceTab,
  topContentTab,
  mainTrendChart,
  distributionChart,
  sourceChart,
  topContentChart,
} = useDashboardCharts(stats, isLoading)

const mainTrendTabs = computed(() => [
  { label: t('admin.dashboard.tab_traffic'), value: 'traffic' },
  { label: t('admin.dashboard.tab_online'), value: 'online' },
  { label: t('admin.dashboard.tab_publishing'), value: 'publishing' },
])
const distributionTabs = computed(() => [
  { label: t('admin.dashboard.tab_category'), value: 'category' },
  { label: t('admin.dashboard.tab_column'), value: 'column' },
  { label: t('admin.dashboard.tab_words'), value: 'words' },
])
const sourceTabs = computed(() => [
  { label: t('admin.dashboard.tab_platform'), value: 'platform' },
  { label: t('admin.dashboard.tab_browser'), value: 'browser' },
  { label: t('admin.dashboard.tab_location'), value: 'location' },
])
const topContentTabs = computed(() => [
  { label: t('admin.dashboard.tab_articles'), value: 'articles' },
  { label: t('admin.dashboard.tab_moments'), value: 'moments' },
  { label: t('admin.dashboard.tab_pages'), value: 'pages' },
  { label: t('admin.dashboard.tab_thinkings'), value: 'thinkings' },
])
</script>

<template>
  <ScrollContainer wrapper-class="flex flex-col gap-y-2 max-sm:gap-y-2">
    <!-- Welcome Section -->
    <div class="relative mt-4 mb-4 max-w-6xl">
      <div class="relative z-10 flex flex-col gap-2 md:flex-row md:items-end md:gap-12">
        <div class="flex shrink-0 flex-col gap-y-1">
          <div
            class="flex items-center gap-x-2 text-xs font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400"
          >
            <span
              >{{ t('admin.dashboard.today_is') }}{{
                new Date().toLocaleDateString(locale, {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })
              }}</span
            >
          </div>
          <h2 class="text-2xl font-light text-neutral-800 dark:text-neutral-100">
            {{ greeting }}，<span class="font-normal">{{ user.nickname || user.username }}</span>
          </h2>
        </div>
        <div class="relative max-w-2xl pl-8 md:pl-0">
          <NSkeleton
            v-if="isHitokotoLoading"
            text
            style="width: 200px"
          />
          <template v-else-if="hitokoto">
            <div
              class="absolute -top-2 left-2 text-neutral-200 md:-top-3 md:-left-1 dark:text-neutral-700"
            >
              <span class="iconify text-2xl opacity-50 ph--quotes-fill" />
            </div>
            <p
              class="relative z-10 font-serif text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
            >
              {{ hitokoto.sentence.hitokoto }}
              <span
                class="ml-2 font-sans text-xs font-medium tracking-wider text-neutral-400 uppercase dark:text-neutral-500"
              >
                —— {{ hitokoto.sentence.from_who ? hitokoto.sentence.from_who + ' ' : ''
                }}{{ hitokoto.sentence.from ? `《${hitokoto.sentence.from}》` : '' }}
              </span>
            </p>
          </template>
        </div>
      </div>
    </div>

    <!-- Top Cards -->
    <div class="grid grid-cols-1 gap-4 max-sm:gap-2 md:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="(item, index) in cardList"
        :key="index"
        class="flex items-center justify-between gap-x-4 overflow-hidden rounded border border-naive-border bg-naive-card p-6 transition-[background-color,border-color]"
      >
        <template v-if="!('loading' in item)">
          <div class="flex-1">
            <span class="text-sm font-medium text-neutral-450">{{ item.title }}</span>
            <div class="mt-1 mb-1.5 flex gap-x-4 text-2xl text-neutral-700 dark:text-neutral-400">
              <NNumberAnimation
                :to="item.value"
                show-separator
                :precision="item.precision"
              />
            </div>
            <div class="flex items-center">
              <span class="text-xs text-neutral-500 dark:text-neutral-400">{{
                item.description
              }}</span>
            </div>
          </div>
          <div>
            <div
              class="grid place-items-center rounded-full p-3"
              :class="item.iconBgClass"
            >
              <span
                class="size-7"
                :class="item.iconClass"
              />
            </div>
          </div>
        </template>
        <template v-else>
          <div class="flex w-full gap-4">
            <div class="flex-1 space-y-2">
              <NSkeleton
                text
                style="width: 40%"
              />
              <NSkeleton
                text
                style="width: 80%; height: 28px"
              />
              <NSkeleton
                text
                style="width: 60%"
              />
            </div>
            <NSkeleton
              circle
              size="medium"
              style="width: 48px; height: 48px"
            />
          </div>
        </template>
      </div>
    </div>

    <!-- Row 2: Main Trend & Distribution -->
    <div class="grid grid-cols-1 gap-4 overflow-hidden max-sm:gap-2 lg:grid-cols-12">
      <div class="col-span-1 lg:col-span-8">
        <ChartPanel
          :title="t('admin.dashboard.trend_analysis')"
          :tabs="mainTrendTabs"
          v-model:active-tab="mainTrendTab"
          :loading="isLoading && !stats"
        >
          <div
            ref="mainTrendChart"
            class="h-full w-full"
          />
        </ChartPanel>
      </div>
      <div class="col-span-1 lg:col-span-4">
        <ChartPanel
          :title="t('admin.dashboard.content_composition')"
          :tabs="distributionTabs"
          v-model:active-tab="distributionTab"
          :loading="isLoading && !stats"
        >
          <div
            ref="distributionChart"
            class="h-full w-full"
          />
        </ChartPanel>
      </div>
    </div>

    <!-- Row 3: Source & Top Content -->
    <div class="grid grid-cols-1 gap-4 overflow-hidden max-sm:gap-2 lg:grid-cols-12">
      <div class="col-span-1 lg:col-span-5">
        <ChartPanel
          :title="t('admin.dashboard.visit_sources')"
          :tabs="sourceTabs"
          v-model:active-tab="sourceTab"
          :height="380"
          :loading="isLoading && !stats"
        >
          <template #header-extra>
            <span
              class="rounded bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              >{{ t('admin.dashboard.view_tracking_badge') }}</span
            >
          </template>
          <div
            ref="sourceChart"
            class="h-full w-full"
          />
        </ChartPanel>
      </div>
      <div class="col-span-1 lg:col-span-7">
        <ChartPanel
          :title="t('admin.dashboard.hot_content')"
          :tabs="topContentTabs"
          v-model:active-tab="topContentTab"
          :height="380"
          :loading="isLoading && !stats"
        >
          <div
            ref="topContentChart"
            class="h-full w-full"
          />
        </ChartPanel>
      </div>
    </div>
  </ScrollContainer>
</template>
