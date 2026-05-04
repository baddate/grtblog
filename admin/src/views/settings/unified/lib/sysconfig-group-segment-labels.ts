import i18n from '@/plugins/i18n'

/**
 * 配置树分组标题：API 只保证稳定的 path/key（与 DB group_path 段一致），展示文案由 UI 层维护。
 */
const SEGMENT_LABELS: Readonly<Record<string, string>> = {
  activitypub: 'ActivityPub',
  ai: 'AI',
  base: '基础',
  comment: '评论',
  email: '邮件',
  federation: '联合',
  friendlink: '友链',
  interaction: '互动',
  limits: '限流',
  notification: '通知',
  policies: '策略',
  prompt: '提示词',
  security: '安全',
  send: '发送',
  site: '站点',
  basic: '基础',
  social: '社交',
  smtp: 'SMTP',
  storage: '存储',
  subscription: '订阅',
  task: '任务',
  telemetry: '遥测',
  turnstile: 'Turnstile 验证',
  upload: '上传',
  webhook: 'Webhook',
}

/** 折叠面板等处的分组标题：优先 i18n，回退到静态映射，再回退到接口 label 或 key。 */
export function titleForSysconfigGroup(group: { key: string; label?: string }): string {
  const k = group.key.trim().toLowerCase()
  if (k) {
    const i18nKey = 'admin.sysconfig.segment.' + k
    const translated = i18n.global.t(i18nKey)
    if (translated !== i18nKey) return translated
    if (SEGMENT_LABELS[k]) return SEGMENT_LABELS[k]
  }
  return (group.label?.trim() || group.key).trim() || group.key
}
