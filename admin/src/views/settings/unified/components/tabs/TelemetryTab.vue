<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import {
  NButton,
  NCard,
  NCode,
  NCollapse,
  NCollapseItem,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NPopconfirm,
  NScrollbar,
  NSpace,
  NSpin,
  NStatistic,
  NSwitch,
  NTag,
  NTimeline,
  NTimelineItem,
  useMessage,
} from 'naive-ui'
import { computed, onMounted, ref } from 'vue'

import { listSysConfigs, updateSysConfigs } from '@/services/sysconfig'
import {
  getTelemetrySnapshot,
  getTelemetryReportHistory,
  triggerTelemetryReport,
  resetTelemetryErrors,
} from '@/services/telemetry'
import { formatDate } from '@/utils/format'

import type { TelemetrySnapshot, TelemetryReportRecord } from '@/services/telemetry'

const message = useMessage()
const loading = ref(true)
const snapshot = ref<TelemetrySnapshot | null>(null)
const reportHistory = ref<TelemetryReportRecord[]>([])
const reporting = ref(false)
const enabled = ref(false)
const loadingToggle = ref(false)

async function fetchData() {
  loading.value = true
  try {
    const [snap, history, configTree] = await Promise.all([
      getTelemetrySnapshot(),
      getTelemetryReportHistory(),
      listSysConfigs(['telemetry.enabled']),
    ])
    snapshot.value = snap
    reportHistory.value = history.history || []
    // listSysConfigs returns a tree — find the key in root items or nested group items.
    const enabledCfg =
      configTree.items?.find((c) => c.key === 'telemetry.enabled') ??
      (configTree.groups ?? [])
        .flatMap((g) => g.items ?? [])
        .find((c) => c.key === 'telemetry.enabled')
    enabled.value = enabledCfg?.value === 'true' || enabledCfg?.value === true
  } catch {
    message.error(t('admin.service.load_failed'))
  } finally {
    loading.value = false
  }
}

async function toggleEnabled(val: boolean) {
  const prev = enabled.value
  loadingToggle.value = true
  enabled.value = val // optimistic update
  try {
    await updateSysConfigs([{ key: 'telemetry.enabled', value: String(val) }])
    message.success(val ? t('admin.telemetry.enabled') : t('admin.telemetry.disabled'))
    await fetchData()
  } catch {
    enabled.value = prev // rollback on failure
    message.error(t('admin.service.operation_failed'))
  } finally {
    loadingToggle.value = false
  }
}

async function doReportNow() {
  reporting.value = true
  try {
    const rec = await triggerTelemetryReport()
    if (rec.status === 'success') {
      message.success(t('admin.telemetry.report_success'))
    } else {
      message.warning(t('admin.telemetry.report_result', { status: rec.status, message: rec.message }))
    }
    await fetchData()
  } catch {
    message.error(t('admin.telemetry.report_failed'))
  } finally {
    reporting.value = false
  }
}

async function doReset() {
  try {
    await resetTelemetryErrors()
    message.success(t('admin.telemetry.errors_cleared'))
    await fetchData()
  } catch {
    message.error(t('admin.telemetry.clear_failed'))
  }
}

const featureList = computed(() => {
  if (!snapshot.value) return []
  const f = snapshot.value.instance.features
  return [
    { label: t('admin.telemetry.feature_federation'), enabled: f.federationEnabled },
    { label: t('admin.telemetry.feature_activitypub'), enabled: f.activityPubEnabled },
    { label: t('admin.telemetry.feature_email'), enabled: f.emailEnabled },
    { label: t('admin.telemetry.feature_turnstile'), enabled: f.turnstileEnabled },
    { label: t('admin.telemetry.feature_comments'), enabled: f.commentsDisabled },
  ]
})

function statusType(status: string): 'success' | 'error' | 'warning' | 'default' {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'error'
    case 'skipped':
      return 'warning'
    default:
      return 'default'
  }
}

onMounted(() => fetchData())
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <NCard
      size="small"
      :title="$t('admin.telemetry.title')"
    >
      <template #header-extra>
        <NSpace
          align="center"
          :size="16"
        >
          <NSwitch
            :value="enabled"
            :loading="loadingToggle"
            @update:value="toggleEnabled"
          >
            <template #checked>{{ $t('admin.telemetry.enable_reporting') }}</template>
            <template #unchecked>{{ $t('admin.telemetry.disabled') }}</template>
          </NSwitch>
          <NButton
            size="small"
            type="primary"
            :loading="reporting"
            :disabled="!enabled"
            @click="doReportNow"
          >
            {{ $t('admin.telemetry.report_now') }}
          </NButton>
          <NButton
            size="small"
            quaternary
            @click="fetchData"
          >
            {{ $t('admin.common.refresh') }}
          </NButton>
        </NSpace>
      </template>
      <p class="text-sm opacity-60">
        {{ $t('admin.telemetry.description') }}
      </p>
    </NCard>

    <NSpin
      v-if="loading && !snapshot"
      class="py-8"
    />

    <!-- Summary stats -->
    <div
      v-if="snapshot"
      class="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      <NCard size="small">
        <NStatistic
          :label="$t('admin.telemetry.unique_errors')"
          :value="snapshot.summary.uniqueErrors"
        />
      </NCard>
      <NCard size="small">
        <NStatistic
          :label="$t('admin.telemetry.total_errors')"
          :value="snapshot.summary.totalErrors"
        />
      </NCard>
      <NCard size="small">
        <NStatistic
          :label="$t('admin.telemetry.unique_panics')"
          :value="snapshot.summary.uniquePanics"
        />
      </NCard>
      <NCard size="small">
        <NStatistic
          :label="$t('admin.telemetry.total_panics')"
          :value="snapshot.summary.totalPanics"
        />
      </NCard>
    </div>

    <!-- Data preview -->
    <NCollapse v-if="snapshot">
      <NCollapseItem
        :title="$t('admin.telemetry.instance_info')"
        name="instance"
      >
        <NDescriptions
          :column="2"
          label-placement="left"
          bordered
          size="small"
        >
          <NDescriptionsItem :label="$t('admin.telemetry.instance_id')">{{
            snapshot.instance.instanceId
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.telemetry.version')">{{ snapshot.instance.version }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.telemetry.go_version')">{{ snapshot.instance.goVersion }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.telemetry.os')"
            >{{ snapshot.instance.os }}/{{ snapshot.instance.arch }}</NDescriptionsItem
          >
          <NDescriptionsItem :label="$t('admin.telemetry.deploy_mode')">{{ snapshot.instance.deployMode }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.telemetry.uptime')"
            >{{ Math.floor(snapshot.instance.uptimeSeconds / 3600) }}h</NDescriptionsItem
          >
        </NDescriptions>
        <div class="mt-2">
          <NSpace :size="6">
            <NTag
              v-for="f in featureList"
              :key="f.label"
              :type="f.enabled ? 'success' : 'default'"
              size="small"
            >
              {{ f.label }}
            </NTag>
          </NSpace>
        </div>
      </NCollapseItem>

      <NCollapseItem
        :title="$t('admin.telemetry.run_metrics')"
        name="metrics"
      >
        <NDescriptions
          :column="2"
          label-placement="left"
          bordered
          size="small"
        >
          <NDescriptionsItem :label="$t('admin.telemetry.articles_total')">{{
            snapshot.metrics.content.articlesTotal
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.telemetry.moments_total')">{{
            snapshot.metrics.content.momentsTotal
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.telemetry.comments_total')">{{
            snapshot.metrics.content.commentsTotal
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.telemetry.friend_links_total')">{{
            snapshot.metrics.content.friendLinksTotal
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.telemetry.requests_total')">{{
            snapshot.metrics.traffic.requestTotal
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.telemetry.error_rate_5xx')"
            >{{ (snapshot.metrics.traffic.errorRate5xx * 100).toFixed(2) }}%</NDescriptionsItem
          >
          <NDescriptionsItem :label="$t('admin.telemetry.p95_latency')"
            >{{ snapshot.metrics.traffic.p95LatencyMs.toFixed(0) }}ms</NDescriptionsItem
          >
          <NDescriptionsItem :label="$t('admin.telemetry.isr_renders')"
            >{{ snapshot.metrics.isr.renderSuccess }}/{{
              snapshot.metrics.isr.renderTotal
            }}</NDescriptionsItem
          >
          <NDescriptionsItem :label="$t('admin.telemetry.federation_outbound')">{{
            snapshot.metrics.federation.outboundTotal
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('admin.telemetry.ws_connections')">{{
            snapshot.metrics.realtime.wsConnectionsCurrent
          }}</NDescriptionsItem>
        </NDescriptions>
      </NCollapseItem>

      <NCollapseItem
        :title="$t('admin.telemetry.error_summary')"
        name="errors"
      >
        <NSpace vertical>
          <NPopconfirm @positive-click="doReset">
            <template #trigger>
              <NButton
                size="tiny"
                quaternary
                type="warning"
                >{{ $t('admin.telemetry.clear_errors') }}</NButton
              >
            </template>
            {{ $t('admin.telemetry.clear_confirm') }}
          </NPopconfirm>
          <template v-if="snapshot.errors?.length">
            <NCard
              v-for="e in snapshot.errors"
              :key="e.fingerprint"
              size="small"
              class="!text-xs"
            >
              <div class="flex items-center justify-between gap-2">
                <NTag
                  size="tiny"
                  :type="e.bizCode === 'SERVER_ERROR' ? 'error' : 'warning'"
                  >{{ e.bizCode || e.kind }}</NTag
                >
                <span class="opacity-50">x{{ e.count }}</span>
              </div>
              <div class="mt-1 font-mono text-xs opacity-70">{{ e.location }}</div>
              <div class="mt-1 text-xs opacity-50">{{ e.sampleMessage }}</div>
            </NCard>
          </template>
          <NEmpty
            v-else
            :description="$t('admin.telemetry.no_errors')"
          />
          <template v-if="snapshot.panics?.length">
            <div class="mt-2 text-sm font-medium">Panics</div>
            <NCard
              v-for="p in snapshot.panics"
              :key="p.fingerprint"
              size="small"
              class="!text-xs"
            >
              <div class="flex items-center justify-between gap-2">
                <NTag
                  size="tiny"
                  type="error"
                  >PANIC</NTag
                >
                <span class="opacity-50">x{{ p.count }}</span>
              </div>
              <div class="mt-1 font-mono text-xs opacity-70">{{ p.location }}</div>
              <div class="mt-1 text-xs opacity-50">{{ p.sampleMessage }}</div>
            </NCard>
          </template>
        </NSpace>
      </NCollapseItem>

      <NCollapseItem
        :title="$t('admin.telemetry.raw_json')"
        name="raw"
      >
        <NScrollbar style="max-height: 400px">
          <NCode
            :code="JSON.stringify(snapshot, null, 2)"
            language="json"
          />
        </NScrollbar>
      </NCollapseItem>
    </NCollapse>

    <!-- Report history -->
    <NCard
      size="small"
      :title="$t('admin.telemetry.report_history')"
    >
      <NTimeline v-if="reportHistory.length">
        <NTimelineItem
          v-for="(rec, idx) in reportHistory"
          :key="idx"
          :type="statusType(rec.status)"
          :title="rec.status.toUpperCase()"
          :time="formatDate(rec.timestamp)"
        >
          <span class="text-xs opacity-70">
            {{ rec.message }}
            <template v-if="rec.durationMs"> · {{ rec.durationMs }}ms</template>
            <template v-if="rec.statusCode"> · HTTP {{ rec.statusCode }}</template>
          </span>
        </NTimelineItem>
      </NTimeline>
      <NEmpty
        v-else
        :description="$t('admin.telemetry.no_reports')"
      />
    </NCard>
  </div>
</template>
