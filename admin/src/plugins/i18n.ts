import { createI18n } from 'vue-i18n'
import { DEFAULT_LANG, FALLBACK_LANG } from '@/shared/languages'

const modules = import.meta.glob('@/locales/*/admin.json', { eager: true, import: 'default' })

const messages: Record<string, unknown> = {}
for (const [path, value] of Object.entries(modules)) {
  const parts = path.split('/')
  const code = parts[parts.length - 2]
  messages[code] = value
}

const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LANG,
  fallbackLocale: FALLBACK_LANG,
  // import.meta.glob returns unknown; cast is safe at this dynamic-import boundary
  messages: messages as Record<string, Record<string, string>>,
})
export default i18n
