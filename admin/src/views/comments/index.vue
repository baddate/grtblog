<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  TrashOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  ArrowUndoOutline,
  PinOutline,
  PersonOutline,
  GlobeOutline,
  LogoChrome,
  LaptopOutline,
  LocationOutline,
  MailOutline,
  BanOutline,
} from '@vicons/ionicons5'
import {
  NCard,
  NTabs,
  NTabPane,
  NList,
  NListItem,
  NThing,
  NTag,
  NSpace,
  NButton,
  useMessage,
  useDialog,
  NResult,
  NSpin,
  NPopconfirm,
  NInput,
  NPopselect,
  NIcon,
  NEllipsis,
  NSwitch,
  NPagination,
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { h, ref, computed } from 'vue'

import { ScrollContainer, EmptyPlaceholder, UserAvatar } from '@/components'
import {
  listComments,
  deleteComment,
  updateCommentStatus,
  replyComment,
  setCommentTop,
  setCommentAuthor,
  markCommentsViewed,
} from '@/services/comments'
import { CommentStatus, type Comment, type CommentListResponse } from '@/types/comments'

import CommentSource from './components/CommentSource.vue'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()
const queryClient = useQueryClient()

const activeStatus = ref<string>('all')
const page = ref(1)
const pageSize = ref(20)
const onlyUnviewed = ref(false)

// Fetch comments
const { data, isLoading, isError } = useQuery({
  queryKey: ['comments', activeStatus, page, pageSize, onlyUnviewed],
  queryFn: () =>
    listComments({
      page: page.value,
      pageSize: pageSize.value,
      status: activeStatus.value === 'all' ? undefined : activeStatus.value,
      onlyUnviewed: onlyUnviewed.value,
    }),
})

const comments = computed(() => data.value?.items || [])
const total = computed(() => data.value?.total || 0)

// Mutations
const updateStatusMutation = useMutation({
  mutationFn: ({ id, status }: { id: string; status: CommentStatus }) =>
    updateCommentStatus(id, { status }),
  onSuccess: () => {
    message.success(t('admin.service.status_updated'))
    queryClient.invalidateQueries({ queryKey: ['comments'] })
  },
  onError: () => message.error(t('admin.service.status_update_failed')),
})

const deleteMutation = useMutation({
  mutationFn: (id: string) => deleteComment(id),
  onSuccess: () => {
    message.success(t('admin.service.comment_deleted'))
    queryClient.invalidateQueries({ queryKey: ['comments'] })
  },
  onError: () => message.error(t('admin.service.delete_failed')),
})

const topMutation = useMutation({
  mutationFn: ({ id, isTop }: { id: string; isTop: boolean }) => setCommentTop(id, { isTop }),
  onSuccess: () => {
    message.success(t('admin.service.pin_updated'))
    queryClient.invalidateQueries({ queryKey: ['comments'] })
  },
})

const authorMutation = useMutation({
  mutationFn: ({ id, isAuthor }: { id: string; isAuthor: boolean }) =>
    setCommentAuthor(id, { isAuthor }),
  onSuccess: () => {
    message.success(t('admin.service.author_marked'))
    queryClient.invalidateQueries({ queryKey: ['comments'] })
  },
  onError: () => message.error(t('admin.service.author_mark_failed')),
})

const replyMutation = useMutation({
  mutationFn: ({ id, content }: { id: string; content: string }) => replyComment(id, { content }),
  onSuccess: () => {
    message.success(t('admin.service.reply_success'))
    replyContent.value = ''
    replyTargetId.value = null
    queryClient.invalidateQueries({ queryKey: ['comments'] })
  },
  onError: () => message.error(t('admin.service.reply_failed')),
})

const markViewedMutation = useMutation({
  mutationFn: (ids: string[]) => markCommentsViewed({ ids, isViewed: true }),
  onSuccess: (_, ids) => {
    queryClient.setQueriesData<CommentListResponse>({ queryKey: ['comments'] }, (oldData) => {
      if (!oldData?.items) return oldData
      return {
        ...oldData,
        items: oldData.items.map((item) =>
          ids.includes(item.id) ? { ...item, isViewed: true } : item,
        ),
      }
    })
  },
})

// Actions
const handleStatusChange = (comment: Comment, status: CommentStatus) => {
  updateStatusMutation.mutate({ id: comment.id, status })
}

const handleDelete = (comment: Comment) => {
  deleteMutation.mutate(comment.id)
}

const handleTop = (comment: Comment) => {
  topMutation.mutate({ id: comment.id, isTop: !comment.isTop })
}

const handleAuthor = (comment: Comment) => {
  authorMutation.mutate({ id: comment.id, isAuthor: !comment.isAuthor })
}

// Reply Logic
const replyTargetId = ref<string | null>(null)
const replyContent = ref('')
const showReplyInput = (comment: Comment) => {
  if (replyTargetId.value === comment.id) {
    replyTargetId.value = null
  } else {
    replyTargetId.value = comment.id
    replyContent.value = ''
  }
}
const submitReply = () => {
  if (!replyTargetId.value || !replyContent.value) return
  replyMutation.mutate({ id: replyTargetId.value, content: replyContent.value })
}

// Utility
const getStatusType = (status: CommentStatus) => {
  switch (status) {
    case CommentStatus.Approved:
      return 'success'
    case CommentStatus.Pending:
      return 'warning'
    case CommentStatus.Rejected:
      return 'error'
    case CommentStatus.Blocked:
      return 'default'
    default:
      return 'default'
  }
}

const getStatusLabel = (status: CommentStatus) => {
  switch (status) {
    case CommentStatus.Approved:
      return t('admin.status.published')
    case CommentStatus.Pending:
      return t('admin.status.pending')
    case CommentStatus.Rejected:
      return t('admin.status.rejected')
    case CommentStatus.Blocked:
      return t('admin.status.banned')
    default:
      return t('admin.status.unknown')
  }
}

const formatUserAgent = (browser?: string, platform?: string) => {
  return [browser, platform].filter(Boolean).join(' · ')
}

const hoverTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const handleMouseEnter = (comment: Comment) => {
  if (!comment.isViewed) {
    hoverTimer.value = setTimeout(() => {
      markViewedMutation.mutate([comment.id])
    }, 500)
  }
}

const handleMouseLeave = () => {
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value)
    hoverTimer.value = null
  }
}
</script>

<template>
  <ScrollContainer
    wrapper-class="p-4"
    :scrollbar-props="{ trigger: 'none' }"
  >
    <n-card
      :title="t('admin.card.comment_list')"
      class="h-full"
      content-style="display: flex; flex-direction: column; height: 100%;"
    >
      <template #header-extra>
        <!-- Using header-extra for the switch if preferred, or keep in body. 
                 User said "Header and below separate", "Tab width wrap content".
                 Let's put Switch in the body row with Tabs as before but cleaner.
            -->
      </template>

      <div class="relative flex min-h-0 flex-1 flex-col">
        <div class="border-b border-gray-100 px-4 dark:border-gray-800">
          <n-tabs
            v-model:value="activeStatus"
            type="line"
            animated
          >
            <n-tab-pane
              name="all"
              :tab="t('admin.filter.all')"
            />
            <n-tab-pane
              name="pending"
              :tab="t('admin.status.pending')"
            />
            <n-tab-pane
              name="approved"
              :tab="t('admin.status.published')"
            />
            <n-tab-pane
              name="rejected"
              :tab="t('admin.filter.spam_rejected')"
            />

            <template #suffix>
              <n-space
                align="center"
                size="small"
                class="pb-1"
              >
                <span class="text-xs text-gray-500">{{ t('admin.filter.unread_only') }}</span>
                <n-switch
                  v-model:value="onlyUnviewed"
                  size="small"
                />
              </n-space>
            </template>
          </n-tabs>
        </div>

        <div class="relative min-h-80 flex-1">
          <n-spin
            :show="isLoading"
            class="absolute inset-0 flex flex-col"
          >
            <EmptyPlaceholder
              :show="!isLoading && comments.length === 0"
              :description="t('admin.service.no_comments')"
            />

            <div
              class="flex-1 overflow-auto px-4 py-4"
              v-if="comments.length > 0"
            >
              <n-list
                hoverable
                clickable
                bordered
              >
                <n-list-item
                  v-for="comment in comments"
                  :key="comment.id"
                  @mouseenter="handleMouseEnter(comment)"
                  @mouseleave="handleMouseLeave"
                  :class="{ 'bg-blue-50/50 dark:bg-blue-900/10': !comment.isViewed }"
                  class="transition-colors duration-200"
                >
                  <n-thing content-indented>
                    <template #avatar>
                      <div class="relative">
                        <UserAvatar
                          :src="comment.avatar || undefined"
                          round
                        />
                        <div
                          v-if="!comment.isViewed"
                          class="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500 dark:border-gray-800"
                        ></div>
                      </div>
                    </template>
                    <template #header>
                      <span
                        class="mr-2 text-base font-bold"
                        :class="{ 'text-gray-400 line-through': comment.isDeleted }"
                        >{{ comment.nickName }}</span
                      >
                      <n-tag
                        v-if="comment.isDeleted"
                        type="error"
                        size="small"
                        class="mr-1"
                        >{{ t('admin.status.deleted') }}</n-tag
                      >
                      <n-tag
                        v-if="comment.isTop"
                        type="warning"
                        size="small"
                        class="mr-1"
                      >
                        {{ t('admin.status.pinned') }}
                      </n-tag>
                      <n-tag
                        v-if="comment.isOwner"
                        type="primary"
                        size="small"
                        class="mr-1"
                        >{{ t('admin.badge.owner') }}</n-tag
                      >
                      <n-tag
                        v-if="comment.isAuthor"
                        type="info"
                        size="small"
                        class="mr-1"
                        >{{ t('admin.badge.author') }}</n-tag
                      >
                      <n-tag
                        v-if="comment.isFriend"
                        type="success"
                        size="small"
                        >{{ t('admin.badge.friend_link') }}</n-tag
                      >
                    </template>
                    <template #header-extra>
                      <div class="flex items-center gap-2 text-xs text-gray-500">
                        <n-tag
                          :type="getStatusType(comment.status)"
                          :bordered="false"
                          size="small"
                          >{{ getStatusLabel(comment.status) }}</n-tag
                        >
                        <span>{{ new Date(comment.createdAt).toLocaleString() }}</span>
                      </div>
                    </template>
                    <template #description>
                      <div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span
                          v-if="comment.ip"
                          class="flex items-center gap-1"
                          ><n-icon :component="GlobeOutline" /> {{ comment.ip }}</span
                        >
                        <span
                          v-if="comment.location"
                          class="flex items-center gap-1"
                          ><n-icon :component="LocationOutline" /> {{ comment.location }}</span
                        >
                        <span
                          v-if="comment.email"
                          class="flex items-center gap-1"
                          ><n-icon :component="MailOutline" /> {{ comment.email }}</span
                        >
                        <span
                          v-if="comment.browser || comment.platform"
                          class="flex items-center gap-1"
                          ><n-icon :component="LaptopOutline" />
                          {{ formatUserAgent(comment.browser, comment.platform) }}</span
                        >
                      </div>
                    </template>

                    <div
                      class="py-3 text-sm leading-relaxed whitespace-pre-wrap"
                      :class="{ 'opacity-50': comment.isDeleted }"
                    >
                      {{ comment.content }}
                    </div>

                    <div
                      class="mb-2 flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-2 text-xs dark:border-gray-800 dark:bg-gray-800/50"
                    >
                      <comment-source
                        :type="comment.areaType"
                        :id="comment.areaRefId"
                        :initial-title="comment.areaTitle || comment.areaName"
                      />
                    </div>

                    <template
                      #action
                      v-if="!comment.isDeleted"
                    >
                      <n-space
                        size="small"
                        class="mt-2"
                      >
                        <n-button
                          text
                          size="tiny"
                          @click="showReplyInput(comment)"
                        >
                          <template #icon><n-icon :component="ArrowUndoOutline" /></template>
                          {{ t('admin.action.reply') }}
                        </n-button>

                        <n-popconfirm
                          v-if="comment.status !== CommentStatus.Approved"
                          @positive-click="handleStatusChange(comment, CommentStatus.Approved)"
                        >
                          <template #trigger>
                            <n-button
                              text
                              type="success"
                              size="tiny"
                            >
                              <template #icon
                                ><n-icon :component="CheckmarkCircleOutline"
                              /></template>
                              {{ t('admin.action.approve') }}
                            </n-button>
                          </template>
                          {{ t('admin.confirm.approve_comment') }}
                        </n-popconfirm>

                        <n-popconfirm
                          v-if="comment.status !== CommentStatus.Blocked"
                          @positive-click="handleStatusChange(comment, CommentStatus.Blocked)"
                        >
                          <template #trigger>
                            <n-button
                              text
                              type="error"
                              size="tiny"
                            >
                              <template #icon><n-icon :component="BanOutline" /></template>
                              {{ t('admin.action.block') }}
                            </n-button>
                          </template>
                          {{ t('admin.confirm.block_comment') }}
                        </n-popconfirm>

                        <n-popconfirm
                          v-if="comment.status !== CommentStatus.Rejected"
                          @positive-click="handleStatusChange(comment, CommentStatus.Rejected)"
                        >
                          <template #trigger>
                            <n-button
                              text
                              type="warning"
                              size="tiny"
                            >
                              <template #icon><n-icon :component="CloseCircleOutline" /></template>
                              {{ t('admin.action.reject') }}
                            </n-button>
                          </template>
                          {{ t('admin.confirm.reject_comment') }}
                        </n-popconfirm>

                        <n-button
                          text
                          :type="comment.isTop ? 'primary' : 'default'"
                          size="tiny"
                          @click="handleTop(comment)"
                        >
                          <template #icon><n-icon :component="PinOutline" /></template>
                          {{ comment.isTop ? t('admin.action.unpin') : t('admin.action.pin') }}
                        </n-button>

                        <n-button
                          text
                          :type="comment.isAuthor ? 'info' : 'default'"
                          size="tiny"
                          @click="handleAuthor(comment)"
                        >
                          <template #icon><n-icon :component="PersonOutline" /></template>
                          {{ comment.isAuthor ? t('admin.action.unmark_author') : t('admin.action.mark_author') }}
                        </n-button>

                        <n-popconfirm @positive-click="handleDelete(comment)">
                          <template #trigger>
                            <n-button
                              text
                              type="error"
                              size="tiny"
                            >
                              <template #icon><n-icon :component="TrashOutline" /></template>
                              {{ t('admin.common.delete') }}
                            </n-button>
                          </template>
                          {{ t('admin.confirm.delete_comment') }}
                        </n-popconfirm>
                      </n-space>

                      <div
                        v-if="replyTargetId === comment.id"
                        class="mt-3 flex gap-2"
                      >
                        <n-input
                          v-model:value="replyContent"
                          type="textarea"
                          :placeholder="t('admin.placeholder.reply_content')"
                          :rows="2"
                          autosize
                        />
                        <n-button
                          type="primary"
                          @click="submitReply"
                          :loading="replyMutation.isPending.value"
                          >{{ t('admin.action.send') }}</n-button
                        >
                      </div>
                    </template>
                  </n-thing>
                </n-list-item>
              </n-list>

              <div
                class="mt-4 flex justify-end pb-2"
                v-if="total > 0"
              >
                <n-pagination
                  v-model:page="page"
                  v-model:page-size="pageSize"
                  :item-count="total"
                  show-size-picker
                  :page-sizes="[10, 20, 50, 100]"
                />
              </div>
            </div>
          </n-spin>
        </div>
      </div>
    </n-card>
  </ScrollContainer>
</template>
