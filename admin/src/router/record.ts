import type { MenuMixedOptions } from './interface'
import i18n from '@/plugins/i18n'
const { t } = i18n.global

export const routeRecordRaw: MenuMixedOptions[] = [
  {
    path: 'dashboard',
    name: 'dashboard',
    icon: 'icon-[mage--dashboard-chart]',
    label: t('admin.sidebar.dashboard'),
    meta: {
      componentName: 'Dashboard',
      pinned: true,
      showTab: true,
    },
    component: 'dashboard/index',
  },
  {
    path: 'articles',
    name: 'articleManagement',
    icon: 'iconify ph--article',
    label: t('admin.sidebar.articles'),
    redirect: 'articles/list',
    children: [
      {
        path: 'list',
        name: 'articleList',
        label: t('admin.sidebar.article_list'),
        icon: 'iconify ph--list-bullets',
        meta: {
          componentName: 'ArticleList',
          showTab: true,
        },
        component: 'articles/index',
      },
      {
        path: 'edit/new',
        name: 'articleCreate',
        label: t('admin.sidebar.new_article'),
        icon: 'iconify ph--pencil-simple-line',
        meta: {
          componentName: 'ArticleEdit',
          showTab: true,
          enableMultiTab: true,
          renderTabTitle() {
            return t('admin.sidebar.new_article')
          },
        },
        component: 'articles/edit',
      },
      {
        path: 'edit/:id',
        name: 'articleEdit',
        label: t('admin.sidebar.edit_article'),
        icon: 'iconify ph--pencil-simple-line',
        show: false,
        meta: {
          componentName: 'ArticleEdit',
          showTab: true,
          enableMultiTab: true,
          renderTabTitle({ id }) {
            return id
              ? t('admin.sidebar.edit_article_tab', { id })
              : t('admin.sidebar.edit_article')
          },
        },
        component: 'articles/edit',
      },
    ],
  },
  {
    path: 'notes',
    name: 'noteManagement',
    icon: 'iconify ph--aperture-thin',
    label: t('admin.sidebar.moments'),
    redirect: 'notes/list',
    children: [
      {
        path: 'list',
        name: 'noteList',
        label: t('admin.sidebar.moment_list'),
        icon: 'iconify ph--note',
        meta: {
          componentName: 'NoteList',
          showTab: true,
        },
        component: 'notes/index',
      },
      {
        path: 'edit/new',
        name: 'noteCreate',
        label: t('admin.sidebar.new_moment'),
        icon: 'iconify ph--pencil-simple-line',
        meta: {
          componentName: 'NoteEdit',
          showTab: true,
          enableMultiTab: true,
          renderTabTitle() {
            return t('admin.sidebar.new_moment')
          },
        },
        component: 'notes/edit',
      },
      {
        path: 'edit/:id',
        name: 'noteEdit',
        label: t('admin.sidebar.edit_moment'),
        icon: 'iconify ph--pencil-simple-line',
        show: false,
        meta: {
          componentName: 'NoteEdit',
          showTab: true,
          enableMultiTab: true,
          renderTabTitle({ id }) {
            return id
              ? t('admin.sidebar.edit_moment_tab', { id })
              : t('admin.sidebar.edit_moment')
          },
        },
        component: 'notes/edit',
      },
    ],
  },
  {
    path: 'thinkings',
    name: 'thinkingManagement',
    icon: 'iconify ph--lightbulb-filament',
    label: t('admin.sidebar.thinkings'),
    redirect: 'thinkings/list',
    children: [
      {
        path: 'list',
        name: 'thinkingList',
        label: t('admin.sidebar.thinking_list'),
        icon: 'iconify ph--list-bullets',
        meta: {
          componentName: 'ThinkingList',
          showTab: true,
        },
        component: 'thinking/index',
      },
      {
        path: 'create',
        name: 'thinkingCreate',
        label: t('admin.sidebar.new_thinking'),
        icon: 'iconify ph--pencil-simple-line',
        meta: {
          componentName: 'ThinkingEdit',
          showTab: true,
          enableMultiTab: true,
          renderTabTitle() {
            return t('admin.sidebar.new_thinking')
          },
        },
        component: 'thinking/edit',
      },
      {
        path: 'edit/:id',
        name: 'thinkingEdit',
        label: t('admin.sidebar.edit_thinking'),
        icon: 'iconify ph--pencil-simple-line',
        show: false,
        meta: {
          componentName: 'ThinkingEdit',
          showTab: true,
          enableMultiTab: true,
          renderTabTitle({ id }) {
            return id
              ? t('admin.sidebar.edit_thinking_tab', { id })
              : t('admin.sidebar.edit_thinking')
          },
        },
        component: 'thinking/edit',
      },
    ],
  },
  {
    path: 'pages',
    name: 'pageManagement',
    icon: 'iconify ph--layout',
    label: t('admin.sidebar.pages'),
    redirect: 'pages/list',
    children: [
      {
        path: 'list',
        name: 'pageList',
        label: t('admin.sidebar.page_list'),
        icon: 'iconify ph--file-text',
        meta: {
          componentName: 'PageList',
          showTab: true,
        },
        component: 'pages/index',
      },
      {
        path: 'create',
        name: 'pageCreate',
        label: t('admin.sidebar.new_page'),
        icon: 'iconify ph--pencil-simple-line',
        meta: {
          componentName: 'PageEdit',
          showTab: true,
          enableMultiTab: true,
          renderTabTitle() {
            return t('admin.sidebar.new_page')
          },
        },
        component: 'pages/edit',
      },
      {
        path: 'edit/:id',
        name: 'pageEdit',
        label: t('admin.sidebar.edit_page'),
        icon: 'iconify ph--pencil-simple-line',
        show: false,
        meta: {
          componentName: 'PageEdit',
          showTab: true,
          enableMultiTab: true,
          renderTabTitle({ id }) {
            return id
              ? t('admin.sidebar.edit_page_tab', { id })
              : t('admin.sidebar.edit_page')
          },
        },
        component: 'pages/edit',
      },
    ],
  },
  {
    path: 'albums',
    name: 'albumManagement',
    icon: 'iconify ph--image',
    label: t('admin.sidebar.albums'),
    redirect: 'albums/list',
    children: [
      {
        path: 'list',
        name: 'albumList',
        label: t('admin.sidebar.album_list'),
        icon: 'iconify ph--images',
        meta: {
          componentName: 'AlbumList',
          showTab: true,
        },
        component: 'albums/index',
      },
      {
        path: 'edit/new',
        name: 'albumCreate',
        label: t('admin.sidebar.new_album'),
        icon: 'iconify ph--pencil-simple-line',
        meta: {
          componentName: 'AlbumEdit',
          showTab: true,
          enableMultiTab: true,
          renderTabTitle() {
            return t('admin.sidebar.new_album')
          },
        },
        component: 'albums/edit',
      },
      {
        path: 'edit/:id',
        name: 'albumEdit',
        label: t('admin.sidebar.edit_album'),
        show: false,
        meta: {
          componentName: 'AlbumEdit',
          showTab: true,
          enableMultiTab: true,
          renderTabTitle({ id }) {
            return id
              ? t('admin.sidebar.edit_album_tab', { id })
              : t('admin.sidebar.edit_album')
          },
        },
        component: 'albums/edit',
      },
    ],
  },
  {
    path: 'comments',
    name: 'commentManagement',
    icon: 'iconify ph--chat-circle-text',
    label: t('admin.sidebar.comments'),
    meta: {
      componentName: 'CommentList',
      showTab: true,
    },
    component: 'comments/index',
  },
  {
    path: 'taxonomy',
    name: 'taxonomyManagement',
    icon: 'iconify ph--tree-structure',
    label: t('admin.sidebar.categories'),
    redirect: 'taxonomy/categories',
    children: [
      {
        path: 'categories',
        name: 'articleCategoryManagement',
        icon: 'iconify ph--folders',
        label: t('admin.sidebar.article_categories'),
        meta: {
          componentName: 'ArticleCategoryManagement',
          showTab: true,
        },
        component: 'taxonomy/categories/index',
      },
      {
        path: 'columns',
        name: 'noteColumnManagement',
        icon: 'iconify ph--rows',
        label: t('admin.sidebar.moment_columns'),
        meta: {
          componentName: 'MomentColumnManagement',
          showTab: true,
        },
        component: 'taxonomy/columns/index',
      },
      {
        path: 'tags',
        name: 'tagManagement',
        icon: 'iconify ph--tag',
        label: t('admin.sidebar.tags'),
        meta: {
          componentName: 'TagManagement',
          showTab: true,
        },
        component: 'taxonomy/tags/index',
      },
    ],
  },
  {
    path: 'audience',
    name: 'audienceManagement',
    icon: 'iconify ph--users-three',
    label: t('admin.sidebar.users'),
    redirect: 'audience/users',
    children: [
      {
        path: 'users',
        name: 'siteUserManagement',
        icon: 'iconify ph--users',
        label: t('admin.sidebar.site_users'),
        meta: {
          componentName: 'SiteUserManagement',
          showTab: true,
        },
        component: 'users/index',
      },
      {
        path: 'visitors',
        name: 'visitorProfileManagement',
        icon: 'iconify ph--users-three',
        label: t('admin.sidebar.visitor_profiles'),
        meta: {
          componentName: 'VisitorProfileList',
          showTab: true,
        },
        component: 'visitors/index',
      },
      {
        path: 'rss',
        name: 'rssAccessStats',
        icon: 'iconify ph--rss',
        label: t('admin.sidebar.rss_stats'),
        meta: {
          componentName: 'RssAccessStats',
          showTab: true,
        },
        component: 'rss/index',
      },
    ],
  },
  {
    path: 'friend-links',
    name: 'friendLinkManagement',
    icon: 'iconify ph--link',
    label: t('admin.sidebar.friends'),
    redirect: 'friend-links/list',
    children: [
      {
        path: 'list',
        name: 'friendLinkList',
        label: t('admin.sidebar.friend_list'),
        icon: 'iconify ph--link',
        meta: {
          componentName: 'FriendLinkList',
          showTab: true,
        },
        component: 'friend-links/index',
      },
      {
        path: 'applications',
        name: 'friendLinkApplications',
        label: t('admin.sidebar.friend_applications'),
        icon: 'iconify ph--checks',
        meta: {
          componentName: 'FriendLinkApplications',
          showTab: true,
        },
        component: 'friend-links/applications',
      },
      {
        path: 'sync-jobs',
        name: 'friendLinkSyncJobs',
        label: t('admin.sidebar.friend_sync_jobs'),
        icon: 'iconify ph--clock-counter-clockwise',
        meta: {
          componentName: 'FriendLinkSyncJobs',
          showTab: true,
        },
        component: 'friend-links/sync-jobs',
      },
    ],
  },
  {
    path: 'federation',
    name: 'unionManagement',
    icon: 'iconify ph--circles-three',
    label: t('admin.sidebar.federation'),
    redirect: 'federation/instances',
    children: [
      {
        path: 'instances',
        name: 'federationInstances',
        label: t('admin.sidebar.federation_instances'),
        icon: 'iconify ph--network',
        meta: {
          componentName: 'FederationInstances',
          showTab: true,
        },
        component: 'federation/instances/index',
      },
      {
        path: 'outbound',
        name: 'federationOutbound',
        label: t('admin.sidebar.federation_outbound'),
        icon: 'iconify ph--paper-plane-tilt',
        meta: {
          componentName: 'FederationOutbound',
          showTab: true,
        },
        component: 'federation/outbound/index',
      },
      {
        path: 'activitypub-outbox',
        name: 'activityPubOutbox',
        label: t('admin.sidebar.activitypub_outbox'),
        icon: 'iconify ph--broadcast',
        meta: {
          componentName: 'ActivityPubOutbox',
          showTab: true,
        },
        component: 'federation/activitypub-outbox/index',
      },
      {
        path: 'reviews',
        name: 'federationReviews',
        label: t('admin.sidebar.federation_reviews'),
        icon: 'iconify ph--check-square',
        meta: {
          componentName: 'FederationReviews',
          showTab: true,
        },
        component: 'federation/reviews/index',
      },
      {
        path: 'debug',
        name: 'federationDebug',
        label: t('admin.sidebar.federation_debug'),
        icon: 'iconify ph--bug',
        show: false, // Hidden from menu, accessed via Instances page
        meta: {
          componentName: 'FederationDebug',
          showTab: true,
        },
        component: 'federation/debug/OutboundRequest',
      },
    ],
  },
  // Legacy redirects for federation settings routes
  {
    path: 'federation/settings',
    name: 'unionSettingsLegacy',
    show: false,
    redirect: '/settings?tab=federation',
  },
  {
    path: 'federation/activitypub-settings',
    name: 'activityPubSettingsLegacy',
    show: false,
    redirect: '/settings?tab=federation',
  },
  {
    path: 'notifications',
    name: 'adminNotificationList',
    label: t('admin.sidebar.notifications'),
    show: false,
    meta: {
      componentName: 'AdminNotificationList',
      showTab: true,
    },
    component: 'admin-notifications/index',
  },
  {
    path: 'files',
    name: 'fileManagement',
    icon: 'icon-[fluent--cloud-arrow-up-24-regular]',
    label: t('admin.sidebar.files'),
    redirect: 'files/list',
    children: [
      {
        path: 'list',
        name: 'fileList',
        label: t('admin.sidebar.file_list'),
        icon: 'icon-[fluent--cloud-arrow-up-24-regular]',
        meta: {
          componentName: 'FileList',
          showTab: true,
        },
        component: 'uploads/index',
      },
    ],
  },
  {
    path: 'plugins',
    name: 'pluginManagement',
    icon: 'iconify ph--puzzle-piece',
    label: t('admin.sidebar.plugins'),
    redirect: 'plugins/list',
    children: [
      {
        path: 'list',
        name: 'pluginList',
        label: t('admin.sidebar.plugins'),
        icon: 'iconify ph--puzzle-piece',
        meta: {
          componentName: 'PluginList',
          showTab: true,
        },
        component: 'plugins/index',
      },
    ],
  },
  {
    path: 'webhooks',
    name: 'webhookList',
    icon: 'iconify ph--webhooks-logo',
    label: t('admin.sidebar.webhooks'),
    meta: {
      componentName: 'WebhookList',
      showTab: true,
    },
    component: 'webhooks/index',
  },
  {
    path: 'global-notifications',
    name: 'globalNotificationList',
    icon: 'iconify ph--megaphone',
    label: t('admin.sidebar.global_notifications'),
    meta: {
      componentName: 'GlobalNotificationList',
      showTab: true,
    },
    component: 'global-notifications/index',
  },
  {
    path: 'ai',
    name: 'aiManagement',
    icon: 'iconify ph--brain',
    label: t('admin.sidebar.ai'),
    redirect: 'ai/task-logs',
    children: [
      {
        path: 'task-logs',
        name: 'aiTaskLogs',
        label: t('admin.sidebar.ai_task_logs'),
        icon: 'iconify ph--list-checks',
        meta: {
          componentName: 'AITaskLogs',
          showTab: true,
        },
        component: 'ai/tasks/index',
      },
    ],
  },
  {
    path: 'email',
    name: 'emailManagement',
    icon: 'iconify ph--envelope',
    label: t('admin.sidebar.emails'),
    redirect: 'email/templates',
    children: [
      {
        path: 'templates',
        name: 'emailTemplateList',
        label: t('admin.sidebar.email_templates'),
        icon: 'iconify ph--scroll',
        meta: {
          componentName: 'EmailTemplateList',
          showTab: true,
        },
        component: 'email/templates/index',
      },
      {
        path: 'templates/new',
        name: 'emailTemplateCreate',
        label: t('admin.sidebar.new_email_template'),
        show: false,
        meta: {
          componentName: 'EmailTemplateEdit',
          showTab: true,
          enableMultiTab: true,
          renderTabTitle() {
            return t('admin.sidebar.new_email_template')
          },
        },
        component: 'email/templates/edit',
      },
      {
        path: 'templates/:code',
        name: 'emailTemplateEdit',
        label: t('admin.sidebar.edit_email_template'),
        show: false,
        meta: {
          componentName: 'EmailTemplateEdit',
          showTab: true,
          enableMultiTab: true,
          renderTabTitle({ code }) {
            return t('admin.sidebar.edit_email_template_tab', { code })
          },
        },
        component: 'email/templates/edit',
      },
      {
        path: 'subscriptions',
        name: 'emailSubscriptionList',
        label: t('admin.sidebar.email_subscriptions'),
        icon: 'iconify ph--users',
        meta: {
          componentName: 'EmailSubscriptionList',
          showTab: true,
        },
        component: 'email/subscriptions/index',
      },
      {
        path: 'outbox',
        name: 'emailOutbox',
        label: t('admin.sidebar.email_outbox'),
        icon: 'iconify ph--paper-plane-right',
        meta: {
          componentName: 'EmailOutbox',
          showTab: true,
        },
        component: 'email/outbox/index',
      },
      {
        path: 'test',
        name: 'emailTest',
        label: t('admin.sidebar.email_test'),
        icon: 'iconify ph--paper-plane-tilt',
        meta: {
          componentName: 'EmailTest',
          showTab: true,
        },
        component: 'email/test/index',
      },
    ],
  },
  {
    path: 'navigation',
    name: 'navMenuManagement',
    icon: 'iconify ph--list',
    label: t('admin.sidebar.navigation'),
    meta: {
      componentName: 'NavMenuManagement',
      showTab: true,
    },
    component: 'navigation/index',
  },
  {
    path: 'settings',
    name: 'settings',
    icon: 'iconify ph--gear-six',
    label: t('admin.sidebar.settings'),
    meta: {
      componentName: 'UnifiedSettings',
      showTab: true,
    },
    component: 'settings/unified/index',
  },
  // Legacy redirects for old settings routes
  {
    path: 'settings/site-info',
    name: 'siteInfoLegacy',
    show: false,
    redirect: '/settings?tab=site-info',
  },
  {
    path: 'settings/login-methods',
    name: 'loginMethodsLegacy',
    show: false,
    redirect: '/settings?tab=security',
  },
  {
    path: 'settings/api-tokens',
    name: 'adminTokensLegacy',
    show: false,
    redirect: '/settings?tab=api-tokens',
  },
  {
    path: 'settings/system',
    name: 'systemSettingsLegacy',
    show: false,
    redirect: '/settings?tab=advanced',
  },
  {
    path: 'advanced',
    name: 'advancedInfo',
    icon: 'iconify ph--info',
    label: t('admin.sidebar.advanced'),
    redirect: 'advanced/render-details',
    children: [
      {
        path: 'overview',
        name: 'advancedOverview',
        label: t('admin.sidebar.advanced'),
        icon: 'iconify ph--info',
        meta: {
          componentName: 'AdvancedInfo',
          showTab: true,
        },
        component: 'advanced/index',
      },
      {
        path: 'render-details',
        name: 'advancedRenderDetails',
        label: t('admin.sidebar.render_details'),
        icon: 'iconify ph--lightning',
        meta: {
          componentName: 'AdvancedRenderDetails',
          showTab: true,
        },
        component: 'advanced/render-details',
      },
    ],
  },
  {
    path: 'monitoring',
    name: 'systemMonitor',
    icon: 'iconify ph--activity',
    label: t('admin.sidebar.system'),
    redirect: 'monitoring/overview',
    children: [
      {
        path: 'overview',
        name: 'systemMonitorOverview',
        label: t('admin.sidebar.system'),
        icon: 'iconify ph--activity',
        meta: {
          componentName: 'SystemMonitor',
          showTab: true,
        },
        component: 'monitoring/index',
      },
      {
        path: 'logs',
        name: 'systemLogs',
        label: t('admin.sidebar.system_logs'),
        icon: 'iconify ph--scroll',
        meta: {
          componentName: 'SystemLogs',
          showTab: true,
        },
        component: 'monitoring/logs',
      },
    ],
  },
  {
    path: 'user-center',
    name: 'userCenter',
    label: t('admin.sidebar.profile'),
    icon: 'iconify ph--user',
    show: false,
    meta: {
      componentName: 'UserCenter',
      showTab: true,
    },
    component: 'user-center/index',
  },
  {
    path: '/about',
    key: 'about',
    name: 'about',
    icon: 'iconify ph--info',
    label: t('admin.sidebar.about'),
    component: 'about/index',
    meta: {
      showTab: true,
    },
  },
]
