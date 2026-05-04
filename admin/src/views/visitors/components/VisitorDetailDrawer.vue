<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import {
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NSpace,
  NTag,
  NText,
} from 'naive-ui'

import { formatDate } from '@/utils/format'

const { t } = useI18n()

import type { VisitorProfile, VisitorRecentComment } from '@/types/visitors'

defineProps<{
  visible: boolean
  loading: boolean
  profile: VisitorProfile | null
  recentComments: VisitorRecentComment[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const statusTagTypeMap: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  blocked: 'default',
}
</script>

<template>
  <NDrawer
    :show="visible"
    width="760"
    @update:show="emit('update:visible', $event)"
  >
    <NDrawerContent
      :title="t('admin.visitor.profile_management')"
      :native-scrollbar="false"
    >
      <div
        v-if="loading"
        class="py-8 text-center"
      >
        <NText depth="3">{{ $t('admin.common.loading') }}</NText>
      </div>

      <template v-else-if="profile">
        <NDescriptions
          bordered
          label-placement="left"
          :column="2"
          class="mb-4"
        >
          <NDescriptionsItem :label="t('admin.visitor.visitor_id')"
            ><code>{{ profile.visitorId }}</code></NDescriptionsItem
          >
          <NDescriptionsItem :label="t('admin.visitor.nickname')">{{ profile.nickName || '-' }}</NDescriptionsItem>
          <NDescriptionsItem :label="t('admin.visitor.email')">{{ profile.email || '-' }}</NDescriptionsItem>
          <NDescriptionsItem :label="t('admin.visitor.website')">
            <a
              v-if="profile.website"
              :href="profile.website"
              target="_blank"
              class="text-primary hover:underline"
              >{{ profile.website }}</a
            >
            <span v-else>-</span>
          </NDescriptionsItem>
          <NDescriptionsItem :label="t('admin.visitor.ip')">{{ profile.ip || '-' }}</NDescriptionsItem>
          <NDescriptionsItem :label="t('admin.visitor.location')">{{ profile.location || '-' }}</NDescriptionsItem>
          <NDescriptionsItem :label="t('admin.visitor.browser_platform')">{{
            [profile.browser, profile.platform].filter(Boolean).join(' / ') || '-'
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="t('admin.visitor.first_visit')">{{
            formatDate(profile.firstSeenAt)
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="t('admin.visitor.last_visit')">{{
            formatDate(profile.lastSeenAt)
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="t('admin.visitor.last_viewed')">{{
            formatDate(profile.lastViewedAt)
          }}</NDescriptionsItem>
          <NDescriptionsItem :label="t('admin.visitor.last_liked')">{{
            formatDate(profile.lastLikedAt)
          }}</NDescriptionsItem>
        </NDescriptions>

        <NSpace class="mb-4">
          <NTag type="info">{{ t('admin.visitor.view_count', { count: profile.totalViews }) }}</NTag>
          <NTag type="info">{{ t('admin.visitor.view_items', { count: profile.uniqueViewItems }) }}</NTag>
          <NTag type="success">{{ t('admin.visitor.like_count', { count: profile.totalLikes }) }}</NTag>
          <NTag type="success">{{ t('admin.visitor.like_items', { count: profile.uniqueLikedItems }) }}</NTag>
          <NTag type="warning">{{ t('admin.visitor.comment_count', { count: profile.totalComments }) }}</NTag>
        </NSpace>

        <NCard
          :title="t('admin.visitor.recent_comments')"
          size="small"
        >
          <div
            v-if="recentComments.length === 0"
            class="py-4 text-center text-[var(--text-color-3)]"
          >
            {{ $t('admin.visitor.no_comments') }}
          </div>
          <NSpace
            v-else
            vertical
            :size="12"
          >
            <div
              v-for="item in recentComments"
              :key="item.id"
              class="rounded border border-gray-200 p-3"
            >
              <NSpace
                justify="space-between"
                align="center"
                class="mb-2"
              >
                <NSpace align="center">
                  <NTag
                    size="small"
                    :type="statusTagTypeMap[item.status] || 'default'"
                    >{{ item.status }}</NTag
                  >
                  <NTag
                    v-if="item.isDeleted"
                    size="small"
                    type="error"
                    >{{ $t('admin.visitor.deleted') }}</NTag
                  >
                </NSpace>
                <NText
                  depth="3"
                  style="font-size: 12px"
                  >{{ formatDate(item.createdAt) }}</NText
                >
              </NSpace>
              <div class="text-sm break-all whitespace-pre-wrap">{{ item.content }}</div>
            </div>
          </NSpace>
        </NCard>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
