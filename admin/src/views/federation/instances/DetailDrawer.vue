<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { useQuery } from '@tanstack/vue-query'
import { useWindowSize } from '@vueuse/core'
import {
  NDrawer,
  NDrawerContent,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NCode,
  NSpin,
  NTabs,
  NTabPane,
  NEmpty,
} from 'naive-ui'
import { computed, watch } from 'vue'

import { ScrollContainer } from '@/components'
import { getFederationInstanceDetail } from '@/services/federation-admin'

import type { FederationInstanceDetailResp } from '@/types/federation'

const props = defineProps<{
  show: boolean
  instanceId?: number
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const { width } = useWindowSize()
const drawerWidth = computed(() => (width.value < 640 ? '100%' : 600))

const {
  data: instance,
  isPending,
  refetch,
} = useQuery({
  queryKey: ['federation-instance-detail', props.instanceId],
  queryFn: () => getFederationInstanceDetail(props.instanceId!),
  enabled: computed(() => !!props.instanceId && props.show),
})

watch(
  () => props.show,
  (newVal) => {
    if (newVal && props.instanceId) {
      refetch()
    }
  },
)
</script>

<template>
  <NDrawer
    :show="show"
    @update:show="(val) => emit('update:show', val)"
    :width="drawerWidth"
  >
    <NDrawerContent
      :title="$t('admin.federation.instance_detail')"
      closable
      :native-scrollbar="false"
    >
      <ScrollContainer>
        <div
          v-if="isPending"
          class="flex justify-center p-8"
        >
          <NSpin />
        </div>
        <div
          v-else-if="instance"
          class="space-y-6 p-4"
        >
          <NDescriptions
            bordered
            :column="1"
            label-placement="left"
            :title="$t('admin.federation.basic_info')"
          >
            <NDescriptionsItem :label="$t('admin.table.id')">{{ instance.id }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.federation.domain')">{{ instance.base_url }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.common.name')">{{ instance.name || '-' }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.common.description')">{{ instance.description || '-' }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.federation.protocol_version')">{{
              instance.protocol_version || '-'
            }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.common.status')">
              <NTag
                :type="
                  instance.status === 'active'
                    ? 'success'
                    : instance.status === 'blocked'
                      ? 'error'
                      : 'warning'
                "
              >
                {{ instance.status }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.federation.last_seen')">{{
              instance.last_seen_at ? new Date(instance.last_seen_at).toLocaleString() : '-'
            }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.common.created_at')">{{
              new Date(instance.created_at).toLocaleString()
            }}</NDescriptionsItem>
          </NDescriptions>

          <NDescriptions
            bordered
            :column="1"
            label-placement="left"
            :title="$t('admin.federation.tech_details')"
          >
            <NDescriptionsItem :label="$t('admin.federation.key_id')">{{ instance.key_id || '-' }}</NDescriptionsItem>
            <NDescriptionsItem
              :label="$t('admin.federation.remote_error')"
              v-if="instance.remote_error"
            >
              <span class="text-red-500">{{ instance.remote_error }}</span>
            </NDescriptionsItem>
          </NDescriptions>

          <NDescriptions
            bordered
            :column="1"
            label-placement="left"
            :title="$t('admin.federation.instance_metadata')"
            v-if="instance.manifest?.software"
          >
            <NDescriptionsItem :label="$t('admin.federation.software')">
              {{ instance.manifest.software?.name || '-' }}
              {{ instance.manifest.software?.version || '' }}
            </NDescriptionsItem>
          </NDescriptions>

          <NDescriptions
            bordered
            :column="1"
            label-placement="left"
            :title="$t('admin.federation.policy_config')"
            v-if="instance.policies"
          >
            <NDescriptionsItem :label="$t('admin.federation.allow_citation')">
              <NTag
                :type="instance.policies.allow_citation ? 'success' : 'error'"
                size="small"
              >
                {{ instance.policies.allow_citation ? $t('admin.federation.allow') : $t('admin.federation.disallow') }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.federation.allow_mention')">
              <NTag
                :type="instance.policies.allow_mention ? 'success' : 'error'"
                size="small"
              >
                {{ instance.policies.allow_mention ? $t('admin.federation.allow') : $t('admin.federation.disallow') }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.federation.auto_approve')">
              <NTag
                :type="instance.policies.auto_approve_friendlink_citation ? 'success' : 'warning'"
                size="small"
              >
                {{ instance.policies.auto_approve_friendlink_citation ? $t('admin.federation.enabled') : $t('admin.federation.disabled') }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.federation.require_https')">
              <NTag
                :type="instance.policies.require_https ? 'success' : 'warning'"
                size="small"
              >
                {{ instance.policies.require_https ? $t('admin.federation.enabled') : $t('admin.federation.disabled') }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('admin.federation.max_cache_age')">
              {{ instance.policies.max_cache_age }} {{ $t('admin.federation.seconds') }}
            </NDescriptionsItem>
          </NDescriptions>

          <div v-if="instance.public_key">
            <h3 class="mb-2 font-bold">{{ $t('admin.federation.public_key') }}</h3>
            <NCode
              :code="instance.public_key"
              language="text"
              word-wrap
              class="rounded bg-gray-100 p-2 text-xs dark:bg-gray-800"
            />
          </div>

          <NTabs
            type="line"
            animated
          >
            <NTabPane
              name="manifest"
              tab="Manifest"
            >
              <NCode
                v-if="instance.manifest"
                :code="JSON.stringify(instance.manifest, null, 2)"
                language="json"
                word-wrap
                class="rounded bg-gray-100 p-2 text-xs dark:bg-gray-800"
              />
              <NEmpty
                v-else
                :description="$t('admin.common.no_data')"
              />
            </NTabPane>
            <NTabPane
              name="endpoints"
              tab="Endpoints"
            >
              <NCode
                v-if="instance.endpoints"
                :code="JSON.stringify(instance.endpoints, null, 2)"
                language="json"
                word-wrap
                class="rounded bg-gray-100 p-2 text-xs dark:bg-gray-800"
              />
              <NEmpty
                v-else
                :description="$t('admin.common.no_data')"
              />
            </NTabPane>
            <NTabPane
              name="features"
              tab="Features"
            >
              <NCode
                v-if="instance.features"
                :code="JSON.stringify(instance.features, null, 2)"
                language="json"
                word-wrap
                class="rounded bg-gray-100 p-2 text-xs dark:bg-gray-800"
              />
              <NEmpty
                v-else
                :description="$t('admin.common.no_data')"
              />
            </NTabPane>
          </NTabs>
        </div>
        <div
          v-else
          class="flex justify-center p-8"
        >
          <NEmpty :description="$t('admin.federation.instance_not_found')" />
        </div>
      </ScrollContainer>
    </NDrawerContent>
  </NDrawer>
</template>
