<script setup lang="ts">
import { ArrowClockwise24Regular } from '@vicons/fluent'
import { useIntervalFn } from '@vueuse/core'
import {
  NCard,
  NGrid,
  NGi,
  NProgress,
  NStatistic,
  NSpace,
  NTag,
  NEmpty,
  NSpin,
  NIcon,
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NNumberAnimation,
  NResult,
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { ref, onMounted, computed } from 'vue'

import { PageHeader, ScrollContainer } from '@/components'
import { getSystemStatus } from '@/services/system'
import { formatBytes } from '@/utils/format'

import type { SystemStatus } from '@/services/system'

defineOptions({
  name: 'SystemMonitor',
})

const loading = ref(true)
const status = ref<SystemStatus | null>(null)
const lastUpdated = ref<Date>(new Date())

const fetchData = async () => {
  try {
    const data = await getSystemStatus()
    status.value = data
    lastUpdated.value = new Date()
  } catch (err) {
    console.error('Failed to fetch system status:', err)
  } finally {
    loading.value = false
  }
}

// Auto-refresh every 10 seconds
useIntervalFn(fetchData, 10000)

onMounted(() => {
  fetchData()
})

const memoryPercentage = computed(() => {
  if (!status.value) return 0
  return Math.round((status.value.memory.alloc / status.value.memory.sys) * 100)
})

const diskPercentage = computed(() => {
  if (!status.value) return 0
  if (status.value.disk.all === 0) return 0
  return Math.round((status.value.disk.used / status.value.disk.all) * 100)
})

const getStatusType = (usage: number) => {
  if (usage > 90) return 'error'
  if (usage > 75) return 'warning'
  return 'success'
}
</script>

<template>
  <ScrollContainer wrapper-class="p-4 md:p-6 space-y-6">
    <!-- Header -->
    <PageHeader
      :title="$t('admin.monitor.title')"
      icon="ph--desktop"
      :description="$t('admin.monitor.description')"
    >
      <template #description>
        <p class="mt-1 pl-1 text-sm text-gray-500">
          {{ $t('admin.monitor.description') }}
          <span class="ml-2 text-xs opacity-75">{{ $t('admin.monitor.updated_at', { time: lastUpdated.toLocaleTimeString() }) }} {{ lastUpdated.toLocaleTimeString() }}</span>
        </p>
      </template>
      <template #actions>
        <NButton
          :loading="loading"
          size="small"
          secondary
          round
          @click="fetchData"
        >
          <template #icon>
            <NIcon :component="ArrowClockwise24Regular" />
          </template>
          {{ $t('admin.common.refresh') }}
        </NButton>
      </template>
    </PageHeader>

    <NSpin :show="loading && !status">
      <div
        v-if="status"
        class="space-y-6"
      >
        <!-- Status Overview -->
        <NGrid
          :x-gap="16"
          :y-gap="16"
          cols="1 s:2 m:4"
          responsive="screen"
        >
          <NGi>
            <NCard
              size="small"
              :bordered="false"
              class="h-full"
            >
              <NStatistic :label="$t('admin.system.uptime')">
                {{ status.app.uptime }}
              </NStatistic>
            </NCard>
          </NGi>
          <NGi>
            <NCard
              size="small"
              :bordered="false"
              class="h-full"
            >
              <NStatistic :label="$t('admin.system.go_version')">
                {{ status.app.goVersion }}
              </NStatistic>
            </NCard>
          </NGi>
          <NGi>
            <NCard
              size="small"
              :bordered="false"
              class="h-full"
            >
              <NStatistic :label="$t('admin.monitor.cpu_cores')">
                <NNumberAnimation
                  :from="0"
                  :to="status.cpu.cores"
                />
                <template #suffix>
                  <span class="text-sm text-gray-400">Cores</span>
                </template>
              </NStatistic>
            </NCard>
          </NGi>
          <NGi>
            <NCard
              size="small"
              :bordered="false"
              class="h-full"
            >
              <NStatistic :label="$t('admin.monitor.os')">
                {{ status.platform.os }}
                <template #suffix>
                  <span class="text-xs text-gray-400">/ {{ status.platform.arch }}</span>
                </template>
              </NStatistic>
            </NCard>
          </NGi>
        </NGrid>

        <!-- Detailed Metrics -->
        <NGrid
          :x-gap="16"
          :y-gap="16"
          cols="1 m:2"
          responsive="screen"
        >
          <!-- Memory -->
          <NGi>
            <NCard
              :title="$t('admin.monitor.memory_overview')"
              :bordered="false"
              size="small"
            >
              <div class="mb-6 flex items-center justify-between px-2">
                <div class="space-y-1">
                  <div class="text-3xl font-light text-primary">{{ memoryPercentage }}%</div>
                  <div class="text-xs text-gray-500">{{ $t('admin.monitor.current_usage') }}</div>
                </div>
                <NProgress
                  type="circle"
                  :percentage="memoryPercentage"
                  :status="getStatusType(memoryPercentage)"
                  :radius="40"
                  :stroke-width="6"
                  :show-indicator="false"
                />
              </div>
              <NDescriptions
                :column="2"
                size="small"
                label-placement="left"
                content-style="text-align: right;"
              >
                <NDescriptionsItem :label="$t('admin.monitor.memory_alloc')">{{
                  formatBytes(status.memory.alloc)
                }}</NDescriptionsItem>
                <NDescriptionsItem :label="$t('admin.monitor.memory_total')">{{
                  formatBytes(status.memory.totalAlloc)
                }}</NDescriptionsItem>
                <NDescriptionsItem :label="$t('admin.monitor.memory_sys')">{{
                  formatBytes(status.memory.sys)
                }}</NDescriptionsItem>
                <NDescriptionsItem :label="$t('admin.monitor.gc_count')">{{ status.memory.numGC }}</NDescriptionsItem>
              </NDescriptions>
            </NCard>
          </NGi>

          <!-- Disk -->
          <NGi>
            <NCard
              :title="$t('admin.monitor.disk_space')"
              :bordered="false"
              size="small"
            >
              <div class="mb-6 flex items-center justify-between px-2">
                <div class="space-y-1">
                  <div class="text-3xl font-light text-primary">{{ diskPercentage }}%</div>
                  <div class="text-xs text-gray-500">{{ $t('admin.monitor.used') }}</div>
                </div>
                <!-- Visualization of disk space -->
                <div class="w-1/3">
                  <NProgress
                    type="line"
                    :percentage="diskPercentage"
                    :status="getStatusType(diskPercentage)"
                    processing
                    :height="8"
                  />
                </div>
              </div>
              <NDescriptions
                :column="1"
                size="small"
                label-placement="left"
                content-style="text-align: right;"
              >
                <NDescriptionsItem :label="$t('admin.monitor.mount_path')">
                  <span
                    class="inline-block max-w-37.5 truncate align-bottom"
                    :title="status.disk.path"
                    >{{ status.disk.path }}</span
                  >
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('admin.monitor.capacity_status')">
                  {{ formatBytes(status.disk.used) }} / {{ formatBytes(status.disk.all) }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('admin.monitor.app_storage')">
                  {{ formatBytes(status.storage.size) }}
                  <span class="ml-1 text-xs text-gray-400">({{ status.storage.path }})</span>
                </NDescriptionsItem>
              </NDescriptions>
            </NCard>
          </NGi>
        </NGrid>

        <!-- Database & Redis (Full Detail) -->
        <NGrid
          :x-gap="16"
          :y-gap="16"
          cols="1"
          responsive="screen"
        >
          <NGi>
            <NCard
              :title="$t('admin.monitor.service_status')"
              :bordered="false"
              size="small"
            >
              <NGrid
                :x-gap="24"
                :y-gap="24"
                cols="1 m:2"
              >
                <NGi>
                  <div class="mb-4 flex items-center gap-3">
                    <span class="text-base font-medium">PostgreSQL</span>
                    <NTag
                      :type="status.database.status === 'connected' ? 'success' : 'error'"
                      size="small"
                      round
                      bordered
                    >
                      {{ status.database.status }}
                    </NTag>
                  </div>
                  <NDescriptions
                    :column="2"
                    size="small"
                    label-placement="left"
                  >
                    <NDescriptionsItem :label="$t('admin.monitor.driver')">{{ status.database.driver }}</NDescriptionsItem>
                    <NDescriptionsItem :label="$t('admin.monitor.version')">{{
                      status.database.version || '-'
                    }}</NDescriptionsItem>
                    <NDescriptionsItem :label="$t('admin.monitor.open_connections')">{{
                      status.database.poolStats.openConnections
                    }}</NDescriptionsItem>
                    <NDescriptionsItem :label="$t('admin.monitor.in_use')">{{
                      status.database.poolStats.inUse
                    }}</NDescriptionsItem>
                    <NDescriptionsItem :label="$t('admin.monitor.idle_connections')">{{
                      status.database.poolStats.idle
                    }}</NDescriptionsItem>
                    <NDescriptionsItem :label="$t('admin.monitor.max_connections')">{{
                      status.database.poolStats.maxOpenConnections
                    }}</NDescriptionsItem>
                    <NDescriptionsItem :label="$t('admin.monitor.wait_count')">{{
                      status.database.poolStats.waitCount
                    }}</NDescriptionsItem>
                  </NDescriptions>
                </NGi>
                <!-- Divider for mobile/desktop handled by grid gap usually, but manual divider can help if needed. Naive grid handles this well. -->
                <NGi>
                  <div
                    class="h-full border-t border-gray-100 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6 dark:border-gray-800"
                  >
                    <div class="mb-4 flex items-center gap-3">
                      <span class="text-base font-medium">Redis</span>
                      <NTag
                        :type="status.redis.status === 'connected' ? 'success' : 'error'"
                        size="small"
                        round
                        bordered
                      >
                        {{ status.redis.status }}
                      </NTag>
                    </div>
                    <NDescriptions
                      :column="1"
                      size="small"
                      label-placement="left"
                    >
                      <NDescriptionsItem :label="$t('admin.monitor.version')">{{
                        status.redis.version || '-'
                      }}</NDescriptionsItem>
                      <NDescriptionsItem :label="$t('admin.monitor.redis_memory')">{{
                        status.redis.usedMemory
                      }}</NDescriptionsItem>
                      <NDescriptionsItem :label="$t('admin.common.status')">
                        {{
                          status.redis.status === 'connected' ? $t('admin.monitor.redis_connected') : $t('admin.monitor.redis_disconnected')
                        }}
                      </NDescriptionsItem>
                    </NDescriptions>
                  </div>
                </NGi>
              </NGrid>
            </NCard>
          </NGi>
        </NGrid>

        <NGrid
          :x-gap="16"
          :y-gap="16"
          cols="1"
          responsive="screen"
        >
          <NGi>
            <NCard
              :title="$t('admin.monitor.component_health')"
              :bordered="false"
              size="small"
            >
              <NEmpty
                v-if="!status.components?.length"
                :description="$t('admin.monitor.no_components')"
              />
              <NSpace v-else>
                <NTag
                  v-for="item in status.components"
                  :key="item.name"
                  :type="
                    item.healthy
                      ? 'success'
                      : item.status === 'not_configured'
                        ? 'warning'
                        : 'error'
                  "
                  size="small"
                  round
                  bordered
                >
                  {{ item.name }} · {{ item.status }} · v{{ item.version || 'n/a' }}
                </NTag>
              </NSpace>
            </NCard>
          </NGi>
        </NGrid>

        <!-- Raw Info Footer (Collapsible or subtle) -->
        <div class="text-center">
          <span class="text-xs text-gray-400"
            >{{ $t('admin.system.version') }}: {{ status.app.version
            }}{{ status.app.commit ? ` (${status.app.commit})` : '' }} | {{ $t('admin.monitor.start_time') }}:
            {{ new Date(status.app.startTime).toLocaleString() }}</span
          >
        </div>
      </div>
      <NResult
        v-else-if="!loading"
        status="info"
        :title="$t('admin.common.no_data')"
        :description="$t('admin.monitor.no_data_desc')"
        class="mt-20"
      >
        <template #footer>
          <NButton @click="fetchData">{{ $t('admin.common.retry') }}</NButton>
        </template>
      </NResult>
    </NSpin>
  </ScrollContainer>
</template>
