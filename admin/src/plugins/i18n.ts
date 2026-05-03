import { createI18n } from 'vue-i18n'
import zhAdmin from '@/locales/zh/admin.json'
import enAdmin from '@/locales/en/admin.json'

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
    zh: { ...zhAdmin },
    en: { ...enAdmin },
  },
})

export default i18n
