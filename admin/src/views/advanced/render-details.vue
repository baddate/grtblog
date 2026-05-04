<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowClockwise24Regular, Flash24Regular, Rocket24Regular } from '@vicons/fluent'
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NIcon,
  NInput,
  NInputGroup,
  NInputGroupLabel,
  NSpace,
  NSpin,
  NSwitch,
  NTag,
  NTimeline,
  NTimelineItem,
  NTree,
  useMessage,
} from 'naive-ui'
import { computed, h, ref } from 'vue'

import { ScrollContainer } from '@/components'
import {
  bootstrapObservabilityPages,
  getObservabilityPages,
  invalidateObservabilityPages,
} from '@/services/observability'

import type {
  ObservabilityInvalidateReport,
  ObservabilityRenderRecord,
} from '@/types/observability'
import type { DataTableColumns, TreeOption } from 'naive-ui'

defineOptions({
  name: 'AdvancedRenderDetails',
})

const message = useMessage()
const queryClient = useQueryClient()

const trackedLimit = ref(200)
const recentLimit = ref(30)
const routeLimit = ref(500)
const source = ref('admin:render-details')
const syncRender = ref(true)
const depKeysInput = ref('')
const urlsInput = ref('')
const lastInvalidateReport = ref<ObservabilityInvalidateReport | null>(null)

const { data: pageStateData, isPending } = useQuery({
  queryKey: ['obs-pages', trackedLimit, recentLimit, routeLimit],
  queryFn: () =>
    getObservabilityPages({
      tracked_limit: trackedLimit.value,
      recent_limit: recentLimit.value,
      route_limit: routeLimit.value,
    }),
  refetchInterval: 15000,
})

const bootstrapMutation = useMutation({
  mutationFn: bootstrapObservabilityPages,
  onSuccess: (data) => {
    message.success(t('admin.observability.bootstrap_complete', { total: data.totalRoutes, rendered: data.renderedCount }))
    queryClient.invalidateQueries({ queryKey: ['obs-pages'] })
  },
})

const invalidateMutation = useMutation({
  mutationFn: invalidateObservabilityPages,
  onSuccess: (data) => {
    lastInvalidateReport.value = data
    message.success(
      t('admin.observability.invalidate_complete', { candidates: ensureArray(data.candidateUrls).length, rendered: ensureArray(data.rendered).length }),
    )
    queryClient.invalidateQueries({ queryKey: ['obs-pages'] })
  },
})

const snapshot = computed(() => pageStateData.value?.snapshot)
const routeCatalog = computed(() => pageStateData.value?.routeCatalog)
const bootstrapReport = computed(() => snapshot.value?.lastBootstrap)
const bootstrapPending = computed(() => bootstrapMutation.isPending.value)
const invalidatePending = computed(() => invalidateMutation.isPending.value)

const renderColumns: DataTableColumns<ObservabilityRenderRecord> = [
  {
    title: t('admin.observability.page'),
    key: 'urlPath',
    minWidth: 240,
    ellipsis: { tooltip: true },
  },
  {
    title: t('admin.common.status'),
    key: 'status',
    width: 100,
    render: (row) =>
      h(
        NTag,
        {
          size: 'small',
          type:
            row.status === 'error' ? 'error' : row.status === 'not_found' ? 'warning' : 'success',
        },
        { default: () => row.status },
      ),
  },
  {
    title: t('admin.observability.trigger_source'),
    key: 'trigger',
    width: 180,
    ellipsis: { tooltip: true },
  },
  {
    title: t('admin.observability.deps_count'),
    key: 'depsCount',
    width: 90,
    render: (row) => row.deps?.length ?? 0,
  },
  {
    title: t('admin.observability.updated_files'),
    key: 'updatedFiles',
    width: 90,
    render: (row) => row.updatedFiles?.length ?? 0,
  },
  {
    title: t('admin.observability.duration'),
    key: 'durationMs',
    width: 90,
    render: (row) => `${row.durationMs}ms`,
  },
]

const treeOptions = computed<TreeOption[]>(() => {
  const root = pageStateData.value?.tree
  if (!root) {
    return []
  }
  return [toTreeOption(root)]
})

function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

function toTreeOption(node: any): TreeOption {
  const details: string[] = []
  if (node.routePath) details.push(node.routePath)
  if (node.tracked) details.push(`deps:${node.deps?.length ?? 0}`)
  if (node.hasHtml) details.push('html')
  if (node.hasData) details.push('data')
  const label = details.length > 0 ? `${node.name} (${details.join(' | ')})` : node.name
  return {
    key: `${node.path}:${node.name}`,
    label,
    children: (node.children ?? []).map((child: any) => toTreeOption(child)),
    isLeaf: node.nodeType === 'file',
  }
}

function splitByLine(input: string) {
  return input
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function refreshPageState() {
  queryClient.invalidateQueries({ queryKey: ['obs-pages'] })
}

function triggerBootstrap() {
  bootstrapMutation.mutate()
}

function triggerInvalidate() {
  const depKeys = splitByLine(depKeysInput.value)
  const urls = splitByLine(urlsInput.value)
  if (depKeys.length === 0 && urls.length === 0) {
    message.warning(t('admin.observability.fill_depkeys_or_urls'))
    return
  }
  invalidateMutation.mutate({
    depKeys,
    urls,
    source: source.value.trim() || 'admin:render-details',
    syncRender: syncRender.value,
  })
}

</script>

<template>
  <ScrollContainer wrapper-class="p-4 md:p-6 space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-2">
        <NIcon
          :component="Flash24Regular"
          class="text-xl text-primary"
        />
        <div class="text-lg font-medium">{{ $t('admin.observability.render_details') }}</div>
      </div>
      <div class="flex items-center gap-2">
        <NButton
          size="small"
          secondary
          :loading="isPending"
          @click="refreshPageState"
        >
          <template #icon><NIcon :component="ArrowClockwise24Regular" /></template>
          {{ $t('admin.common.refresh') }}
        </NButton>
        <NButton
          size="small"
          type="warning"
          :loading="bootstrapPending"
          @click="triggerBootstrap"
        >
          <template #icon><NIcon :component="Rocket24Regular" /></template>
          {{ $t('admin.observability.cold_bootstrap') }}
        </NButton>
      </div>
    </div>

    <NSpin :show="isPending">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <NCard
          :title="$t('admin.observability.isr_status')"
          class="lg:col-span-6"
        >
          <NDescriptions
            :column="2"
            size="small"
          >
            <NDescriptionsItem :label="$t('admin.observability.queue_depth')">{{ snapshot?.queueDepth ?? 0 }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.observability.dep_keys')">{{ snapshot?.depKeyCount ?? 0 }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.observability.url_keys')">{{ snapshot?.urlKeyCount ?? 0 }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.observability.tracked_pages')">{{
              snapshot?.trackedPages?.length ?? 0
            }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.observability.total_routes')">{{ routeCatalog?.total ?? 0 }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.observability.routes_truncated')">{{
              routeCatalog?.truncated ? $t('admin.common.yes') : $t('admin.common.no')
            }}</NDescriptionsItem>
          </NDescriptions>
          <div class="mt-3 text-xs text-neutral-500">
            {{ $t('admin.observability.last_bootstrap') }}：{{
              bootstrapReport?.finishedAt
                ? new Date(bootstrapReport.finishedAt).toLocaleString()
                : $t('admin.common.none')
            }}
          </div>
        </NCard>

        <NCard
          :title="$t('admin.observability.manual_invalidate')"
          class="lg:col-span-6"
        >
          <div class="space-y-3">
            <NInputGroup>
              <NInputGroupLabel>source</NInputGroupLabel>
              <NInput
                v-model:value="source"
                placeholder="admin:render-details"
              />
            </NInputGroup>
            <NInput
              v-model:value="depKeysInput"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
              :placeholder="$t('admin.observability.placeholder_dep_keys')"
            />
            <NInput
              v-model:value="urlsInput"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
              :placeholder="$t('admin.observability.placeholder_urls')"
            />
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-xs text-neutral-500">
                <span>{{ $t('admin.observability.sync_render') }}</span>
                <NSwitch v-model:value="syncRender" />
              </div>
              <NButton
                type="primary"
                :loading="invalidatePending"
                @click="triggerInvalidate"
              >
                {{ $t('admin.observability.trigger_update') }}
              </NButton>
            </div>
          </div>
        </NCard>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <NCard
          :title="$t('admin.observability.page_tree')"
          class="lg:col-span-7"
        >
          <NEmpty
            v-if="!treeOptions.length"
            :description="$t('admin.observability.no_page_tree')"
          />
          <NTree
            v-else
            block-line
            expand-on-click
            :default-expand-all="false"
            :data="treeOptions"
          />
        </NCard>

        <NCard
          :title="$t('admin.observability.route_catalog')"
          class="lg:col-span-5"
        >
          <NEmpty
            v-if="!routeCatalog?.items?.length"
            :description="$t('admin.observability.no_route_catalog')"
          />
          <NSpace
            v-else
            size="small"
          >
            <NTag
              v-for="item in routeCatalog.items"
              :key="item"
              size="small"
              type="default"
            >
              {{ item }}
            </NTag>
          </NSpace>
          <NAlert
            v-if="routeCatalog?.truncated"
            class="mt-3"
            type="info"
            :show-icon="false"
          >
            {{ $t('admin.observability.routes_truncated_hint') }}
          </NAlert>
        </NCard>
      </div>

      <NCard :title="$t('admin.observability.invalidate_receipt')">
        <NEmpty
          v-if="!lastInvalidateReport"
          :description="$t('admin.observability.no_invalidate_yet')"
        />
        <div
          v-else
          class="space-y-3"
        >
          <NDescriptions
            :column="3"
            size="small"
          >
            <NDescriptionsItem :label="$t('admin.observability.source')">{{ lastInvalidateReport.source }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.observability.candidate_pages')">{{
              ensureArray(lastInvalidateReport.candidateUrls).length
            }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.observability.rendered_count')">{{
              ensureArray(lastInvalidateReport.rendered).length
            }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.observability.matched_urls')">{{
              ensureArray(lastInvalidateReport.matchedUrls).length
            }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.observability.enqueued_urls')">{{
              ensureArray(lastInvalidateReport.enqueuedUrls).length
            }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.observability.queue_depth')">{{
              lastInvalidateReport.queueDepth
            }}</NDescriptionsItem>
          </NDescriptions>
          <NDataTable
            :columns="renderColumns"
            :data="ensureArray(lastInvalidateReport.rendered)"
            :pagination="{ pageSize: 8 }"
            size="small"
          />
        </div>
      </NCard>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NCard :title="$t('admin.observability.recent_invalidations')">
          <NEmpty
            v-if="!snapshot?.recentInvalidations?.length"
            :description="$t('admin.observability.no_invalidations')"
          />
          <NTimeline v-else>
            <NTimelineItem
              v-for="item in snapshot.recentInvalidations"
              :key="`${item.generatedAt}:${item.source}`"
              :title="item.source"
              :time="new Date(item.generatedAt).toLocaleString()"
              type="warning"
            >
              <div class="text-xs text-neutral-500">
                depKeys: {{ ensureArray(item.depKeys).join(', ') || 'none' }}
              </div>
              <div class="text-xs text-neutral-500">
                candidate: {{ ensureArray(item.candidateUrls).length }} / rendered:
                {{ ensureArray(item.renderedUrls).length }}
              </div>
            </NTimelineItem>
          </NTimeline>
        </NCard>

        <NCard :title="$t('admin.observability.recent_renders')">
          <NEmpty
            v-if="!snapshot?.recentRenderActivity?.length"
            :description="$t('admin.observability.no_renders')"
          />
          <NTimeline v-else>
            <NTimelineItem
              v-for="item in snapshot.recentRenderActivity"
              :key="`${item.generatedAt}:${item.urlPath}:${item.trigger}`"
              :title="item.urlPath"
              :time="new Date(item.generatedAt).toLocaleString()"
              :type="item.status === 'error' ? 'error' : 'success'"
            >
              <div class="text-xs text-neutral-500">
                {{ item.trigger }} / {{ item.status }} / {{ item.durationMs }}ms
              </div>
              <div class="text-xs text-neutral-500">
                deps: {{ item.deps?.length ?? 0 }}, updated: {{ item.updatedFiles?.length ?? 0 }}
              </div>
            </NTimelineItem>
          </NTimeline>
        </NCard>
      </div>
    </NSpin>
  </ScrollContainer>
</template>
